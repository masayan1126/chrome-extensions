import type { ConnectionData, Point, ShapeData, AnchorPosition } from '@/types';
import { getAnchorPoint, calculateBezierControlPoints } from '@/utils/geometry';

export function renderConnection(
  connection: ConnectionData,
  shapes: ShapeData[]
): SVGGElement | null {
  const fromShape = shapes.find((s) => s.id === connection.from.shapeId);
  const toShape = shapes.find((s) => s.id === connection.to.shapeId);

  if (!fromShape || !toShape) return null;

  const fromPoint = getAnchorPoint(fromShape, connection.from.position);
  const toPoint = getAnchorPoint(toShape, connection.to.position);

  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.classList.add('wb-connection');
  group.dataset.connectionId = connection.id;

  const { strokeColor, strokeWidth, arrowHead } = connection.style;

  if (connection.type === 'straight') {
    const line = createStraightLine(fromPoint, toPoint);
    line.setAttribute('stroke', strokeColor);
    line.setAttribute('stroke-width', String(strokeWidth));
    line.setAttribute('fill', 'none');
    group.appendChild(line);
  } else {
    const path = createBezierPath(
      fromPoint,
      toPoint,
      connection.from.position,
      connection.to.position
    );
    path.setAttribute('stroke', strokeColor);
    path.setAttribute('stroke-width', String(strokeWidth));
    path.setAttribute('fill', 'none');
    group.appendChild(path);
  }

  if (arrowHead) {
    const arrow = createArrowHead(fromPoint, toPoint, strokeColor);
    group.appendChild(arrow);
  }

  return group;
}

function createStraightLine(from: Point, to: Point): SVGLineElement {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', String(from.x));
  line.setAttribute('y1', String(from.y));
  line.setAttribute('x2', String(to.x));
  line.setAttribute('y2', String(to.y));
  return line;
}

function createBezierPath(
  from: Point,
  to: Point,
  fromAnchor: AnchorPosition,
  toAnchor: AnchorPosition
): SVGPathElement {
  const [cp1, cp2] = calculateBezierControlPoints(from, to, fromAnchor, toAnchor);
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  const d = `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${to.x} ${to.y}`;
  path.setAttribute('d', d);
  return path;
}

function createArrowHead(from: Point, to: Point, color: string): SVGPolygonElement {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const lineLength = Math.hypot(to.x - from.x, to.y - from.y);

  // Scale arrowhead based on line length
  // Max arrowhead length is 12px, but limit to 40% of line length for short lines
  const maxArrowLength = 12;
  const arrowLength = Math.min(maxArrowLength, lineLength * 0.4);

  // Minimum size threshold - if too small, don't render arrowhead
  if (arrowLength < 4) {
    const polygon = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'polygon'
    );
    polygon.setAttribute('points', `${to.x},${to.y}`);
    polygon.setAttribute('fill', color);
    return polygon;
  }

  // Keep the arrowhead angle constant (30 degrees = PI/6)
  const arrowAngle = Math.PI / 6;

  const x1 = to.x - arrowLength * Math.cos(angle - arrowAngle);
  const y1 = to.y - arrowLength * Math.sin(angle - arrowAngle);
  const x2 = to.x - arrowLength * Math.cos(angle + arrowAngle);
  const y2 = to.y - arrowLength * Math.sin(angle + arrowAngle);

  const polygon = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'polygon'
  );
  polygon.setAttribute('points', `${to.x},${to.y} ${x1},${y1} ${x2},${y2}`);
  polygon.setAttribute('fill', color);
  return polygon;
}
