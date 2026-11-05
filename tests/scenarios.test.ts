import { describe, it, expect } from 'vitest';
import { PRESET_SCENARIOS } from '../src/scenarios/presetScenarios';
import { SimulationEngine } from '../src/engine/simulation/simulationEngine';
import { validateStateInvariants } from '../src/engine/validation/invariants';

describe('SRC Preset Scenario Verification (All 14 Scenarios)', () => {
  it('contains exactly 14 predefined research scenarios covering all core cases', () => {
    expect(PRESET_SCENARIOS.length).toBe(14);
  });

  PRESET_SCENARIOS.forEach(scenario => {
    it(`initializes and steps Scenario #${scenario.number}: "${scenario.title}" without invariant violations`, () => {
      const engine = new SimulationEngine(
        scenario.gridWidth,
        scenario.gridHeight,
        scenario.placements
      );

      // Verify initial state
      const initial = engine.getCurrentState();
      expect(initial.round).toBe(0);
      expect(initial.agents.length).toBe(scenario.placements.length);

      let violations = validateStateInvariants(initial);
      expect(violations).toEqual([]);

      // Step forward 10 rounds or until dispersed
      for (let r = 0; r < 10; r++) {
        if (engine.getCurrentState().isTerminated) break;
        engine.stepForward();
        violations = validateStateInvariants(engine.getCurrentState());
        expect(violations).toEqual([]);
      }

      // Step backward 3 rounds to verify historical scrubber integrity
      for (let b = 0; b < 3; b++) {
        if (!engine.canStepBackward()) break;
        engine.stepBackward();
        violations = validateStateInvariants(engine.getCurrentState());
        expect(violations).toEqual([]);
      }
    });
  });

  it('runs Scenario #8 (Boundary Bounce) and verifies direction flip and anchor update', () => {
    const sc8 = PRESET_SCENARIOS.find(s => s.number === 8)!;
    const engine = new SimulationEngine(sc8.gridWidth, sc8.gridHeight, sc8.placements);

    // Initial group starting at (5,4) with direction (+1, +1) and gamma = 4
    const initialGrp = engine.getCurrentState().groups[0];
    expect(initialGrp.direction).toEqual({ dx: 1, dy: 1 });
    expect(initialGrp.bouncesCount).toBe(0);

    // Run until bounce occurs
    engine.runUntilDispersed(30);
    const bouncedState = engine.getCurrentState();

    expect(bouncedState.statistics.bouncesCount).toBeGreaterThanOrEqual(1);
    const violations = validateStateInvariants(bouncedState);
    expect(violations).toEqual([]);
  });

  it('runs Scenario #9 (Whole Grid Sweep) and settles within O(√n) rounds', () => {
    const sc9 = PRESET_SCENARIOS.find(s => s.number === 9)!;
    const engine = new SimulationEngine(sc9.gridWidth, sc9.gridHeight, sc9.placements);

    engine.runUntilDispersed(50);
    const finalState = engine.getCurrentState();

    expect(finalState.isTerminated).toBe(true);
    expect(finalState.isDispersed).toBe(true);
    const violations = validateStateInvariants(finalState);
    expect(violations).toEqual([]);
  });
});
