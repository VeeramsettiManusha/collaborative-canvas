document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('main-canvas');
  const canvasManager = new CanvasManager(canvas);
  const wsManager = new WebSocketManager();
  
  // DOM Elements
  const joinModal = document.getElementById('join-modal');
  const joinBtn = document.getElementById('join-btn');
  const userNameInput = document.getElementById('user-name-input');
  const roomIdInput = document.getElementById('room-id-input');
  const roomNameDisplay = document.getElementById('room-name');
  const userCountDisplay = document.getElementById('user-count');
  const usersListEl = document.getElementById('users-list');
  const cursorsLayer = document.getElementById('cursors-layer');
  const fpsCounter = document.getElementById('fps-counter');
  const latencyDisplay = document.getElementById('latency');
  const strokeCountDisplay = document.getElementById('stroke-count');
  
  const toolBtns = document.querySelectorAll('.tool-btn');
  const colorInput = document.getElementById('color-input');
  const colorBtns = document.querySelectorAll('.color-btn');
  const strokeWidthInput = document.getElementById('stroke-width');
  const strokeValueDisplay = document.getElementById('stroke-value');
  const strokePreviewDot = document.getElementById('stroke-preview-dot');
  const undoBtn = document.getElementById('undo-btn');
  const redoBtn = document.getElementById('redo-btn');
  const clearBtn = document.getElementById('clear-btn');
  
  // State
  let currentUser = null;
  let users = new Map();
  let remoteCursors = new Map();
  let strokeCount = 0;

  // When user info is received from server
  wsManager.onUserInfo = (data) => {
    currentUser = data;
    canvasManager.setUserInfo(data.id, data.name, data.color);
    
    // Set the color picker to user's assigned color
    colorInput.value = data.color;
    canvasManager.setColor(data.color);
    
    // Update color button selection
    colorBtns.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.color.toUpperCase() === data.color.toUpperCase()) {
        btn.classList.add('active');
      }
    });
    
    // Update stroke preview color
    strokePreviewDot.style.backgroundColor = data.color;
  };

  // Canvas events
  canvasManager.onDrawStart = (data) => wsManager.emitDrawStart(data);
  canvasManager.onDrawMove = (data) => wsManager.emitDrawMove(data);
  canvasManager.onDrawEnd = (data) => {
    wsManager.emitDrawEnd(data);
    strokeCount++;
    strokeCountDisplay.textContent = strokeCount;
  };
  canvasManager.onCursorMove = (pos) => wsManager.emitCursorMove(pos);
  canvasManager.onFPSUpdate = (fps) => fpsCounter.textContent = fps;

  // WebSocket events
  wsManager.onCanvasState = (data) => {
    canvasManager.loadState(data.strokes || []);
    strokeCount = (data.strokes || []).filter(s => !s.undone).length;
    strokeCountDisplay.textContent = strokeCount;
    data.users.forEach(user => users.set(user.id, user));
    updateUsersList();
  };
  
  wsManager.onUserJoined = (data) => {
    users.set(data.id, data);
    updateUsersList();
    showToast(`${data.name} joined`, data.color);
  };
  
  wsManager.onUserLeft = (data) => {
    users.delete(data.id);
    removeRemoteCursor(data.id);
    updateUsersList();
    showToast(`${data.name} left`, '#6b7280');
  };
  
  wsManager.onDrawStart = (data) => canvasManager.handleRemoteDrawStart(data);
  wsManager.onDrawMove = (data) => {
    canvasManager.handleRemoteDrawMove(data);
    updateRemoteCursor(data, true);
  };
  wsManager.onDrawEnd = (data) => {
    canvasManager.handleRemoteDrawEnd(data);
    strokeCount++;
    strokeCountDisplay.textContent = strokeCount;
  };
  
  wsManager.onCursorUpdate = (data) => updateRemoteCursor(data, false);
  
  wsManager.onStrokeUndone = (data) => {
    canvasManager.handleStrokeUndone(data.strokeId);
    strokeCount = Math.max(0, strokeCount - 1);
    strokeCountDisplay.textContent = strokeCount;
  };
  
  wsManager.onStrokeRedone = (data) => {
    canvasManager.handleStrokeRedone(data.stroke);
    strokeCount++;
    strokeCountDisplay.textContent = strokeCount;
  };
  
  wsManager.onCanvasCleared = () => {
    canvasManager.clear();
    strokeCount = 0;
    strokeCountDisplay.textContent = strokeCount;
  };

  // Join room
  joinBtn.addEventListener('click', async () => {
    const userName = userNameInput.value.trim() || 'Anonymous';
    const roomId = roomIdInput.value.trim() || 'default';
    
    try {
      await wsManager.connect();
      wsManager.joinRoom(roomId, userName);
      roomNameDisplay.textContent = roomId;
      joinModal.classList.add('hidden');
    } catch (error) {
      alert('Failed to connect to server. Please try again.');
      console.error(error);
    }
  });

  // Tool selection
  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toolBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      canvasManager.setTool(btn.dataset.tool);
    });
  });

  // Color selection
  colorInput.addEventListener('input', (e) => {
    canvasManager.setColor(e.target.value);
    strokePreviewDot.style.backgroundColor = e.target.value;
    colorBtns.forEach(b => b.classList.remove('active'));
  });
  
  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.dataset.color;
      canvasManager.setColor(color);
      colorInput.value = color;
      strokePreviewDot.style.backgroundColor = color;
      colorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Stroke width
  strokeWidthInput.addEventListener('input', (e) => {
    const width = parseInt(e.target.value);
    canvasManager.setStrokeWidth(width);
    strokeValueDisplay.textContent = width;
    strokePreviewDot.style.width = `${width}px`;
    strokePreviewDot.style.height = `${width}px`;
  });

  // Undo/Redo
  undoBtn.addEventListener('click', () => wsManager.emitUndo());
  redoBtn.addEventListener('click', () => wsManager.emitRedo());

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (joinModal && !joinModal.classList.contains('hidden')) return;
    
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z') { e.preventDefault(); wsManager.emitUndo(); }
      else if (e.key === 'y') { e.preventDefault(); wsManager.emitRedo(); }
    }
    if (e.key === 'b' || e.key === 'B') {
      toolBtns.forEach(b => b.classList.remove('active'));
      document.querySelector('[data-tool="brush"]').classList.add('active');
      canvasManager.setTool('brush');
    }
    if (e.key === 'e' || e.key === 'E') {
      toolBtns.forEach(b => b.classList.remove('active'));
      document.querySelector('[data-tool="eraser"]').classList.add('active');
      canvasManager.setTool('eraser');
    }
  });

  // Clear canvas
  clearBtn.addEventListener('click', () => {
    if (confirm('Clear the entire canvas? This affects all users.')) {
      wsManager.emitClear();
    }
  });

  // Update latency display
  setInterval(() => {
    latencyDisplay.textContent = wsManager.latency;
  }, 1000);

  // Helper functions
  function updateUsersList() {
    usersListEl.innerHTML = '';
    userCountDisplay.textContent = users.size;
    
    users.forEach(user => {
      const li = document.createElement('li');
      const initial = user.name.charAt(0).toUpperCase();
      const isCurrentUser = user.id === wsManager.oderId;
      
      li.innerHTML = `
        <div class="user-avatar" style="background: ${user.color}">
          ${initial}
        </div>
        <div class="user-info">
          <div class="user-name">${user.name}</div>
          ${isCurrentUser ? '<div class="user-you">You</div>' : ''}
        </div>
        <div class="user-color-indicator" style="background: ${user.color}" title="Drawing color"></div>
      `;
      usersListEl.appendChild(li);
    });
  }

  function updateRemoteCursor(data, isDrawing) {
    let cursorEl = remoteCursors.get(data.oderId);
    const user = users.get(data.oderId);
    const userName = data.userName || user?.name || 'User';
    const userColor = data.userColor || user?.color || '#6b7280';
    const initial = userName.charAt(0).toUpperCase();
    
    if (!cursorEl) {
      cursorEl = document.createElement('div');
      cursorEl.className = 'remote-cursor';
      cursorEl.innerHTML = `
        <div class="cursor-bubble" style="background: ${userColor}">
          <span class="cursor-initial">${initial}</span>
        </div>
        <div class="cursor-label" style="background: ${userColor}">
          ${userName}
        </div>
        <div class="cursor-drawing-indicator"></div>
      `;
      cursorsLayer.appendChild(cursorEl);
      remoteCursors.set(data.oderId, cursorEl);
    }
    
    // Update position
    cursorEl.style.transform = `translate(${data.x}px, ${data.y}px)`;
    
    // Show drawing indicator when user is actively drawing
    const indicator = cursorEl.querySelector('.cursor-drawing-indicator');
    if (isDrawing) {
      indicator.style.background = userColor;
      indicator.classList.add('active');
    } else {
      indicator.classList.remove('active');
    }
  }

  function removeRemoteCursor(oderId) {
    const cursor = remoteCursors.get(oderId);
    if (cursor) {
      cursor.remove();
      remoteCursors.delete(oderId);
    }
  }

  function showToast(message, color) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <div class="toast-indicator" style="background: ${color}"></div>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // Handle enter key in inputs
  userNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinBtn.click();
  });
  
  roomIdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinBtn.click();
  });
});