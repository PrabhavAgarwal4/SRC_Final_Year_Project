/**
 * Reverse phase logic for the SRC algorithm.
 *
 * After Spread, if there are OVERFLOW agents at corner C (more agents
 * than available column nodes), the overflow agents enter Reverse.
 *
 * During Reverse:
 *   - Overflow agents at C are re-ranked, re-assigned to subgroups (same γ)
 *   - They retrace the path from C back to A in λ rounds
 *   - Lower-label settled markers have their labels overwritten (NOT recruited)
 *   - Equal/lower-label moving agents adopt the label and join
 *   - Higher-label agents → the reverser loses / late adoption
 *
 * Reverse does NOT recruit (un-settle) markers — that's unique to Collect.
 */

import type {
  AgentState,
  GridState,
  SimulationEvent,
} from '../types';
import { cloneLabel, isHigherLabel, labelsEqual } from '../label';
import { generateSubgroupPath } from '../geometry';
import { cloneAgent, resolveSettledMarkerEncounter } from '../interactions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReverseStepResult {
  agents: AgentState[];
  events: SimulationEvent[];
  reverseComplete: boolean;
}

// ---------------------------------------------------------------------------
// Main Reverse step
// ---------------------------------------------------------------------------

/**
 * Execute one round of the Reverse phase.
 *
 * Reverse agents retrace their subgroup path from the end back to the anchor.
 * Their path index decreases by 1 each round.
 */
export function executeReverseStep(
  agents: AgentState[],
  grid: GridState,
  round: number,
  allAgents: AgentState[],
): ReverseStepResult {
  const events: SimulationEvent[] = [];
  const updatedAgents: AgentState[] = [];

  // Build settled-by-position map
  const settledByPos = new Map<string, AgentState[]>();
  for (const a of allAgents) {
    if (a.status === 'settled') {
      const key = `${a.position.x},${a.position.y}`;
      if (!settledByPos.has(key)) settledByPos.set(key, []);
      settledByPos.get(key)!.push(a);
    }
  }

  const reverseAgents = agents.filter(a => a.phase === 'reverse' && a.status === 'moving');
  const otherAgents = agents.filter(a => !(a.phase === 'reverse' && a.status === 'moving'));

  // Copy non-reverse agents
  for (const a of otherAgents) {
    updatedAgents.push(cloneAgent(a));
  }

  for (const agent of reverseAgents) {
    const a = cloneAgent(agent);
    const path = generateSubgroupPath(a.subgroup, a.sweep, grid.sideLength);

    // Reverse: move from current step toward 0 (anchor)
    const nextStep = a.step - 1;

    if (nextStep < 0) {
      // Already at anchor — reverse complete for this agent
      a.step = 0;
      a.position = { ...path[0] };
      updatedAgents.push(a);
      continue;
    }

    a.step = nextStep;
    const nextPos = path[nextStep];
    a.position = { ...nextPos };

    events.push({
      round,
      phase: 'reverse',
      type: 'agent_moved',
      agentIds: [a.id],
      position: { ...nextPos },
      reason: 'reverse_retrace',
      explanation: `Agent ${a.id} retracing to (${nextPos.x},${nextPos.y}) — step ${nextStep}`,
    });

    // Check for settled markers — Reverse overwrites but does NOT recruit
    const posKey = `${nextPos.x},${nextPos.y}`;
    const settledHere = settledByPos.get(posKey);
    if (settledHere && settledHere.length > 0) {
      for (const settled of settledHere) {
        const result = resolveSettledMarkerEncounter(a, settled, round);
        Object.assign(a, {
          label: result.moving.label,
          contact: result.moving.contact,
          adoptedFromMarkerId: result.moving.adoptedFromMarkerId,
        });
        if (result.event) {
          events.push(result.event);
          if (result.event.type === 'marker_overwritten') {
            settled.label = { ...result.settled.label };
          }
        }
      }
    }

    updatedAgents.push(a);
  }

  // Check completion: all reverse agents at step 0
  const remainingReverse = updatedAgents.filter(
    a => a.phase === 'reverse' && a.status === 'moving' && a.step > 0
  );
  const reverseComplete = reverseAgents.length > 0 && remainingReverse.length === 0;

  return { agents: updatedAgents, events, reverseComplete };
}
