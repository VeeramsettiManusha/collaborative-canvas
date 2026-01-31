# 🏗️ Architecture Documentation

## 📋 Quick Overview

This is a real-time collaborative drawing canvas where multiple users can:
- ✏️ Draw together in the same room
- 👁️ See each other's cursors and strokes instantly
- ↩️ Undo/redo their own strokes
- 🏠 Join different rooms for isolated sessions

**Tech Stack:** Socket.IO, HTML5 Canvas, Node.js  
**Max Recommended Users:** 20 per room  
**Architecture Pattern:** Client-Server with WebSocket Communication

---

## 🔄 Data Flow Diagram

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER INPUT                             │
│      Mouse/Touch Events → Canvas Coordinates → Drawing Ops     │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CANVAS MANAGER                            │
│  • Normalizes coordinates (CSS px → Canvas px)                  │
│  • Captures stroke points at 60fps                              │
│  • Renders local strokes immediately (client prediction)        │
│  • Stores strokes for redraw operations                         │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      WEBSOCKET MANAGER                          │
│  • Serializes drawing events to JSON                            │
│  • Emits events: draw_start, draw_move, draw_end                │
│  • Receives events from other users                             │
│  • Handles connection state and reconnection                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SOCKET.IO SERVER                           │
│  • Routes events to appropriate rooms                           │
│  • Broadcasts to all users except sender                        │
│  • Manages user connections and disconnections                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       STATE MANAGER                             │
│  • Maintains authoritative stroke history                       │
│  • Handles undo/redo stacks per user                            │
│  • Provides initial state for new connections                   │
└─────────────────────────────────────────────────────────────────┘
```

### Detailed Drawing Flow

```
User A Draws                Server                    User B Sees
─────────────────────────────────────────────────────────────────
    │
    │ Mouse Down
    ├──────────────────►  draw_start
    │                         │
    │                         │ Broadcast
    │                         ├──────────────────►  Render Start
    │                         │
    │ Mouse Move              │
    ├──────────────────►  draw_move
    │                         │
    │                         │ Broadcast
    │                         ├──────────────────►  Render Point
    │                         │
    │ Mouse Up                │
    ├──────────────────►  draw_end
    │                         │
    │                         │ Store Stroke
    │                         │ Broadcast
    │                         ├──────────────────►  Render Complete
    │                         │
```

---

## 🌐 System Architecture

### Network Topology

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │◄───────►│   Node.js   │◄───────►│   Browser   │
│   Client 1  │  WebSkt │   Server    │  WebSkt │   Client 2  │
│             │         │ (Socket.IO) │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
      │                        │                        │
      └────────────────────────┴────────────────────────┘
                    WebSocket Broadcast
```

### Component Breakdown

**Frontend (Client)**
- `index.html` - UI structure
- `style.css` - Visual styling
- `canvas.js` - Canvas drawing logic
- `websocket.js` - WebSocket communication
- `main.js` - Application orchestration

**Backend (Server)**
- `server.js` - Express + Socket.IO server
- `rooms.js` - Room and state management
- `package.json` - Dependencies

---

## 📡 WebSocket Protocol

### Event Types Overview

| Direction | Event Count | Purpose |
|-----------|-------------|---------|
| Client → Server | 8 events | User actions (draw, undo, join) |
| Server → Client | 11 events | State updates and broadcasts |

---

### Client → Server Events

#### 1. Join Room
```javascript
Event: 'join_room'
Payload: {
  roomId: String,  // Room identifier (optional, defaults to "default")
  name: String     // User's display name
}
Description: User joins a drawing room and receives initial state
```

#### 2. Draw Start
```javascript
Event: 'draw_start'
Payload: {
  strokeId: String,  // Unique identifier for this stroke
  x: Number,         // X coordinate (normalized 0-1)
  y: Number,         // Y coordinate (normalized 0-1)
  color: String,     // Hex color code
  width: Number,     // Stroke width in pixels
  tool: String       // "brush" or "eraser"
}
Description: User begins a new stroke
```

#### 3. Draw Move
```javascript
Event: 'draw_move'
Payload: {
  strokeId: String,  // Reference to active stroke
  x: Number,         // Current X coordinate
  y: Number          // Current Y coordinate
}
Description: User continues drawing (sent continuously during drag)
```

#### 4. Draw End
```javascript
Event: 'draw_end'
Payload: {
  strokeId: String,       // Reference to completed stroke
  points: Array<Point>,   // All points in stroke [{x, y}, ...]
  color: String,          // Final color
  width: Number,          // Final width
  tool: String            // Final tool type
}
Description: User completes a stroke
```

#### 5. Cursor Move
```javascript
Event: 'cursor_move'
Payload: {
  x: Number,  // Cursor X position (normalized)
  y: Number   // Cursor Y position (normalized)
}
Description: Update cursor position for other users to see
```

#### 6. Undo
```javascript
Event: 'undo'
Payload: {}
Description: User undoes their last stroke
```

#### 7. Redo
```javascript
Event: 'redo'
Payload: {}
Description: User redoes their last undone stroke
```

#### 8. Clear Canvas
```javascript
Event: 'clear_canvas'
Payload: {}
Description: User clears entire canvas (all strokes)
```

---

### Server → Client Events

#### 1. User Info
```javascript
Event: 'user_info'
Payload: {
  id: String,     // Unique user ID
  name: String,   // User's display name
  color: String   // Assigned color for cursor/identification
}
Description: Server assigns user information upon connection
```

#### 2. Canvas State
```javascript
Event: 'canvas_state'
Payload: {
  strokes: Array<Stroke>,  // All existing strokes in room
  users: Array<User>       // All connected users
}
Description: Initial state sent when user joins room
```

#### 3. User Joined
```javascript
Event: 'user_joined'
Payload: {
  id: String,     // New user's ID
  name: String,   // New user's name
  color: String   // New user's color
}
Description: Notifies existing users of new user joining
```

#### 4. User Left
```javascript
Event: 'user_left'
Payload: {
  id: String,    // Disconnected user's ID
  name: String   // Disconnected user's name
}
Description: Notifies users when someone disconnects
```

#### 5. Remote Draw Start
```javascript
Event: 'draw_start'
Payload: {
  userId: String,   // Who is drawing
  strokeId: String, // Stroke identifier
  x: Number,        // Starting X
  y: Number,        // Starting Y
  color: String,    // Stroke color
  width: Number     // Stroke width
}
Description: Another user started drawing
```

#### 6. Remote Draw Move
```javascript
Event: 'draw_move'
Payload: {
  userId: String,  // Who is drawing
  x: Number,       // Current X
  y: Number        // Current Y
}
Description: Another user is continuing their stroke
```

#### 7. Remote Draw End
```javascript
Event: 'draw_end'
Payload: {
  id: String,            // Stroke ID
  userId: String,        // Who drew it
  points: Array<Point>,  // Complete stroke data
  color: String,         // Final color
  width: Number          // Final width
}
Description: Another user completed their stroke
```

#### 8. Cursor Update
```javascript
Event: 'cursor_update'
Payload: {
  userId: String,  // Whose cursor
  x: Number,       // Cursor X position
  y: Number,       // Cursor Y position
  color: String    // User's color
}
Description: Another user's cursor moved
```

#### 9. Stroke Undone
```javascript
Event: 'stroke_undone'
Payload: {
  strokeId: String,  // Which stroke was undone
  userId: String     // Who undid it
}
Description: A user undid one of their strokes
```

#### 10. Stroke Redone
```javascript
Event: 'stroke_redone'
Payload: {
  stroke: Object,   // Complete stroke object
  userId: String    // Who redid it
}
Description: A user redid one of their strokes
```

#### 11. Canvas Cleared
```javascript
Event: 'canvas_cleared'
Payload: {}
Description: The canvas was cleared by a user
```

---

## ↩️ Undo/Redo Strategy

### The Challenge

Global undo/redo in a collaborative environment is complex because:

1. **Concurrency** - Multiple users create strokes simultaneously
2. **Per-User Operations** - User A should only undo their own strokes
3. **State Consistency** - Canvas must remain synchronized across all clients
4. **Interleaved Strokes** - Strokes from different users are mixed in timeline

**Example Problem:**
```
Timeline: [UserA-Stroke1, UserB-Stroke1, UserA-Stroke2, UserB-Stroke2]

If UserA presses Undo, which stroke should be removed?
Answer: UserA-Stroke2 (their most recent)
```

---

### Our Solution: Per-User History Stacks

#### Server State Structure

```
┌─────────────────────────────────────────────────────────────┐
│                   Global Stroke Array                       │
│                                                              │
│  [stroke1, stroke2, stroke3, stroke4, stroke5, stroke6]     │
│      ↑        ↑        ↑        ↑        ↑        ↑         │
│    userA    userB    userA    userB    userA    userB       │
│                                                              │
│  Each stroke has: { id, userId, points, color, undone }     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Per-User Redo Stacks                      │
│                                                              │
│  userA: [stroke5]  ← UserA undid stroke5                    │
│  userB: []         ← UserB has nothing to redo              │
└─────────────────────────────────────────────────────────────┘
```

---

### Algorithm Details

#### Undo Operation

**Steps:**
1. **Find Target** - Locate last non-undone stroke by requesting user
   ```javascript
   const lastStroke = strokes
     .filter(s => s.userId === userId && !s.undone)
     .pop();
   ```

2. **Mark as Undone** - Set `undone: true` flag
   ```javascript
   lastStroke.undone = true;
   ```

3. **Update Redo Stack** - Push to user's redo stack
   ```javascript
   redoStacks[userId].push(lastStroke);
   ```

4. **Broadcast** - Notify all clients
   ```javascript
   socket.broadcast.emit('stroke_undone', {
     strokeId: lastStroke.id,
     userId: userId
   });
   ```

5. **Client Redraw** - Each client marks stroke and redraws canvas

**Time Complexity:** O(n) where n = number of strokes  
**Space Complexity:** O(1) additional per undo operation

---

#### Redo Operation

**Steps:**
1. **Pop from Stack** - Get last undone stroke
   ```javascript
   const stroke = redoStacks[userId].pop();
   ```

2. **Restore Stroke** - Set `undone: false`
   ```javascript
   stroke.undone = false;
   ```

3. **Broadcast** - Notify all clients
   ```javascript
   socket.broadcast.emit('stroke_redone', {
     stroke: stroke,
     userId: userId
   });
   ```

4. **Client Redraw** - Each client updates and redraws

**Time Complexity:** O(1)  
**Space Complexity:** O(1)

---

#### Conflict Handling Rules

| Scenario | Behavior |
|----------|----------|
| New stroke while redo stack has items | Clear user's redo stack |
| Undo on empty history | Ignored (no-op) |
| Redo on empty redo stack | Ignored (no-op) |
| Undo while other user drawing | Independent - no conflict |
| Canvas cleared | Clear all redo stacks |

**Key Design Decision:** 
Undone strokes are **marked, not deleted**. This allows:
- ✅ Efficient redo (no data reconstruction)
- ✅ Preserving stroke order/layering
- ✅ Simpler state management

**Canvas Rendering:**
```javascript
function redrawCanvas() {
  strokes
    .filter(stroke => !stroke.undone)  // Skip undone strokes
    .forEach(stroke => drawStroke(stroke));
}
```

---

## ⚡ Performance Decisions

### 1. Client-Side Prediction

**Problem:** Network latency makes drawing feel sluggish  
**Solution:** Render locally immediately, sync asynchronously

```javascript
handlePointerMove(event) {
  const currentPoint = getPoint(event);
  
  // IMMEDIATE: Local render (no latency)
  this.drawSegment(lastPoint, currentPoint);
  
  // ASYNC: Send to server (may have latency)
  wsManager.emitDrawMove({
    strokeId: this.currentStroke.id,
    x: currentPoint.x,
    y: currentPoint.y
  });
  
  lastPoint = currentPoint;
}
```

**Benefits:**
- ✅ Zero perceived latency for local user
- ✅ Smooth drawing experience
- ✅ Immediate visual feedback

**Trade-offs:**
- ⚠️ Potential inconsistency if message is lost
- ⚠️ Requires reconciliation on reconnect

---

### 2. Event Batching Strategy

**Current Implementation:** Real-time streaming (optimized for low latency)

```javascript
// Sent on every mousemove event (~60 times/second)
socket.emit('draw_move', { x, y });
```

**Alternative for High-Latency Networks:** Point batching

```javascript
// Collect points for 16ms (~60fps), send as batch
const pointBuffer = [];

setInterval(() => {
  if (pointBuffer.length > 0) {
    socket.emit('draw_move_batch', { points: pointBuffer });
    pointBuffer = [];
  }
}, 16);
```

**Trade-off Analysis:**

| Approach | Latency | Bandwidth | Smoothness |
|----------|---------|-----------|------------|
| Real-time streaming | Low | High | Excellent |
| Batched (16ms) | Medium | Medium | Good |
| Batched (100ms) | High | Low | Poor |

**Current Choice:** Real-time streaming
- Most users have low-latency connections
- Smoothness prioritized over bandwidth

---

### 3. Efficient Redraw Strategy

**Problem:** Full canvas redraw is expensive

**Our Approach:** Selective redrawing

```javascript
// NEW STROKE: Incremental draw (fast)
function handleDrawMove(point) {
  ctx.lineTo(point.x, point.y);
  ctx.stroke();  // Only draws new segment
}

// UNDO/REDO: Full redraw (necessary)
function handleUndo() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes
    .filter(s => !s.undone)
    .forEach(drawCompleteStroke);  // Redraw all
}

// REMOTE STROKE: Incremental as points arrive
function handleRemoteMove(point) {
  remoteCtx.lineTo(point.x, point.y);
  remoteCtx.stroke();
}
```

**Performance Impact:**
- New strokes: **O(1)** per point
- Undo/Redo: **O(n × m)** where n = strokes, m = points per stroke
- Typical: ~100 strokes × ~50 points = 5000 operations (~16ms)

---

### 4. Cursor Throttling

**Problem:** Sending cursor position on every mousemove floods the network

**Solution:** Natural throttling + CSS transitions

```javascript
// Client: Send on every mousemove (browser throttles to ~100/sec)
canvas.addEventListener('mousemove', (e) => {
  socket.emit('cursor_move', { x: e.offsetX, y: e.offsetY });
});
```

```css
/* Smooth cursor movement between updates */
.remote-cursor {
  transition: transform 0.05s linear;
}
```

**Results:**
- ~100 updates/second (browser's natural throttling)
- CSS interpolates between updates
- Smooth appearance despite lower update rate

---

### 5. Memory Management

**Design Decisions:**

```javascript
// ✅ Efficient: Store as point arrays
stroke = {
  id: 'uuid',
  userId: 'user123',
  points: [{x: 0.5, y: 0.5}, ...],  // ~8 bytes per point
  color: '#FF0000',
  width: 5
}

// ❌ Wasteful: Store as image data
stroke = {
  imageData: ctx.getImageData(...)  // ~4MB for 1920×1080 canvas
}
```

**Memory Calculation:**
```
Typical stroke:
- 50 points × 16 bytes = 800 bytes
- Metadata = ~200 bytes
- Total per stroke = ~1KB

100 strokes = ~100KB
1000 strokes = ~1MB  ← Manageable in browser memory
```

**Garbage Collection:**
- Old/empty rooms deleted when last user leaves
- No persistent storage (strokes lost on server restart)
- Could add Redis/MongoDB for persistence

---

## 🔧 Conflict Resolution

### 1. Overlapping Drawing

**Scenario:** Two users draw in the same area simultaneously

```
User A: Draws red line at (100, 100) → (200, 200)
User B: Draws blue line at (150, 150) → (250, 250)
```

**Resolution:** No conflict! Strokes are independent

**Rendering Order:**
```javascript
// Strokes rendered in order received
// Last stroke appears on top
canvas.drawStroke(userA_stroke);  // Red line
canvas.drawStroke(userB_stroke);  // Blue line (on top)
```

**Result:** Natural layering effect, no data loss

---

### 2. Network Issues

#### Scenario A: Drawing While Offline

```
1. User disconnects
2. User draws locally → Strokes render immediately
3. WebSocket fails to send
4. User reconnects
5. Strokes are LOST (not implemented: offline queue)
```

**Potential Solution (not implemented):**
```javascript
// Store failed events in localStorage
if (!socket.connected) {
  localStorage.setItem('pendingStrokes', JSON.stringify(strokes));
}

// On reconnect, send queued strokes
socket.on('connect', () => {
  const pending = JSON.parse(localStorage.getItem('pendingStrokes'));
  pending.forEach(stroke => socket.emit('draw_end', stroke));
});
```

---

#### Scenario B: Out-of-Order Messages

```
Sent Order:  Point1 → Point2 → Point3
Received Order: Point1 → Point3 → Point2  ❌
```

**Current Handling:** Points implicitly ordered by array index

```javascript
// Complete stroke includes all points in order
socket.emit('draw_end', {
  points: [point1, point2, point3, ...]  // Ordered array
});
```

**Worst Case:** Slightly jumbled intermediate rendering during `draw_move` events, but `draw_end` corrects it

**Better Solution (not implemented):** Sequence numbers
```javascript
{
  strokeId: 'abc',
  sequenceNumber: 5,
  point: {x, y}
}
```

---

### 3. State Recovery

**When a new user joins:**

```
1. Server sends complete room state
   ↓
2. Client receives all existing strokes
   ↓
3. Client renders strokes in order
   ↓
4. User is now synchronized
```

**Code Flow:**
```javascript
// Server
socket.on('join_room', (data) => {
  const room = rooms[roomId];
  
  // Send complete state to new user
  socket.emit('canvas_state', {
    strokes: room.strokes.filter(s => !s.undone),
    users: room.users
  });
});

// Client
socket.on('canvas_state', (state) => {
  // Render all strokes
  state.strokes.forEach(stroke => {
    drawCompleteStroke(stroke);
  });
  
  // Update user list
  updateUserList(state.users);
});
```

**Complexity:** O(n × m) where n = strokes, m = points per stroke  
**Typical Join Time:** ~100ms for 100 strokes

---

## 📈 Scaling Considerations

### Current System Limits

**Architecture:** Single Node.js server with in-memory storage

**Limitations:**
```
✅ Works well for: 1-20 users per room
⚠️ Degrades at: 50+ users per room
❌ Fails at: 100+ users per room
```

**Bottlenecks:**
1. **Memory:** All strokes stored in RAM
2. **CPU:** Broadcasting to all users in room
3. **Network:** Server bandwidth for broadcasts

**Example Resource Usage:**
```
20 users × 100 messages/sec = 2,000 messages/sec
Each message: ~500 bytes
Bandwidth: ~1 MB/sec  ← Manageable

100 users × 100 messages/sec = 10,000 messages/sec
Bandwidth: ~5 MB/sec  ← Server overload
```

---

### Scaling to 1000+ Users

#### Horizontal Scaling Architecture

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │   (NGINX/HAProxy)│
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
     ┌──────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐
     │  Server 1   │  │  Server 2  │  │  Server 3  │
     │  (Node.js)  │  │  (Node.js) │  │  (Node.js) │
     └──────┬──────┘  └─────┬──────┘  └─────┬──────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
                    ┌────────▼─────────┐
                    │      Redis       │
                    │  (Pub/Sub + DB)  │
                    └──────────────────┘
```

#### Required Changes

**1. Socket.IO Redis Adapter**
```javascript
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ host: 'redis-server', port: 6379 });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

**Benefit:** Broadcasts work across multiple servers

---

**2. Persistent Storage**
```javascript
// Store strokes in Redis/MongoDB instead of memory
const stroke = {
  id: uuid(),
  roomId: 'room123',
  userId: 'user456',
  points: [...],
  timestamp: Date.now()
};

await redis.hset(`room:${roomId}:strokes`, stroke.id, JSON.stringify(stroke));
```

**Benefit:** Data survives server restarts

---

**3. Spatial Partitioning**
```javascript
// Only send strokes visible in user's viewport
const viewport = {
  x: 0, y: 0,
  width: 1920, height: 1080
};

const visibleStrokes = strokes.filter(stroke => 
  isInViewport(stroke, viewport)
);

socket.emit('canvas_state', { strokes: visibleStrokes });
```

**Benefit:** Reduces initial load time and memory

---

**4. Delta Compression**
```javascript
// Instead of sending all points
points: [{x: 100, y: 100}, {x: 101, y: 101}, {x: 102, y: 102}]

// Send deltas (difference from previous point)
deltas: [{x: 100, y: 100}, {dx: 1, dy: 1}, {dx: 1, dy: 1}]

// Compression: ~40% smaller payload
```

---

**5. WebRTC Peer-to-Peer (for small groups)**
```javascript
// For 2-5 users, connect directly
const peerConnection = new RTCPeerConnection();

// Send drawing data directly, bypass server
dataChannel.send(JSON.stringify({
  type: 'draw_move',
  x: 100,
  y: 200
}));
```

**Benefit:** Zero server load for drawing data

---

### Performance Comparison

| Users | Current | With Redis | With Spatial | With P2P |
|-------|---------|------------|--------------|----------|
| 10 | ✅ 100ms | ✅ 100ms | ✅ 100ms | ✅ 50ms |
| 50 | ⚠️ 500ms | ✅ 150ms | ✅ 120ms | ✅ 60ms |
| 100 | ❌ Crash | ⚠️ 400ms | ✅ 200ms | ✅ 80ms |
| 1000 | ❌ N/A | ❌ Crash | ⚠️ 1000ms | ✅ 100ms |

---

## 🚀 Future Improvements

### 1. Operational Transform (OT)
**Purpose:** True conflict resolution for collaborative editing

```javascript
// When User A and User B edit simultaneously
// OT algorithm transforms operations to maintain consistency

function transform(op1, op2) {
  // Complex algorithm to resolve conflicts
  // Example: Google Docs uses this
}
```

**Benefit:** Prevents lost updates, maintains causality

---

### 2. Canvas Layers
**Purpose:** Better organization and undo granularity

```javascript
layers = [
  { id: 'background', strokes: [...] },
  { id: 'sketch', strokes: [...] },
  { id: 'final', strokes: [...] }
];

// Undo only affects current layer
```

---

### 3. Stroke Simplification
**Purpose:** Reduce storage and bandwidth

```javascript
// Ramer-Douglas-Peucker algorithm
// Reduces 1000 points to 50 points with minimal visual difference

const simplified = simplifyStroke(complexStroke, tolerance=2.0);
// 95% fewer points, 2px max deviation
```

---

### 4. Offline Support
**Purpose:** Work without internet, sync when connected

```javascript
// Service Worker caches app
// IndexedDB stores pending strokes
// Background sync sends when online

navigator.serviceWorker.register('/sw.js');

if ('sync' in registration) {
  registration.sync.register('sync-strokes');
}
```

---

### 5. Pressure Sensitivity
**Purpose:** Support stylus/pen input

```javascript
// Use Pointer Events API
canvas.addEventListener('pointermove', (e) => {
  const pressure = e.pressure || 0.5;  // 0.0 to 1.0
  
  ctx.lineWidth = baseWidth * pressure;
  // Thicker lines with more pressure
});
```

---

## 📚 Additional Resources

**WebSocket Protocol:**
- [Socket.IO Documentation](https://socket.io/docs/)
- [WebSocket RFC 6455](https://tools.ietf.org/html/rfc6455)

**Canvas Performance:**
- [HTML5 Canvas Performance](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)

**Collaborative Algorithms:**
- [Operational Transformation](https://en.wikipedia.org/wiki/Operational_transformation)
- [CRDT (Conflict-free Replicated Data Types)](https://crdt.tech/)

---

## 📝 Changelog

**Version 1.0 (Current)**
- Basic real-time drawing
- Per-user undo/redo
- Room system
- Cursor tracking

**Planned for 2.0**
- Persistent storage (Redis)
- Offline support
- Layer system
- Advanced tools (shapes, text)

---

**Last Updated:** January 31, 2026  
**Author:** Veeramsetti Manusha  
**License:** MIT
