class CanvasManager {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    
    // Drawing state
    this.isDrawing = false;
    this.currentStroke = null;
    this.currentTool = 'brush';
    this.currentColor = '#000000';
    this.strokeWidth = 5;
    
    // User info (will be set from main.js)
    this.userId = null;
    this.userName = null;
    this.userColor = null;
    
    // Store all strokes
    this.strokes = [];
    this.activeStrokes = new Map();
    
    // Performance
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    this.fps = 60;
    
    this.setupCanvas();
    this.setupEventListeners();
    this.startAnimationLoop();
  }

  setUserInfo(id, name, color) {
    this.oderId = id;
    this.userName = name;
    this.userColor = color;
    // Set default drawing color to user's assigned color
    this.currentColor = color;
  }

  setupCanvas() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();
    
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    
    this.ctx.putImageData(imageData, 0, 0);
    this.redrawCanvas();
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this.handlePointerStart(e));
    this.canvas.addEventListener('mousemove', (e) => this.handlePointerMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handlePointerEnd(e));
    this.canvas.addEventListener('mouseleave', (e) => this.handlePointerEnd(e));
    
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handlePointerStart(e.touches[0]);
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.handlePointerMove(e.touches[0]);
    });
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handlePointerEnd(e);
    });
  }

  getCanvasCoordinates(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  handlePointerStart(event) {
    this.isDrawing = true;
    const pos = this.getCanvasCoordinates(event);
    
    const strokeId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Use user's color for brush, white for eraser
    const strokeColor = this.currentTool === 'eraser' ? '#FFFFFF' : this.currentColor;
    
    this.currentStroke = {
      id: strokeId,
      points: [pos],
      color: strokeColor,
      width: this.currentTool === 'eraser' ? this.strokeWidth * 3 : this.strokeWidth,
      tool: this.currentTool,
      oderId: this.oderId,
      userName: this.userName,
      userColor: this.userColor
    };
    
    if (this.onDrawStart) {
      this.onDrawStart({
        strokeId,
        x: pos.x,
        y: pos.y,
        color: this.currentStroke.color,
        width: this.currentStroke.width,
        tool: this.currentTool,
        userName: this.userName,
        userColor: this.userColor
      });
    }
  }

  handlePointerMove(event) {
    const pos = this.getCanvasCoordinates(event);
    
    if (this.onCursorMove) {
      this.onCursorMove({
        ...pos,
        userName: this.userName,
        userColor: this.userColor,
        isDrawing: this.isDrawing
      });
    }
    
    if (!this.isDrawing || !this.currentStroke) return;
    
    this.currentStroke.points.push(pos);
    
    const points = this.currentStroke.points;
    if (points.length >= 2) {
      this.drawSegment(
        points[points.length - 2],
        points[points.length - 1],
        this.currentStroke.color,
        this.currentStroke.width
      );
    }
    
    if (this.onDrawMove) {
      this.onDrawMove({
        strokeId: this.currentStroke.id,
        x: pos.x,
        y: pos.y,
        userName: this.userName,
        userColor: this.userColor
      });
    }
  }

  handlePointerEnd(event) {
    if (!this.isDrawing || !this.currentStroke) return;
    
    this.isDrawing = false;
    
    if (this.currentStroke.points.length > 1) {
      this.strokes.push({ ...this.currentStroke });
      
      if (this.onDrawEnd) {
        this.onDrawEnd({
          strokeId: this.currentStroke.id,
          points: this.currentStroke.points,
          color: this.currentStroke.color,
          width: this.currentStroke.width,
          tool: this.currentStroke.tool,
          userName: this.userName,
          userColor: this.userColor
        });
      }
    }
    
    this.currentStroke = null;
  }

  drawSegment(from, to, color, width) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();
  }

  drawStroke(stroke) {
    if (!stroke.points || stroke.points.length < 2) return;
    
    this.ctx.beginPath();
    this.ctx.strokeStyle = stroke.color;
    this.ctx.lineWidth = stroke.width;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    const points = stroke.points;
    this.ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length - 1; i++) {
      const midX = (points[i].x + points[i + 1].x) / 2;
      const midY = (points[i].y + points[i + 1].y) / 2;
      this.ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    
    if (points.length > 1) {
      const last = points[points.length - 1];
      this.ctx.lineTo(last.x, last.y);
    }
    
    this.ctx.stroke();
  }

  redrawCanvas() {
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (const stroke of this.strokes) {
      if (!stroke.undone) {
        this.drawStroke(stroke);
      }
    }
  }

  handleRemoteDrawStart(data) {
    this.activeStrokes.set(data.oderId, {
      id: data.strokeId,
      points: [{ x: data.x, y: data.y }],
      color: data.color,
      width: data.width,
      tool: data.tool,
      oderId: data.oderId,
      userName: data.userName,
      userColor: data.userColor
    });
  }

  handleRemoteDrawMove(data) {
    const stroke = this.activeStrokes.get(data.oderId);
    if (!stroke) return;
    
    const newPoint = { x: data.x, y: data.y };
    const lastPoint = stroke.points[stroke.points.length - 1];
    
    this.drawSegment(lastPoint, newPoint, stroke.color, stroke.width);
    stroke.points.push(newPoint);
  }

  handleRemoteDrawEnd(data) {
    this.activeStrokes.delete(data.oderId);
    
    this.strokes.push({
      id: data.id,
      oderId: data.oderId,
      userName: data.userName,
      userColor: data.userColor,
      points: data.points,
      color: data.color,
      width: data.width,
      tool: data.tool
    });
  }

  loadState(strokes) {
    this.strokes = strokes.map(s => ({ ...s }));
    this.redrawCanvas();
  }

  handleStrokeUndone(strokeId) {
    const stroke = this.strokes.find(s => s.id === strokeId);
    if (stroke) {
      stroke.undone = true;
      this.redrawCanvas();
    }
  }

  handleStrokeRedone(stroke) {
    const existingStroke = this.strokes.find(s => s.id === stroke.id);
    if (existingStroke) {
      existingStroke.undone = false;
    } else {
      this.strokes.push({ ...stroke, undone: false });
    }
    this.redrawCanvas();
  }

  clear() {
    this.strokes = [];
    this.redrawCanvas();
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  setColor(color) {
    this.currentColor = color;
  }

  setStrokeWidth(width) {
    this.strokeWidth = width;
  }

  startAnimationLoop() {
    const animate = (currentTime) => {
      this.frameCount++;
      
      if (currentTime - this.lastFrameTime >= 1000) {
        this.fps = this.frameCount;
        this.frameCount = 0;
        this.lastFrameTime = currentTime;
        
        if (this.onFPSUpdate) {
          this.onFPSUpdate(this.fps);
        }
      }
      
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  }
}

window.CanvasManager = CanvasManager;