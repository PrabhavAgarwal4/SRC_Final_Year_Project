import { Coord } from '../model/Grid';
import { Label } from '../model/Label';
import { AlgorithmPhase, AgentStatus } from '../model/Agent';

export type SimulationEventType =
  | 'GroupCreated'
  | 'SubgroupAssigned'
  | 'SweepStarted'
  | 'AgentMoved'
  | 'ClaimStarted'
  | 'AgentSettled'
  | 'LabelCompared'
  | 'LabelAdopted'
  | 'MarkerOverwritten'
  | 'AgentAbsorbed'
  | 'AgentUnsettled'
  | 'OverflowCreated'
  | 'ReverseStarted'
  | 'CollectStarted'
  | 'BoundaryHit'
  | 'BoundaryBounce'
  | 'LateAdoptionStarted'
  | 'PhasePredicted'
  | 'LateAdoptionWaitStarted'
  | 'RecoveryStarted'
  | 'RecoveryCompleted'
  | 'CertificateUpdated'
  | 'LevelUp'
  | 'AgentTerminated'
  | 'DispersionAchieved';

export interface ExplanationDetails {
  whatHappened: string;
  ruleApplied: string;
  whyActionSelected: string;
  stateChanged: string;
  whatHappensNext: string;
}

export interface SimulationEvent {
  id: string;
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
}
