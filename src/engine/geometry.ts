/**
 * Sweep geometry helpers for the SRC algorithm.
 *
 * Key concepts:
 *   γ = 2⌈√m⌉            — side length of the sweep square
 *   Sweep = ⌐-shaped path from anchor A toward corner C
 *   Each subgroup s covers one column (vertical strip) inside the square
 */

import type { Direction, Position, SweepInfo } from './types';

// ---------------------------------------------------------------------------
// Primitive helpers
// ---------------------------------------------------------------------------

/** Clip value z into [a, b]. */
export function clip(z: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, z));
}

/** γ = 2⌈√m⌉. Always ≥ 2. */
export function calculateGamma(m: number): number {
  if (m <= 0) return 2;
  return 2 * Math.ceil(Math.sqrt(m));
}

/** Check whether a position is inside a grid of side length `s` (0-indexed). */
export function isInsideGrid(p: Position, sideLength: number): boolean {
  return p.x >= 0 && p.x < sideLength && p.y >= 0 && p.y < sideLength;
}

// ---------------------------------------------------------------------------
// Sweep calculation
// ---------------------------------------------------------------------------

/**
 * Compute the full SweepInfo from an anchor, direction, γ, and grid size.
 *
 * Ideal corner C* = A + (γ-1)·δ  (component-wise).
 * Realized corner C clips each coordinate into [0, sideLength-1].
 * Excess tx, ty = distance lost to clipping on each axis.
 * λ = 2(γ-1) - tx - ty.
 */
export function calculateSweep(
  anchor: Position,
  direction: Direction,
  gamma: number,
  gridSideLength: number,
): SweepInfo {
  const idealCorner: Position = {
    x: anchor.x + (gamma - 1) * direction.dx,
    y: anchor.y + (gamma - 1) * direction.dy,
  };

  const realizedCorner: Position = {
    x: clip(idealCorner.x, 0, gridSideLength - 1),
    y: clip(idealCorner.y, 0, gridSideLength - 1),
  };

  const excessX = Math.abs(idealCorner.x - realizedCorner.x);
  const excessY = Math.abs(idealCorner.y - realizedCorner.y);
  const lambda = 2 * (gamma - 1) - excessX - excessY;

  return {
    anchor,
    idealCorner,
    realizedCorner,
    direction,
    gamma,
    lambda,
    excessX,
    excessY,
    isClipped: excessX > 0 || excessY > 0,
  };
}

// ---------------------------------------------------------------------------
// Subgroup path generation
// ---------------------------------------------------------------------------

/**
 * Generate the ⌐-shaped path for a given subgroup index `s`.
 *
 * Path legs (all relative to anchor A with direction δ):
 *   Leg 1 (first row): s steps along dx   → positions (A.x + i·dx, A.y) for i = 0 … s
 *   Leg 2 (column):    γ-1 steps along dy → positions (A.x + s·dx, A.y + j·dy) for j = 1 … γ-1
 *   Leg 3 (second row): γ-1-s steps along dx → positions (A.x + (s+k)·dx, A.y + (γ-1)·dy) for k = 1 … γ-1-s
 *
 * Total unclipped length = s + (γ-1) + (γ-1-s) = 2(γ-1) positions visited
 * (but the path has 2(γ-1) *steps*, which means 2(γ-1)+1 positions including start — wait, no:
 *  the NUMBER OF STEPS is equal to the number of edges traversed = 2(γ-1).
 *  The number of POSITIONS visited (nodes) = 2(γ-1) + 1 when unclipped, but
 *  position 0 is the anchor so there are 2(γ-1) move-steps.)
 *
 * Returns the sequence of positions the subgroup HEAD visits (including anchor).
 * If a position falls outside the grid it is SKIPPED from the returned list
 * (the step still counts against λ).
 */
export function generateSubgroupPath(
  subgroup: number,
  sweep: SweepInfo,
  gridSideLength: number,
): Position[] {
  const { anchor, direction, gamma } = sweep;
  const s = subgroup;
  const path: Position[] = [];

  // Leg 1 — first row: s+1 positions (including anchor at i=0)
  for (let i = 0; i <= s; i++) {
    const p: Position = {
      x: anchor.x + i * direction.dx,
      y: anchor.y,
    };
    if (isInsideGrid(p, gridSideLength)) {
      path.push(p);
    }
  }

  // Leg 2 — column: γ-1 positions (j = 1 … γ-1)
  for (let j = 1; j <= gamma - 1; j++) {
    const p: Position = {
      x: anchor.x + s * direction.dx,
      y: anchor.y + j * direction.dy,
    };
    if (isInsideGrid(p, gridSideLength)) {
      path.push(p);
    }
  }

  // Leg 3 — second row: γ-1-s positions (k = 1 … γ-1-s)
  for (let k = 1; k <= gamma - 1 - s; k++) {
    const p: Position = {
      x: anchor.x + (s + k) * direction.dx,
      y: anchor.y + (gamma - 1) * direction.dy,
    };
    if (isInsideGrid(p, gridSideLength)) {
      path.push(p);
    }
  }

  return path;
}

/**
 * Return the γ column positions that subgroup `s` covers during the column leg.
 *
 * Column x = anchor.x + s·dx, y ranges from anchor.y to anchor.y + (γ-1)·dy.
 */
export function getSubgroupCoveredColumn(
  subgroup: number,
  sweep: SweepInfo,
  gridSideLength: number,
): Position[] {
  const { anchor, direction, gamma } = sweep;
  const cx = anchor.x + subgroup * direction.dx;
  const positions: Position[] = [];

  for (let j = 0; j < gamma; j++) {
    const p: Position = {
      x: cx,
      y: anchor.y + j * direction.dy,
    };
    if (isInsideGrid(p, gridSideLength)) {
      positions.push(p);
    }
  }

  return positions;
}

// ---------------------------------------------------------------------------
// Subgroup assignment
// ---------------------------------------------------------------------------

/**
 * Assign agents to subgroups.
 *
 * 1. Sort agent IDs in DECREASING order.
 * 2. Rank α = position in sorted list (1-indexed, so rank 1 = largest ID).
 * 3. Subgroup s = α mod γ   (with 1-indexed rank, subgroup 0 gets ranks γ, 2γ, …).
 *
 * @returns Map from agentId → subgroup index
 */
export function assignSubgroups(
  agentIds: number[],
  gamma: number,
): Map<number, number> {
  // Sort descending (largest first → rank 1)
  const sorted = [...agentIds].sort((a, b) => b - a);
  const result = new Map<number, number>();
  for (let i = 0; i < sorted.length; i++) {
    const rank = i + 1; // 1-indexed
    const s = rank % gamma;
    result.set(sorted[i], s);
  }
  return result;
}

/**
 * Get the rank of each agent (1 = largest ID).
 * @returns Map from agentId → rank
 */
export function assignRanks(agentIds: number[]): Map<number, number> {
  const sorted = [...agentIds].sort((a, b) => b - a);
  const result = new Map<number, number>();
  for (let i = 0; i < sorted.length; i++) {
    result.set(sorted[i], i + 1);
  }
  return result;
}

/** Positions-equal helper. */
export function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}
