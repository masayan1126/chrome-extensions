export * from './shapes';
export * from './connections';

import type { ShapeData, Point } from './shapes';
import type { ConnectionData } from './connections';

export type ToolType =
  | 'select'
  | 'rectangle'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'arrow';

export interface Viewport {
  zoom: number;
  pan: Point;
}

export interface GridConfig {
  enabled: boolean;
  size: number;
  snap: boolean;
}

export interface OverlayConfig {
  opacity: number;
  visible: boolean;
}

export interface CanvasState {
  shapes: ShapeData[];
  connections: ConnectionData[];
  selectedIds: string[];
  viewport: Viewport;
  grid: GridConfig;
  overlay: OverlayConfig;
  activeTool: ToolType;
}

export interface HistoryEntry {
  type: 'add' | 'remove' | 'update' | 'batch';
  timestamp: number;
  before: Partial<CanvasState>;
  after: Partial<CanvasState>;
}

export const DEFAULT_CANVAS_STATE: CanvasState = {
  shapes: [],
  connections: [],
  selectedIds: [],
  viewport: { zoom: 1, pan: { x: 0, y: 0 } },
  grid: { enabled: false, size: 20, snap: true },
  overlay: { opacity: 0.1, visible: true },
  activeTool: 'select',
};
