import { Coord } from '../model/Grid';
import { Subgroup } from '../model/Subgroup';
import { SweepBounds } from './sweepGeometry';

/**
 * Generates the discrete grid path for subgroup s given sweep bounds.
 * Path starts at anchor A (step 0) and ends at realized corner C (step λ).
 * Total points in array: length + 1.
 */
export function generateSubgroupPath(
  s: number,
  bounds: SweepBounds,
  gridWidth: number,
  gridHeight: number
): {
  path: Coord[];
  firstRowLeg: Coord[];
  columnLeg: Coord[];
  secondRowLeg: Coord[];
  coveredX: number;
} {
  const { anchor, direction, gamma } = bounds;
  const dx = direction.dx;
  const dy = direction.dy;

  // Total allowed displacement along each axis on grid
  const maxDeltaX = Math.abs(bounds.realizedCorner.x - anchor.x);
  const maxDeltaY = Math.abs(bounds.realizedCorner.y - anchor.y);

  // Ideal steps for each leg:
  // Leg 1: s steps of dx
  // Leg 2: (gamma - 1) steps of dy
  // Leg 3: (gamma - 1 - s) steps of dx

  // In clipped sweep, we distribute available x displacement proportionally or by capping
  const idealLeg1Steps = s;
  const idealLeg3Steps = (gamma - 1) - s;

  // Subgroup covered column target:
  const coveredIdealX = anchor.x + s * dx;
  const coveredX = Math.max(0, Math.min(gridWidth - 1, coveredIdealX));

  // Determine actual steps on leg 1 (cannot exceed maxDeltaX)
  const leg1Steps = Math.min(idealLeg1Steps, maxDeltaX);
  // Remaining x steps left for leg 3
  const leg3Steps = Math.min(idealLeg3Steps, maxDeltaX - leg1Steps);
  // Leg 2 steps (cannot exceed maxDeltaY)
  const leg2Steps = Math.min(gamma - 1, maxDeltaY);

  const path: Coord[] = [{ x: anchor.x, y: anchor.y }];
  const firstRowLeg: Coord[] = [{ x: anchor.x, y: anchor.y }];
  const columnLeg: Coord[] = [];
  const secondRowLeg: Coord[] = [];

  let curX = anchor.x;
  let curY = anchor.y;

  // Leg 1: first row
  for (let i = 0; i < leg1Steps; i++) {
    curX += dx;
    const pt = { x: curX, y: curY };
    path.push(pt);
    firstRowLeg.push(pt);
  }

  // If column leg starts, first point is current pos
  if (leg2Steps > 0) {
    columnLeg.push({ x: curX, y: curY });
  }

  // Leg 2: column
  for (let j = 0; j < leg2Steps; j++) {
    curY += dy;
    const pt = { x: curX, y: curY };
    path.push(pt);
    columnLeg.push(pt);
  }

  // If leg 3 starts, first point is current pos
  if (leg3Steps > 0) {
    secondRowLeg.push({ x: curX, y: curY });
  }

  // Leg 3: second row
  for (let k = 0; k < leg3Steps; k++) {
    curX += dx;
    const pt = { x: curX, y: curY };
    path.push(pt);
    secondRowLeg.push(pt);
  }

  return {
    path,
    firstRowLeg,
    columnLeg,
    secondRowLeg,
    coveredX,
  };
}

/**
 * Creates Subgroup data structures for all γ subgroups in a group.
 */
export function buildSubgroups(
  gamma: number,
  memberRanks: Map<number, number>, // agentId -> rank
  bounds: SweepBounds,
  gridWidth: number,
  gridHeight: number
): Subgroup[] {
  const subgroups: Subgroup[] = [];

  for (let s = 0; s < gamma; s++) {
    const { path, firstRowLeg, columnLeg, secondRowLeg, coveredX } = generateSubgroupPath(
      s,
      bounds,
      gridWidth,
      gridHeight
    );

    const memberIds: number[] = [];
    for (const [id, rank] of memberRanks.entries()) {
      if (rank % gamma === s) {
        memberIds.push(id);
      }
    }

    subgroups.push({
      index: s,
      coveredX,
      path,
      firstRowLeg,
      columnLeg,
      secondRowLeg,
      memberIds,
      headPos: path[0] || { ...bounds.anchor },
      contacted: false,
    });
  }

  return subgroups;
}
