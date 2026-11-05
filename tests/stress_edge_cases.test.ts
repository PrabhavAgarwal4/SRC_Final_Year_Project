import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../src/engine/simulation/simulationEngine';
import { validateStateInvariants } from '../src/engine/validation/invariants';
import { compareLabels } from '../src/engine/model/Label';
import { calculateGamma, calculateSweepBounds } from '../src/engine/geometry/sweepGeometry';
import { resolveNodeSettlement } from '../src/engine/interactions/settlement';
import { handleCoLocatedAbsorption } from '../src/engine/interactions/absorption';
import { predictHigherSubgroupState } from '../src/engine/interactions/lateAdoption';
import { initiateRecoveryCycle } from '../src/engine/interactions/recovery';
import { Agent } from '../src/engine/model/Agent';

describe('Rigorous Stress & Edge Case Test Suite', () => {
  // Edge Case 1: Dense Grid (k = N = 16)
  it('Edge Case 1: Dense Grid Dispersion (k = N = 16 on 4x4 grid)', () => {
    // 16 agents all co-located at (0, 0)
    const placements = Array.from({ length: 16 }).map((_, i) => ({
      id: 100 + i,
      pos: { x: 0, y: 0 },
    }));

    const engine = new SimulationEngine(4, 4, placements);
    const initial = engine.getCurrentState();

    expect(initial.statistics.totalAgents).toBe(16);
    expect(initial.statistics.gridNodes).toBe(16);
    expect(validateStateInvariants(initial)).toEqual([]);

    // Run until dispersed or max rounds
    const finalState = engine.runUntilDispersed(150);

    const violations = validateStateInvariants(finalState);
    expect(violations).toEqual([]);
    expect(finalState.isDispersed).toBe(true);
    expect(finalState.statistics.settledCount).toBe(16);
    expect(finalState.statistics.activeCount).toBe(0);

    // Verify all 16 agents occupy distinct grid coordinates
    const occupiedCoords = new Set(
      finalState.agents.map(a => `${a.currentPos.x},${a.currentPos.y}`)
    );
    expect(occupiedCoords.size).toBe(16);
  });

  // Edge Case 2: Multi-cluster asymmetric initial placements
  it('Edge Case 2: Highly asymmetric multi-cluster placements across boundaries', () => {
    const placements = [
      // Cluster 1 at top-left
      { id: 1, pos: { x: 0, y: 5 } },
      { id: 2, pos: { x: 0, y: 5 } },
      // Cluster 2 at bottom-right
      { id: 10, pos: { x: 5, y: 0 } },
      { id: 20, pos: { x: 5, y: 0 } },
      { id: 30, pos: { x: 5, y: 0 } },
      // Singletons
      { id: 99, pos: { x: 2, y: 2 } },
      { id: 100, pos: { x: 3, y: 4 } },
    ];

    const engine = new SimulationEngine(6, 6, placements);
    const finalState = engine.runUntilDispersed(100);

    expect(validateStateInvariants(finalState)).toEqual([]);
    expect(finalState.isDispersed).toBe(true);
    expect(finalState.statistics.settledCount).toBe(7);
  });

  // Edge Case 3: Multiple boundary bounces in succession
  it('Edge Case 3: Successive boundary reflections maintain invariants', () => {
    // 4 agents placed at (5, 5) on a 6x6 grid with direction (+1, +1)
    // Sweep immediately clips on both axes!
    const placements = [
      { id: 10, pos: { x: 5, y: 5 } },
      { id: 20, pos: { x: 5, y: 5 } },
      { id: 30, pos: { x: 5, y: 5 } },
      { id: 40, pos: { x: 5, y: 5 } },
    ];

    const engine = new SimulationEngine(6, 6, placements);
    const initialGrp = engine.getCurrentState().groups[0];
    expect(initialGrp.direction).toEqual({ dx: 1, dy: 1 });

    // Step forward until bounce happens
    let bounced = false;
    for (let r = 0; r < 20; r++) {
      engine.stepForward();
      const cur = engine.getCurrentState();
      expect(validateStateInvariants(cur)).toEqual([]);
      if (cur.statistics.bouncesCount > 0) {
        bounced = true;
        break;
      }
    }

    expect(bounced).toBe(true);
  });

  // Edge Case 4: Multiple competing candidates of different levels on same node
  it('Edge Case 4: Multi-level simultaneous claim resolution', () => {
    // Three candidates:
    // c1: level 0, cert 4, ID 99
    // c2: level 1, cert 2, ID 10
    // c3: level 1, cert 2, ID 5 (lowest ID at highest level)
    const c1: Agent = {
      id: 99,
      status: 'claiming',
      label: { level: 0, certificate: 4, leaderId: 99 },
      mass: 4,
      subgroup: 0,
      rank: 1,
      step: 1,
      dir: { dx: 1, dy: 1 },
      anchor: { x: 0, y: 0 },
      idealCorner: { x: 3, y: 3 },
      destination: { x: 3, y: 3 },
      contact: false,
      epoch: 0,
      initialPos: { x: 0, y: 0 },
      currentPos: { x: 1, y: 1 },
      groupId: 'g0',
      initialGroupId: 'g0',
      isLeader: true,
      isOverflow: false,
      isLateAdopter: false,
      totalMoves: 1,
    };

    const c2: Agent = {
      ...c1,
      id: 10,
      label: { level: 1, certificate: 2, leaderId: 10 },
      groupId: 'g1',
      initialGroupId: 'g1',
    };

    const c3: Agent = {
      ...c1,
      id: 5, // Winner!
      label: { level: 1, certificate: 2, leaderId: 10 },
      groupId: 'g1',
      initialGroupId: 'g1',
    };

    const res = resolveNodeSettlement({ x: 1, y: 1 }, [c1, c2, c3], undefined, 2);

    // c3 must settle because it has the lowest ID among level 1 candidates
    expect(res.settledAgent).toBeDefined();
    expect(res.settledAgent!.id).toBe(5);
    expect(c3.status).toBe('settled');

    // c1 and c2 must keep moving
    expect(c1.status).toBe('moving');
    expect(c2.status).toBe('moving');
  });

  // Edge Case 5: Large cluster recovery initiator election
  it('Edge Case 5: Recovery initiation with multiple waiting adopters chooses strictly maximum ID', () => {
    const waitingAdopters: Agent[] = [
      {
        id: 7,
        status: 'moving',
        label: { level: 1, certificate: 4, leaderId: 90 },
        mass: 4,
        subgroup: 0,
        rank: 3,
        step: 6,
        dir: { dx: 1, dy: 1 },
        anchor: { x: 0, y: 0 },
        idealCorner: { x: 3, y: 3 },
        destination: { x: 3, y: 3 },
        contact: true,
        epoch: 0,
        initialPos: { x: 0, y: 0 },
        currentPos: { x: 3, y: 3 },
        groupId: 'g-old',
        initialGroupId: 'g-old',
        isLeader: false,
        isOverflow: false,
        isLateAdopter: true,
        totalMoves: 6,
        lateAdoption: {
          originalLabel: { level: 0, certificate: 2, leaderId: 7 },
          adoptedLabel: { level: 1, certificate: 4, leaderId: 90 },
          predictedPhase: 'WaitAtC',
          predictedStep: 6,
          waitTimer: 0,
          recoveryInitiator: false,
        },
      },
      {
        id: 88, // Maximum ID!
        status: 'moving',
        label: { level: 1, certificate: 4, leaderId: 90 },
        mass: 4,
        subgroup: 1,
        rank: 1,
        step: 6,
        dir: { dx: 1, dy: 1 },
        anchor: { x: 0, y: 0 },
        idealCorner: { x: 3, y: 3 },
        destination: { x: 3, y: 3 },
        contact: true,
        epoch: 0,
        initialPos: { x: 0, y: 0 },
        currentPos: { x: 3, y: 3 },
        groupId: 'g-old',
        initialGroupId: 'g-old',
        isLeader: false,
        isOverflow: false,
        isLateAdopter: true,
        totalMoves: 6,
        lateAdoption: {
          originalLabel: { level: 0, certificate: 2, leaderId: 88 },
          adoptedLabel: { level: 1, certificate: 4, leaderId: 90 },
          predictedPhase: 'WaitAtC',
          predictedStep: 6,
          waitTimer: 0,
          recoveryInitiator: false,
        },
      },
      {
        id: 23,
        status: 'moving',
        label: { level: 1, certificate: 4, leaderId: 90 },
        mass: 4,
        subgroup: 2,
        rank: 2,
        step: 6,
        dir: { dx: 1, dy: 1 },
        anchor: { x: 0, y: 0 },
        idealCorner: { x: 3, y: 3 },
        destination: { x: 3, y: 3 },
        contact: true,
        epoch: 0,
        initialPos: { x: 0, y: 0 },
        currentPos: { x: 3, y: 3 },
        groupId: 'g-old',
        initialGroupId: 'g-old',
        isLeader: false,
        isOverflow: false,
        isLateAdopter: true,
        totalMoves: 6,
        lateAdoption: {
          originalLabel: { level: 0, certificate: 2, leaderId: 23 },
          adoptedLabel: { level: 1, certificate: 4, leaderId: 90 },
          predictedPhase: 'WaitAtC',
          predictedStep: 6,
          waitTimer: 0,
          recoveryInitiator: false,
        },
      },
    ];

    const res = initiateRecoveryCycle(waitingAdopters, 15, 8, 8);
    expect(res.initiatorAgent.id).toBe(88);
    expect(res.recoveryGroup.isClean).toBe(false);
    expect(res.recoveryGroup.phase).toBe('RecoveryReverse');
  });

  // Edge Case 6: Boundary Excess calculation on asymmetric coordinates
  it('Edge Case 6: Asymmetric bounds clipping and path length formula', () => {
    const anchor = { x: 5, y: 2 };
    const direction = { dx: 1 as const, dy: 1 as const };
    const gamma = 4; // C* = (5+3, 2+3) = (8, 5)
    const bounds = calculateSweepBounds(anchor, direction, gamma, 7, 7);

    // Grid width 7, height 7 -> max coord is 6
    // C* = (8, 5) -> realized C = (6, 5)
    // excessX = 8 - 6 = 2, excessY = 5 - 5 = 0
    expect(bounds.excessX).toBe(2);
    expect(bounds.excessY).toBe(0);
    expect(bounds.isClipped).toBe(true);
    // λ = 2(4-1) - 2 - 0 = 6 - 2 = 4
    expect(bounds.length).toBe(4);
  });

  // Edge Case 7: High population dense grid stress test (k = 36 on 6x6 grid)
  it('Edge Case 7: High population dense dispersion (k = 36 on 6x6 grid)', () => {
    const placements = Array.from({ length: 36 }).map((_, i) => ({
      id: 200 + i,
      pos: { x: 0, y: 0 },
    }));

    const engine = new SimulationEngine(6, 6, placements);
    const finalState = engine.runUntilDispersed(250);

    const violations = validateStateInvariants(finalState);
    expect(violations).toEqual([]);
    expect(finalState.isDispersed).toBe(true);
    expect(finalState.statistics.settledCount).toBe(36);
    expect(finalState.statistics.activeCount).toBe(0);

    // Verify all 36 agents occupy distinct coordinates
    const uniqueCoords = new Set(
      finalState.agents.map(a => `${a.currentPos.x},${a.currentPos.y}`)
    );
    expect(uniqueCoords.size).toBe(36);
  });

  // Edge Case 8: Snapshot immutability & random scrubbing test
  it('Edge Case 8: Snapshot immutability across repeated backward/forward scrubbing', () => {
    const placements = [
      { id: 1, pos: { x: 0, y: 0 } },
      { id: 2, pos: { x: 0, y: 0 } },
      { id: 3, pos: { x: 1, y: 1 } },
      { id: 4, pos: { x: 1, y: 1 } },
    ];

    const engine = new SimulationEngine(5, 5, placements);

    // Advance 15 rounds
    for (let i = 0; i < 15; i++) {
      if (engine.getCurrentState().isTerminated) break;
      engine.stepForward();
    }

    const recordedRound = engine.getCurrentRound();

    // Repeatedly jump around history
    for (let target = 0; target <= recordedRound; target++) {
      const state = engine.jumpToRound(target);
      expect(state.round).toBe(target);
      expect(validateStateInvariants(state)).toEqual([]);
    }

    // Scrub backwards one by one
    while (engine.canStepBackward()) {
      const state = engine.stepBackward();
      expect(validateStateInvariants(state)).toEqual([]);
    }
    expect(engine.getCurrentRound()).toBe(0);
  });
});
