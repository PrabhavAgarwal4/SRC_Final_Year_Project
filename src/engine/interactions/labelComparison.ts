import { Agent } from '../model/Agent';
import { Label, compareLabels } from '../model/Label';

export interface WinnerResolution {
  winnerLabel: Label;
  winningAgents: Agent[];
  losingAgents: Agent[];
  isEqual: boolean;
}

/**
 * Compare all agents present on a single node and partition them into winners and losers.
 */
export function resolveCoLocatedLabels(agents: Agent[]): WinnerResolution {
  if (agents.length === 0) {
    throw new Error('Cannot resolve labels for empty agent list');
  }

  // Find max label
  let maxAgent = agents[0];
  for (let i = 1; i < agents.length; i++) {
    if (compareLabels(agents[i].label, maxAgent.label) > 0) {
      maxAgent = agents[i];
    }
  }

  const winnerLabel = maxAgent.label;
  const winningAgents: Agent[] = [];
  const losingAgents: Agent[] = [];

  for (const agent of agents) {
    if (compareLabels(agent.label, winnerLabel) === 0) {
      winningAgents.push(agent);
    } else {
      losingAgents.push(agent);
    }
  }

  return {
    winnerLabel,
    winningAgents,
    losingAgents,
    isEqual: losingAgents.length === 0,
  };
}
