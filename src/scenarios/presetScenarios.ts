import { InitialAgentPlacement } from '../engine/simulation/simulationEngine';

export interface PresetScenario {
  id: string;
  number: number;
  title: string;
  category: 'Basics' | 'Cycle & Phases' | 'Interactions' | 'Late Adoption' | 'Certificates & Advanced' | 'Custom';
  description: string;
  gridWidth: number;
  gridHeight: number;
  placements: InitialAgentPlacement[];
  expectedEvents: string[];
  expectedOutcome: string;
  guidedExplanation: string[];
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'scenario-1',
    number: 1,
    title: 'Basic Single Group',
    category: 'Basics',
    description: 'A small group of 4 co-located agents at the origin on an empty grid.',
    gridWidth: 6,
    gridHeight: 6,
    placements: [
      { id: 101, pos: { x: 0, y: 0 } },
      { id: 102, pos: { x: 0, y: 0 } },
      { id: 103, pos: { x: 0, y: 0 } },
      { id: 104, pos: { x: 0, y: 0 } },
    ],
    expectedEvents: ['GroupCreated', 'SubgroupAssigned', 'ClaimStarted', 'AgentSettled', 'DispersionAchieved'],
    expectedOutcome: 'All 4 agents settle on free nodes during a single clean Spread. Zero overflow.',
    guidedExplanation: [
      'Active mass m = 4 yields sweep parameter γ = 2 * ceil(sqrt(4)) = 4.',
      'Square area γ² = 16 offers ample capacity (> 4m) for all 4 agents.',
      'Each subgroup covers a distinct column x = s, claiming empty nodes one by one.',
      'The group disperses completely in a single Spread phase without needing Reverse or Collect.'
    ],
  },
  {
    id: 'scenario-2',
    number: 2,
    title: 'Subgroup Assignment & Ranking',
    category: 'Basics',
    description: 'Nine agents in one cluster demonstrating rank-based modulo assignment and column allocation.',
    gridWidth: 8,
    gridHeight: 8,
    placements: [
      { id: 10, pos: { x: 0, y: 0 } },
      { id: 20, pos: { x: 0, y: 0 } },
      { id: 30, pos: { x: 0, y: 0 } },
      { id: 40, pos: { x: 0, y: 0 } },
      { id: 50, pos: { x: 0, y: 0 } },
      { id: 60, pos: { x: 0, y: 0 } },
      { id: 70, pos: { x: 0, y: 0 } },
      { id: 80, pos: { x: 0, y: 0 } },
      { id: 90, pos: { x: 0, y: 0 } },
    ],
    expectedEvents: ['GroupCreated', 'SubgroupAssigned', 'SweepStarted'],
    expectedOutcome: 'γ = 2 * ceil(sqrt(9)) = 6 subgroups. Agents partitioned by s = rank mod 6.',
    guidedExplanation: [
      'Agents are sorted in descending ID order: Rank 1 is Agent 90, down to Rank 9 (Agent 10).',
      'γ = 6 yields 6 subgroup indices {0, 1, 2, 3, 4, 5}.',
      'Agents 60 and 90 share subgroup 0 (ranks 6 and 1 mod 6).',
      'Each subgroup traverses its Γ-shaped path and disperses along its assigned column.'
    ],
  },
  {
    id: 'scenario-3',
    number: 3,
    title: 'Complete Clean SRC Cycle',
    category: 'Cycle & Phases',
    description: 'A configuration where obstructed nodes during Spread create overflow, triggering Reverse and Collect.',
    gridWidth: 7,
    gridHeight: 7,
    placements: [
      { id: 1, pos: { x: 0, y: 0 } },
      { id: 2, pos: { x: 0, y: 0 } },
      { id: 3, pos: { x: 0, y: 0 } },
      { id: 4, pos: { x: 0, y: 0 } },
      { id: 5, pos: { x: 0, y: 0 } },
      { id: 6, pos: { x: 0, y: 0 } },
    ],
    expectedEvents: ['SweepStarted', 'ClaimStarted', 'AgentSettled', 'ReverseStarted', 'CollectStarted'],
    expectedOutcome: 'Overflow agents retrace C -> A during Reverse, then sweep A -> C during Collect.',
    guidedExplanation: [
      'In Spread, agents claim covered column nodes; any moving agents reaching C form the overflow.',
      'Reverse synchronizes moving overflow agents back to anchor A without settling new nodes.',
      'Collect sweeps from A back to C, gathering recruited agents.',
      'At C, the group re-evaluates active size and flips axes to begin the next cycle.'
    ],
  },
  {
    id: 'scenario-4',
    number: 4,
    title: 'Settled Marker During Reverse',
    category: 'Interactions',
    description: 'A higher-labeled reversing subgroup passes over an existing lower-labeled settled marker.',
    gridWidth: 7,
    gridHeight: 7,
    placements: [
      // Higher group at (0,0) with 4 agents
      { id: 90, pos: { x: 0, y: 0 } },
      { id: 91, pos: { x: 0, y: 0 } },
      { id: 92, pos: { x: 0, y: 0 } },
      { id: 93, pos: { x: 0, y: 0 } },
      // Lower group settled marker pre-placed
      { id: 10, pos: { x: 2, y: 2 } },
    ],
    expectedEvents: ['MarkerOverwritten', 'ReverseStarted'],
    expectedOutcome: 'The settled marker has its label updated, but stays passive-settled. It is NOT un-settled until Collect.',
    guidedExplanation: [
      'Section 3.4 rule: When Reverse encounters a lower-labeled settled marker, its metadata is overwritten.',
      'The marker stays passive-settled; Reverse does not un-settle agents.',
      'This guarantees that Reverse functions strictly as a moving-agent rendezvous phase.'
    ],
  },
  {
    id: 'scenario-5',
    number: 5,
    title: 'Moving Agent Encounter During Reverse',
    category: 'Interactions',
    description: 'A lower-labeled moving agent is intercepted by a higher-labeled reversing subgroup.',
    gridWidth: 7,
    gridHeight: 7,
    placements: [
      { id: 80, pos: { x: 0, y: 0 } },
      { id: 81, pos: { x: 0, y: 0 } },
      { id: 82, pos: { x: 0, y: 0 } },
      { id: 83, pos: { x: 0, y: 0 } },
      { id: 15, pos: { x: 2, y: 1 } },
      { id: 16, pos: { x: 2, y: 1 } },
    ],
    expectedEvents: ['AgentAbsorbed', 'ReverseStarted'],
    expectedOutcome: 'The lower moving agent adopts the higher label and joins the reversing subgroup toward A.',
    guidedExplanation: [
      'Section 3.4 & Table 2: When a moving agent meets a higher reversing group, it adopts the higher label immediately.',
      'It joins the reversing flow and travels together back to anchor A.',
      'The winning group does not rebuild its subgroups mid-cycle; the new agent travels with the head.'
    ],
  },
  {
    id: 'scenario-6',
    number: 6,
    title: 'Recruitment During Collect',
    category: 'Interactions',
    description: 'Collect phase passes over an eligible settled marker, un-settling and recruiting it.',
    gridWidth: 7,
    gridHeight: 7,
    placements: [
      { id: 70, pos: { x: 0, y: 0 } },
      { id: 71, pos: { x: 0, y: 0 } },
      { id: 72, pos: { x: 0, y: 0 } },
      { id: 73, pos: { x: 0, y: 0 } },
      { id: 5, pos: { x: 1, y: 2 } },
    ],
    expectedEvents: ['AgentUnsettled', 'CollectStarted'],
    expectedOutcome: 'Collect un-settles the marker and carries it to C, enlarging the active group mass.',
    guidedExplanation: [
      'Section 3.5: Collect is the ONLY phase permitted to recruit final settled markers.',
      'When an eligible settled marker is reached, its status changes to moving.',
      'This mechanism allows larger groups to reclaim territory and grow toward theoretical bounds.'
    ],
  },
  {
    id: 'scenario-7',
    number: 7,
    title: 'Partial Absorption & Group Splitting',
    category: 'Interactions',
    description: 'Two groups with different labels whose sweep squares partially overlap.',
    gridWidth: 8,
    gridHeight: 8,
    placements: [
      // High-priority group (higher IDs)
      { id: 91, pos: { x: 1, y: 1 } },
      { id: 92, pos: { x: 1, y: 1 } },
      { id: 93, pos: { x: 1, y: 1 } },
      { id: 94, pos: { x: 1, y: 1 } },
      // Low-priority group (lower IDs) at offset
      { id: 11, pos: { x: 3, y: 1 } },
      { id: 12, pos: { x: 3, y: 1 } },
      { id: 13, pos: { x: 3, y: 1 } },
      { id: 14, pos: { x: 3, y: 1 } },
    ],
    expectedEvents: ['LabelCompared', 'AgentAbsorbed'],
    expectedOutcome: 'Only overlapping subgroups are absorbed; non-contacted subgroups continue independently.',
    guidedExplanation: [
      'Section 3.6: Partial absorption splits the lower group into absorbed members, settled members, and non-contacted overflow.',
      'Only paths that actually encounter the higher label mark contacted.',
      'Uncontacted paths retain their original label and may still independently disperse.'
    ],
  },
  {
    id: 'scenario-8',
    number: 8,
    title: 'Boundary Bounce',
    category: 'Basics',
    description: 'A Spread sweep starting near the edge reaches the grid boundary and reflects back inside.',
    gridWidth: 7,
    gridHeight: 7,
    placements: [
      { id: 51, pos: { x: 5, y: 4 } },
      { id: 52, pos: { x: 5, y: 4 } },
      { id: 53, pos: { x: 5, y: 4 } },
      { id: 54, pos: { x: 5, y: 4 } },
    ],
    expectedEvents: ['BoundaryHit', 'BoundaryBounce', 'SweepStarted'],
    expectedOutcome: 'Sweep clips on +x and +y, flips direction to (-1, -1), re-anchors at hit corner, and continues Spread inward.',
    guidedExplanation: [
      'Section 3.7: Boundary contact is handled locally when outgoing ports are missing.',
      'The group flips the hit axes (dx <- -dx, dy <- -dy) and sets A = C.',
      'Parameters γ, level, and certificate remain unchanged.',
      'By Lemma 4.5, a group bounces at most 4 times before its next clean Spread.'
    ],
  },
  {
    id: 'scenario-9',
    number: 9,
    title: 'Terminating Whole-Grid Sweep',
    category: 'Basics',
    description: 'A sufficiently large group (γ > √n) reaches the terminating corner condition.',
    gridWidth: 4,
    gridHeight: 4,
    placements: [
      // 9 agents on 4x4 grid (√n = 4, γ = 2 * ceil(sqrt(9)) = 6 > 4)
      { id: 1, pos: { x: 0, y: 0 } },
      { id: 2, pos: { x: 0, y: 0 } },
      { id: 3, pos: { x: 0, y: 0 } },
      { id: 4, pos: { x: 0, y: 0 } },
      { id: 5, pos: { x: 0, y: 0 } },
      { id: 6, pos: { x: 0, y: 0 } },
      { id: 7, pos: { x: 0, y: 0 } },
      { id: 8, pos: { x: 0, y: 0 } },
      { id: 9, pos: { x: 0, y: 0 } },
    ],
    expectedEvents: ['AgentTerminated', 'DispersionAchieved'],
    expectedOutcome: 'Sweep clips both axes with γ > √n; agents cover the grid and terminate.',
    guidedExplanation: [
      'Section 3.7: When γ exceeds grid side length √n and clips both axes, flipping direction cannot fit inside.',
      'The group settles all its active members across available grid nodes and terminates.',
      'This terminates in O(√n) rounds, which is O(√k).'
    ],
  },
  {
    id: 'scenario-10',
    number: 10,
    title: 'Successful Late Adoption',
    category: 'Late Adoption',
    description: 'A lower-labeled moving agent meets a higher-labeled settled marker, predicts head position, and joins.',
    gridWidth: 8,
    gridHeight: 8,
    placements: [
      // Higher group starting earlier at (0,0)
      { id: 80, pos: { x: 0, y: 0 } },
      { id: 81, pos: { x: 0, y: 0 } },
      { id: 82, pos: { x: 0, y: 0 } },
      { id: 83, pos: { x: 0, y: 0 } },
      // Lower group at (1,0)
      { id: 20, pos: { x: 1, y: 0 } },
      { id: 21, pos: { x: 1, y: 0 } },
    ],
    expectedEvents: ['LateAdoptionStarted', 'PhasePredicted'],
    expectedOutcome: 'Lower agent adopts higher label, calculates marker age = r - r_set, and joins the higher sweep.',
    guidedExplanation: [
      'Section 3.6: Lower agent reads stored anchor, direction, subgroup, and settling round r_set from marker.',
      'It computes marker age to determine the head’s current progress.',
      'It follows the stored path to join the active higher subgroup.'
    ],
  },
  {
    id: 'scenario-11',
    number: 11,
    title: 'Recovery Reverse–Collect Cycle',
    category: 'Late Adoption',
    description: 'Late adopters miss live traffic, wait at corner C for 2γ rounds, and initiate recovery.',
    gridWidth: 8,
    gridHeight: 8,
    placements: [
      { id: 95, pos: { x: 0, y: 0 } },
      { id: 96, pos: { x: 0, y: 0 } },
      { id: 18, pos: { x: 2, y: 0 } },
      { id: 19, pos: { x: 2, y: 0 } },
    ],
    expectedEvents: ['LateAdoptionWaitStarted', 'RecoveryStarted', 'CollectStarted'],
    expectedOutcome: 'Waiting adopters at C reach timeout; largest ID initiates exactly one Recovery Reverse–Collect.',
    guidedExplanation: [
      'Section 3.6 Case C: If late adopters miss live traffic, they proceed to C and wait up to 2γ rounds.',
      'If no ordinary Collect reaches C, the largest-ID adopter triggers recovery.',
      'Recovery runs an ordinary Reverse then Collect using stored marker variables, without promoting.'
    ],
  },
  {
    id: 'scenario-12',
    number: 12,
    title: 'Certificate Doubling & Level-Up',
    category: 'Certificates & Advanced',
    description: 'A clean cycle gathers m_after >= 2c active members, triggering a certified level-up.',
    gridWidth: 8,
    gridHeight: 8,
    placements: [
      { id: 50, pos: { x: 0, y: 0 } },
      { id: 51, pos: { x: 0, y: 0 } },
      { id: 10, pos: { x: 1, y: 1 } },
      { id: 11, pos: { x: 1, y: 1 } },
      { id: 12, pos: { x: 1, y: 1 } },
    ],
    expectedEvents: ['LevelUp', 'CertificateUpdated', 'SweepStarted'],
    expectedOutcome: 'Level increments ℓ <- ℓ + 1, certificate updates c <- m_after.',
    guidedExplanation: [
      'Section 3.8: After a clean Collect, if m_after >= 2c and path was clean, level increments by 1.',
      'Certificate updates to c = m_after.',
      'By Lemma 4.3, certificate satisfies c >= 2^ℓ, bounding total level-ups to O(log k).'
    ],
  },
  {
    id: 'scenario-13',
    number: 13,
    title: 'No Promotion (Sub-Doubling Active Mass)',
    category: 'Certificates & Advanced',
    description: 'A cycle completes cleanly but collects fewer than 2c agents, preserving level and certificate.',
    gridWidth: 8,
    gridHeight: 8,
    placements: [
      { id: 60, pos: { x: 0, y: 0 } },
      { id: 61, pos: { x: 0, y: 0 } },
      { id: 62, pos: { x: 0, y: 0 } },
      { id: 63, pos: { x: 0, y: 0 } },
      { id: 1, pos: { x: 2, y: 2 } },
    ],
    expectedEvents: ['CollectStarted', 'SweepStarted'],
    expectedOutcome: 'Level ℓ and certificate c remain unchanged because m_after < 2c.',
    guidedExplanation: [
      'Section 3.8: Certificate is not updated arbitrarily; it requires genuine growth (m_after >= 2c).',
      'If fewer agents are collected, the group maintains its existing certificate.',
      'This guarantees that only certified population growth increases the sweep scale.'
    ],
  },
  {
    id: 'scenario-14',
    number: 14,
    title: 'Multi-Cluster General Dispersion',
    category: 'Certificates & Advanced',
    description: 'Four separate clusters across the grid interacting, merging, and achieving total dispersion.',
    gridWidth: 10,
    gridHeight: 10,
    placements: [
      { id: 10, pos: { x: 1, y: 1 } },
      { id: 11, pos: { x: 1, y: 1 } },
      { id: 20, pos: { x: 4, y: 1 } },
      { id: 21, pos: { x: 4, y: 1 } },
      { id: 30, pos: { x: 1, y: 5 } },
      { id: 31, pos: { x: 1, y: 5 } },
      { id: 40, pos: { x: 5, y: 5 } },
      { id: 41, pos: { x: 5, y: 5 } },
    ],
    expectedEvents: ['LabelCompared', 'AgentAbsorbed', 'AgentSettled', 'DispersionAchieved'],
    expectedOutcome: 'Hierarchical merging resolves all conflicts; all 8 agents disperse to distinct nodes.',
    guidedExplanation: [
      'Demonstrates Theorem 4.11: SRC solves dispersion from any general initial placement.',
      'Multiple clusters sweep simultaneously, arbitrate priority via lexicographical labels, and achieve complete dispersion.',
      'Total running time is bounded by O(√k) rounds.'
    ],
  },
];
