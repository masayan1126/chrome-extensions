export const OVERLAY_Z_INDEX = 999999;
export const TOOLBAR_Z_INDEX = 10000000;

export const DEFAULT_SHAPE_SIZE = { width: 120, height: 80 };
export const MIN_SHAPE_SIZE = { width: 20, height: 20 };

export const COLORS = {
  shapes: [
    '#ffffff',
    '#f3f4f6',
    '#fef3c7',
    '#fce7f3',
    '#dbeafe',
    '#d1fae5',
    '#e0e7ff',
    '#fecaca',
  ],
  strokes: [
    '#333333',
    '#6b7280',
    '#f59e0b',
    '#ec4899',
    '#3b82f6',
    '#10b981',
    '#6366f1',
    '#ef4444',
  ],
};

export const KEYBOARD_SHORTCUTS = {
  toggleWhiteboard: 'Alt+W',
  select: 'v',
  rectangle: 'r',
  circle: 'c',
  ellipse: 'e',
  triangle: 't',
  diamond: 'd',
  arrow: 'a',
  undo: 'ctrl+z',
  redo: 'ctrl+shift+z',
  delete: 'Delete',
  selectAll: 'ctrl+a',
  escape: 'Escape',
  zoomIn: '+',
  zoomOut: '-',
} as const;

export const SELECTION_HANDLE_SIZE = 8;
export const ANCHOR_POINT_SIZE = 6;
