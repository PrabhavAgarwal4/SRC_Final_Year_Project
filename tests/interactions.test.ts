import { describe, it, expect } from 'vitest';
import { compareLabels, Label } from '../src/engine/model/Label';
import { resolveNodeSettlement } from '../src/engine/interactions/settlement';
import { handleCoLocatedAbsorption } from '../src/engine/interactions/absorption';
import { predictHigherSubgroupState } from '../src/engine/interactions/lateAdoption';
import { initiateRecoveryCycle } from '../src/engine/interactions/recovery';
import { Agent } from '../src/engine/model/Agent';
import { validateStateInvariants } from '../src/engine/validation/invariants';
import { SimulationState } from '../src/engine/model/SimulationState';

describe('SRC Interaction Engine & Priority Rules', () => {
  it('compares labels strictly lexicographically (level -> certificate -> leaderId)', () => {
    const l1: Label = { level: 0, certificate: 4, leaderId: 10 };
    const l2: Label = { level: 1, certificate: 2, leaderId: 1 };
    expect(compareLabels(l2, l1)).toBeGreaterThan(0); // higher level wins

    const l3: Label = { level: 1, certificate: 8, leaderId: 2 };
    expect(compareLabels(l3, l2)).toBeGreaterThan(0); // same level, higher cert wins

    const l4: Label = { level: 1, certificate: 8, leaderId: 99 };
    expect(compareLabels(l4, l3)).toBeGreaterThan(0); // same level & cert, higher ID wins
  });

  it('settles lowest ID candidate on free covered node during handshake', () => {
    const candidate1: Agent = {
      id: 25,
      status: 'claiming',
      label: { level: 0, certificate: 4, leaderId: 25 },
      mass: 4,
      subgroup: 1,
      rank: 1,
      step: 2,
      dir: { dx: 1, dy: 1 },
      anchor: { x: 0, y: 0 },
      idealCorner: { x: 3, y: 3 },
      destination: { x: 3, y: 3 },
      contact: false,
      epoch: 0,
      initialPos: { x: 0, y: 0 },
      currentPos: { x: 1, y: 1 },
      groupId: 'grp-1',
      initialGroupId: 'grp-1',
      isLeader: true,
      isOverflow: false,
      isLateAdopter: false,
      totalMoves: 2,
    };

    const candidate2: Agent = {
      ...candidate1,
      id: 12,
      rank: 2,
    };

    const res = resolveNodeSettlement(
      { x: 1, y: 1 },
      [candidate1, candidate2],
      undefined,
      5
    );

    // Lowest ID candidate settles
    expect(res.settledAgent).toBeDefined();
    expect(res.settledAgent!.id).toBe(12);
    expect(candidate2.status).toBe('settled');
    expect(candidate1.status).toBe('moving'); // other candidate continues
  });

  it('absorbs lower-labeled moving agents into higher-labeled group during moving encounters', () => {
    const highAgent: Agent = {
      id: 50,
      status: 'moving',
      label: { level: 1, certificate: 4, leaderId: 50 },
      mass: 4,
      subgroup: 2,
      rank: 1,
      step: 3,
      dir: { dx: 1, dy: 1 },
      anchor: { x: 0, y: 0 },
      idealCorner: { x: 3, y: 3 },
      destination: { x: 3, y: 3 },
      contact: false,
      epoch: 0,
      initialPos: { x: 0, y: 0 },
      currentPos: { x: 2, y: 2 },
      groupId: 'grp-high',
      initialGroupId: 'grp-high',
      isLeader: true,
      isOverflow: false,
      isLateAdopter: false,
      totalMoves: 3,
    };

    const lowAgent: Agent = {
      id: 10,
      status: 'moving',
      label: { level: 0, certificate: 2, leaderId: 10 },
      mass: 4,
      subgroup: 1,
      rank: 1,
      step: 2,
      dir: { dx: 1, dy: 1 },
      anchor: { x: 0, y: 0 },
      idealCorner: { x: 3, y: 3 },
      destination: { x: 3, y: 3 },
      contact: false,
      epoch: 0,
      initialPos: { x: 0, y: 0 },
      currentPos: { x: 2, y: 2 },
      groupId: 'grp-low',
      initialGroupId: 'grp-low',
      isLeader: true,
      isOverflow: false,
      isLateAdopter: false,
      totalMoves: 2,
    };

    const res = handleCoLocatedAbsorption(
      { x: 2, y: 2 },
      'Spread',
      [highAgent, lowAgent],
      undefined,
      6
    );

    expect(res.absorbedMovingAgents.length).toBe(1);
    expect(res.absorbedMovingAgents[0].id).toBe(10);
    expect(lowAgent.label.level).toBe(1); // Adopted high label
    expect(lowAgent.groupId).toBe('grp-high');
    expect(lowAgent.contact).toBe(true);
  });

  it('predicts higher subgroup phase accurately based on marker age', () => {
    // Marker placed at round 2, step 1, gamma = 4 -> lambda = 2*(4-1) = 6
    const p1 = predictHigherSubgroupState(4, 2, 1, 4, 0, 0); // age 2, total step 3 <= 6
    expect(p1.predictedPhase).toBe('Spread');

    const p2 = predictHigherSubgroupState(10, 2, 1, 4, 0, 0); // age 8, step 9 -> 6 < step <= 12
    expect(p2.predictedPhase).toBe('Reverse');

    const p3 = predictHigherSubgroupState(16, 2, 1, 4, 0, 0); // age 14, step 15 -> 12 < step <= 18
    expect(p3.predictedPhase).toBe('Collect');

    const p4 = predictHigherSubgroupState(30, 2, 1, 4, 0, 0); // age 28, step 29 > 18
    expect(p4.predictedPhase).toBe('WaitAtC');
  });

  it('selects largest ID waiting adopter to initiate recovery cycle', () => {
    const adopter1: Agent = {
      id: 15,
      status: 'moving',
      label: { level: 1, certificate: 4, leaderId: 99 },
      mass: 4,
      subgroup: 0,
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
      groupId: 'grp-old',
      initialGroupId: 'grp-old',
      isLeader: false,
      isOverflow: false,
      isLateAdopter: true,
      totalMoves: 6,
      lateAdoption: {
        originalLabel: { level: 0, certificate: 2, leaderId: 15 },
        adoptedLabel: { level: 1, certificate: 4, leaderId: 99 },
        predictedPhase: 'WaitAtC',
        predictedStep: 6,
        waitTimer: 0,
        recoveryInitiator: false,
      },
    };

    const adopter2: Agent = {
      ...adopter1,
      id: 42, // largest ID
      rank: 1,
    };

    const res = initiateRecoveryCycle([adopter1, adopter2], 25, 10, 10);
    expect(res.initiatorAgent.id).toBe(42);
    expect(res.recoveryGroup.phase).toBe('RecoveryReverse');
    expect(res.recoveryGroup.isClean).toBe(false); // Recovery never promotes by itself
  });

  it('detects invariant violations such as duplicate IDs or multiple settled agents on a node', () => {
    const dummyState: SimulationState = {
      round: 3,
      gridWidth: 5,
      gridHeight: 5,
      agents: [
        {
          id: 1,
          status: 'settled',
          label: { level: 0, certificate: 2, leaderId: 1 },
          mass: 2,
          subgroup: 0,
          rank: 1,
          step: 1,
          dir: { dx: 1, dy: 1 },
          anchor: { x: 0, y: 0 },
          idealCorner: { x: 2, y: 2 },
          destination: { x: 2, y: 2 },
          contact: false,
          epoch: 0,
          initialPos: { x: 0, y: 0 },
          currentPos: { x: 1, y: 1 },
          groupId: 'g1',
          initialGroupId: 'g1',
          isLeader: true,
          isOverflow: false,
          isLateAdopter: false,
          totalMoves: 1,
        },
        {
          id: 2,
          status: 'settled',
          label: { level: 0, certificate: 2, leaderId: 2 },
          mass: 2,
          subgroup: 0,
          rank: 1,
          step: 1,
          dir: { dx: 1, dy: 1 },
          anchor: { x: 0, y: 0 },
          idealCorner: { x: 2, y: 2 },
          destination: { x: 2, y: 2 },
          contact: false,
          epoch: 0,
          initialPos: { x: 0, y: 0 },
          currentPos: { x: 1, y: 1 }, // SAME NODE! Violation of Lemma 4.9
          groupId: 'g2',
          initialGroupId: 'g2',
          isLeader: true,
          isOverflow: false,
          isLateAdopter: false,
          totalMoves: 1,
        },
      ],
      groups: [],
      events: [],
      isTerminated: false,
      isDispersed: false,
      statistics: {
        totalAgents: 2,
        gridNodes: 25,
        settledCount: 2,
        activeCount: 0,
        groupsCount: 2,
        completedCycles: 0,
        highestLevel: 0,
        bouncesCount: 0,
        lateAdoptionsCount: 0,
        recoveryCyclesCount: 0,
      },
    };

    const violations = validateStateInvariants(dummyState);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].code).toBe('MULTIPLE_SETTLED_AGENTS_ON_NODE');
  });
});
