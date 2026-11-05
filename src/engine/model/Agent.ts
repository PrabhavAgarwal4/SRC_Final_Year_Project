import { Coord, Direction } from './Grid';
import { Label } from './Label';

export type AgentStatus = 'moving' | 'claiming' | 'settled' | 'terminated';

export type AlgorithmPhase = 'Spread' | 'Reverse' | 'Collect' | 'WaitAtC' | 'RecoveryReverse' | 'RecoveryCollect' | 'Terminated';

export interface SettleMetadata {
  round: number;
  stepWhenHeadLeft: number;
  storedLabel: Label;
  storedGamma: number;
  storedAnchor: Coord;
  storedIdealCorner: Coord;
  storedDir: Direction;
  storedSubgroup: number;
  storedEpoch: number;
}

export interface LateAdoptionState {
  originalLabel: Label;
  adoptedLabel: Label;
  predictedPhase: AlgorithmPhase;
  predictedStep: number;
  waitTimer: number; // For Case C wait at C up to 2γ rounds
  recoveryInitiator: boolean;
}

export interface Agent {
  id: number;
  status: AgentStatus;
  label: Label;
  mass: number; // active size m used to choose current cycle's γ
  subgroup: number; // s ∈ {0, ..., γ - 1}
  rank: number; // 1-based rank among group members
  step: number; // current step on current phase path
  dir: Direction;
  anchor: Coord;
  idealCorner: Coord;
  destination: Coord; // Realized corner C
  contact: boolean; // clean until meeting strictly higher label
  epoch: number;
  initialPos: Coord;
  currentPos: Coord;
  groupId: string;
  initialGroupId: string;

  // Settle metadata (retained if passive-settled)
  settleMeta?: SettleMetadata;

  // Late adoption tracking
  lateAdoption?: LateAdoptionState;

  // Roles
  isLeader: boolean;
  isOverflow: boolean;
  isLateAdopter: boolean;

  // History / metrics
  totalMoves: number;
  lastAction?: string;
}

export function cloneAgent(agent: Agent): Agent {
  return {
    ...agent,
    label: { ...agent.label },
    dir: { ...agent.dir },
    anchor: { ...agent.anchor },
    idealCorner: { ...agent.idealCorner },
    destination: { ...agent.destination },
    initialPos: { ...agent.initialPos },
    currentPos: { ...agent.currentPos },
    settleMeta: agent.settleMeta ? {
      ...agent.settleMeta,
      storedLabel: { ...agent.settleMeta.storedLabel },
      storedAnchor: { ...agent.settleMeta.storedAnchor },
      storedIdealCorner: { ...agent.settleMeta.storedIdealCorner },
      storedDir: { ...agent.settleMeta.storedDir },
    } : undefined,
    lateAdoption: agent.lateAdoption ? {
      ...agent.lateAdoption,
      originalLabel: { ...agent.lateAdoption.originalLabel },
      adoptedLabel: { ...agent.lateAdoption.adoptedLabel },
    } : undefined,
  };
}
