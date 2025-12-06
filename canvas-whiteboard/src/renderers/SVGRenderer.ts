import type { CanvasState, ShapeData, Point, AnchorPosition } from '@/types';
import { SELECTION_HANDLE_SIZE, ANCHOR_POINT_SIZE } from '@/constants';
import { renderShape } from './ShapeRenderer';
import { renderConnection } from './ConnectionRenderer';
import { getAnchorPoint } from '@/utils/geometry';
import type { ConnectionPreview } from '@/core/Canvas';

export class SVGRenderer {
  private svg: SVGSVGElement;
  private gridLayer: SVGGElement;
  private connectionLayer: SVGGElement;
  private shapeLayer: SVGGElement;
  private selectionLayer: SVGGElement;
  private previewLayer: SVGGElement;

  constructor(container: HTMLElement) {
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.id = 'canvas-whiteboard-svg';
    this.svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    this.gridLayer = this.createGroup('grid-layer');
    this.connectionLayer = this.createGroup('connection-layer');
    this.shapeLayer = this.createGroup('shape-layer');
    this.selectionLayer = this.createGroup('selection-layer');
    this.previewLayer = this.createGroup('preview-layer');

    this.svg.appendChild(this.gridLayer);
    this.svg.appendChild(this.connectionLayer);
    this.svg.appendChild(this.shapeLayer);
    this.svg.appendChild(this.selectionLayer);
    this.svg.appendChild(this.previewLayer);

    container.appendChild(this.svg);
  }

  private createGroup(id: string): SVGGElement {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.id = id;
    return g;
  }

  render(state: CanvasState, connectionPreview?: ConnectionPreview | null): void {
    this.renderGrid(state);
    this.renderConnections(state);
    this.renderShapes(state);
    this.renderSelection(state, connectionPreview);
    this.renderConnectionPreview(state, connectionPreview);
  }

  private renderConnections(state: CanvasState): void {
    this.connectionLayer.innerHTML = '';

    for (const connection of state.connections) {
      const group = renderConnection(connection, state.shapes);
      if (group) {
        this.connectionLayer.appendChild(group);
      }
    }
  }

  private renderGrid(state: CanvasState): void {
    this.gridLayer.innerHTML = '';
    if (!state.grid.enabled) return;

    const { size } = state.grid;
    const width = window.innerWidth;
    const height = window.innerHeight;

    for (let x = 0; x <= width; x += size) {
      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line'
      );
      line.setAttribute('x1', String(x));
      line.setAttribute('y1', '0');
      line.setAttribute('x2', String(x));
      line.setAttribute('y2', String(height));
      line.classList.add('wb-grid-line');
      this.gridLayer.appendChild(line);
    }

    for (let y = 0; y <= height; y += size) {
      const line = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'line'
      );
      line.setAttribute('x1', '0');
      line.setAttribute('y1', String(y));
      line.setAttribute('x2', String(width));
      line.setAttribute('y2', String(y));
      line.classList.add('wb-grid-line');
      this.gridLayer.appendChild(line);
    }
  }

  private renderShapes(state: CanvasState): void {
    this.shapeLayer.innerHTML = '';

    const sortedShapes = [...state.shapes].sort(
      (a, b) => a.zIndex - b.zIndex
    );

    for (const shape of sortedShapes) {
      const group = renderShape(shape, state.selectedIds.includes(shape.id));
      this.shapeLayer.appendChild(group);
    }
  }

  private renderSelection(state: CanvasState, connectionPreview?: ConnectionPreview | null): void {
    this.selectionLayer.innerHTML = '';

    const isConnecting = !!connectionPreview;
    const isArrowTool = state.activeTool === 'arrow';

    // Show anchor points on all shapes when arrow tool is active or connecting
    if (isConnecting || isArrowTool) {
      for (const shape of state.shapes) {
        // Skip the source shape when connecting
        if (connectionPreview && shape.id === connectionPreview.fromShapeId) {
          continue;
        }
        this.renderAnchorPoints(shape, connectionPreview?.hoverShapeId === shape.id, connectionPreview?.hoverAnchor);
      }
    }

    // Render selection handles and anchor points for selected shapes
    for (const id of state.selectedIds) {
      const shape = state.shapes.find((s) => s.id === id);
      if (!shape) continue;

      this.renderSelectionHandles(shape);
      if (!isConnecting && !isArrowTool) {
        this.renderAnchorPoints(shape, false, null);
      }
    }
  }

  private renderConnectionPreview(state: CanvasState, connectionPreview?: ConnectionPreview | null): void {
    this.previewLayer.innerHTML = '';

    if (!connectionPreview) return;

    const fromShape = state.shapes.find((s) => s.id === connectionPreview.fromShapeId);
    if (!fromShape) return;

    const fromPoint = getAnchorPoint(fromShape, connectionPreview.fromAnchor);
    let toPoint = connectionPreview.currentPoint;

    // Snap to target anchor if hovering over a shape
    if (connectionPreview.hoverShapeId && connectionPreview.hoverAnchor) {
      const toShape = state.shapes.find((s) => s.id === connectionPreview.hoverShapeId);
      if (toShape) {
        toPoint = getAnchorPoint(toShape, connectionPreview.hoverAnchor);
      }
    }

    // Draw preview line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(fromPoint.x));
    line.setAttribute('y1', String(fromPoint.y));
    line.setAttribute('x2', String(toPoint.x));
    line.setAttribute('y2', String(toPoint.y));
    line.classList.add('wb-connection-preview');
    this.previewLayer.appendChild(line);

    // Draw arrow head (scaled for short lines)
    const angle = Math.atan2(toPoint.y - fromPoint.y, toPoint.x - fromPoint.x);
    const lineLength = Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y);
    const maxArrowLength = 12;
    const arrowLength = Math.min(maxArrowLength, lineLength * 0.4);

    if (arrowLength >= 4) {
      const arrowAngle = Math.PI / 6;
      const x1 = toPoint.x - arrowLength * Math.cos(angle - arrowAngle);
      const y1 = toPoint.y - arrowLength * Math.sin(angle - arrowAngle);
      const x2 = toPoint.x - arrowLength * Math.cos(angle + arrowAngle);
      const y2 = toPoint.y - arrowLength * Math.sin(angle + arrowAngle);

      const arrowHead = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      arrowHead.setAttribute('points', `${toPoint.x},${toPoint.y} ${x1},${y1} ${x2},${y2}`);
      arrowHead.classList.add('wb-connection-preview-arrow');
      this.previewLayer.appendChild(arrowHead);
    }

    // Draw start point indicator
    const startCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    startCircle.setAttribute('cx', String(fromPoint.x));
    startCircle.setAttribute('cy', String(fromPoint.y));
    startCircle.setAttribute('r', '6');
    startCircle.classList.add('wb-connection-preview-start');
    this.previewLayer.appendChild(startCircle);
  }

  private renderSelectionHandles(shape: ShapeData): void {
    const { x, y } = shape.position;
    const { width, height } = shape.size;
    const handles: Point[] = [
      { x, y },
      { x: x + width / 2, y },
      { x: x + width, y },
      { x: x + width, y: y + height / 2 },
      { x: x + width, y: y + height },
      { x: x + width / 2, y: y + height },
      { x, y: y + height },
      { x, y: y + height / 2 },
    ];

    for (const handle of handles) {
      const rect = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'rect'
      );
      rect.setAttribute(
        'x',
        String(handle.x - SELECTION_HANDLE_SIZE / 2)
      );
      rect.setAttribute(
        'y',
        String(handle.y - SELECTION_HANDLE_SIZE / 2)
      );
      rect.setAttribute('width', String(SELECTION_HANDLE_SIZE));
      rect.setAttribute('height', String(SELECTION_HANDLE_SIZE));
      rect.classList.add('wb-selection-handle');
      rect.dataset.shapeId = shape.id;
      this.selectionLayer.appendChild(rect);
    }
  }

  private renderAnchorPoints(shape: ShapeData, isHovered: boolean, hoverAnchor: AnchorPosition | null): void {
    const { x, y } = shape.position;
    const { width, height } = shape.size;
    const anchors: { pos: AnchorPosition; point: Point }[] = [
      { pos: 'top', point: { x: x + width / 2, y } },
      { pos: 'right', point: { x: x + width, y: y + height / 2 } },
      { pos: 'bottom', point: { x: x + width / 2, y: y + height } },
      { pos: 'left', point: { x, y: y + height / 2 } },
    ];

    for (const anchor of anchors) {
      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );
      circle.setAttribute('cx', String(anchor.point.x));
      circle.setAttribute('cy', String(anchor.point.y));

      // Make anchor larger when hovered
      const isActiveAnchor = isHovered && hoverAnchor === anchor.pos;
      circle.setAttribute('r', String(isActiveAnchor ? ANCHOR_POINT_SIZE + 3 : ANCHOR_POINT_SIZE));

      circle.classList.add('wb-anchor-point');
      if (isHovered) {
        circle.classList.add('wb-anchor-visible');
      }
      if (isActiveAnchor) {
        circle.classList.add('wb-anchor-active');
      }
      circle.dataset.shapeId = shape.id;
      circle.dataset.anchor = anchor.pos;
      this.selectionLayer.appendChild(circle);
    }
  }

  getSVGElement(): SVGSVGElement {
    return this.svg;
  }

  destroy(): void {
    this.svg.remove();
  }
}
