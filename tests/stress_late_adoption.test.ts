import { describe, it, expect } from 'vitest';
import { SimulationEngine } from '../src/engine/simulation/simulationEngine';
import { validateStateInvariants } from '../src/engine/validation/invariants';
import { predictHigherSubgroupState, applyLateAdoption } from '../src/engine/interactions/lateAdoption';
import { initiateRecoveryCycle } from '../src/engine/interactions/recovery';
import { Agent } from '../src/engine/model/Agent';
import { compareLabels } from '../src/engine/model/Label';

describe('Comprehensive Late Adoption Stress Testing', () => {
  // Test 1: Age computation across all phase boundaries
  it('Late Adoption 1: Precise phase prediction across Spread, Reverse, Collect, and WaitAtC', () => {
    // gamma = 4 -> lambda = 2 * (4 - 1) = 6
    const gamma = 4;
    const rSet = 10;
    const stepWhenLeft = 2; // head left marker at step 2 of Spread

    // Round 10: age = 0, step = 2 -> Spread (step 2)
    const p0 = predictHigherSubgroupState(10, rSet, stepWhenLeft, gamma, 0, 0);
    expect(p0.predictedPhase).toBe('Spread');
    expect(p0.predictedStep).toBe(2);

    // Round 14: age = 4, step = 6 -> Spread at corner C (step 6)
    const p1 = predictHigherSubgroupState(14, rSet, stepWhenLeft, gamma, 0, 0);
    expect(p1.predictedPhase).toBe('Spread');
    expect(p1.predictedStep).toBe(6);

    // Round 15: age = 5, step = 7 -> Reverse (step 1 of Reverse)
    const p2 = predictHigherSubgroupState(15, rSet, stepWhenLeft, gamma, 0, 0);
    expect(p2.predictedPhase).toBe('Reverse');
    expect(p2.predictedStep).toBe(1);

    // Round 20: age = 10, step = 12 -> Reverse at anchor A (step 6 of Reverse)
    const p3 = predictHigherSubgroupState(20, rSet, stepWhenLeft, gamma, 0, 0);
    expect(p3.predictedPhase).toBe('Reverse');
    expect(p3.predictedStep).toBe(6);

    // Round 21: age = 11, step = 13 -> Collect (step 1 of Collect)
    const p4 = predictHigherSubgroupState(21, rSet, stepWhenLeft, gamma, 0, 0);
    expect(p4.predictedPhase).toBe('Collect');
    expect(p4.predictedStep).toBe(1);

    // Round 26: age = 16, step = 18 -> Collect at C (step 6 of Collect)
    const p5 = predictHigherSubgroupState(26, rSet, stepWhenLeft, gamma, 0, 0);
    expect(p5.predictedPhase).toBe('Collect');
    expect(p5.predictedStep).toBe(6);

    // Round 27: age = 17, step = 19 -> WaitAtC (missed traffic)
    const p6 = predictHigherSubgroupState(27, rSet, stepWhenLeft, gamma, 0, 0);
    expect(p6.predictedPhase).toBe('WaitAtC');

    // Round 100: age = 90 -> WaitAtC
    const p7 = predictHigherSubgroupState(100, rSet, stepWhenLeft, gamma, 0, 0);
    expect(p7.predictedPhase).toBe('WaitAtC');
  });

  // Test 2: Late Adoption from Settled Marker overrides lower label and marks contacted
  it('Late Adoption 2: applyLateAdoption overwrites agent state correctly and marks path contacted', () => {
    const lowerAgent: Agent = {
      id: 5,
      status: 'moving',
      label: { level: 0, certificate: 2, leaderId: 5 },
      mass: 2,
      subgroup: 0,
      rank: 1,
      step: 1,
      dir: { dx: 1, dy: 1 },
      anchor: { x: 1, y: 0 },
      idealCorner: { x: 2, y: 1 },
      destination: { x: 2, y: 1 },
      contact: false,
      epoch: 0,
      initialPos: { x: 1, y: 0 },
      currentPos: { x: 1, y: 1 },
      groupId: 'g-lower',
      initialGroupId: 'g-lower',
      isLeader: true,
      isOverflow: false,
      isLateAdopter: false,
      totalMoves: 1,
    };

    const higherSettledMarker: Agent = {
      id: 99,
      status: 'settled',
      label: { level: 2, certificate: 8, leaderId: 99 },
      mass: 8,
      subgroup: 1,
      rank: 1,
      step: 3,
      dir: { dx: 1, dy: 1 },
      anchor: { x: 0, y: 0 },
      idealCorner: { x: 5, y: 5 },
      destination: { x: 5, y: 5 },
      contact: false,
      epoch: 1,
      initialPos: { x: 0, y: 0 },
      currentPos: { x: 1, y: 1 },
      groupId: 'g-higher',
      initialGroupId: 'g-higher',
      isLeader: true,
      isOverflow: false,
      isLateAdopter: false,
      totalMoves: 3,
      settleMeta: {
        round: 2,
        stepWhenHeadLeft: 2,
        storedLabel: { level: 2, certificate: 8, leaderId: 99 },
        storedGamma: 6,
        storedAnchor: { x: 0, y: 0 },
        storedIdealCorner: { x: 5, y: 5 },
        storedDir: { dx: 1, dy: 1 },
        storedSubgroup: 1,
        storedEpoch: 1,
      },
    };

    const ev = applyLateAdoption(lowerAgent, higherSettledMarker, 4);

    expect(ev).not.toBeNull();
    expect(ev!.type).toBe('LateAdoptionStarted');
    expect(lowerAgent.label).toEqual({ level: 2, certificate: 8, leaderId: 99 });
    expect(lowerAgent.contact).toBe(true); // Losing path marked contacted
    expect(lowerAgent.isLateAdopter).toBe(true);
    expect(lowerAgent.anchor).toEqual({ x: 0, y: 0 });
    expect(lowerAgent.subgroup).toBe(1);
    expect(lowerAgent.lateAdoption).toBeDefined();
    expect(lowerAgent.lateAdoption!.originalLabel).toEqual({ level: 0, certificate: 2, leaderId: 5 });
    expect(lowerAgent.lateAdoption!.waitTimer).toBe(2 * 6); // 2 * gamma
  });

  // Test 3: Higher agent does NOT adopt lower settled marker
  it('Late Adoption 3: Higher agent ignores lower settled marker', () => {
    const higherAgent: Agent = {
      id: 90,
      status: 'moving',
      label: { level: 3, certificate: 16, leaderId: 90 },
      mass: 8,
      subgroup: 0,
      rank: 1,
      step: 1,
      dir: { dx: 1, dy: 1 },
      anchor: { x: 0, y: 0 },
      idealCorner: { x: 5, y: 5 },
      destination: { x: 5, y: 5 },
      contact: false,
      epoch: 0,
      initialPos: { x: 0, y: 0 },
      currentPos: { x: 2, y: 2 },
      groupId: 'g-high',
      initialGroupId: 'g-high',
      isLeader: true,
      isOverflow: false,
      isLateAdopter: false,
      totalMoves: 1,
    };

    const lowerMarker: Agent = {
      id: 10,
      status: 'settled',
      label: { level: 0, certificate: 2, leaderId: 10 },
      mass: 2,
      subgroup: 0,
      rank: 1,
      step: 1,
      dir: { dx: 1, dy: 1 },
      anchor: { x: 2, y: 0 },
      idealCorner: { x: 3, y: 1 },
      destination: { x: 3, y: 1 },
      contact: false,
      epoch: 0,
      initialPos: { x: 2, y: 0 },
      currentPos: { x: 2, y: 2 },
      groupId: 'g-low',
      initialGroupId: 'g-low',
      isLeader: true,
      isOverflow: false,
      isLateAdopter: false,
      totalMoves: 1,
      settleMeta: {
        round: 1,
        stepWhenHeadLeft: 1,
        storedLabel: { level: 0, certificate: 2, leaderId: 10 },
        storedGamma: 4,
        storedAnchor: { x: 2, y: 0 },
        storedIdealCorner: { x: 3, y: 1 },
        storedDir: { dx: 1, dy: 1 },
        storedSubgroup: 0,
        storedEpoch: 0,
      },
    };

    const ev = applyLateAdoption(higherAgent, lowerMarker, 5);
    expect(ev).toBeNull(); // No adoption!
    expect(higherAgent.label.level).toBe(3);
    expect(higherAgent.contact).toBe(false);
  });

  // Test 4: Recovery cycle initiation with 10 waiting adopters chooses strictly maximum ID
  it('Late Adoption 4: Large pool of waiting adopters deterministically elects maximum ID', () => {
    const ids = [14, 88, 3, 105, 42, 79, 2, 91, 104, 66];
    const waitingAgents: Agent[] = ids.map(id => ({
      id,
      status: 'moving',
      label: { level: 1, certificate: 6, leaderId: 200 },
      mass: 6,
      subgroup: id % 6,
      rank: 1,
      step: 10,
      dir: { dx: 1 as const, dy: 1 as const },
      anchor: { x: 0, y: 0 },
      idealCorner: { x: 5, y: 5 },
      destination: { x: 5, y: 5 },
      contact: true,
      epoch: 0,
      initialPos: { x: 0, y: 0 },
      currentPos: { x: 5, y: 5 },
      groupId: 'g-old',
      initialGroupId: 'g-old',
      isLeader: false,
      isOverflow: false,
      isLateAdopter: true,
      totalMoves: 10,
      lateAdoption: {
        originalLabel: { level: 0, certificate: 2, leaderId: id },
        adoptedLabel: { level: 1, certificate: 6, leaderId: 200 },
        predictedPhase: 'WaitAtC',
        predictedStep: 10,
        waitTimer: 0,
        recoveryInitiator: false,
      },
    }));

    const res = initiateRecoveryCycle(waitingAgents, 20, 8, 8);
    expect(res.initiatorAgent.id).toBe(105); // max ID
    expect(res.initiatorAgent.lateAdoption!.recoveryInitiator).toBe(true);
    expect(res.recoveryGroup.mass).toBe(10);
    expect(res.recoveryGroup.isClean).toBe(false); // Can never promote!
    expect(res.recoveryGroup.phase).toBe('RecoveryReverse');
  });

  // Test 5: End-to-end simulation verifying late adoption encounter between groups
  it('Late Adoption 5: End-to-end simulation where lower group encounters higher settled marker', () => {
    const placements = [
      { id: 91, pos: { x: 0, y: 0 } },
      { id: 92, pos: { x: 0, y: 0 } },
      { id: 93, pos: { x: 0, y: 0 } },
      { id: 94, pos: { x: 0, y: 0 } },
      { id: 10, pos: { x: 1, y: 2 } },
      { id: 11, pos: { x: 1, y: 2 } },
    ];

    const engine = new SimulationEngine(8, 8, placements);
    const finalState = engine.runUntilDispersed(120);

    const violations = validateStateInvariants(finalState);
    expect(violations).toEqual([]);
    expect(finalState.isDispersed).toBe(true);
    expect(finalState.statistics.settledCount).toBe(6);

    // Invariant: all 6 agents occupy distinct nodes
    const occupied = new Set(finalState.agents.map(a => `${a.currentPos.x},${a.currentPos.y}`));
    expect(occupied.size).toBe(6);
  });

  // Test 6: Full simulation of Recovery cycle execution and dispersion
  it('Late Adoption 6: End-to-end recovery cycle executes and preserves non-promotion guarantee', () => {
    const placements = [
      { id: 95, pos: { x: 0, y: 0 } },
      { id: 96, pos: { x: 0, y: 0 } },
      { id: 18, pos: { x: 2, y: 0 } },
      { id: 19, pos: { x: 2, y: 0 } },
    ];

    const engine = new SimulationEngine(8, 8, placements);
    const finalState = engine.runUntilDispersed(150);

    expect(validateStateInvariants(finalState)).toEqual([]);
    expect(finalState.isDispersed).toBe(true);
    expect(finalState.statistics.settledCount).toBe(4);

    // Invariant: no agent ever settled on the same node
    const occupied = new Set(finalState.agents.map(a => `${a.currentPos.x},${a.currentPos.y}`));
    expect(occupied.size).toBe(4);
  });
});
