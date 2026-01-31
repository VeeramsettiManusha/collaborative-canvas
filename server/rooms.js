class RoomManager {
  constructor() {
    this.rooms = new Map();
  }

  createRoom(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        users: new Map(),
        createdAt: Date.now()
      });
    }
    return this.rooms.get(roomId);
  }

  addUser(roomId, user) {
    if (!this.rooms.has(roomId)) {
      this.createRoom(roomId);
    }
    const room = this.rooms.get(roomId);
    room.users.set(user.id, user);
    return room;
  }

  removeUser(roomId, oderId) {
    if (this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId);
      room.users.delete(oderId);
      
      if (room.users.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  getUsers(roomId) {
    if (this.rooms.has(roomId)) {
      return Array.from(this.rooms.get(roomId).users.values());
    }
    return [];
  }

  getUser(roomId, oderId) {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId).users.get(oderId);
    }
    return null;
  }
}

module.exports = RoomManager;