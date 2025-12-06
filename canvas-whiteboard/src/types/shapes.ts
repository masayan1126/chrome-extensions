export type ShapeType =
  | 'rectangle'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'diamond';

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ShapeStyle {
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
}

export interface TextConfig {
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
}

export interface ShapeData {
  id: string;
  type: ShapeType;
  position: Point;
  size: Size;
  style: ShapeStyle;
  text?: TextConfig;
  rotation: number;
  zIndex: number;
}

export type AnchorPosition = 'top' | 'right' | 'bottom' | 'left' | 'center';

export const DEFAULT_SHAPE_STYLE: ShapeStyle = {
  fillColor: '#ffffff',
  strokeColor: '#333333',
  strokeWidth: 2,
  opacity: 1,
};

export const DEFAULT_TEXT_CONFIG: TextConfig = {
  content: '',
  fontSize: 14,
  fontFamily: 'sans-serif',
  color: '#333333',
  align: 'center',
};
