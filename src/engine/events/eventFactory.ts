import { SimulationEvent, SimulationEventType, ExplanationDetails } from './SimulationEvent';
import { Coord } from '../model/Grid';
import { Label, formatLabel } from '../model/Label';
import { AlgorithmPhase } from '../model/Agent';

let eventCounter = 0;

export function resetEventCounter(): void {
  eventCounter = 0;
}

export function createSimulationEvent(params: {
  round: number;
  type: SimulationEventType;
  phase: AlgorithmPhase;
  agentIds: number[];
  groupId?: string;
  label?: Label;
  position?: Coord;
  previousState?: string;
  newState?: string;
  reason: string;
  summary: string;
  explanation: ExplanationDetails;
}): SimulationEvent {
  eventCounter++;
  return {
    id: `ev-${params.round}-${eventCounter}`,
    ...params,
  };
}

// Preset helper factories for standard SRC algorithmic milestones
export function createSettlementEvent(
  round: number,
  agentId: number,
  label: Label,
  pos: Coord,
  subgroup: number
): SimulationEvent {
  return createSimulationEvent({
    round,
    type: 'AgentSettled',
    phase: 'Spread',
    agentIds: [agentId],
    label,
    position: pos,
    previousState: 'claiming',
    newState: 'settled',
    reason: `Agent ${agentId} won the 1-round claim handshake on covered column for subgroup ${subgroup}.`,
    summary: `Agent ${agentId} permanently settled at (${pos.x}, ${pos.y}) as a marker for ${formatLabel(label)}.`,
    explanation: {
      whatHappened: `Agent ${agentId} claimed free node (${pos.x}, ${pos.y}) covered by its subgroup ${subgroup}.`,
      ruleApplied: `Section 3.3 Spread Settlement Rule & 1-round claim handshake.`,
      whyActionSelected: `The node is on subgroup ${subgroup}'s covered column, has no higher-priority claimant, and Agent ${agentId} is the lowest-identifier candidate.`,
      stateChanged: `Agent ${agentId} transitioned from claiming to passive-settled. It stores sweep metadata to serve as a marker.`,
      whatHappensNext: `The remaining moving agents of subgroup ${subgroup} advance to the next node on the column.`,
    },
  });
}

export function createLateAdoptionEvent(
  round: number,
  agentId: number,
  oldLabel: Label,
  newLabel: Label,
  pos: Coord,
  predictedPhase: AlgorithmPhase
): SimulationEvent {
  return createSimulationEvent({
    round,
    type: 'LateAdoptionStarted',
    phase: predictedPhase,
    agentIds: [agentId],
    label: newLabel,
    position: pos,
    previousState: formatLabel(oldLabel),
    newState: formatLabel(newLabel),
    reason: `Encountered higher-labeled settled marker ${formatLabel(newLabel)} at (${pos.x}, ${pos.y}).`,
    summary: `Agent ${agentId} adopted higher label ${formatLabel(newLabel)} and predicted phase: ${predictedPhase}.`,
    explanation: {
      whatHappened: `Moving agent ${agentId} encountered a settled marker carrying higher label ${formatLabel(newLabel)}.`,
      ruleApplied: `Section 3.6 Higher-Label Interaction & Late Adoption from Settled Marker.`,
      whyActionSelected: `The settled marker carries higher lexicographical priority. By Lemma 4.4, lower labels cannot overtake higher labels.`,
      stateChanged: `Agent ${agentId} adopted the higher label, marked its old path as contacted, and computed the head position using age = r - r_set.`,
      whatHappensNext: `Agent ${agentId} joins the predicted phase or heads to destination C to await or trigger Recovery Reverse–Collect.`,
    },
  });
}

export function createLevelUpEvent(
  round: number,
  groupId: string,
  oldLabel: Label,
  newLabel: Label,
  mAfter: number
): SimulationEvent {
  return createSimulationEvent({
    round,
    type: 'LevelUp',
    phase: 'Spread',
    agentIds: [],
    groupId,
    label: newLabel,
    previousState: `Level ${oldLabel.level}, cert ${oldLabel.certificate}`,
    newState: `Level ${newLabel.level}, cert ${newLabel.certificate}`,
    reason: `Clean Collect gathered m_after = ${mAfter} agents, satisfying doubling condition m_after >= 2c (${mAfter} >= 2 * ${oldLabel.certificate}).`,
    summary: `Group leveled up to Level ${newLabel.level} with certified size c = ${newLabel.certificate}!`,
    explanation: {
      whatHappened: `At destination C after a clean Collect, the recomputed active population doubled the old certificate.`,
      ruleApplied: `Section 3.8 End-of-Cycle Decision & Doubling Invariant (Lemma 4.3).`,
      whyActionSelected: `The subgroup path was clean (no higher label contacted) and active mass m_after >= 2c.`,
      stateChanged: `Level incremented: ℓ = ${newLabel.level}, certificate updated: c = ${newLabel.certificate}. Sweep parameter will increase in the next cycle.`,
      whatHappensNext: `Both direction axes are flipped: (dx, dy) <- (-dx, -dy), anchor set to C, and a larger Spread phase begins.`,
    },
  });
}
