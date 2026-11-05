/**
 * Core type definitions for the SRC (Spread-Reverse-Collect) algorithm engine.
 *
 * Based on "Beyond the Boundary: Optimal Grid Dispersion by
 * Spread, Reverse, and Collect" — synchronous CCM model on an
 * oriented square grid.
 */

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/** Diagonal direction vector – each component is ±1. */
export type Direction = { dx: -1 | 1; dy: -1 | 1 };

/** Absolute grid position (0-indexed). */
export type Position = { x: number; y: number };

// ---------------------------------------------------------------------------
// Agent state
// ---------------------------------------------------------------------------

/** Agent lifecycle status. */
export type AgentStatus = 'moving' | 'claiming' | 'settled' | 'terminated';

/**
 * Group label, compared lexicographically: (level, certificate, leaderId).
 * A *higher* label is the one that wins in a conflict.
 */
export interface Label {
  /** ℓ — growth counter (doubles at each level-up). */
  level: number;
  /** c — certified group size (NEVER decreases). */
  certificate: number;
  /** id — largest identifier among certified members. */
  leaderId: number;
}

/** Phase of the SRC algorithm. */
export type Phase =
  | 'spread'
  | 'reverse'
  | 'collect'
  | 'waiting'
  | 'recovery-reverse'
  | 'recovery-collect'
  | 'idle'
  | 'terminated';

/** Whether a subgroup's path has met a strictly higher label. */
export type ContactStatus = 'clean' | 'contacted';

// ---------------------------------------------------------------------------
// Sweep geometry
// ---------------------------------------------------------------------------

/** Complete description of a single sweep in the algorithm. */
export interface SweepInfo {
  /** A — starting position. */
  anchor: Position;
  /** C* — intended (unclipped) corner. */
  idealCorner: Position;
  /** C — actual corner after boundary clipping. */
  realizedCorner: Position;
  /** δ = (dx, dy). */
  direction: Direction;
  /** γ = 2⌈√m⌉. */
  gamma: number;
  /** λ = 2(γ-1) - tx - ty  (path length). */
  lambda: number;
  /** tx — excess clipped in x. */
  excessX: number;
  /** ty — excess clipped in y. */
  excessY: number;
  /** Whether the ideal corner was clipped. */
  isClipped: boolean;
}

// ---------------------------------------------------------------------------
// Per-agent persistent state (cf. Table 1 from the paper)
// ---------------------------------------------------------------------------

export interface AgentState {
  id: number;
  status: AgentStatus;
  position: Position;
  label: Label;
  /** Active group size m used for current γ. */
  mass: number;
  /** s ∈ {0, ..., γ-1}. */
  subgroup: number;
  /** Steps taken on the current sweep path. */
  step: number;
  /** Round when the agent settled. */
  settleRound: number;
  /** Step index at which the head left a settled agent behind. */
  settleStep: number;
  direction: Direction;
  sweep: SweepInfo;
  contact: ContactStatus;
  epoch: number;
  /** Rank by decreasing ID (1 = largest). */
  rank: number;
  phase: Phase;
  // -- Late adoption tracking -------------------------------------------------
  /** True if waiting at C for recovery. */
  waitingAtC: boolean;
  /** Round at which the agent started waiting. */
  waitStartRound: number;
  /** ID of the settled marker that triggered adoption (if any). */
  adoptedFromMarkerId: number | null;
  // -- Visualization helpers --------------------------------------------------
  initialPosition: Position;
  initialGroupId: number;
}

// ---------------------------------------------------------------------------
// Simulation events
// ---------------------------------------------------------------------------

export type SimEventType =
  | 'group_created'
  | 'subgroup_assigned'
  | 'sweep_started'
  | 'agent_moved'
  | 'claim_started'
  | 'agent_settled'
  | 'label_compared'
  | 'label_adopted'
  | 'marker_overwritten'
  | 'agent_absorbed'
  | 'agent_unsettled'
  | 'overflow_created'
  | 'reverse_started'
  | 'collect_started'
  | 'boundary_hit'
  | 'boundary_bounce'
  | 'late_adoption_started'
  | 'phase_predicted'
  | 'late_adoption_wait_started'
  | 'recovery_started'
  | 'recovery_completed'
  | 'certificate_updated'
  | 'level_up'
  | 'agent_terminated'
  | 'cycle_started'
  | 'cycle_ended'
  | 'singleton_settled'
  | 'two_groups_meet'
  | 'terminating_sweep';

export interface SimulationEvent {
  round: number;
  phase: Phase;
  type: SimEventType;
  agentIds: number[];
  groupLabel?: Label;
  position?: Position;
  previousState?: Partial<AgentState>;
  newState?: Partial<AgentState>;
  reason: string;
  explanation: string;
}

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

export interface GridState {
  /** √n — side length of the square grid. */
  sideLength: number;
  /** n = sideLength². */
  nodeCount: number;
}

// ---------------------------------------------------------------------------
// Snapshots & configuration
// ---------------------------------------------------------------------------

/** Complete immutable snapshot of the simulation at a given round. */
export interface SimulationSnapshot {
  round: number;
  agents: ReadonlyMap<number, Readonly<AgentState>>;
  grid: Readonly<GridState>;
  events: readonly SimulationEvent[];
  phase: Phase;
  isComplete: boolean;
}

/** Initial configuration fed to the engine. */
export interface InitialConfig {
  gridSideLength: number;
  agentPlacements: { agentId: number; position: Position }[];
}

/** A named scenario with expected outcomes. */
export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  config: InitialConfig;
  expectedEvents?: string[];
  expectedFinalCondition?: string;
}
