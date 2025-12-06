import type { AnchorPosition, Point } from './shapes';

export type ConnectionType = 'straight' | 'bezier';

export interface ConnectionAnchor {
  shapeId: string;
  position: AnchorPosition;
}

export interface ConnectionStyle {
  strokeColor: string;
  strokeWidth: number;
  arrowHead: boolean;
  arrowTail: boolean;
}

export interface ConnectionData {
  id: string;
  type: ConnectionType;
  from: ConnectionAnchor;
  to: ConnectionAnchor;
  style: ConnectionStyle;
  controlPoints?: Point[];
}

export const DEFAULT_CONNECTION_STYLE: ConnectionStyle = {
  strokeColor: '#333333',
  strokeWidth: 2,
  arrowHead: true,
  arrowTail: false,
};
