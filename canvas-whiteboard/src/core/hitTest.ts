import type { Point, ShapeData } from '@/types';
import {
  pointInRect,
  pointInCircle,
  pointInEllipse,
  pointInPolygon,
} from '@/utils/geometry';

export function hitTest(point: Point, shapes: ShapeData[]): ShapeData | null {
  // Test in reverse order (top shapes first)
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i];
    if (hitTestShape(point, shape)) {
      return shape;
    }
  }
  return null;
}

function hitTestShape(point: Point, shape: ShapeData): boolean {
  const { x, y } = shape.position;
  const { width, height } = shape.size;

  switch (shape.type) {
    case 'rectangle':
      return pointInRect(point, shape.position, shape.size);

    case 'circle': {
      const radius = Math.min(width, height) / 2;
      const center = { x: x + width / 2, y: y + height / 2 };
      return pointInCircle(point, center, radius);
    }

    case 'ellipse': {
      const center = { x: x + width / 2, y: y + height / 2 };
      return pointInEllipse(point, center, width / 2, height / 2);
    }

    case 'triangle': {
      const vertices = [
        { x: x + width / 2, y },
        { x: x + width, y: y + height },
        { x, y: y + height },
      ];
      return pointInPolygon(point, vertices);
    }

    case 'diamond': {
      const cx = x + width / 2;
      const cy = y + height / 2;
      const vertices = [
        { x: cx, y },
        { x: x + width, y: cy },
        { x: cx, y: y + height },
        { x, y: cy },
      ];
      return pointInPolygon(point, vertices);
    }

    default:
      return pointInRect(point, shape.position, shape.size);
  }
}
