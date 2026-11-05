import { Agent } from '../model/Agent';
import { Group } from '../model/Group';
import { AlgorithmPhase } from '../model/Agent';
import { compareLabels, cloneLabel } from '../model/Label';
import { SimulationEvent } from '../events/SimulationEvent';
import { createSimulationEvent } from '../events/eventFactory';
import { Coord } from '../model/Grid';

export interface AbsorptionResult {
  absorbedMovingAgents: Agent[];
  unsettledAgents: Agent[];
  events: SimulationEvent[];
}

/**
 * Handle absorption between co-located moving agents and settled markers.
 */
export function handleCoLocatedAbsorption(
  pos: Coord,
  phase: AlgorithmPhase,
  coLocatedMoving: Agent[],
  settledMarker: Agent | undefined,
  round: number
): AbsorptionResult {
  const events: SimulationEvent[] = [];
  const absorbedMovingAgents: Agent[] = [];
  const unsettledAgents: Agent[] = [];

  // If there are moving agents
  if (coLocatedMoving.length > 1) {
    // Determine winner among moving agents
    let bestAgent = coLocatedMoving[0];
    for (let i = 1; i < coLocatedMoving.length; i++) {
      if (compareLabels(coLocatedMoving[i].label, bestAgent.label) > 0) {
        bestAgent = coLocatedMoving[i];
      }
    }

    const winnerLabel = bestAgent.label;
    const winnerSubgroup = bestAgent.subgroup;
    const winnerGroupId = bestAgent.groupId;

    for (const agent of coLocatedMoving) {
      if (compareLabels(agent.label, winnerLabel) < 0) {
        const oldLabel = cloneLabel(agent.label);
        agent.label = cloneLabel(winnerLabel);
        agent.groupId = winnerGroupId;
        agent.subgroup = winnerSubgroup;
        agent.contact = true;
        agent.isLateAdopter = true;
        absorbedMovingAgents.push(agent);

        events.push(
          createSimulationEvent({
            round,
            type: 'AgentAbsorbed',
            phase,
            agentIds: [agent.id, bestAgent.id],
            label: winnerLabel,
            position: pos,
            previousState: `Label ${oldLabel.level}.${oldLabel.certificate}`,
            newState: `Label ${winnerLabel.level}.${winnerLabel.certificate}`,
            reason: `Moving agent ${agent.id} met higher-labeled moving agent ${bestAgent.id} during ${phase}.`,
            summary: `Agent ${agent.id} adopted winning label and joined subgroup ${winnerSubgroup} at step ${bestAgent.step}.`,
            explanation: {
              whatHappened: `Moving agent ${agent.id} co-located with higher-labeled moving agent ${bestAgent.id}.`,
              ruleApplied: `Table 2 Moving Encounter (${phase}): Lower-label moving agent joins winner.`,
              whyActionSelected: `The higher label wins lexicographically. Winning subgroup partition is not rebuilt mid-cycle.`,
              stateChanged: `Agent ${agent.id} adopted winning label, updated group ID and subgroup, and marked its path as contacted.`,
              whatHappensNext: `Agent ${agent.id} travels together with the winner subgroup head toward the phase destination.`,
            },
          })
        );
      }
    }
  }

  // Handle settled marker encounter
  if (settledMarker && coLocatedMoving.length > 0) {
    const leaderMoving = coLocatedMoving.reduce((best, cur) =>
      compareLabels(cur.label, best.label) > 0 ? cur : best
    );

    const cmp = compareLabels(leaderMoving.label, settledMarker.label);

    if (cmp > 0) {
      // Moving agent has higher label than settled marker
      if (phase === 'Collect' || phase === 'RecoveryCollect') {
        // Collect recruits settled agents! Un-settle and join collector!
        settledMarker.status = 'moving';
        settledMarker.label = cloneLabel(leaderMoving.label);
        settledMarker.groupId = leaderMoving.groupId;
        settledMarker.subgroup = leaderMoving.subgroup;
        settledMarker.step = leaderMoving.step;
        settledMarker.anchor = { ...leaderMoving.anchor };
        settledMarker.destination = { ...leaderMoving.destination };
        settledMarker.dir = { ...leaderMoving.dir };
        settledMarker.settleMeta = undefined;
        unsettledAgents.push(settledMarker);

        events.push(
          createSimulationEvent({
            round,
            type: 'AgentUnsettled',
            phase,
            agentIds: [settledMarker.id, leaderMoving.id],
            label: leaderMoving.label,
            position: pos,
            reason: `Collecting subgroup recruited settled agent ${settledMarker.id}.`,
            summary: `Agent ${settledMarker.id} un-settled and joined collecting subgroup ${leaderMoving.subgroup} toward C.`,
            explanation: {
              whatHappened: `Collect phase reached eligible settled agent ${settledMarker.id} of equal or lower label.`,
              ruleApplied: `Section 3.5 Collect Recruitment: Settled agents un-settle and join collecting subgroup.`,
              whyActionSelected: `Collect is the unique phase designed to enlarge group population by gathering earlier settled markers.`,
              stateChanged: `Agent ${settledMarker.id} status changed from settled to moving. Sweep metadata updated.`,
              whatHappensNext: `Recruited agent travels with the group to destination C for active mass recount.`,
            },
          })
        );
      } else {
        // Spread or Reverse: overwrite marker label in place; remains settled
        settledMarker.label = cloneLabel(leaderMoving.label);
        if (settledMarker.settleMeta) {
          settledMarker.settleMeta.storedLabel = cloneLabel(leaderMoving.label);
        }
      }
    }
  }

  return {
    absorbedMovingAgents,
    unsettledAgents,
    events,
  };
}
