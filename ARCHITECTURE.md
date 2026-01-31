```markdown
# Architecture Documentation

## Quick Overview
This is a real-time collaborative drawing canvas where multiple users can:
- Draw together in the same room
- See each other's cursors and strokes instantly
- Undo/redo their own strokes
- Join different rooms for isolated sessions

**Tech Stack:** Socket.IO, HTML5 Canvas, Node.js
**Max Recommended Users:** 20 per room

## Data Flow Diagram

┌─────────────────────────────────────────────────────────────────┐ │ USER INPUT │ │ Mouse/Touch Events → Canvas Coordinates → Drawing Operations │ └─────────────────────────┬───────────────────────────────────────┘ │ ▼ ┌─────────────────────────────────────────────────────────────────┐ │ CANVAS MANAGER │ │ • Normalizes coordinates (CSS px → Canvas px) │ │ • Captures stroke points at 60fps │ │ • Renders local strokes immediately (client prediction) │ │ • Stores strokes for redraw operations │ └─────────────────────────┬───────────────────────────────────────┘ │ ▼ ┌─────────────────────────────────────────────────────────────────┐ │ WEBSOCKET MANAGER │ │ • Serializes drawing events to JSON │ │ • Emits events: draw_start, draw_move, draw_end │ │ • Receives events from other users │ │ • Handles connection state and reconnection │ └─────────────────────────┬───────────────────────────────────────┘ │ ▼ ┌─────────────────────────────────────────────────────────────────┐ │ SOCKET.IO SERVER │ │ • Routes events to appropriate rooms │ │ • Broadcasts to all users except sender │ │ • Manages user connections and disconnections │ └─────────────────────────┬───────────────────────────────────────┘ │ ▼ ┌─────────────────────────────────────────────────────────────────┐ │ STATE MANAGER │ │ • Maintains authoritative stroke history │ │ • Handles undo/redo stacks per user │ │ • Provides initial state for new connections │ └─────────────────────────────────────────────────────────────────┘


## WebSocket Protocol

### Message Types

## System Architecture

┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │◄───────►│   Node.js   │◄───────►│   Browser   │
│   Client 1  │  WS     │   Server    │  WS     │   Client 2  │
│             │         │ (Socket.IO) │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
      │                        │                        │
      └────────────────────────┴────────────────────────┘
                    WebSocket Broadcast

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `{ roomId, name }` | Join a drawing room |
| `draw_start` | `{ strokeId, x, y, color, width, tool }` | Start new stroke |
| `draw_move` | `{ strokeId, x, y }` | Continue stroke |
| `draw_end` | `{ strokeId, points, color, width, tool }` | Complete stroke |
| `cursor_move` | `{ x, y }` | Update cursor position |
| `undo` | `{}` | Undo last stroke |
| `redo` | `{}` | Redo undone stroke |
| `clear_canvas` | `{}` | Clear entire canvas |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `user_info` | `{ id, name, color }` | Assigned user info |
| `canvas_state` | `{ strokes, users }` | Initial canvas state |
| `user_joined` | `{ id, name, color }` | New user notification |
| `user_left` | `{ id, name }` | User disconnect notification |
| `draw_start` | `{ userId, strokeId, x, y, color, width }` | Remote stroke start |
| `draw_move` | `{ userId, x, y }` | Remote stroke continue |
| `draw_end` | `{ id, userId, points, color, width }` | Remote stroke complete |
| `cursor_update` | `{ userId, x, y, color }` | Remote cursor position |
| `stroke_undone` | `{ strokeId, userId }` | Stroke was undone |
| `stroke_redone` | `{ stroke, userId }` | Stroke was redone |
| `canvas_cleared` | `{}` | Canvas was cleared |

## Undo/Redo Strategy

### The Challenge
Global undo/redo in a collaborative environment is complex because:
1. Multiple users are creating strokes simultaneously
2. User A should only be able to undo their own strokes
3. The canvas state must remain consistent across all clients

### Our Approach: Per-User History Stacks

Server State: ┌─────────────────────────────────────────┐ │ Global Stroke Array │ │ [stroke1, stroke2, stroke3, stroke4] │ │ ↑ ↑ ↑ ↑ │ │ userA userB userA userB │ └─────────────────────────────────────────┘

┌─────────────────────────────────────────┐ │ Per-User Redo Stacks │ │ userA: [stroke3] (after undo) │ │ userB: [] │ └─────────────────────────────────────────┘


### Algorithm

**Undo:**
1. Find the last non-undone stroke by the requesting user
2. Mark it as `undone: true`
3. Push to user's redo stack
4. Broadcast `stroke_undone` to all clients
5. Each client marks the stroke as undone and redraws

**Redo:**
1. Pop from user's redo stack
2. Mark it as `undone: false`
3. Broadcast `stroke_redone` to all clients
4. Each client updates and redraws

**Conflict Handling:**
- New strokes clear the user's redo stack (standard undo/redo behavior)
- Undone strokes are not deleted, just marked (allows for redo)
- Canvas redraw skips all strokes with `undone: true`

## Performance Decisions

### 1. Client-Side Prediction
Drawing is rendered locally immediately, without waiting for server acknowledgment. This eliminates perceived latency.

```javascript
// Local render happens instantly
handlePointerMove(event) {
  this.drawSegment(lastPoint, currentPoint);  // Immediate
  wsManager.emitDrawMove(data);                // Async
}

2. Event Batching
We send individual points but could batch for high-latency networks:

// Current: Real-time streaming (low latency networks)
socket.emit('draw_move', { x, y });

// Alternative: Batched (high latency networks)
// Collect points for 16ms, send as array

3. Efficient Redraw
Instead of redrawing the entire canvas on every change:

New strokes: Only draw the new segment
Undo/Redo: Full redraw (necessary for consistency)
Remote strokes: Incremental drawing as points arrive

4. Cursor Throttling
Remote cursor updates are throttled to prevent flooding:

Updates sent on mousemove (natural throttling by browser)
CSS transition smooths cursor movement between updates

5. Memory Management
Strokes stored as arrays of points (compact)
Old rooms cleaned up when empty
No image data stored (strokes are re-rendered)
Conflict Resolution
Overlapping Drawing
Since all strokes are independent, there's no true conflict when users draw in the same area. Strokes are layered in order of completion (last stroke on top).

Network Issues
Scenario: User draws while offline

Local strokes render immediately
When reconnecting, strokes may be lost
Solution: Could implement local storage queue (not implemented)
Scenario: Out-of-order messages

Stroke points have implicit ordering (array index)
Complete strokes include all points
Worst case: Slightly jumbled intermediate rendering
State Recovery
When a new user joins:

Server sends complete stroke history
Client renders all strokes in order
User is now synchronized
Scaling Considerations
Current Limits
In-memory storage (single server)
All strokes broadcast to all users in room
~20 users per room recommended
Scaling to 1000+ Users
Horizontal Scaling:

                    Load Balancer
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    Server 1        Server 2        Server 3
         │               │               │
         └───────────────┼───────────────┘
                         │
                      Redis
                 (Pub/Sub + State)


