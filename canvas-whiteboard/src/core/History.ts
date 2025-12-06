import type { CanvasState } from '@/types';

export interface HistoryEntry {
  state: CanvasState;
  timestamp: number;
}

export class HistoryManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private maxSize: number;

  constructor(maxSize = 50) {
    this.maxSize = maxSize;
  }

  push(state: CanvasState): void {
    this.undoStack.push({
      state: this.cloneState(state),
      timestamp: Date.now(),
    });

    // Clear redo stack when new action is taken
    this.redoStack = [];

    // Limit stack size
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
  }

  undo(): CanvasState | null {
    if (this.undoStack.length <= 1) return null;

    const current = this.undoStack.pop();
    if (current) {
      this.redoStack.push(current);
    }

    const previous = this.undoStack[this.undoStack.length - 1];
    return previous ? this.cloneState(previous.state) : null;
  }

  redo(): CanvasState | null {
    if (this.redoStack.length === 0) return null;

    const next = this.redoStack.pop();
    if (next) {
      this.undoStack.push(next);
      return this.cloneState(next.state);
    }
    return null;
  }

  canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  private cloneState(state: CanvasState): CanvasState {
    return JSON.parse(JSON.stringify(state));
  }
}
