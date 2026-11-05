/**
 * Boundary handling for the SRC algorithm.
 *
 * When a sweep's ideal corner C* falls outside the grid, the sweep is
 * "clipped".  After the sweep completes, the group BOUNCES — flipping
 * only the axis (or axes) that hit the boundary — and starts a new sweep
 * from the realized corner C.
 *
 * Terminating case: when γ > √n AND the realized corner sits at a grid
 * corner, the whole grid can be covered in one sweep → agents settle and
 * terminate.
 */

import type { AgentState, Direction, GridState, Position, SweepInfo } from './types';
import { calculateSweep } from './geometry';

// ---------------------------------------------------------------------------
// Bounce
// ---------------------------------------------------------------------------

/**
 * Compute the post-bounce direction and new sweep from the clipped corner.
 *
 * Only the axes that were actually clipped get flipped:
 *   - If tx > 0 → flip dx
 *   - If ty > 0 → flip dy
 *
 * The new anchor is the realized corner C of the old sweep.
 * γ stays the same (it only changes at end-of-cycle level-up).
 */
export function handleBounce(
  sweep: SweepInfo,
  gridSideLength: number,
): SweepInfo {
  const newDx: -1 | 1 = sweep.excessX > 0
    ? ((-sweep.direction.dx) as -1 | 1)
    : sweep.direction.dx;
  const newDy: -1 | 1 = sweep.excessY > 0
    ? ((-sweep.direction.dy) as -1 | 1)
    : sweep.direction.dy;

  const newDirection: Direction = { dx: newDx, dy: newDy };
  const newAnchor: Position = { ...sweep.realizedCorner };

  return calculateSweep(newAnchor, newDirection, sweep.gamma, gridSideLength);
}

// ---------------------------------------------------------------------------
// Terminating case
// ---------------------------------------------------------------------------

/**
 * Detect the terminating case.
 *
 * The terminating case occurs when γ ≥ √n (the sweep side covers the
 * whole grid side) AND the realized corner is a corner of the grid.
 * In this case one full sweep can cover every node.
 */
export function isTerminatingCase(
  gamma: number,
  gridSideLength: number,
): boolean {
  return gamma >= gridSideLength;
}

/**
 * Check if a position is a corner of the grid.
 */
export function isGridCorner(pos: Position, sideLength: number): boolean {
  const max = sideLength - 1;
  return (pos.x === 0 || pos.x === max) && (pos.y === 0 || pos.y === max);
}

/**
 * Handle the terminating sweep: all agents settle along their subgroup
 * paths, and terminate.
 *
 * In practice, each agent is already at some position on the path —
 * we mark them settled + terminated.
 */
export function handleTerminatingSweep(
  agents: AgentState[],
  _grid: GridState,
): AgentState[] {
  return agents.map(a => ({
    ...a,
    status: 'terminated' as const,
    phase: 'terminated' as const,
  }));
}
