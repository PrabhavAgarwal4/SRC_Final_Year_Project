import { Coord, Direction, clip } from '../model/Grid';

/**
 * Compute gamma parameter: γ = 2 * ceil(sqrt(m))
 * where m is the active mass (number of moving agents)
 */
export function calculateGamma(m: number): number {
  if (m <= 0) return 2;
  return 2 * Math.ceil(Math.sqrt(m));
}

/**
 * Subgroup assignment rule:
 * Ranks α ∈ {1, ..., m} sorted by decreasing identifier.
 * Subgroup s = α mod γ ∈ {0, ..., γ - 1}
 */
export function calculateSubgroupIndex(rank: number, gamma: number): number {
  return rank % gamma;
}

export interface SweepBounds {
  anchor: Coord;
  idealCorner: Coord;
  realizedCorner: Coord;
  direction: Direction;
  gamma: number;
  excessX: number;
  excessY: number;
  isClipped: boolean;
  length: number; // λ = 2(γ - 1) - tx - ty
}

export function calculateSweepBounds(
  anchor: Coord,
  direction: Direction,
  gamma: number,
  gridWidth: number,
  gridHeight: number
): SweepBounds {
  const idealX = anchor.x + (gamma - 1) * direction.dx;
  const idealY = anchor.y + (gamma - 1) * direction.dy;
  const idealCorner: Coord = { x: idealX, y: idealY };

  const realizedX = clip(idealX, 0, gridWidth - 1);
  const realizedY = clip(idealY, 0, gridHeight - 1);
  const realizedCorner: Coord = { x: realizedX, y: realizedY };

  const excessX = Math.abs(idealX - realizedX);
  const excessY = Math.abs(idealY - realizedY);
  const isClipped = excessX > 0 || excessY > 0;
  const length = Math.max(0, 2 * (gamma - 1) - excessX - excessY);

  return {
    anchor: { ...anchor },
    idealCorner,
    realizedCorner,
    direction: { ...direction },
    gamma,
    excessX,
    excessY,
    isClipped,
    length,
  };
}
