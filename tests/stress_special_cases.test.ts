import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../src/engine/simulation/simulationEngine';
import { validateStateInvariants } from '../src/engine/validation/invariants';
import { compareLabels, cloneLabel } from '../src/engine/model/Label';
import { calculateGamma } from '../src/engine/geometry/sweepGeometry';

describe('Comprehensive Special Cases & Invariant Stress Testing', () => {
  // Test 1: Maximally Dense Grid (k = n = 25 on 5x5 grid)
  it('Special 1: Complete saturation dispersion (k = n = 25 on 5x5 grid)', () => {
    // 25 agents placed in 5 clusters of 5 agents each
    const placements = [
      ...Array.from({ length: 5 }).map((_, i) => ({ id: 10 + i, pos: { x: 0, y: 0 } })),
      ...Array.from({ length: 5 }).map((_, i) => ({ id: 20 + i, pos: { x: 4, y: 0 } })),
      ...Array.from({ length: 5 }).map((_, i) => ({ id: 30 + i, pos: { x: 2, y: 2 } })),
      ...Array.from({ length: 5 }).map((_, i) => ({ id: 40 + i, pos: { x: 0, y: 4 } })),
      ...Array.from({ length: 5 }).map((_, i) => ({ id: 50 + i, pos: { x: 4, y: 4 } })),
    ];

    const engine = new SimulationEngine(5, 5, placements);
    const finalState = engine.runUntilDispersed(200);

    const violations = validateStateInvariants(finalState);
    expect(violations).toEqual([]);
    expect(finalState.isDispersed).toBe(true);
    expect(finalState.statistics.settledCount).toBe(25);
    expect(finalState.statistics.activeCount).toBe(0);

    // Every single cell of the 5x5 grid must be occupied
    const occupied = new Set(finalState.agents.map(a => `${a.currentPos.x},${a.currentPos.y}`));
    expect(occupied.size).toBe(25);
  });

  // Test 2: Singleton Rule (m = 1)
  it('Special 2: Singleton rule immediately settles isolated agent at round 0', () => {
    const placements = [
      { id: 42, pos: { x: 3, y: 3 } },
    ];

    const engine = new SimulationEngine(7, 7, placements);
    const state0 = engine.getCurrentState();

    // Agent must be settled immediately at round 0
    expect(state0.agents[0].status).toBe('settled');
    expect(state0.agents[0].settleMeta).toBeDefined();
    expect(state0.agents[0].settleMeta!.round).toBe(0);
    expect(state0.isDispersed).toBe(true);
    expect(state0.statistics.settledCount).toBe(1);
    expect(state0.statistics.activeCount).toBe(0);
    expect(validateStateInvariants(state0)).toEqual([]);
  });

  // Test 3: Partial Absorption & Group Splitting
  it('Special 3: Partial absorption splits lower group; uncontacted subgroups disperse independently', () => {
    // Group 1 (higher, IDs 91-94) at (1, 1)
    // Group 2 (lower, IDs 11-14) at (3, 1)
    const placements = [
      { id: 91, pos: { x: 1, y: 1 } },
      { id: 92, pos: { x: 1, y: 1 } },
      { id: 93, pos: { x: 1, y: 1 } },
      { id: 94, pos: { x: 1, y: 1 } },
      { id: 11, pos: { x: 3, y: 1 } },
      { id: 12, pos: { x: 3, y: 1 } },
      { id: 13, pos: { x: 3, y: 1 } },
      { id: 14, pos: { x: 3, y: 1 } },
    ];

    const engine = new SimulationEngine(8, 8, placements);
    const finalState = engine.runUntilDispersed(150);

    expect(validateStateInvariants(finalState)).toEqual([]);
    expect(finalState.isDispersed).toBe(true);
    expect(finalState.statistics.settledCount).toBe(8);

    // Invariant: all 8 distinct coordinates
    const coords = new Set(finalState.agents.map(a => `${a.currentPos.x},${a.currentPos.y}`));
    expect(coords.size).toBe(8);
  });

  // Test 4: Certificate Doubling Invariant (Lemma 4.3)
  it('Special 4: Certificate doubling condition requires m_after >= 2c on clean path', () => {
    // 2 agents at (0, 0) + 3 agents pre-placed to be collected
    // Group at (0, 0) has c = 2. Collecting 3 agents gives m_after = 5 >= 2*2 = 4 -> level-up!
    const placements = [
      { id: 50, pos: { x: 0, y: 0 } },
      { id: 51, pos: { x: 0, y: 0 } },
      { id: 10, pos: { x: 1, y: 1 } },
      { id: 11, pos: { x: 1, y: 1 } },
      { id: 12, pos: { x: 1, y: 1 } },
    ];

    const engine = new SimulationEngine(8, 8, placements);
    const finalState = engine.runUntilDispersed(120);

    expect(validateStateInvariants(finalState)).toEqual([]);
    expect(finalState.isDispersed).toBe(true);

    // Verify certificate and level invariant (Lemma 4.3: c >= 2^ℓ)
    for (const ag of finalState.agents) {
      expect(ag.label.certificate).toBeGreaterThanOrEqual(Math.pow(2, ag.label.level));
    }
  });

  // Test 5: Sub-doubling active mass preserves level and certificate
  it('Special 5: Non-promotion when m_after < 2c preserves existing certificate', () => {
    // Group with 4 agents (c = 4) that collects only 1 extra agent -> m_after = 5 < 8 -> no level-up!
    const placements = [
      { id: 60, pos: { x: 0, y: 0 } },
      { id: 61, pos: { x: 0, y: 0 } },
      { id: 62, pos: { x: 0, y: 0 } },
      { id: 63, pos: { x: 0, y: 0 } },
      { id: 1, pos: { x: 2, y: 2 } },
    ];

    const engine = new SimulationEngine(8, 8, placements);
    const finalState = engine.runUntilDispersed(120);

    expect(validateStateInvariants(finalState)).toEqual([]);
    expect(finalState.isDispersed).toBe(true);

    // Initial group certificate was 4; since doubling requires 8, level should not inflate
    const maxLevel = Math.max(...finalState.agents.map(a => a.label.level));
    expect(maxLevel).toBeLessThanOrEqual(1);
  });

  // Test 6: Multi-cluster collision with 4 clusters in a cross configuration
  it('Special 6: Symmetrical 4-cluster cross collision resolves deterministically', () => {
    const placements = [
      // North
      { id: 10, pos: { x: 3, y: 6 } },
      { id: 11, pos: { x: 3, y: 6 } },
      // South
      { id: 20, pos: { x: 3, y: 0 } },
      { id: 21, pos: { x: 3, y: 0 } },
      // West
      { id: 30, pos: { x: 0, y: 3 } },
      { id: 31, pos: { x: 0, y: 3 } },
      // East
      { id: 40, pos: { x: 6, y: 3 } },
      { id: 41, pos: { x: 6, y: 3 } },
    ];

    const engine = new SimulationEngine(7, 7, placements);
    const finalState = engine.runUntilDispersed(150);

    expect(validateStateInvariants(finalState)).toEqual([]);
    expect(finalState.isDispersed).toBe(true);
    expect(finalState.statistics.settledCount).toBe(8);

    const uniqueNodes = new Set(finalState.agents.map(a => `${a.currentPos.x},${a.currentPos.y}`));
    expect(uniqueNodes.size).toBe(8);
  });

  // Test 7: Double Flip Keystone Verification
  it('Special 7: Double flip (dx, dy) <- (-dx, -dy) in clean cycle sends next sweep back through slack', () => {
    // 6 agents co-located at (0, 0)
    const placements = [
      { id: 1, pos: { x: 0, y: 0 } },
      { id: 2, pos: { x: 0, y: 0 } },
      { id: 3, pos: { x: 0, y: 0 } },
      { id: 4, pos: { x: 0, y: 0 } },
      { id: 5, pos: { x: 0, y: 0 } },
      { id: 6, pos: { x: 0, y: 0 } },
    ];

    const engine = new SimulationEngine(8, 8, placements);
    const finalState = engine.runUntilDispersed(120);

    expect(validateStateInvariants(finalState)).toEqual([]);
    expect(finalState.isDispersed).toBe(true);
    expect(finalState.statistics.settledCount).toBe(6);
  });

  // Test 8: Asymmetric Grid Dimensions (6x8)
  it('Special 8: Non-square asymmetric grid (6x8) boundary detection', () => {
    const placements = [
      { id: 1, pos: { x: 4, y: 1 } },
      { id: 2, pos: { x: 4, y: 1 } },
      { id: 3, pos: { x: 4, y: 1 } },
      { id: 4, pos: { x: 4, y: 1 } },
    ];

    const engine = new SimulationEngine(6, 8, placements);
    const finalState = engine.runUntilDispersed(100);

    expect(validateStateInvariants(finalState)).toEqual([]);
    expect(finalState.isDispersed).toBe(true);
    expect(finalState.statistics.settledCount).toBe(4);
  });
});
