import { Agent } from '../model/Agent';
import { Group } from '../model/Group';
import { SimulationEvent } from '../events/SimulationEvent';
import { createSimulationEvent } from '../events/eventFactory';
import { calculateSweepBounds } from '../geometry/sweepGeometry';
import { buildSubgroups } from '../geometry/pathGeneration';

export interface RecoveryInitiationResult {
  initiatorAgent: Agent;
  recoveryGroup: Group;
  event: SimulationEvent;
}

/**
 * Initiates a Recovery Reverse–Collect cycle from waiting late adopters at C.
 */
export function initiateRecoveryCycle(
  waitingAgents: Agent[],
  round: number,
  gridWidth: number,
  gridHeight: number
): RecoveryInitiationResult {
  if (waitingAgents.length === 0) {
    throw new Error('Cannot initiate recovery cycle with 0 waiting agents');
  }

  // Select largest ID among waiting adopters
  let initiator = waitingAgents[0];
  for (let i = 1; i < waitingAgents.length; i++) {
    if (waitingAgents[i].id > initiator.id) {
      initiator = waitingAgents[i];
    }
  }

  initiator.lateAdoption!.recoveryInitiator = true;

  const label = initiator.label;
  const gamma = initiator.mass;
  const anchor = initiator.anchor;
  const direction = initiator.dir;

  const bounds = calculateSweepBounds(anchor, direction, gamma, gridWidth, gridHeight);

  // Build ranking map
  const memberRanks = new Map<number, number>();
  const sorted = [...waitingAgents].sort((a, b) => b.id - a.id);
  sorted.forEach((ag, idx) => {
    memberRanks.set(ag.id, idx + 1);
    ag.rank = idx + 1;
    ag.subgroup = (idx + 1) % gamma;
  });

  const subgroups = buildSubgroups(gamma, memberRanks, bounds, gridWidth, gridHeight);

  const recoveryGroupId = `recovery-${label.level}-${label.certificate}-${label.leaderId}-${round}`;

  const recoveryGroup: Group = {
    id: recoveryGroupId,
    label: { ...label },
    mass: waitingAgents.length,
    gamma,
    anchor: { ...anchor },
    idealCorner: { ...bounds.idealCorner },
    realizedCorner: { ...bounds.realizedCorner },
    direction: { ...direction },
    epoch: initiator.epoch,
    phase: 'RecoveryReverse',
    phaseStep: 0,
    phaseLength: bounds.length,
    boundaryExcessX: bounds.excessX,
    boundaryExcessY: bounds.excessY,
    bouncesCount: 0,
    subgroups,
    activeMemberIds: waitingAgents.map(a => a.id),
    settledMemberIds: [],
    overflowMemberIds: [],
    isClean: false, // recovery cycles never promote
    isTerminated: false,
    color: '#8b5cf6', // distinctive purple for recovery
  };

  for (const ag of waitingAgents) {
    ag.groupId = recoveryGroupId;
    ag.status = 'moving';
    ag.step = 0;
  }

  const event = createSimulationEvent({
    round,
    type: 'RecoveryStarted',
    phase: 'RecoveryReverse',
    agentIds: waitingAgents.map(a => a.id),
    groupId: recoveryGroupId,
    label,
    position: initiator.currentPos,
    reason: `Wait timeout elapsed at C without ordinary Collect arriving. Largest-ID adopter ${initiator.id} triggered recovery.`,
    summary: `Agent ${initiator.id} initiated Recovery Reverse–Collect for ${waitingAgents.length} late adopters at C.`,
    explanation: {
      whatHappened: `Adopter wait timer expired at corner C without an ordinary Collect arriving from the original sweep.`,
      ruleApplied: `Section 3.6 Case C: Waiting at C & Unique Recovery Reverse–Collect initiation.`,
      whyActionSelected: `The original sweep had no moving overflow to collect these late adopters. Largest ID initiates exactly one recovery.`,
      stateChanged: `Recovery group created; agents re-ranked and assigned to subgroups to execute Reverse from C to A.`,
      whatHappensNext: `Agents retrace paths to A to gather lower/same-labeled agents, then execute Collect to C.`,
    },
  });

  return {
    initiatorAgent: initiator,
    recoveryGroup,
    event,
  };
}
