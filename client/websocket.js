class WebSocketManager {
  constructor(serverUrl) {
    this.socket = null;
    this.serverUrl = serverUrl || window.location.origin;
    this.connected = false;
    this.oderId = null;
    this.userName = null;
    this.userColor = null;
    this.latency = 0;
    
    // Callbacks
    this.onConnect = null;
    this.onDisconnect = null;
    this.onUserInfo = null;
    this.onUserJoined = null;
    this.onUserLeft = null;
    this.onCanvasState = null;
    this.onDrawStart = null;
    this.onDrawMove = null;
    this.onDrawEnd = null;
    this.onCursorUpdate = null;
    this.onStrokeUndone = null;
    this.onStrokeRedone = null;
    this.onCanvasCleared = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        this.connected = true;
        console.log('Connected to server');
        if (this.onConnect) this.onConnect();
        resolve();
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
        console.log('Disconnected from server');
        if (this.onDisconnect) this.onDisconnect();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      this.setupEventListeners();
      this.measureLatency();
    });
  }

  setupEventListeners() {
    this.socket.on('user_info', (data) => {
      this.oderId = data.id;
      this.userName = data.name;
      this.userColor = data.color;
      if (this.onUserInfo) this.onUserInfo(data);
    });

    this.socket.on('canvas_state', (data) => {
      if (this.onCanvasState) this.onCanvasState(data);
    });

    this.socket.on('user_joined', (data) => {
      if (this.onUserJoined) this.onUserJoined(data);
    });

    this.socket.on('user_left', (data) => {
      if (this.onUserLeft) this.onUserLeft(data);
    });

    this.socket.on('draw_start', (data) => {
      if (this.onDrawStart) this.onDrawStart(data);
    });

    this.socket.on('draw_move', (data) => {
      if (this.onDrawMove) this.onDrawMove(data);
    });

    this.socket.on('draw_end', (data) => {
      if (this.onDrawEnd) this.onDrawEnd(data);
    });

    this.socket.on('cursor_update', (data) => {
      if (this.onCursorUpdate) this.onCursorUpdate(data);
    });

    this.socket.on('stroke_undone', (data) => {
      if (this.onStrokeUndone) this.onStrokeUndone(data);
    });

    this.socket.on('stroke_redone', (data) => {
      if (this.onStrokeRedone) this.onStrokeRedone(data);
    });

    this.socket.on('canvas_cleared', () => {
      if (this.onCanvasCleared) this.onCanvasCleared();
    });

    this.socket.on('pong', () => {
      this.latency = Date.now() - this.pingStart;
    });
  }

  measureLatency() {
    setInterval(() => {
      this.pingStart = Date.now();
      this.socket.emit('ping');
    }, 2000);
  }

  joinRoom(roomId, userName) {
    this.socket.emit('join_room', {
      roomId: roomId || 'default',
      name: userName
    });
  }

  emitDrawStart(data) {
    this.socket.emit('draw_start', data);
  }

  emitDrawMove(data) {
    this.socket.emit('draw_move', data);
  }

  emitDrawEnd(data) {
    this.socket.emit('draw_end', data);
  }

  emitCursorMove(position) {
    this.socket.emit('cursor_move', position);
  }

  emitUndo() {
    this.socket.emit('undo');
  }

  emitRedo() {
    this.socket.emit('redo');
  }

  emitClear() {
    this.socket.emit('clear_canvas');
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

window.WebSocketManager = WebSocketManager;