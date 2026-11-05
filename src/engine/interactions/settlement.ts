import { Agent, SettleMetadata } from '../model/Agent';
import { Group } from '../model/Group';
import { Coord, areCoordsEqual } from '../model/Grid';
import { compareLabels, cloneLabel } from '../model/Label';
import { SimulationEvent } from '../events/SimulationEvent';
import { createSettlementEvent, createSimulationEvent } from '../events/eventFactory';

export interface SettlementResolutionResult {
  settledAgent?: Agent;
  overwrittenMarkers: Agent[];
  events: SimulationEvent[];
}

/**
 * Checks if a node at pos is covered by subgroup s of the group.
 * In a clean sweep, subgroup s covers column x = ax + s * dx.
 */
export function isNodeCoveredBySubgroup(
  pos: Coord,
  subgroupIndex: number,
  group: Group
): boolean {
  const subgroup = group.subgroups.find(sg => sg.index === subgroupIndex);
  if (!subgroup) return false;
  return pos.x === subgroup.coveredX;
}

/**
 * Resolves claims on a single node during Spread handshake.
 */
export function resolveNodeSettlement(
  nodePos: Coord,
  candidates: Agent[], // agents in 'claiming' status on this node
  existingSettledMarker: Agent | undefined,
  round: number
): SettlementResolutionResult {
  const events: SimulationEvent[] = [];
  const overwrittenMarkers: Agent[] = [];

  if (candidates.length === 0) {
    return { overwrittenMarkers, events };
  }

  // 1. If there's an existing settled marker
  if (existingSettledMarker) {
    const markerLabel = existingSettledMarker.label;

    // Check relationship between candidates and existing marker
    // Find candidate with max label
    let bestCandidate = candidates[0];
    for (let i = 1; i < candidates.length; i++) {
      if (compareLabels(candidates[i].label, bestCandidate.label) > 0) {
        bestCandidate = candidates[i];
      }
    }

    const cmp = compareLabels(bestCandidate.label, markerLabel);

    if (cmp > 0) {
      // Lower-labeled settled marker is overwritten by winning candidate's group
      existingSettledMarker.label = cloneLabel(bestCandidate.label);
      if (existingSettledMarker.settleMeta) {
        existingSettledMarker.settleMeta.storedLabel = cloneLabel(bestCandidate.label);
        existingSettledMarker.settleMeta.storedGamma = bestCandidate.mass;
        existingSettledMarker.settleMeta.storedAnchor = { ...bestCandidate.anchor };
        existingSettledMarker.settleMeta.storedIdealCorner = { ...bestCandidate.idealCorner };
        existingSettledMarker.settleMeta.storedDir = { ...bestCandidate.dir };
        existingSettledMarker.settleMeta.storedSubgroup = bestCandidate.subgroup;
        existingSettledMarker.settleMeta.storedEpoch = bestCandidate.epoch;
        existingSettledMarker.settleMeta.round = round;
      }
      overwrittenMarkers.push(existingSettledMarker);

      // Visiting candidate does NOT settle; it walks on!
      for (const c of candidates) {
        c.status = 'moving';
      }

      events.push(
        createSimulationEvent({
          round,
          type: 'MarkerOverwritten',
          phase: 'Spread',
          agentIds: [existingSettledMarker.id, bestCandidate.id],
          label: bestCandidate.label,
          position: nodePos,
          reason: `Higher-labeled candidate ${bestCandidate.id} overwrote settled marker ${existingSettledMarker.id}.`,
          summary: `Marker at (${nodePos.x}, ${nodePos.y}) overwritten with ${bestCandidate.label.level}. Marker stays settled; visitors walk on.`,
          explanation: {
            whatHappened: `Visiting candidate ${bestCandidate.id} encountered lower-labeled settled marker ${existingSettledMarker.id}.`,
            ruleApplied: `Section 3.3 Spread Settlement on Lower-Label Marker.`,
            whyActionSelected: `Visiting label wins lexicographically. Lower settled marker is claimed and updated, but remains settled until Collect.`,
            stateChanged: `Settled marker's label and stored sweep metadata updated to match winning visitor.`,
            whatHappensNext: `Visiting subgroup continues its sweep without leaving a new settled agent.`,
          },
        })
      );

      return { overwrittenMarkers, events };
    } else if (cmp === 0) {
      // Equal label: node is blocked; candidates walk on
      for (const c of candidates) {
        c.status = 'moving';
      }
      return { overwrittenMarkers, events };
    } else {
      // Settled marker has higher label! Candidates adopt higher label
      for (const c of candidates) {
        c.status = 'moving';
        c.label = cloneLabel(markerLabel);
        c.contact = true;
      }
      return { overwrittenMarkers, events };
    }
  }

  // 2. Free node: find maximum label among candidates
  let maxCandidate = candidates[0];
  for (let i = 1; i < candidates.length; i++) {
    if (compareLabels(candidates[i].label, maxCandidate.label) > 0) {
      maxCandidate = candidates[i];
    }
  }

  // Filter candidates carrying max label
  const winnerCandidates = candidates.filter(
    c => compareLabels(c.label, maxCandidate.label) === 0
  );

  // Lowest ID among winning candidates settles!
  winnerCandidates.sort((a, b) => a.id - b.id);
  const settledCandidate = winnerCandidates[0];

  settledCandidate.status = 'settled';
  const meta: SettleMetadata = {
    round,
    stepWhenHeadLeft: settledCandidate.step,
    storedLabel: cloneLabel(settledCandidate.label),
    storedGamma: settledCandidate.mass,
    storedAnchor: { ...settledCandidate.anchor },
    storedIdealCorner: { ...settledCandidate.idealCorner },
    storedDir: { ...settledCandidate.dir },
    storedSubgroup: settledCandidate.subgroup,
    storedEpoch: settledCandidate.epoch,
  };
  settledCandidate.settleMeta = meta;

  // Other candidates keep moving
  for (const c of candidates) {
    if (c.id !== settledCandidate.id) {
      c.status = 'moving';
    }
  }

  events.push(
    createSettlementEvent(
      round,
      settledCandidate.id,
      settledCandidate.label,
      nodePos,
      settledCandidate.subgroup
    )
  );

  return {
    settledAgent: settledCandidate,
    overwrittenMarkers,
    events,
  };
}
