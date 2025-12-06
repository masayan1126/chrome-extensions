import type {
  CanvasState,
  ShapeData,
  ShapeType,
  ShapeStyle,
  ConnectionData,
  ConnectionType,
  Point,
  ToolType,
  AnchorPosition,
} from '@/types';
import {
  DEFAULT_CANVAS_STATE,
  DEFAULT_SHAPE_STYLE,
  DEFAULT_TEXT_CONFIG,
  DEFAULT_CONNECTION_STYLE,
} from '@/types';
import { DEFAULT_SHAPE_SIZE, MIN_SHAPE_SIZE } from '@/constants';
import { generateId, snapToGrid, getAnchorPoint } from '@/utils/geometry';
import { SVGRenderer } from '@/renderers/SVGRenderer';
import { hitTest } from './hitTest';
import { HistoryManager } from './History';

type DragMode = 'none' | 'move' | 'resize' | 'connect';
type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface ConnectionPreview {
  fromShapeId: string;
  fromAnchor: AnchorPosition;
  currentPoint: Point;
  hoverShapeId: string | null;
  hoverAnchor: AnchorPosition | null;
}

export class WhiteboardCanvas {
  private state: CanvasState;
  private history: HistoryManager;
  private renderer: SVGRenderer | null = null;
  private container: HTMLElement | null = null;
  private dragMode: DragMode = 'none';
  private dragStart: Point = { x: 0, y: 0 };
  private dragOffset: Point = { x: 0, y: 0 };
  private resizeHandle: ResizeHandle | null = null;
  private originalShape: ShapeData | null = null;
  private connectingFrom: { shapeId: string; anchor: AnchorPosition } | null = null;
  private connectionPreview: ConnectionPreview | null = null;
  private listeners: Array<() => void> = [];
  private lastClickTime = 0;
  private lastClickShapeId: string | null = null;
  private isEditingText = false;
  private connectionType: ConnectionType = 'straight';

  constructor() {
    this.state = { ...DEFAULT_CANVAS_STATE };
    this.history = new HistoryManager();
    this.history.push(this.state);
  }

  mount(container: HTMLElement): void {
    this.container = container;
    this.renderer = new SVGRenderer(container);
    this.setupEventListeners();
    this.render();
  }

  unmount(): void {
    this.removeEventListeners();
    this.renderer?.destroy();
    this.renderer = null;
    this.container = null;
  }

  private setupEventListeners(): void {
    const svg = this.renderer?.getSVGElement();
    if (!svg) return;

    const onMouseDown = this.handleMouseDown.bind(this);
    const onMouseMove = this.handleMouseMove.bind(this);
    const onMouseUp = this.handleMouseUp.bind(this);
    const onDblClick = this.handleDoubleClick.bind(this);

    svg.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    svg.addEventListener('dblclick', onDblClick);

    this.listeners.push(() => {
      svg.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      svg.removeEventListener('dblclick', onDblClick);
    });
  }

  private removeEventListeners(): void {
    this.listeners.forEach((remove) => remove());
    this.listeners = [];
  }

  private handleMouseDown(e: MouseEvent): void {
    // Ignore clicks while editing text
    if (this.isEditingText) return;

    const point = { x: e.clientX, y: e.clientY };
    const target = e.target as SVGElement;
    const tool = this.state.activeTool;

    // Check for anchor point click (for connections)
    if (target.classList.contains('wb-anchor-point')) {
      const shapeId = target.dataset.shapeId;
      const anchor = target.dataset.anchor as AnchorPosition;
      if (shapeId && anchor) {
        this.connectingFrom = { shapeId, anchor };
        this.dragMode = 'connect';
        this.dragStart = point;
        // Initialize connection preview
        this.connectionPreview = {
          fromShapeId: shapeId,
          fromAnchor: anchor,
          currentPoint: point,
          hoverShapeId: null,
          hoverAnchor: null,
        };
        this.render();
        return;
      }
    }

    // Check for resize handle click
    if (target.classList.contains('wb-selection-handle')) {
      const shapeId = target.dataset.shapeId;
      if (shapeId) {
        const shape = this.state.shapes.find((s) => s.id === shapeId);
        if (shape) {
          this.originalShape = { ...shape };
          this.resizeHandle = this.getResizeHandle(point, shape);
          this.dragMode = 'resize';
          this.dragStart = point;
          return;
        }
      }
    }

    if (tool === 'select') {
      const hitShape = hitTest(point, this.state.shapes);
      if (hitShape) {
        // Check for double-click (manual detection)
        const now = Date.now();
        const isDoubleClick =
          this.lastClickShapeId === hitShape.id &&
          now - this.lastClickTime < 400;

        if (isDoubleClick) {
          // Reset to prevent triple-click from triggering again
          this.lastClickTime = 0;
          this.lastClickShapeId = null;
          this.startTextEditing(hitShape);
          return;
        }

        this.lastClickTime = now;
        this.lastClickShapeId = hitShape.id;

        this.selectShape(hitShape.id, e.shiftKey);
        this.dragMode = 'move';
        this.dragStart = point;
        this.dragOffset = {
          x: point.x - hitShape.position.x,
          y: point.y - hitShape.position.y,
        };
        this.originalShape = { ...hitShape };
      } else {
        this.lastClickShapeId = null;
        this.clearSelection();
      }
    } else if (tool === 'arrow') {
      const hitShape = hitTest(point, this.state.shapes);
      if (hitShape) {
        const anchor = this.getNearestAnchor(point, hitShape);
        this.connectingFrom = { shapeId: hitShape.id, anchor };
        this.dragMode = 'connect';
        this.dragStart = point;
        // Initialize connection preview
        this.connectionPreview = {
          fromShapeId: hitShape.id,
          fromAnchor: anchor,
          currentPoint: point,
          hoverShapeId: null,
          hoverAnchor: null,
        };
        this.render();
      }
    } else if (this.isShapeTool(tool)) {
      this.addShape(tool as ShapeType, point);
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    const point = { x: e.clientX, y: e.clientY };

    if (this.dragMode === 'none') return;

    if (this.dragMode === 'move') {
      let newPosition = {
        x: point.x - this.dragOffset.x,
        y: point.y - this.dragOffset.y,
      };

      if (this.state.grid.snap) {
        newPosition = snapToGrid(newPosition, this.state.grid.size);
      }

      for (const id of this.state.selectedIds) {
        this.updateShapeNoHistory(id, { position: newPosition });
      }
    } else if (this.dragMode === 'resize' && this.originalShape && this.resizeHandle) {
      this.handleResize(point);
    } else if (this.dragMode === 'connect' && this.connectionPreview) {
      // Update connection preview
      const hitShape = hitTest(point, this.state.shapes);
      let hoverShapeId: string | null = null;
      let hoverAnchor: AnchorPosition | null = null;

      if (hitShape && hitShape.id !== this.connectionPreview.fromShapeId) {
        hoverShapeId = hitShape.id;
        hoverAnchor = this.getNearestAnchor(point, hitShape);
      }

      this.connectionPreview = {
        ...this.connectionPreview,
        currentPoint: point,
        hoverShapeId,
        hoverAnchor,
      };
      this.render();
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    const point = { x: e.clientX, y: e.clientY };

    if (this.dragMode === 'connect' && this.connectingFrom) {
      const hitShape = hitTest(point, this.state.shapes);
      if (hitShape && hitShape.id !== this.connectingFrom.shapeId) {
        // Connect to existing shape
        const toAnchor = this.getNearestAnchor(point, hitShape);
        this.addConnection(
          this.connectingFrom.shapeId,
          this.connectingFrom.anchor,
          hitShape.id,
          toAnchor
        );
      } else if (!hitShape) {
        // Dropped on empty space - create new shape of same type and connect
        const fromShape = this.state.shapes.find(
          (s) => s.id === this.connectingFrom!.shapeId
        );
        if (fromShape) {
          // Check if dragged far enough (minimum distance threshold)
          const dragDistance = Math.hypot(
            point.x - this.dragStart.x,
            point.y - this.dragStart.y
          );
          if (dragDistance > 30) {
            // Create new shape at drop position with same style as source
            const newShape = this.addShapeNoHistory(fromShape.type, point, fromShape.style);
            // Determine anchor for the new shape (opposite of from anchor)
            const toAnchor = this.getOppositeAnchor(this.connectingFrom.anchor);
            this.addConnection(
              this.connectingFrom.shapeId,
              this.connectingFrom.anchor,
              newShape.id,
              toAnchor
            );
          }
        }
      }
    }

    // Save to history if something changed
    if (this.dragMode === 'move' || this.dragMode === 'resize') {
      this.saveHistory();
    }

    this.dragMode = 'none';
    this.resizeHandle = null;
    this.originalShape = null;
    this.connectingFrom = null;
    this.connectionPreview = null;
    this.render();
  }

  private handleDoubleClick(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();

    const point = { x: e.clientX, y: e.clientY };
    const hitShape = hitTest(point, this.state.shapes);

    if (hitShape) {
      this.startTextEditing(hitShape);
    }
  }

  private handleResize(point: Point): void {
    if (!this.originalShape || !this.resizeHandle) return;

    const dx = point.x - this.dragStart.x;
    const dy = point.y - this.dragStart.y;
    const orig = this.originalShape;
    let newX = orig.position.x;
    let newY = orig.position.y;
    let newWidth = orig.size.width;
    let newHeight = orig.size.height;

    switch (this.resizeHandle) {
      case 'nw':
        newX = orig.position.x + dx;
        newY = orig.position.y + dy;
        newWidth = orig.size.width - dx;
        newHeight = orig.size.height - dy;
        break;
      case 'n':
        newY = orig.position.y + dy;
        newHeight = orig.size.height - dy;
        break;
      case 'ne':
        newY = orig.position.y + dy;
        newWidth = orig.size.width + dx;
        newHeight = orig.size.height - dy;
        break;
      case 'e':
        newWidth = orig.size.width + dx;
        break;
      case 'se':
        newWidth = orig.size.width + dx;
        newHeight = orig.size.height + dy;
        break;
      case 's':
        newHeight = orig.size.height + dy;
        break;
      case 'sw':
        newX = orig.position.x + dx;
        newWidth = orig.size.width - dx;
        newHeight = orig.size.height + dy;
        break;
      case 'w':
        newX = orig.position.x + dx;
        newWidth = orig.size.width - dx;
        break;
    }

    // Enforce minimum size
    if (newWidth < MIN_SHAPE_SIZE.width) {
      if (this.resizeHandle.includes('w')) {
        newX = orig.position.x + orig.size.width - MIN_SHAPE_SIZE.width;
      }
      newWidth = MIN_SHAPE_SIZE.width;
    }
    if (newHeight < MIN_SHAPE_SIZE.height) {
      if (this.resizeHandle.includes('n')) {
        newY = orig.position.y + orig.size.height - MIN_SHAPE_SIZE.height;
      }
      newHeight = MIN_SHAPE_SIZE.height;
    }

    this.updateShapeNoHistory(orig.id, {
      position: { x: newX, y: newY },
      size: { width: newWidth, height: newHeight },
    });
  }

  private getResizeHandle(point: Point, shape: ShapeData): ResizeHandle {
    const { x, y } = shape.position;
    const { width, height } = shape.size;
    const handles: { pos: ResizeHandle; point: Point }[] = [
      { pos: 'nw', point: { x, y } },
      { pos: 'n', point: { x: x + width / 2, y } },
      { pos: 'ne', point: { x: x + width, y } },
      { pos: 'e', point: { x: x + width, y: y + height / 2 } },
      { pos: 'se', point: { x: x + width, y: y + height } },
      { pos: 's', point: { x: x + width / 2, y: y + height } },
      { pos: 'sw', point: { x, y: y + height } },
      { pos: 'w', point: { x, y: y + height / 2 } },
    ];

    let closest = handles[0];
    let minDist = Infinity;
    for (const h of handles) {
      const dist = Math.hypot(point.x - h.point.x, point.y - h.point.y);
      if (dist < minDist) {
        minDist = dist;
        closest = h;
      }
    }
    return closest.pos;
  }

  private getNearestAnchor(point: Point, shape: ShapeData): AnchorPosition {
    const anchors: AnchorPosition[] = ['top', 'right', 'bottom', 'left'];
    let nearest = anchors[0];
    let minDist = Infinity;

    for (const anchor of anchors) {
      const anchorPoint = getAnchorPoint(shape, anchor);
      const dist = Math.hypot(point.x - anchorPoint.x, point.y - anchorPoint.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = anchor;
      }
    }
    return nearest;
  }

  private getOppositeAnchor(anchor: AnchorPosition): AnchorPosition {
    const opposites: Record<AnchorPosition, AnchorPosition> = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left',
    };
    return opposites[anchor];
  }

  private startTextEditing(shape: ShapeData): void {
    if (!this.container || this.isEditingText) {
      return;
    }

    this.isEditingText = true;

    // Remove any existing text input
    const existingInput = document.querySelector('.wb-text-input');
    if (existingInput) existingInput.remove();

    // Create HTML text input overlay
    const input = document.createElement('textarea');
    input.className = 'wb-text-input';
    input.value = shape.text?.content || '';
    input.style.cssText = `
      position: fixed !important;
      left: ${shape.position.x}px !important;
      top: ${shape.position.y}px !important;
      width: ${shape.size.width}px !important;
      height: ${shape.size.height}px !important;
      font-size: ${shape.text?.fontSize ?? 14}px !important;
      font-family: ${shape.text?.fontFamily ?? 'sans-serif'} !important;
      color: ${shape.text?.color ?? '#333333'} !important;
      text-align: ${shape.text?.align ?? 'center'} !important;
      resize: none !important;
      border: 3px solid #3b82f6 !important;
      border-radius: 4px !important;
      padding: 8px !important;
      box-sizing: border-box !important;
      background: white !important;
      z-index: 2147483647 !important;
      outline: none !important;
    `;

    document.body.appendChild(input);

    const finishEditing = () => {
      this.isEditingText = false;
      const newText = input.value;
      this.updateShape(shape.id, {
        text: {
          ...(shape.text || DEFAULT_TEXT_CONFIG),
          content: newText,
        },
      });
      input.remove();
    };

    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        input.value = shape.text?.content || ''; // Revert changes
        input.blur();
      }
      // Prevent event propagation to avoid triggering other shortcuts
      e.stopPropagation();
    });

    // Delay focus and blur listener registration to avoid immediate blur from pending events
    setTimeout(() => {
      input.focus();
      input.select();
      input.addEventListener('blur', finishEditing);
    }, 100);
  }

  private isShapeTool(tool: ToolType): boolean {
    return ['rectangle', 'circle', 'ellipse', 'triangle', 'diamond'].includes(tool);
  }

  private saveHistory(): void {
    this.history.push(this.state);
  }

  addShape(type: ShapeType, position: Point): ShapeData {
    const shape = this.addShapeNoHistory(type, position);
    this.saveHistory();
    return shape;
  }

  private addShapeNoHistory(type: ShapeType, position: Point, style?: ShapeStyle): ShapeData {
    let snappedPosition = position;
    if (this.state.grid.snap) {
      snappedPosition = snapToGrid(position, this.state.grid.size);
    }

    const shape: ShapeData = {
      id: generateId(),
      type,
      position: {
        x: snappedPosition.x - DEFAULT_SHAPE_SIZE.width / 2,
        y: snappedPosition.y - DEFAULT_SHAPE_SIZE.height / 2,
      },
      size: { ...DEFAULT_SHAPE_SIZE },
      style: style ? { ...style } : { ...DEFAULT_SHAPE_STYLE },
      rotation: 0,
      zIndex: this.state.shapes.length,
    };

    this.state = {
      ...this.state,
      shapes: [...this.state.shapes, shape],
      selectedIds: [shape.id],
    };
    this.render();
    return shape;
  }

  addConnection(
    fromShapeId: string,
    fromAnchor: AnchorPosition,
    toShapeId: string,
    toAnchor: AnchorPosition
  ): ConnectionData {
    const connection: ConnectionData = {
      id: generateId(),
      type: this.connectionType,
      from: { shapeId: fromShapeId, position: fromAnchor },
      to: { shapeId: toShapeId, position: toAnchor },
      style: { ...DEFAULT_CONNECTION_STYLE },
    };

    this.state = {
      ...this.state,
      connections: [...this.state.connections, connection],
    };
    this.saveHistory();
    this.render();
    return connection;
  }

  updateShape(id: string, updates: Partial<ShapeData>): void {
    this.updateShapeNoHistory(id, updates);
    this.saveHistory();
  }

  private updateShapeNoHistory(id: string, updates: Partial<ShapeData>): void {
    this.state = {
      ...this.state,
      shapes: this.state.shapes.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    };
    this.render();
  }

  removeShape(id: string): void {
    this.state = {
      ...this.state,
      shapes: this.state.shapes.filter((s) => s.id !== id),
      connections: this.state.connections.filter(
        (c) => c.from.shapeId !== id && c.to.shapeId !== id
      ),
      selectedIds: this.state.selectedIds.filter((sid) => sid !== id),
    };
    this.saveHistory();
    this.render();
  }

  selectShape(id: string, addToSelection = false): void {
    if (addToSelection) {
      if (this.state.selectedIds.includes(id)) {
        this.state = {
          ...this.state,
          selectedIds: this.state.selectedIds.filter((sid) => sid !== id),
        };
      } else {
        this.state = {
          ...this.state,
          selectedIds: [...this.state.selectedIds, id],
        };
      }
    } else {
      this.state = {
        ...this.state,
        selectedIds: [id],
      };
    }
    this.render();
  }

  clearSelection(): void {
    this.state = {
      ...this.state,
      selectedIds: [],
    };
    this.render();
  }

  deleteSelected(): void {
    const idsToDelete = new Set(this.state.selectedIds);
    this.state = {
      ...this.state,
      shapes: this.state.shapes.filter((s) => !idsToDelete.has(s.id)),
      connections: this.state.connections.filter(
        (c) => !idsToDelete.has(c.from.shapeId) && !idsToDelete.has(c.to.shapeId)
      ),
      selectedIds: [],
    };
    this.saveHistory();
    this.render();
  }

  setActiveTool(tool: ToolType): void {
    this.state = {
      ...this.state,
      activeTool: tool,
    };
    this.render();
  }

  setShapeStyle(type: 'fill' | 'stroke', color: string): void {
    const updates = type === 'fill' ? { fillColor: color } : { strokeColor: color };

    for (const id of this.state.selectedIds) {
      const shape = this.state.shapes.find((s) => s.id === id);
      if (shape) {
        this.updateShapeNoHistory(id, {
          style: { ...shape.style, ...updates },
        });
      }
    }
    this.saveHistory();
  }

  setConnectionType(type: ConnectionType): void {
    this.connectionType = type;
  }

  alignHorizontal(alignment: 'left' | 'center' | 'right'): void {
    const selectedShapes = this.state.shapes.filter((s) =>
      this.state.selectedIds.includes(s.id)
    );

    if (selectedShapes.length < 2) return;

    // Calculate bounding box of all selected shapes
    let minX = Infinity;
    let maxX = -Infinity;

    for (const shape of selectedShapes) {
      minX = Math.min(minX, shape.position.x);
      maxX = Math.max(maxX, shape.position.x + shape.size.width);
    }

    const centerX = (minX + maxX) / 2;

    for (const shape of selectedShapes) {
      let newX: number;
      switch (alignment) {
        case 'left':
          newX = minX;
          break;
        case 'center':
          newX = centerX - shape.size.width / 2;
          break;
        case 'right':
          newX = maxX - shape.size.width;
          break;
      }
      this.updateShapeNoHistory(shape.id, {
        position: { x: newX, y: shape.position.y },
      });
    }
    this.saveHistory();
  }

  alignVertical(alignment: 'top' | 'middle' | 'bottom'): void {
    const selectedShapes = this.state.shapes.filter((s) =>
      this.state.selectedIds.includes(s.id)
    );

    if (selectedShapes.length < 2) return;

    // Calculate bounding box of all selected shapes
    let minY = Infinity;
    let maxY = -Infinity;

    for (const shape of selectedShapes) {
      minY = Math.min(minY, shape.position.y);
      maxY = Math.max(maxY, shape.position.y + shape.size.height);
    }

    const centerY = (minY + maxY) / 2;

    for (const shape of selectedShapes) {
      let newY: number;
      switch (alignment) {
        case 'top':
          newY = minY;
          break;
        case 'middle':
          newY = centerY - shape.size.height / 2;
          break;
        case 'bottom':
          newY = maxY - shape.size.height;
          break;
      }
      this.updateShapeNoHistory(shape.id, {
        position: { x: shape.position.x, y: newY },
      });
    }
    this.saveHistory();
  }

  distributeHorizontal(): void {
    const selectedShapes = this.state.shapes.filter((s) =>
      this.state.selectedIds.includes(s.id)
    );

    if (selectedShapes.length < 3) return;

    // Sort by x position
    const sorted = [...selectedShapes].sort((a, b) => a.position.x - b.position.x);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const totalWidth = last.position.x + last.size.width - first.position.x;
    const shapesWidth = sorted.reduce((sum, s) => sum + s.size.width, 0);
    const gap = (totalWidth - shapesWidth) / (sorted.length - 1);

    let currentX = first.position.x;
    for (const shape of sorted) {
      this.updateShapeNoHistory(shape.id, {
        position: { x: currentX, y: shape.position.y },
      });
      currentX += shape.size.width + gap;
    }
    this.saveHistory();
  }

  distributeVertical(): void {
    const selectedShapes = this.state.shapes.filter((s) =>
      this.state.selectedIds.includes(s.id)
    );

    if (selectedShapes.length < 3) return;

    // Sort by y position
    const sorted = [...selectedShapes].sort((a, b) => a.position.y - b.position.y);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];

    const totalHeight = last.position.y + last.size.height - first.position.y;
    const shapesHeight = sorted.reduce((sum, s) => sum + s.size.height, 0);
    const gap = (totalHeight - shapesHeight) / (sorted.length - 1);

    let currentY = first.position.y;
    for (const shape of sorted) {
      this.updateShapeNoHistory(shape.id, {
        position: { x: shape.position.x, y: currentY },
      });
      currentY += shape.size.height + gap;
    }
    this.saveHistory();
  }

  undo(): void {
    const prevState = this.history.undo();
    if (prevState) {
      this.state = prevState;
      this.render();
    }
  }

  redo(): void {
    const nextState = this.history.redo();
    if (nextState) {
      this.state = nextState;
      this.render();
    }
  }

  canUndo(): boolean {
    return this.history.canUndo();
  }

  canRedo(): boolean {
    return this.history.canRedo();
  }

  importState(shapes: ShapeData[], connections: ConnectionData[]): void {
    // Merge imported shapes and connections with current state
    // Regenerate IDs to avoid conflicts
    const idMap = new Map<string, string>();

    const newShapes = shapes.map((shape, index) => {
      const newId = generateId();
      idMap.set(shape.id, newId);
      return {
        ...shape,
        id: newId,
        zIndex: this.state.shapes.length + index,
      };
    });

    const newConnections = connections.map((conn) => ({
      ...conn,
      id: generateId(),
      from: {
        ...conn.from,
        shapeId: idMap.get(conn.from.shapeId) || conn.from.shapeId,
      },
      to: {
        ...conn.to,
        shapeId: idMap.get(conn.to.shapeId) || conn.to.shapeId,
      },
    }));

    this.state = {
      ...this.state,
      shapes: [...this.state.shapes, ...newShapes],
      connections: [...this.state.connections, ...newConnections],
      selectedIds: newShapes.map((s) => s.id),
    };

    this.saveHistory();
    this.render();
  }

  clearAndImportState(shapes: ShapeData[], connections: ConnectionData[]): void {
    // Replace all current state with imported data
    this.state = {
      ...this.state,
      shapes: shapes.map((shape, index) => ({
        ...shape,
        zIndex: index,
      })),
      connections: [...connections],
      selectedIds: [],
    };

    this.saveHistory();
    this.render();
  }

  getState(): CanvasState {
    return this.state;
  }

  private render(): void {
    this.renderer?.render(this.state, this.connectionPreview);
  }
}
