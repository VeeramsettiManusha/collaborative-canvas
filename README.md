# 🎨 Collaborative Canvas

A real-time collaborative drawing application where multiple users can draw together on a shared canvas. Built with HTML5 Canvas, Socket.IO, and Node.js.

![Collaborative Canvas Demo](https://img.shields.io/badge/Status-Active-success)
![Node.js](https://img.shields.io/badge/Node.js-v14+-green)
![Socket.IO](https://img.shields.io/badge/Socket.IO-v4.0+-blue)

## ✨ Features

- 🎨 **Real-time Drawing** - Draw with multiple users simultaneously
- 👥 **Multi-user Support** - See who's online and their cursors in real-time
- 🎯 **Drawing Tools** - Brush and Eraser with customizable colors and stroke width
- ↩️ **Undo/Redo** - Per-user undo and redo functionality
- 🏠 **Room System** - Create or join different drawing rooms
- 📱 **Responsive Design** - Works on desktop and mobile devices
- ⚡ **Low Latency** - Optimized for smooth drawing experience

## 🖼️ Screenshots

<!-- Add screenshots of your application here -->
<img width="1918" height="914" alt="image" src="https://github.com/user-attachments/assets/b90ceca0-aede-4e7b-ae96-2834f506c08e" />
<img width="1917" height="912" alt="image" src="https://github.com/user-attachments/assets/0bedca5e-c9c0-42f2-adb0-d6be5f0604e4" />



## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/VeeramsettiManusha/collaborative-canvas.git
   cd collaborative-canvas
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
collaborative-canvas/
├── client/
│   ├── index.html      # Main UI structure
│   ├── style.css       # Responsive styling
│   ├── canvas.js       # Canvas drawing logic
│   ├── websocket.js    # WebSocket client manager
│   └── main.js         # Application entry point
├── server/
│   ├── server.js       # Express + Socket.io server
│   ├── rooms.js        # Room management
│   └── state-manager.js # Drawing state & history
├── package.json
├── README.md
└── ARCHITECTURE.md
```

## 🛠️ Tech Stack

**Frontend:**
- HTML5 Canvas
- CSS3
- Vanilla JavaScript
- Socket.IO Client

**Backend:**
- Node.js
- Express.js
- Socket.IO Server

## 🎮 Usage

1. **Join a Room**
   - Enter your name
   - Optionally specify a room ID (leave empty for default room)

2. **Drawing**
   - Select Brush or Eraser tool
   - Choose a color from the palette
   - Adjust stroke width
   - Draw on the canvas!

3. **Collaboration**
   - See other users' cursors in real-time
   - Watch drawings appear as others create them
   - Use Undo/Redo for your own strokes

4. **Keyboard Shortcuts**
   - `Ctrl + Z` - Undo
   - `Ctrl + Y` - Redo
   - `B` - Switch to Brush
   - `E` - Switch to Eraser

## 📡 WebSocket Events

### Client → Server
- `join_room` - Join a drawing room
- `draw_start` - Start a new stroke
- `draw_move` - Continue drawing
- `draw_end` - Complete stroke
- `cursor_move` - Update cursor position
- `undo` / `redo` - Undo/redo strokes
- `clear_canvas` - Clear the canvas

### Server → Client
- `user_info` - Assigned user information
- `canvas_state` - Initial canvas state
- `user_joined` / `user_left` - User notifications
- `draw_start` / `draw_move` / `draw_end` - Remote drawing
- `cursor_update` - Remote cursor positions

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed technical documentation.

## 🔧 Configuration

### Server Configuration (server/server.js)

```javascript
const PORT = process.env.PORT || 3000;
const MAX_USERS_PER_ROOM = 20; // Recommended limit
```

### Client Configuration

No configuration needed - connects to server automatically.

## 🚀 Deployment

### Deploy to Heroku

1. Create Heroku app
   ```bash
   heroku create your-app-name
   ```

2. Push to Heroku
   ```bash
   git push heroku main
   ```

### Deploy to Railway/Render

1. Connect your GitHub repository
2. Set build command: `cd server && npm install`
3. Set start command: `cd server && npm start`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- HTML5 Canvas API
- Inter font family

## 👨‍💻 Author

**Your Name**
- GitHub: [@VeeramsettiManusha](https://github.com/VeeramsettiManusha)
- LinkedIn: [manusha-veeramsetti](https://linkedin.com/in/manusha-veeramsetti)

## 📞 Support

If you have any questions or issues, please open an issue on GitHub.

---

⭐ Star this repo if you find it helpful!
