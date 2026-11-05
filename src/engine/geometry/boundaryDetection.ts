import { Coord, Direction } from '../model/Grid';
import { SweepBounds } from './sweepGeometry';

export interface BoundaryBounceResult {
  newAnchor: Coord;
  newDirection: Direction;
  axisFlippedX: boolean;
  axisFlippedY: boolean;
  isTerminatingWholeGrid: boolean;
}

export function evaluateBoundaryContact(
  bounds: SweepBounds,
  gridWidth: number,
  gridHeight: number
): BoundaryBounceResult {
  const { anchor, realizedCorner, direction, excessX, excessY, gamma } = bounds;

  const flipX = excessX > 0;
  const flipY = excessY > 0;

  const newDirection: Direction = {
    dx: (flipX ? -direction.dx : direction.dx) as -1 | 1,
    dy: (flipY ? -direction.dy : direction.dy) as -1 | 1,
  };

  const newAnchor: Coord = { ...realizedCorner };

  // Terminating whole grid condition:
  // γ > sqrt(n) AND clips on both axes
  const gridSide = Math.max(gridWidth, gridHeight);
  const isTerminatingWholeGrid = gamma > gridSide && flipX && flipY;

  return {
    newAnchor,
    newDirection,
    axisFlippedX: flipX,
    axisFlippedY: flipY,
    isTerminatingWholeGrid,
  };
}
