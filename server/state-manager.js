class StateManager {
  constructor() {
    this.states = new Map();
  }

  initState(roomId) {
    if (!this.states.has(roomId)) {
      this.states.set(roomId, {
        strokes: [],
        undoStack: new Map(),
        redoStack: new Map()
      });
    }
    return this.states.get(roomId);
  }

  getState(roomId) {
    return this.initState(roomId);
  }

  addStroke(roomId, stroke) {
    const state = this.initState(roomId);
    state.strokes.push(stroke);
    
    if (!state.undoStack.has(stroke.oderId)) {
      state.undoStack.set(stroke.oderId, []);
    }
    
    if (state.redoStack.has(stroke.oderId)) {
      state.redoStack.get(stroke.oderId).length = 0;
    }
    
    return stroke;
  }

  undoStroke(roomId, oderId) {
    const state = this.getState(roomId);
    
    let lastStrokeIndex = -1;
    for (let i = state.strokes.length - 1; i >= 0; i--) {
      if (state.strokes[i].oderId === oderId && !state.strokes[i].undone) {
        lastStrokeIndex = i;
        break;
      }
    }

    if (lastStrokeIndex === -1) return null;

    const stroke = state.strokes[lastStrokeIndex];
    stroke.undone = true;

    if (!state.redoStack.has(oderId)) {
      state.redoStack.set(oderId, []);
    }
    state.redoStack.get(oderId).push(stroke);

    return stroke;
  }

  redoStroke(roomId, oderId) {
    const state = this.getState(roomId);
    
    if (!state.redoStack.has(oderId)) return null;
    
    const redoStack = state.redoStack.get(oderId);
    if (redoStack.length === 0) return null;

    const stroke = redoStack.pop();
    stroke.undone = false;

    return stroke;
  }

  clearState(roomId) {
    this.states.set(roomId, {
      strokes: [],
      undoStack: new Map(),
      redoStack: new Map()
    });
  }
}

module.exports = StateManager;
