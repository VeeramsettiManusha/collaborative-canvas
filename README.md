# 🎨 Real-Time Collaborative Drawing Canvas

A multi-user drawing application where multiple people can draw simultaneously on a shared canvas with real-time synchronization.

## Features

- **Real-time Drawing**: See other users' drawings as they draw (not after they finish)
- **Drawing Tools**: Brush and eraser with customizable colors and stroke width
- **User Indicators**: Ghost cursors showing where other users are drawing
- **Global Undo/Redo**: Works across all users with per-user history tracking
- **Room System**: Multiple isolated canvases for different sessions
- **Mobile Support**: Touch drawing support for tablets and phones
- **Performance Metrics**: FPS counter and latency display

## Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5 Canvas API, CSS3
- **Backend**: Node.js, Express, Socket.io
- **No drawing libraries** - Pure Canvas API implementation

## Setup Instructions

### Prerequisites
- Node.js v18+ installed
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/collaborative-canvas.git
cd collaborative-canvas
Install dependencies:
npm install
Start the server:
npm start
Open your browser and navigate to:
http://localhost:3000
Testing with Multiple Users
Open the app in multiple browser windows/tabs
Enter different usernames for each window
Use the same room ID to join the same canvas
Start drawing and see real-time synchronization!
For network testing:

Find your local IP address
Other devices on the same network can connect via http://YOUR_IP:3000
Project Structure
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
Known Limitations
Canvas state is stored in memory (resets on server restart)
No user authentication (anyone can join any room)
Maximum recommended users per room: ~20 (for optimal performance)
Undo only works for your own strokes
Time Spent
Planning & Architecture: 2 hours
Canvas Implementation: 4 hours
WebSocket Integration: 3 hours
Undo/Redo System: 2 hours
UI/UX & Styling: 2 hours
Testing & Bug Fixes: 2 hours
Documentation: 1 hour
Total: ~16 hours

Deployment
Render (Recommended)
Create a new Web Service on Render
Connect your GitHub repository
Set build command: npm install
Set start command: npm start
Railway
Create new project from GitHub
Railway auto-detects Node.js
Deploy automatically
Heroku
heroku create your-app-name
git push heroku main
License
MIT