import { describe, it, expect } from 'vitest';
import {
  calculateGamma,
  calculateSubgroupIndex,
  calculateSweepBounds,
} from '../src/engine/geometry/sweepGeometry';
import { generateSubgroupPath } from '../src/engine/geometry/pathGeneration';
import { evaluateBoundaryContact } from '../src/engine/geometry/boundaryDetection';

describe('SRC Geometry and Sweep Bounds', () => {
  it('calculates gamma correctly for various group sizes (γ = 2 * ceil(sqrt(m)))', () => {
    // m = 1 -> ceil(sqrt(1)) = 1 -> γ = 2
    expect(calculateGamma(1)).toBe(2);
    // m = 2 -> ceil(sqrt(2)) = 2 -> γ = 4
    expect(calculateGamma(2)).toBe(4);
    // m = 4 -> ceil(sqrt(4)) = 2 -> γ = 4
    expect(calculateGamma(4)).toBe(4);
    // m = 5 -> ceil(sqrt(5)) = 3 -> γ = 6
    expect(calculateGamma(5)).toBe(6);
    // m = 9 -> ceil(sqrt(9)) = 3 -> γ = 6
    expect(calculateGamma(9)).toBe(6);
    // m = 10 -> ceil(sqrt(10)) = 4 -> γ = 8
    expect(calculateGamma(10)).toBe(8);
  });

  it('assigns subgroups by rank mod γ correctly', () => {
    const gamma = 6;
    expect(calculateSubgroupIndex(1, gamma)).toBe(1);
    expect(calculateSubgroupIndex(2, gamma)).toBe(2);
    expect(calculateSubgroupIndex(5, gamma)).toBe(5);
    expect(calculateSubgroupIndex(6, gamma)).toBe(0); // 6 mod 6 = 0
    expect(calculateSubgroupIndex(7, gamma)).toBe(1);
  });

  it('calculates clean sweep bounds accurately', () => {
    const anchor = { x: 1, y: 1 };
    const direction = { dx: 1 as const, dy: 1 as const };
    const gamma = 6;
    const gridW = 10;
    const gridH = 10;

    const bounds = calculateSweepBounds(anchor, direction, gamma, gridW, gridH);

    // C* = (1 + (6-1)*1, 1 + (6-1)*1) = (6, 6)
    expect(bounds.idealCorner).toEqual({ x: 6, y: 6 });
    expect(bounds.realizedCorner).toEqual({ x: 6, y: 6 });
    expect(bounds.excessX).toBe(0);
    expect(bounds.excessY).toBe(0);
    expect(bounds.isClipped).toBe(false);
    // λ = 2(γ - 1) = 2 * 5 = 10
    expect(bounds.length).toBe(10);
  });

  it('calculates clipped sweep bounds when reaching grid boundary', () => {
    const anchor = { x: 7, y: 7 };
    const direction = { dx: 1 as const, dy: 1 as const };
    const gamma = 6; // ideal C* = (7 + 5, 7 + 5) = (12, 12)
    const gridW = 10;
    const gridH = 10;

    const bounds = calculateSweepBounds(anchor, direction, gamma, gridW, gridH);

    expect(bounds.idealCorner).toEqual({ x: 12, y: 12 });
    // Realized corner clamped to (9, 9)
    expect(bounds.realizedCorner).toEqual({ x: 9, y: 9 });
    expect(bounds.excessX).toBe(3);
    expect(bounds.excessY).toBe(3);
    expect(bounds.isClipped).toBe(true);
    // λ = 2(γ - 1) - tx - ty = 10 - 3 - 3 = 4
    expect(bounds.length).toBe(4);
  });

  it('generates the 3-leg Γ-shaped path covering the exact column with total steps λ', () => {
    const anchor = { x: 0, y: 0 };
    const direction = { dx: 1 as const, dy: 1 as const };
    const gamma = 4;
    const bounds = calculateSweepBounds(anchor, direction, gamma, 10, 10);
    // s = 2
    const res = generateSubgroupPath(2, bounds, 10, 10);

    // λ = 2(4 - 1) = 6 steps -> 7 points
    expect(res.path.length).toBe(7);
    expect(res.coveredX).toBe(2);
    expect(res.path[0]).toEqual({ x: 0, y: 0 }); // A
    expect(res.path[res.path.length - 1]).toEqual({ x: 3, y: 3 }); // C

    // First row leg: 2 steps -> (1, 0), (2, 0)
    expect(res.firstRowLeg[1]).toEqual({ x: 1, y: 0 });
    expect(res.firstRowLeg[2]).toEqual({ x: 2, y: 0 });

    // Column leg: 3 steps along dy at x=2 -> (2, 1), (2, 2), (2, 3)
    expect(res.columnLeg).toContainEqual({ x: 2, y: 1 });
    expect(res.columnLeg).toContainEqual({ x: 2, y: 2 });
    expect(res.columnLeg).toContainEqual({ x: 2, y: 3 });
  });

  it('computes boundary bounce reflecting hit axes correctly', () => {
    const anchor = { x: 8, y: 2 };
    const direction = { dx: 1 as const, dy: 1 as const };
    const gamma = 4; // C* = (8+3, 2+3) = (11, 5)
    const bounds = calculateSweepBounds(anchor, direction, gamma, 10, 10);
    // x exceeds (excessX = 2), y does not exceed (excessY = 0)
    expect(bounds.excessX).toBe(2);
    expect(bounds.excessY).toBe(0);

    const bounce = evaluateBoundaryContact(bounds, 10, 10);
    expect(bounce.axisFlippedX).toBe(true);
    expect(bounce.axisFlippedY).toBe(false);
    expect(bounce.newDirection).toEqual({ dx: -1, dy: 1 });
    expect(bounce.newAnchor).toEqual({ x: 9, y: 5 });
  });
});
