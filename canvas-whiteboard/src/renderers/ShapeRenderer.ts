import type { ShapeData } from '@/types';

export function renderShape(shape: ShapeData, isSelected: boolean): SVGGElement {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  group.classList.add('wb-shape');
  group.dataset.shapeId = shape.id;

  if (isSelected) {
    group.classList.add('selected');
  }

  const { x, y } = shape.position;
  const { width, height } = shape.size;
  const { fillColor, strokeColor, strokeWidth, opacity } = shape.style;

  let shapeElement: SVGElement;

  switch (shape.type) {
    case 'rectangle':
      shapeElement = createRectangle(x, y, width, height);
      break;
    case 'circle': {
      const radius = Math.min(width, height) / 2;
      const cx = x + width / 2;
      const cy = y + height / 2;
      shapeElement = createCircle(cx, cy, radius);
      break;
    }
    case 'ellipse': {
      const rx = width / 2;
      const ry = height / 2;
      const cx = x + width / 2;
      const cy = y + height / 2;
      shapeElement = createEllipse(cx, cy, rx, ry);
      break;
    }
    case 'triangle':
      shapeElement = createTriangle(x, y, width, height);
      break;
    case 'diamond':
      shapeElement = createDiamond(x, y, width, height);
      break;
    default:
      shapeElement = createRectangle(x, y, width, height);
  }

  shapeElement.setAttribute('fill', fillColor);
  shapeElement.setAttribute('stroke', strokeColor);
  shapeElement.setAttribute('stroke-width', String(strokeWidth));
  shapeElement.setAttribute('opacity', String(opacity));
  group.appendChild(shapeElement);

  // Always add text element for editing capability
  const textElement = createTextElement(shape);
  group.appendChild(textElement);

  return group;
}

function createRectangle(
  x: number,
  y: number,
  width: number,
  height: number
): SVGRectElement {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', String(x));
  rect.setAttribute('y', String(y));
  rect.setAttribute('width', String(width));
  rect.setAttribute('height', String(height));
  rect.setAttribute('rx', '4');
  rect.setAttribute('ry', '4');
  return rect;
}

function createCircle(cx: number, cy: number, r: number): SVGCircleElement {
  const circle = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'circle'
  );
  circle.setAttribute('cx', String(cx));
  circle.setAttribute('cy', String(cy));
  circle.setAttribute('r', String(r));
  return circle;
}

function createEllipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number
): SVGEllipseElement {
  const ellipse = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'ellipse'
  );
  ellipse.setAttribute('cx', String(cx));
  ellipse.setAttribute('cy', String(cy));
  ellipse.setAttribute('rx', String(rx));
  ellipse.setAttribute('ry', String(ry));
  return ellipse;
}

function createTriangle(
  x: number,
  y: number,
  width: number,
  height: number
): SVGPolygonElement {
  const polygon = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'polygon'
  );
  const points = [
    `${x + width / 2},${y}`,
    `${x + width},${y + height}`,
    `${x},${y + height}`,
  ].join(' ');
  polygon.setAttribute('points', points);
  return polygon;
}

function createDiamond(
  x: number,
  y: number,
  width: number,
  height: number
): SVGPolygonElement {
  const polygon = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'polygon'
  );
  const cx = x + width / 2;
  const cy = y + height / 2;
  const points = [
    `${cx},${y}`,
    `${x + width},${cy}`,
    `${cx},${y + height}`,
    `${x},${cy}`,
  ].join(' ');
  polygon.setAttribute('points', points);
  return polygon;
}

function createTextElement(shape: ShapeData): SVGForeignObjectElement {
  const { x, y } = shape.position;
  const { width, height } = shape.size;
  const text = shape.text;

  const foreignObject = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'foreignObject'
  );
  foreignObject.setAttribute('x', String(x));
  foreignObject.setAttribute('y', String(y));
  foreignObject.setAttribute('width', String(width));
  foreignObject.setAttribute('height', String(height));
  foreignObject.style.pointerEvents = 'none';

  const div = document.createElement('div');
  div.className = 'wb-shape-text';
  div.style.fontSize = `${text?.fontSize ?? 14}px`;
  div.style.fontFamily = text?.fontFamily ?? 'sans-serif';
  div.style.color = text?.color ?? '#333333';
  div.style.textAlign = text?.align ?? 'center';
  div.textContent = text?.content ?? '';

  foreignObject.appendChild(div);
  return foreignObject;
}
