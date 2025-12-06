import type { Point, Size, ShapeData, AnchorPosition } from '@/types';

export function generateId(): string {
  return `shape-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function midpoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

export function pointInRect(
  point: Point,
  position: Point,
  size: Size
): boolean {
  return (
    point.x >= position.x &&
    point.x <= position.x + size.width &&
    point.y >= position.y &&
    point.y <= position.y + size.height
  );
}

export function pointInCircle(
  point: Point,
  center: Point,
  radius: number
): boolean {
  return distance(point, center) <= radius;
}

export function pointInEllipse(
  point: Point,
  center: Point,
  rx: number,
  ry: number
): boolean {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
}

export function pointInPolygon(point: Point, vertices: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x;
    const yi = vertices[i].y;
    const xj = vertices[j].x;
    const yj = vertices[j].y;
    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function getShapeCenter(shape: ShapeData): Point {
  return {
    x: shape.position.x + shape.size.width / 2,
    y: shape.position.y + shape.size.height / 2,
  };
}

export function getAnchorPoint(
  shape: ShapeData,
  anchor: AnchorPosition
): Point {
  const { x, y } = shape.position;
  const { width, height } = shape.size;
  const cx = x + width / 2;
  const cy = y + height / 2;

  switch (anchor) {
    case 'top':
      return { x: cx, y };
    case 'right':
      return { x: x + width, y: cy };
    case 'bottom':
      return { x: cx, y: y + height };
    case 'left':
      return { x, y: cy };
    case 'center':
    default:
      return { x: cx, y: cy };
  }
}

export function snapToGrid(point: Point, gridSize: number): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

export function calculateBezierControlPoints(
  from: Point,
  to: Point,
  _fromAnchor: AnchorPosition,
  _toAnchor: AnchorPosition
): [Point, Point] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = Math.min(dist / 3, 100);

  const cp1: Point = { x: from.x + offset, y: from.y };
  const cp2: Point = { x: to.x - offset, y: to.y };

  return [cp1, cp2];
}
