import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../src/engine/simulation/simulationEngine';
import { validateStateInvariants } from '../src/engine/validation/invariants';
import { calculateSweepBounds, calculateGamma } from '../src/engine/geometry/sweepGeometry';
import { evaluateBoundaryContact } from '../src/engine/geometry/boundaryDetection';

describe('Comprehensive Boundary Handling Stress Testing', () => {
  // Test 1: Single-axis horizontal bounce (East edge hit)
  it('Boundary 1: Horizontal bounce flips only dx, preserves dy, updates anchor to C', () => {
    const anchor = { x: 5, y: 1 };
    const direction = { dx: 1 as const, dy: 1 as const };
    const gamma = 4; // ideal C* = (5+3, 1+3) = (8, 4) on grid 7x7
    const bounds = calculateSweepBounds(anchor, direction, gamma, 7, 7);

    // Max coordinate is 6. C* = (8, 4) -> realized C = (6, 4)
    expect(bounds.excessX).toBe(2);
    expect(bounds.excessY).toBe(0);
    expect(bounds.isClipped).toBe(true);

    const bounce = evaluateBoundaryContact(bounds, 7, 7);
    expect(bounce.axisFlippedX).toBe(true);
    expect(bounce.axisFlippedY).toBe(false);
    expect(bounce.isTerminatingWholeGrid).toBe(false);
    expect(bounce.newDirection).toEqual({ dx: -1, dy: 1 }); // dx flipped, dy preserved
    expect(bounce.newAnchor).toEqual({ x: 6, y: 4 }); // anchor is C
  });

  // Test 2: Single-axis vertical bounce (North edge hit)
  it('Boundary 2: Vertical bounce flips only dy, preserves dx, updates anchor to C', () => {
    const anchor = { x: 1, y: 5 };
    const direction = { dx: 1 as const, dy: 1 as const };
    const gamma = 4; // ideal C* = (1+3, 5+3) = (4, 8) on grid 7x7
    const bounds = calculateSweepBounds(anchor, direction, gamma, 7, 7);

    // Max coordinate is 6. C* = (4, 8) -> realized C = (4, 6)
    expect(bounds.excessX).toBe(0);
    expect(bounds.excessY).toBe(2);
    expect(bounds.isClipped).toBe(true);

    const bounce = evaluateBoundaryContact(bounds, 7, 7);
    expect(bounce.axisFlippedX).toBe(false);
    expect(bounce.axisFlippedY).toBe(true);
    expect(bounce.isTerminatingWholeGrid).toBe(false);
    expect(bounce.newDirection).toEqual({ dx: 1, dy: -1 }); // dy flipped, dx preserved
    expect(bounce.newAnchor).toEqual({ x: 4, y: 6 });
  });

  // Test 3: Corner bounce (both axes hit)
  it('Boundary 3: Corner bounce flips both dx and dy', () => {
    const anchor = { x: 5, y: 5 };
    const direction = { dx: 1 as const, dy: 1 as const };
    const gamma = 4; // ideal C* = (8, 8) on grid 7x7
    const bounds = calculateSweepBounds(anchor, direction, gamma, 7, 7);

    expect(bounds.excessX).toBe(2);
    expect(bounds.excessY).toBe(2);
    expect(bounds.isClipped).toBe(true);

    const bounce = evaluateBoundaryContact(bounds, 7, 7);
    expect(bounce.axisFlippedX).toBe(true);
    expect(bounce.axisFlippedY).toBe(true);
    expect(bounce.newDirection).toEqual({ dx: -1, dy: -1 });
    expect(bounce.newAnchor).toEqual({ x: 6, y: 6 });
  });

  // Test 4: Lemma 4.5 Bounded Bounces Invariant: at most 4 boundary bounces before clean Spread
  it('Boundary 4: Lemma 4.5 Invariant — at most 4 boundary bounces before clean Spread', () => {
    // 4 agents in the far top-right corner of a 7x7 grid: (6, 6)
    // Starting with (+1, +1): immediately clips on both axes
    const placements = [
      { id: 10, pos: { x: 6, y: 6 } },
      { id: 20, pos: { x: 6, y: 6 } },
      { id: 30, pos: { x: 6, y: 6 } },
      { id: 40, pos: { x: 6, y: 6 } },
    ];

    const engine = new SimulationEngine(7, 7, placements);
    const finalState = engine.runUntilDispersed(100);

    // Verify bounces do not exceed 4
    const totalBounces = finalState.statistics.bouncesCount;
    expect(totalBounces).toBeLessThanOrEqual(4);

    expect(validateStateInvariants(finalState)).toEqual([]);
    expect(finalState.isDispersed).toBe(true);
    expect(finalState.statistics.settledCount).toBe(4);
  });

  // Test 5: Boundary reflection preserves previously placed settled markers
  it('Boundary 5: Settled markers placed before bounce remain passive-settled and untouched', () => {
    // 4 agents at (4, 3) on a 6x6 grid. Direction (+1, +1), gamma = 4.
    // Some agents settle before hitting the boundary at x=5, y=5.
    const placements = [
      { id: 1, pos: { x: 4, y: 3 } },
      { id: 2, pos: { x: 4, y: 3 } },
      { id: 3, pos: { x: 4, y: 3 } },
      { id: 4, pos: { x: 4, y: 3 } },
    ];

    const engine = new SimulationEngine(6, 6, placements);

    // Step forward until first bounce
    let bounced = false;
    for (let r = 0; r < 30; r++) {
      engine.stepForward();
      const state = engine.getCurrentState();
      expect(validateStateInvariants(state)).toEqual([]);
      if (state.statistics.bouncesCount > 0) {
        bounced = true;
        break;
      }
    }

    expect(bounced).toBe(true);

    // Finish simulation and check final state
    const finalState = engine.runUntilDispersed(100);
    expect(validateStateInvariants(finalState)).toEqual([]);
    expect(finalState.isDispersed).toBe(true);
  });

  // Test 6: Terminating Whole-Grid Sweep (gamma > sqrt(n))
  it('Boundary 6: Terminating whole-grid sweep disperses all agents and completes within O(√n) rounds', () => {
    // 9 agents on a 3x3 grid (n = 9, sqrt(n) = 3)
    // gamma = 2 * ceil(sqrt(9)) = 6 > 3
    const placements = Array.from({ length: 9 }).map((_, i) => ({
      id: 10 + i,
      pos: { x: 0, y: 0 },
    }));

    const engine = new SimulationEngine(3, 3, placements);
    const finalState = engine.runUntilDispersed(50);

    expect(finalState.isTerminated).toBe(true);
    expect(finalState.isDispersed).toBe(true);
    expect(finalState.statistics.settledCount).toBe(9);
    expect(finalState.statistics.activeCount).toBe(0);

    // Invariant: all 9 nodes of the 3x3 grid are occupied by exactly 1 agent
    const occupied = new Set(finalState.agents.map(a => `${a.currentPos.x},${a.currentPos.y}`));
    expect(occupied.size).toBe(9);
    expect(validateStateInvariants(finalState)).toEqual([]);
  });

  // Test 7: Terminating Whole-Grid Sweep on 4x4 grid (12 agents)
  it('Boundary 7: Terminating whole-grid sweep with k = 12 on 4x4 grid', () => {
    const placements = Array.from({ length: 12 }).map((_, i) => ({
      id: 50 + i,
      pos: { x: 0, y: 0 },
    }));

    const engine = new SimulationEngine(4, 4, placements);
    const finalState = engine.runUntilDispersed(60);

    expect(finalState.isTerminated).toBe(true);
    expect(finalState.isDispersed).toBe(true);
    expect(finalState.statistics.settledCount).toBe(12);

    const occupied = new Set(finalState.agents.map(a => `${a.currentPos.x},${a.currentPos.y}`));
    expect(occupied.size).toBe(12);
    expect(validateStateInvariants(finalState)).toEqual([]);
  });

  // Test 8: Successive bounces in a small 4x4 grid preserve conservation
  it('Boundary 8: Rapid successive bounces on a small 4x4 grid preserve conservation', () => {
    const placements = [
      { id: 1, pos: { x: 3, y: 3 } },
      { id: 2, pos: { x: 3, y: 3 } },
      { id: 3, pos: { x: 3, y: 3 } },
      { id: 4, pos: { x: 3, y: 3 } },
    ];

    const engine = new SimulationEngine(4, 4, placements);
    const finalState = engine.runUntilDispersed(80);

    expect(validateStateInvariants(finalState)).toEqual([]);
    expect(finalState.isDispersed).toBe(true);
    expect(finalState.statistics.settledCount).toBe(4);
  });
});
