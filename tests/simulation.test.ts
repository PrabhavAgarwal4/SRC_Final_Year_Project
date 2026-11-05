import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../src/engine/simulation/simulationEngine';
import { validateStateInvariants } from '../src/engine/validation/invariants';

describe('SRC Simulation Engine End-to-End', () => {
  it('disperses a small group of 4 co-located agents cleanly in a single Spread', () => {
    // 4 agents at (0,0) on 6x6 grid
    // m = 4 -> γ = 4. Area 16 >= 4*4 = 16. Clean sweep length λ = 6.
    const engine = new SimulationEngine(6, 6, [
      { id: 10, pos: { x: 0, y: 0 } },
      { id: 20, pos: { x: 0, y: 0 } },
      { id: 30, pos: { x: 0, y: 0 } },
      { id: 40, pos: { x: 0, y: 0 } },
    ]);

    const state0 = engine.getCurrentState();
    expect(state0.agents.length).toBe(4);
    expect(state0.groups.length).toBe(1);
    expect(state0.groups[0].label.leaderId).toBe(40); // Largest ID is leader
    expect(state0.groups[0].label.certificate).toBe(4);
    expect(state0.groups[0].gamma).toBe(4);

    // Run until dispersed
    const finalState = engine.runUntilDispersed(50);

    // Invariants must hold at final state
    const violations = validateStateInvariants(finalState);
    expect(violations).toEqual([]);

    // Dispersion achieved: every agent is settled on a distinct node
    expect(finalState.isDispersed).toBe(true);
    expect(finalState.statistics.settledCount).toBe(4);
    expect(finalState.statistics.activeCount).toBe(0);

    const positions = finalState.agents.map(a => `${a.currentPos.x},${a.currentPos.y}`);
    const uniquePositions = new Set(positions);
    expect(uniquePositions.size).toBe(4);
  });

  it('allows stepping forward and backward through simulation history', () => {
    const engine = new SimulationEngine(5, 5, [
      { id: 1, pos: { x: 0, y: 0 } },
      { id: 2, pos: { x: 0, y: 0 } },
    ]);

    expect(engine.getCurrentRound()).toBe(0);
    engine.stepForward();
    expect(engine.getCurrentRound()).toBe(1);
    engine.stepForward();
    expect(engine.getCurrentRound()).toBe(2);

    engine.stepBackward();
    expect(engine.getCurrentRound()).toBe(1);

    engine.stepBackward();
    expect(engine.getCurrentRound()).toBe(0);

    engine.jumpToRound(2);
    expect(engine.getCurrentRound()).toBe(2);
  });

  it('immediately settles singleton agent by the Singleton Rule', () => {
    // 1 isolated agent
    const engine = new SimulationEngine(5, 5, [
      { id: 99, pos: { x: 2, y: 2 } },
    ]);

    const state0 = engine.getCurrentState();
    expect(state0.agents[0].status).toBe('settled');
    expect(state0.isDispersed).toBe(true);
  });
});
