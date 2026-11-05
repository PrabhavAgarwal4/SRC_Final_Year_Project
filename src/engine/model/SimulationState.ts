import { Agent, cloneAgent } from './Agent';
import { Group, cloneGroup } from './Group';
import { SimulationEvent } from '../events/SimulationEvent';

export interface SimulationStatistics {
  totalAgents: number; // k
  gridNodes: number; // n
  settledCount: number;
  activeCount: number;
  groupsCount: number;
  completedCycles: number;
  highestLevel: number;
  bouncesCount: number;
  lateAdoptionsCount: number;
  recoveryCyclesCount: number;
}

export interface SimulationState {
  round: number;
  gridWidth: number;
  gridHeight: number;
  agents: Agent[];
  groups: Group[];
  events: SimulationEvent[];
  isTerminated: boolean;
  isDispersed: boolean;
  statistics: SimulationStatistics;
}

export function cloneSimulationState(state: SimulationState): SimulationState {
  return {
    round: state.round,
    gridWidth: state.gridWidth,
    gridHeight: state.gridHeight,
    agents: state.agents.map(cloneAgent),
    groups: state.groups.map(cloneGroup),
    events: [...state.events],
    isTerminated: state.isTerminated,
    isDispersed: state.isDispersed,
    statistics: { ...state.statistics },
  };
}
