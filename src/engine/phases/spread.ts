/**
 * Spread phase logic for the SRC algorithm.
 *
 * During Spread, each subgroup head advances one step per round along its
 * ⌐-shaped path.  On "covered" column nodes, the lowest-ID still-moving
 * member settles (claims the node).  Label conflicts are resolved by
 * higher-label-wins.
 *
 * The Spread phase ends when all subgroup heads reach corner C.
 */

import type {
  AgentState,
  GridState,
  Position,
  SimulationEvent,
} from '../types';
import { cloneLabel, compareLabels, isHigherLabel, labelsEqual } from '../label';
import { generateSubgroupPath, positionsEqual } from '../geometry';
import { cloneAgent, resolveSettledMarkerEncounter } from '../interactions';

// ---------------------------------------------------------------------------
// Types local to Spread
// ---------------------------------------------------------------------------

export interface SpreadStepResult {
  /** Updated agents (clones — originals not mutated). */
  agents: AgentState[];
  /** Events generated this round. */
  events: SimulationEvent[];
  /** True when every moving agent has reached its final path position. */
  spreadComplete: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine which agents in a subgroup should attempt to settle at the
 * current position (column-leg positions only).
 *
 * During the column leg, the LOWEST-ID still-moving member of the
 * subgroup claims the current node.
 */
function findClaimCandidate(
  subgroupAgents: AgentState[],
): AgentState | null {
  const moving = subgroupAgents.filter(a => a.status === 'moving');
  if (moving.length === 0) return null;

  // Lowest ID claims
  moving.sort((a, b) => a.id - b.id);
  return moving[0];
}

/**
 * Check whether a given step index is on the column leg for a subgroup.
 *
 * For subgroup s with γ:
 *   Leg 1 indices: 0 … s           (row leg — s+1 positions)
 *   Leg 2 indices: s+1 … s+γ-1     (column leg — γ-1 positions)
 *   Leg 3 indices: s+γ … 2(γ-1)    (row leg — γ-1-s positions)
 *
 * Settlement happens on the column leg (indices s+1 through s+γ-1).
 * Note: the anchor at index 0 is NOT a column position for settlement in
 * the standard case (the anchor node was already handled at cycle start).
 */
function isOnColumnLeg(stepIndex: number, subgroup: number, gamma: number): boolean {
  return stepIndex > subgroup && stepIndex <= subgroup + gamma - 1;
}

// ---------------------------------------------------------------------------
// Main Spread step
// ---------------------------------------------------------------------------

/**
 * Execute one round of the Spread phase.
 *
 * @param agents      All agents (frozen snapshot copies — will be cloned internally)
 * @param grid        Grid state
 * @param round       Current round number
 * @param allAgents   ALL agents including settled ones (for encounter resolution)
 * @returns           SpreadStepResult with updated agents and events
 */
export function executeSpreadStep(
  agents: AgentState[],
  grid: GridState,
  round: number,
  allAgents: AgentState[],
): SpreadStepResult {
  const events: SimulationEvent[] = [];
  const updatedAgents: AgentState[] = [];

  // Build a map of settled agents by position for encounter resolution
  const settledByPos = new Map<string, AgentState[]>();
  for (const a of allAgents) {
    if (a.status === 'settled') {
      const key = `${a.position.x},${a.position.y}`;
      if (!settledByPos.has(key)) settledByPos.set(key, []);
      settledByPos.get(key)!.push(a);
    }
  }

  // Group moving agents by label+subgroup for coordinated movement
  const movingAgents = agents.filter(a => a.phase === 'spread' && a.status === 'moving');
  const otherAgents = agents.filter(a => !(a.phase === 'spread' && a.status === 'moving'));

  // Copy non-moving agents as-is
  for (const a of otherAgents) {
    updatedAgents.push(cloneAgent(a));
  }

  // Process each moving agent
  let allAtEnd = true;

  // Generate paths for each agent and advance by one step
  for (const agent of movingAgents) {
    const a = cloneAgent(agent);
    const path = generateSubgroupPath(a.subgroup, a.sweep, grid.sideLength);

    // Current position in path is a.step
    const nextStep = a.step + 1;

    if (nextStep >= path.length) {
      // Agent has reached the end of path (at corner C)
      a.step = path.length - 1;
      updatedAgents.push(a);
      continue;
    }

    // Advance to next position
    a.step = nextStep;
    const nextPos = path[nextStep];
    a.position = { ...nextPos };

    events.push({
      round,
      phase: 'spread',
      type: 'agent_moved',
      agentIds: [a.id],
      position: { ...nextPos },
      reason: 'spread_advance',
      explanation: `Agent ${a.id} (subgroup ${a.subgroup}) moved to (${nextPos.x},${nextPos.y}) — step ${nextStep}/${path.length - 1}`,
    });

    // Check for settled markers at the new position
    const posKey = `${nextPos.x},${nextPos.y}`;
    const settledHere = settledByPos.get(posKey);
    if (settledHere && settledHere.length > 0) {
      for (const settled of settledHere) {
        const result = resolveSettledMarkerEncounter(a, settled, round);
        // Update agent with encounter result
        Object.assign(a, {
          label: result.moving.label,
          contact: result.moving.contact,
          adoptedFromMarkerId: result.moving.adoptedFromMarkerId,
        });
        // If the marker label was overwritten, update it in our tracking
        if (result.event) {
          events.push(result.event);
          if (result.event.type === 'marker_overwritten') {
            // Update the settled agent's label in the tracking map
            settled.label = { ...result.settled.label };
          }
        }
      }
    }

    // Check if this step is on the column leg and agent should try to settle
    if (isOnColumnLeg(a.step, a.subgroup, a.sweep.gamma)) {
      // Check if position is free (no settled agent with equal or higher label)
      const settledAtPos = settledByPos.get(posKey);
      const isOccupiedByEqual = settledAtPos?.some(
        s => labelsEqual(s.label, a.label)
      );

      if (!isOccupiedByEqual) {
        // Attempt to claim — but we only settle if no other agent from same
        // subgroup has higher priority (lower ID settles)
        const sameSubgroupMoving = movingAgents.filter(
          m => m.subgroup === agent.subgroup &&
            labelsEqual(m.label, agent.label) &&
            m.id !== agent.id
        );
        const allCandidates = [agent, ...sameSubgroupMoving.filter(
          m => {
            const mPath = generateSubgroupPath(m.subgroup, m.sweep, grid.sideLength);
            const mNext = m.step + 1;
            return mNext < mPath.length && positionsEqual(mPath[mNext], nextPos);
          }
        )];

        const candidate = findClaimCandidate(
          allCandidates.map(c => c.id === agent.id ? a : cloneAgent(c))
        );

        if (candidate && candidate.id === a.id) {
          // This agent settles
          a.status = 'settled';
          a.phase = 'spread';
          a.settleRound = round;
          a.settleStep = a.step;

          events.push({
            round,
            phase: 'spread',
            type: 'agent_settled',
            agentIds: [a.id],
            groupLabel: cloneLabel(a.label),
            position: { ...nextPos },
            reason: 'column_claim',
            explanation: `Agent ${a.id} settled at (${nextPos.x},${nextPos.y}) on column leg`,
          });
        }
      }
    }

    if (a.status === 'moving' && a.step < path.length - 1) {
      allAtEnd = false;
    }

    updatedAgents.push(a);
  }

  // Check if all moving agents have reached end of path
  const remainingMoving = updatedAgents.filter(
    a => a.phase === 'spread' && a.status === 'moving' && (() => {
      const path = generateSubgroupPath(a.subgroup, a.sweep, grid.sideLength);
      return a.step < path.length - 1;
    })()
  );
  const spreadComplete = remainingMoving.length === 0;

  return { agents: updatedAgents, events, spreadComplete };
}
