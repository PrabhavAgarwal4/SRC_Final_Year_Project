/**
 * Label interaction logic for the SRC algorithm.
 *
 * Handles all encounters between agents that may carry different labels.
 * The core invariant: the HIGHER label always wins.
 */

import type { AgentState, Label, Phase, Position, SimulationEvent } from './types';
import { compareLabels, isHigherLabel, labelsEqual, cloneLabel } from './label';

// ---------------------------------------------------------------------------
// Deep-clone helper
// ---------------------------------------------------------------------------

/** Deep-clone an AgentState. */
export function cloneAgent(a: AgentState): AgentState {
  return {
    ...a,
    position: { ...a.position },
    label: { ...a.label },
    direction: { ...a.direction },
    sweep: {
      ...a.sweep,
      anchor: { ...a.sweep.anchor },
      idealCorner: { ...a.sweep.idealCorner },
      realizedCorner: { ...a.sweep.realizedCorner },
      direction: { ...a.sweep.direction },
    },
    initialPosition: { ...a.initialPosition },
  };
}

// ---------------------------------------------------------------------------
// Moving encounter
// ---------------------------------------------------------------------------

/**
 * Resolve an encounter among co-located MOVING agents that may have
 * different labels.
 *
 * Higher-label group absorbs the lower-label group:
 *   - Losers adopt the winning label
 *   - Losers' contact becomes 'contacted' (they met a higher label)
 *   - Winner stays 'clean' unless it was already 'contacted'
 *
 * All agents returned are clones (immutable).
 */
export function resolveMovingEncounter(
  agents: AgentState[],
  round: number,
): { agents: AgentState[]; events: SimulationEvent[] } {
  if (agents.length <= 1) {
    return { agents: agents.map(cloneAgent), events: [] };
  }

  const events: SimulationEvent[] = [];

  // Find the highest label among the co-located movers
  let highest: Label = agents[0].label;
  for (const a of agents) {
    if (isHigherLabel(a.label, highest)) {
      highest = a.label;
    }
  }

  const result = agents.map(a => {
    const clone = cloneAgent(a);
    if (!labelsEqual(a.label, highest)) {
      // Loser: adopt the winning label
      events.push({
        round,
        phase: a.phase,
        type: 'label_adopted',
        agentIds: [a.id],
        groupLabel: cloneLabel(highest),
        position: { ...a.position },
        previousState: { label: cloneLabel(a.label) },
        newState: { label: cloneLabel(highest) },
        reason: 'moving_encounter',
        explanation: `Agent ${a.id} adopted higher label from co-located moving group`,
      });
      clone.label = cloneLabel(highest);
      clone.contact = 'contacted';
    }
    return clone;
  });

  if (events.length > 0) {
    // Also emit a two_groups_meet event
    events.unshift({
      round,
      phase: agents[0].phase,
      type: 'two_groups_meet',
      agentIds: agents.map(a => a.id),
      position: { ...agents[0].position },
      reason: 'label_conflict',
      explanation: `Moving groups with different labels met at (${agents[0].position.x},${agents[0].position.y})`,
    });
  }

  return { agents: result, events };
}

// ---------------------------------------------------------------------------
// Settled marker encounter
// ---------------------------------------------------------------------------

/**
 * Resolve encounter between a moving agent and a settled marker.
 *
 * Three cases based on label comparison:
 *   1. Moving > Settled: overwrite the marker's label (marker stays settled)
 *   2. Moving = Settled: no interaction (walk on)
 *   3. Moving < Settled: late adoption — moving agent flags 'contacted'
 *      and adopts the marker's label
 */
export function resolveSettledMarkerEncounter(
  moving: AgentState,
  settled: AgentState,
  round: number,
): { moving: AgentState; settled: AgentState; event: SimulationEvent | null } {
  const cmp = compareLabels(moving.label, settled.label);
  const m = cloneAgent(moving);
  const s = cloneAgent(settled);

  if (cmp > 0) {
    // Moving > Settled → overwrite marker label
    const event: SimulationEvent = {
      round,
      phase: moving.phase,
      type: 'marker_overwritten',
      agentIds: [moving.id, settled.id],
      position: { ...settled.position },
      previousState: { label: cloneLabel(settled.label) },
      newState: { label: cloneLabel(moving.label) },
      reason: 'moving_higher',
      explanation: `Moving agent ${moving.id} overwrote settled marker ${settled.id}'s label`,
    };
    s.label = cloneLabel(moving.label);
    return { moving: m, settled: s, event };
  }

  if (cmp < 0) {
    // Moving < Settled → late adoption
    const event: SimulationEvent = {
      round,
      phase: moving.phase,
      type: 'label_adopted',
      agentIds: [moving.id],
      groupLabel: cloneLabel(settled.label),
      position: { ...settled.position },
      previousState: { label: cloneLabel(moving.label) },
      newState: { label: cloneLabel(settled.label), contact: 'contacted' },
      reason: 'settled_higher',
      explanation: `Moving agent ${moving.id} adopted higher label from settled marker ${settled.id}`,
    };
    m.label = cloneLabel(settled.label);
    m.contact = 'contacted';
    m.adoptedFromMarkerId = settled.id;
    return { moving: m, settled: s, event };
  }

  // Equal labels — no interaction
  return { moving: m, settled: s, event: null };
}

// ---------------------------------------------------------------------------
// Late adoption
// ---------------------------------------------------------------------------

/**
 * Handle late adoption: an agent adopts the label from a settled marker
 * that has a strictly higher label.
 *
 * The adopter:
 *   - Takes the marker's label
 *   - Flags contact = 'contacted'
 *   - Records the marker id for potential recovery
 */
export function handleLateAdoption(
  adopter: AgentState,
  marker: AgentState,
  round: number,
): AgentState {
  const result = cloneAgent(adopter);
  result.label = cloneLabel(marker.label);
  result.contact = 'contacted';
  result.adoptedFromMarkerId = marker.id;
  return result;
}

// ---------------------------------------------------------------------------
// Phase prediction
// ---------------------------------------------------------------------------

/**
 * Predict what phase and approximate position the group that left a settled
 * marker would be in at the current round.
 *
 * The marker was settled at round `marker.settleRound`, step `marker.settleStep`.
 * The sweep's total length is λ.
 * We compute `age = currentRound - marker.settleRound` and determine:
 *   - If the group is still in Spread (hasn't reached C yet)
 *   - If it's in Reverse (retracing toward A)
 *   - If it's in Collect (sweeping from A to C again)
 *   - Or beyond (next cycle)
 */
export function predictPhase(
  marker: AgentState,
  currentRound: number,
): { phase: Phase; position: Position } {
  const age = currentRound - marker.settleRound;
  const lambda = marker.sweep.lambda;
  const remainingSpread = lambda - marker.settleStep;

  if (age <= remainingSpread) {
    // Still in Spread
    return { phase: 'spread', position: marker.sweep.realizedCorner };
  }

  const afterSpread = age - remainingSpread;

  if (afterSpread <= lambda) {
    // In Reverse (retracing C→A)
    return { phase: 'reverse', position: marker.sweep.anchor };
  }

  const afterReverse = afterSpread - lambda;

  if (afterReverse <= lambda) {
    // In Collect (A→C)
    return { phase: 'collect', position: marker.sweep.realizedCorner };
  }

  // Beyond this cycle
  return { phase: 'idle', position: marker.sweep.realizedCorner };
}
