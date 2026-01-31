const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const RoomManager = require('./rooms');
const StateManager = require('./state-manager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static(path.join(__dirname, '../client')));

const roomManager = new RoomManager();
const stateManager = new StateManager();

// Color palette for users - vibrant and distinct
const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFEAA7', '#DDA0DD', '#F8B500', '#00CED1',
  '#FF8C00', '#8B5CF6', '#EC4899', '#10B981',
  '#F59E0B', '#6366F1', '#EF4444', '#14B8A6'
];

let colorIndex = 0;

function getNextUserColor() {
  const color = USER_COLORS[colorIndex % USER_COLORS.length];
  colorIndex++;
  return color;
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  let currentRoom = 'default';
  let userColor = getNextUserColor();
  let userName = `User_${socket.id.substring(0, 4)}`;

  socket.on('join_room', (data) => {
    const { roomId, name } = data;
    currentRoom = roomId || 'default';
    userName = name || userName;
    
    socket.join(currentRoom);
    roomManager.addUser(currentRoom, {
      id: socket.id,
      name: userName,
      color: userColor
    });

    const canvasState = stateManager.getState(currentRoom);
    socket.emit('canvas_state', {
      strokes: canvasState.strokes,
      users: roomManager.getUsers(currentRoom)
    });

    socket.to(currentRoom).emit('user_joined', {
      id: socket.id,
      name: userName,
      color: userColor
    });

    // Send user their info including their assigned color
    socket.emit('user_info', {
      id: socket.id,
      name: userName,
      color: userColor
    });

    console.log(`${userName} joined room: ${currentRoom} with color: ${userColor}`);
  });

  socket.on('draw_start', (data) => {
    const strokeData = {
      ...data,
      oderId: socket.id,
      userName: userName,
      userColor: userColor,
      timestamp: Date.now()
    };
    socket.to(currentRoom).emit('draw_start', strokeData);
  });

  socket.on('draw_move', (data) => {
    socket.to(currentRoom).emit('draw_move', {
      oderId: socket.id,
      userName: userName,
      userColor: userColor,
      ...data
    });
  });

  socket.on('draw_end', (data) => {
    const stroke = {
      id: data.strokeId,
      oderId: socket.id,
      userName: userName,
      userColor: userColor,
      points: data.points,
      color: data.color,
      width: data.width,
      tool: data.tool,
      timestamp: Date.now()
    };

    stateManager.addStroke(currentRoom, stroke);
    socket.to(currentRoom).emit('draw_end', stroke);
  });

  socket.on('cursor_move', (data) => {
    socket.to(currentRoom).emit('cursor_update', {
      oderId: socket.id,
      userName: userName,
      userColor: userColor,
      x: data.x,
      y: data.y
    });
  });

  socket.on('undo', () => {
    const undoneStroke = stateManager.undoStroke(currentRoom, socket.id);
    if (undoneStroke) {
      io.to(currentRoom).emit('stroke_undone', {
        strokeId: undoneStroke.id,
        oderId: socket.id
      });
    }
  });

  socket.on('redo', () => {
    const redoneStroke = stateManager.redoStroke(currentRoom, socket.id);
    if (redoneStroke) {
      io.to(currentRoom).emit('stroke_redone', {
        stroke: redoneStroke,
        oderId: socket.id
      });
    }
  });

  socket.on('clear_canvas', () => {
    stateManager.clearState(currentRoom);
    io.to(currentRoom).emit('canvas_cleared');
  });

  socket.on('ping', () => {
    socket.emit('pong');
  });

  socket.on('disconnect', () => {
    roomManager.removeUser(currentRoom, socket.id);
    socket.to(currentRoom).emit('user_left', {
      id: socket.id,
      name: userName
    });
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});