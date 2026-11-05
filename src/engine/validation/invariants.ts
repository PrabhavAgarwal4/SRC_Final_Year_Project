import { SimulationState } from '../model/SimulationState';
import { areCoordsEqual } from '../model/Grid';

export interface InvariantViolation {
  code: string;
  message: string;
  round: number;
  agentIds?: number[];
}

export function validateStateInvariants(state: SimulationState): InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  const { round, agents, gridWidth, gridHeight, statistics } = state;

  // 1. Agent Conservation Invariant
  if (agents.length !== statistics.totalAgents) {
    violations.push({
      code: 'AGENT_CONSERVATION_FAILED',
      message: `Expected ${statistics.totalAgents} agents, but found ${agents.length}. Agents must never disappear or duplicate.`,
      round,
    });
  }

  // Check unique IDs
  const idSet = new Set<number>();
  for (const ag of agents) {
    if (idSet.has(ag.id)) {
      violations.push({
        code: 'DUPLICATE_AGENT_ID',
        message: `Duplicate agent ID found: ${ag.id}.`,
        round,
        agentIds: [ag.id],
      });
    }
    idSet.add(ag.id);
  }

  // 2. Valid Grid Coordinate Invariant
  for (const ag of agents) {
    if (
      ag.currentPos.x < 0 ||
      ag.currentPos.x >= gridWidth ||
      ag.currentPos.y < 0 ||
      ag.currentPos.y >= gridHeight
    ) {
      violations.push({
        code: 'OUT_OF_BOUNDS_AGENT',
        message: `Agent ${ag.id} is at invalid coordinates (${ag.currentPos.x}, ${ag.currentPos.y}).`,
        round,
        agentIds: [ag.id],
      });
    }
  }

  // 3. Lemma 4.9: At each round at most 1 settled agent occupies a node
  const settledCoords = new Map<string, number>();
  for (const ag of agents) {
    if (ag.status === 'settled') {
      const key = `${ag.currentPos.x},${ag.currentPos.y}`;
      if (settledCoords.has(key)) {
        violations.push({
          code: 'MULTIPLE_SETTLED_AGENTS_ON_NODE',
          message: `Lemma 4.9 violated: Agents ${settledCoords.get(key)} and ${ag.id} are both settled at (${ag.currentPos.x}, ${ag.currentPos.y}).`,
          round,
          agentIds: [settledCoords.get(key)!, ag.id],
        });
      } else {
        settledCoords.set(key, ag.id);
      }
    }
  }

  // 4. Lemma 4.3 (Doubling Invariant): c >= 2^level for certified groups
  for (const ag of agents) {
    if (ag.label.level > 0 && ag.label.certificate < Math.pow(2, ag.label.level)) {
      violations.push({
        code: 'DOUBLING_INVARIANT_VIOLATED',
        message: `Lemma 4.3 violated: Agent ${ag.id} has level ${ag.label.level} but certificate ${ag.label.certificate} < 2^${ag.label.level}.`,
        round,
        agentIds: [ag.id],
      });
    }
  }

  return violations;
}
