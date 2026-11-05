export interface KnowledgeCheckOption {
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface TutorialChapter {
  id: number;
  title: string;
  subtitle: string;
  content: string[];
  formula?: string;
  keyTakeaways: string[];
  question: {
    prompt: string;
    options: KnowledgeCheckOption[];
  };
}

export const TUTORIAL_CHAPTERS: TutorialChapter[] = [
  {
    id: 1,
    title: 'The Mobile Agent Dispersion Problem',
    subtitle: 'From congested initial placements to autonomous 1-agent-per-node balance',
    content: [
      'Dispersion is a fundamental coordination problem in distributed computing and multi-agent robotics.',
      'Given k mobile agents placed arbitrarily on the nodes of an n-node graph, the agents must autonomously navigate until each node is occupied by at most one agent.',
      'Unlike exploration, where all nodes must be visited, dispersion requires agents to spread out, claim distinct territory, and terminate.',
      'Applications include autonomous warehouse robotics (e.g. Amazon Kiva systems), drone swarm search-and-rescue, sensor network deployment, and load balancing.'
    ],
    formula: 'k \\le n \\quad \\text{agents dispersed such that} \\quad \\forall u \\in V, \\ |\\{a \\in R : \\text{pos}(a) = u\\}| \\le 1',
    keyTakeaways: [
      'k agents must occupy k distinct nodes and permanently stop.',
      'Agents start with no global coordinate system and no knowledge of grid size n or population k.'
    ],
    question: {
      prompt: 'What is the primary termination requirement for the dispersion problem?',
      options: [
        { text: 'Every agent visits every node in the graph.', isCorrect: false, feedback: 'That is the exploration problem, not dispersion.' },
        { text: 'Every node in the grid contains at most one agent, and all agents stop.', isCorrect: true, feedback: 'Correct! Dispersion succeeds when at most 1 agent occupies each node and motion terminates.' },
        { text: 'All agents gather together at the origin (0, 0).', isCorrect: false, feedback: 'That is the gathering / rendezvous problem.' }
      ]
    }
  },
  {
    id: 2,
    title: 'Model & CCM Synchronous Execution',
    subtitle: 'Anonymous nodes, local communication, and simultaneous rounds',
    content: [
      'The environment is an oriented square grid where each node has 4 cardinal ports: North (+y), East (+x), South (-y), and West (-x).',
      'Nodes are anonymous and have zero memory or computation.',
      'Execution proceeds in discrete synchronous rounds following the CCM cycle:',
      '1. Communicate: Read states of all co-located agents sharing the node.',
      '2. Compute: Run deterministic local state transitions.',
      '3. Move: Traverse an outgoing port or stay.',
      'Crucially, agents have no edge-crossing detection: agents crossing edges in opposite directions cannot detect one another.'
    ],
    keyTakeaways: [
      'CCM model ensures strict synchrony and local decision-making.',
      'Port consistency provides directional orientation without absolute position coordinates.'
    ],
    question: {
      prompt: 'In the CCM model, can an agent detect another agent moving across the same edge in the opposite direction?',
      options: [
        { text: 'No, agents have no edge-crossing detection.', isCorrect: true, feedback: 'Correct! The paper highlights that agents do not notice opposite edge traversals in the same round.' },
        { text: 'Yes, agents always communicate across edges.', isCorrect: false, feedback: 'Incorrect. Communication occurs only between co-located agents at the same node.' }
      ]
    }
  },
  {
    id: 3,
    title: 'Initial Groups & Leader Election',
    subtitle: 'Autonomous formation of initial clusters at round 0',
    content: [
      'At round 0, agents initially sitting on the same grid node discover each other through local communication.',
      'The co-located agents elect the agent with the highest unique identifier (ID) as their leader.',
      'They form an initial group with level ℓ = 0 and certified size c = m, where m is the number of co-located agents.',
      'Initial sweep direction is initialized to (+1, +1) with an initial epoch of 0.'
    ],
    formula: '\\Lambda = (\\ell = 0, \\ c = m, \\ \\text{id} = \\max_{a \\in G} a.\\text{id})',
    keyTakeaways: [
      'Co-located agents cluster into a group at round 0.',
      'Leader ID breaks ties and establishes initial priority.'
    ],
    question: {
      prompt: 'How is the leader of an initial group selected at round 0?',
      options: [
        { text: 'Random coin toss.', isCorrect: false, feedback: 'SRC is completely deterministic; randomness is not used.' },
        { text: 'The agent with the largest unique identifier (ID).', isCorrect: true, feedback: 'Correct! Unique IDs guarantee a deterministic leader with zero ambiguity.' }
      ]
    }
  },
  {
    id: 4,
    title: 'Group Priority & Lexicographical Labels',
    subtitle: 'How competing groups arbitrate conflicts',
    content: [
      'Every group carries a 3-tuple label Λ = (ℓ, c, id).',
      'Priority is determined by strict lexicographical comparison:',
      '1. Higher level ℓ wins: ℓ₁ > ℓ₂',
      '2. Equal level, higher certified size c wins: c₁ > c₂',
      '3. Equal level and certificate, higher leader ID wins: id₁ > id₂',
      'Since IDs are globally unique, any two labels can be strictly ordered without ties.'
    ],
    formula: '(\\ell_1, c_1, \\text{id}_1) \\prec (\\ell_2, c_2, \\text{id}_2) \\iff (\\ell_1 < \\ell_2) \\lor (\\ell_1 = \\ell_2 \\land c_1 < c_2) \\lor (\\ell_1 = \\ell_2 \\land c_1 = c_2 \\land \\text{id}_1 < \\text{id}_2)',
    keyTakeaways: [
      'Lexicographical ordering eliminates deadlocks and race conditions.',
      'Certificate c represents proven historical doublings and never decreases arbitrarily.'
    ],
    question: {
      prompt: 'Which label has higher priority: (1, 8, 20) or (2, 4, 10)?',
      options: [
        { text: '(2, 4, 10) wins because level 2 > level 1.', isCorrect: true, feedback: 'Correct! Level is the primary key in the lexicographical order.' },
        { text: '(1, 8, 20) wins because certificate 8 > 4.', isCorrect: false, feedback: 'Incorrect. Level takes precedence over certificate.' }
      ]
    }
  },
  {
    id: 5,
    title: 'Sweep Geometry & Parameter γ',
    subtitle: 'Dimensioning the search area for optimal dispersion',
    content: [
      'For active mass m, the group sets sweep parameter γ = 2 * ceil(sqrt(m)).',
      'The swept square has area γ² >= 4m, providing at least 4 times the capacity needed for all m active agents.',
      'From anchor A = (ax, ay) in direction δ = (dx, dy), the ideal corner is C* = (ax + (γ - 1)dx, ay + (γ - 1)dy).',
      'Realized corner C is obtained by clipping C* to valid grid boundaries [0, √n - 1].',
      'Unclipped sweep length is λ = 2(γ - 1).'
    ],
    formula: '\\gamma = 2 \\lceil \\sqrt{m} \\rceil, \\quad \\text{Area} = \\gamma^2 \\ge 4m, \\quad \\lambda = 2(\\gamma - 1)',
    keyTakeaways: [
      'γ² >= 4m guarantees ample slack for clean dispersion in one pass when unobstructed.',
      'Sweep length λ is O(√m) rounds.'
    ],
    question: {
      prompt: 'If active mass m = 9, what is the sweep parameter γ and sweep length λ?',
      options: [
        { text: 'γ = 6, λ = 10', isCorrect: true, feedback: 'Correct! ceil(sqrt(9)) = 3, so γ = 2*3 = 6, and λ = 2*(6-1) = 10 rounds.' },
        { text: 'γ = 4, λ = 6', isCorrect: false, feedback: 'Incorrect. 2 * ceil(sqrt(9)) = 2 * 3 = 6.' }
      ]
    }
  },
  {
    id: 6,
    title: 'Subgroups & The Γ-Shaped Path',
    subtitle: 'Partitioning agents into non-overlapping parallel columns',
    content: [
      'Agents are ranked by decreasing ID: ranks α ∈ {1, ..., m}.',
      'Rank α is assigned to subgroup s = α mod γ ∈ {0, ..., γ - 1}.',
      'Subgroup s traverses a 3-leg Γ-shaped path:',
      'Leg 1 (first row): s steps along dx to reach column x = ax + s * dx.',
      'Leg 2 (column leg): γ - 1 steps along dy covering column x.',
      'Leg 3 (second row): γ - 1 - s steps along dx to reach corner C.',
      'Subgroup s is responsible for covering column x = ax + s * dx; agents settle only on nodes covered by their own subgroup.'
    ],
    formula: 's = \\alpha \\bmod \\gamma, \\quad \\text{Leg 1: } s, \\quad \\text{Leg 2: } \\gamma - 1, \\quad \\text{Leg 3: } \\gamma - 1 - s',
    keyTakeaways: [
      'The γ covered columns partition the square into γ non-overlapping vertical strips.',
      'All subgroups arrive at destination C simultaneously at round λ.'
    ],
    question: {
      prompt: 'Why does an agent only settle on nodes covered by its own subgroup?',
      options: [
        { text: 'To ensure each node in the square is assigned to exactly one subgroup without collision.', isCorrect: true, feedback: 'Correct! Lemma 3.1 proves that the γ covered columns partition the square with zero overlap.' },
        { text: 'Because agents cannot turn corners.', isCorrect: false, feedback: 'Incorrect. The Γ-shaped path has two turns.' }
      ]
    }
  },
  {
    id: 7,
    title: 'The Spread Phase & Settlement Handshake',
    subtitle: 'Dispersing active members and placing passive-settled markers',
    content: [
      'Spread is the phase where agents first settle.',
      'When the head of subgroup s enters an unblocked covered node, the lowest-ID moving agent becomes a claiming candidate for 1 round.',
      'In the next round, if no higher-labeled contender appears, the candidate transitions to passive-settled.',
      'The settled agent stores sweep metadata to act as a marker for future late adoption.',
      'If any moving agents remain when reaching corner C, they form the overflow and advance to Reverse.'
    ],
    keyTakeaways: [
      'A 1-round local claim handshake guarantees at most 1 agent settles per node.',
      'If no overflow remains at C, the entire group is dispersed.'
    ],
    question: {
      prompt: 'What happens to moving agents that reach destination C without having settled?',
      options: [
        { text: 'They disappear.', isCorrect: false, feedback: 'Agent conservation invariant ensures no agent disappears.' },
        { text: 'They form the overflow and transition to the Reverse phase.', isCorrect: true, feedback: 'Correct! The overflow initiates Reverse towards anchor A.' }
      ]
    }
  },
  {
    id: 8,
    title: 'The Reverse Phase',
    subtitle: 'Overflow rendezvous and backward retracing to anchor A',
    content: [
      'In Reverse, the overflow agents at C are re-ranked and re-assigned to subgroups using the same modulo rule s = α mod γ.',
      'Subgroups retrace their paths from corner C back to anchor A in λ rounds.',
      'On covered nodes:',
      '- Lower-labeled settled markers are claimed and overwritten in place, but remain passive-settled (they do not move).',
      '- Equal- or lower-labeled moving agents adopt the higher label and join the reversing group back to A.',
      'Reverse is strictly a moving-agent rendezvous phase, not a settlement phase.'
    ],
    keyTakeaways: [
      'Reverse synchronizes moving overflow agents at anchor A.',
      'Lower settled markers are claimed but never un-settled during Reverse.'
    ],
    question: {
      prompt: 'Does the Reverse phase un-settle and pick up existing settled markers?',
      options: [
        { text: 'No, markers are claimed/overwritten but remain settled until Collect.', isCorrect: true, feedback: 'Correct! Reverse only moves active agents; only Collect can un-settle markers.' },
        { text: 'Yes, all markers are immediately converted into moving agents.', isCorrect: false, feedback: 'Incorrect. Unsettling during Reverse would destroy territorial claims.' }
      ]
    }
  },
  {
    id: 9,
    title: 'The Collect Phase',
    subtitle: 'Gathering population and recruiting eligible markers from A to C',
    content: [
      'In Collect, members gathered at A are re-ranked and re-assigned to subgroups.',
      'Subgroups sweep from A back to corner C in λ rounds.',
      'Collect is the ONLY phase that recruits settled markers:',
      'When reaching an eligible same- or lower-labeled settled marker, the marker un-settles and joins the collecting subgroup!',
      'Collect settles nobody; it gathers all collected active agents co-located at C.'
    ],
    keyTakeaways: [
      'Collect enlarges active mass by reclaiming previously placed markers.',
      'Surviving collected members all arrive at C for active mass recount.'
    ],
    question: {
      prompt: 'What is the primary function of the Collect phase?',
      options: [
        { text: 'To permanently settle all active agents.', isCorrect: false, feedback: 'Collect settles nobody.' },
        { text: 'To recruit eligible settled markers and moving agents, gathering them at C.', isCorrect: true, feedback: 'Correct! Collect enlarges the group for the next cycle.' }
      ]
    }
  },
  {
    id: 10,
    title: 'Higher-Label Encounters & Priority Rules',
    subtitle: 'Lexicographical arbitration during moving encounters',
    content: [
      'Whenever two moving groups meet during Spread, Reverse, or Collect: the higher label wins.',
      'Co-located lower-labeled moving agents adopt the winning label and join the winner subgroup at its current step.',
      'Non-co-located agents of the losing label are unchanged: they settle on free nodes or form a smaller overflow remnant.',
      'The winner’s sweep parameters (γ, subgroups) are not rebuilt mid-cycle; size updates wait until reaching corner C.'
    ],
    formula: '\\Lambda_{hi} \\succ \\Lambda_{lo} \\implies a_{lo}.\\text{label} \\gets \\Lambda_{hi}, \\quad a_{lo}.\\text{contact} \\gets \\text{true}',
    keyTakeaways: [
      'Higher label wins all clashes.',
      'Winning sweep structure is preserved mid-cycle to prevent chaotic resizing.'
    ],
    question: {
      prompt: 'When a moving agent is absorbed by a higher-labeled group, is the winner’s γ recalculated mid-cycle?',
      options: [
        { text: 'No, active mass and γ are recomputed only at destination C at cycle end.', isCorrect: true, feedback: 'Correct! Postponing recount until C maintains geometric synchronization.' },
        { text: 'Yes, γ is updated immediately after every absorption.', isCorrect: false, feedback: 'Incorrect. Rebuilding mid-cycle would de-synchronize parallel subgroups.' }
      ]
    }
  },
  {
    id: 11,
    title: 'Partial Absorption & Group Splitting',
    subtitle: 'Why partial spatial overlap does not destroy an entire lower group',
    content: [
      'A group occupies a γ x γ square via γ subgroups.',
      'A higher-labeled group H may intersect only a subset of these columns.',
      'Only the subgroups that physically intersect H are absorbed or marked contacted.',
      'Subgroups outside the overlap continue sweeping independently, settling on free nodes or forming an independent overflow.',
      'The contacted part cannot raise its old label; non-contacted parts may still promote if they gather enough agents.'
    ],
    keyTakeaways: [
      'Partial absorption gracefully partitions lower groups.',
      'Contacted paths become losing remnants with non-promoting certificates.'
    ],
    question: {
      prompt: 'If a higher group overlaps only 2 out of 6 columns of a lower group, what happens to the other 4 columns?',
      options: [
        { text: 'The other 4 columns continue their sweep independently.', isCorrect: true, feedback: 'Correct! Subgroups outside the overlap proceed with their assigned paths.' },
        { text: 'All 6 columns are immediately destroyed.', isCorrect: false, feedback: 'Incorrect. Absorption is local to co-located and contacted paths.' }
      ]
    }
  },
  {
    id: 12,
    title: 'Late Adoption from Settled Markers',
    subtitle: 'Reading stored sweep metadata to catch up with higher groups',
    content: [
      'Settled markers store: label Λ, γ, anchor A, ideal corner C*, direction δ, subgroup s, step q when head left, and settling round r_set.',
      'When a lower moving agent enters this node at round r, it computes marker age = r - r_set.',
      'Using age and step q, it predicts which phase the higher head is currently in:',
      '- Case A: Head in Spread -> follow path to join head.',
      '- Case B: Head in Reverse/Collect -> join active phase traffic.',
      '- Case C: Missed live traffic -> continue to corner C and wait up to 2γ rounds.'
    ],
    formula: '\\text{age} = r - r_{set}, \\quad \\text{step}_{total} = q + \\text{age}',
    keyTakeaways: [
      'Markers act as asynchronous signposts enabling late adopters to catch up.',
      'Late adopters mark their old subgroup as contacted and adopt the higher label.'
    ],
    question: {
      prompt: 'What formula does a late adopter use to determine the elapsed rounds since the marker settled?',
      options: [
        { text: 'age = r - r_set (current round minus settling round)', isCorrect: true, feedback: 'Correct! This local difference allows deterministic phase prediction.' },
        { text: 'age = r * r_set', isCorrect: false, feedback: 'Incorrect.' }
      ]
    }
  },
  {
    id: 13,
    title: 'Recovery Reverse–Collect Cycle',
    subtitle: 'Preventing stranded adopters when live traffic is missed',
    content: [
      'If late adopters arrive at corner C after traffic passed, they wait up to 2γ rounds for an ordinary Collect.',
      'If an ordinary Collect arrives, they merge into it with no extra cycle.',
      'If timeout elapses, the largest-ID waiting adopter initiates exactly ONE Recovery Reverse–Collect cycle.',
      'Recovery runs an ordinary Reverse followed by an ordinary Collect using stored marker variables.',
      'Crucially, a recovery cycle NEVER promotes by itself: it collects agents but does not raise level or certificate.'
    ],
    keyTakeaways: [
      'Unique largest-ID initiator prevents duplicate recovery sweeps.',
      'Recovery cycles synchronize stranded adopters without inflating certificates.'
    ],
    question: {
      prompt: 'Can a Recovery Reverse–Collect cycle trigger a level-up by itself?',
      options: [
        { text: 'No, recovery cycles never promote on their own.', isCorrect: true, feedback: 'Correct! Lemma 4.4 prevents lower recovery cycles from inflating certificates.' },
        { text: 'Yes, any cycle can level up if it collects enough agents.', isCorrect: false, feedback: 'Incorrect. Only clean ordinary cycles satisfying m_after >= 2c can level up.' }
      ]
    }
  },
  {
    id: 14,
    title: 'Boundary Bouncing & Whole-Grid Sweep',
    subtitle: 'Local boundary reflection without global grid size knowledge',
    content: [
      'Agents do not know grid size n. A boundary is detected locally when a required outgoing port is missing.',
      'Boundary Bounce (γ <= √n):',
      '- Set new anchor A = C.',
      '- Flip hit axes: dx <- -dx if x clipped, dy <- -dy if y clipped.',
      '- Retain level, certificate, active mass, and γ; begin new Spread inward.',
      'Terminating Whole-Grid Sweep (γ > √n):',
      '- If a sweep starting from a corner clips on both axes, γ exceeds grid side √n.',
      '- Active members settle across the grid according to coverage and terminate.'
    ],
    keyTakeaways: [
      'Boundary bounce reflects sweeps back into the interior in at most 4 bounces (Lemma 4.5).',
      'The algorithm runs identically on an infinite grid where boundaries never occur.'
    ],
    question: {
      prompt: 'How many boundary bounces can a group undergo before its next clean Spread while γ <= √n?',
      options: [
        { text: 'At most 4 boundary bounces.', isCorrect: true, feedback: 'Correct! Lemma 4.5 proves a maximum of 4 bounces.' },
        { text: 'Infinite bounces.', isCorrect: false, feedback: 'Incorrect. Bounding to at most 4 bounces is vital for the O(√k) complexity.' }
      ]
    }
  },
  {
    id: 15,
    title: 'Certificate Doubling & Level-Up',
    subtitle: 'Hierarchical doubling guaranteeing logarithmic level depth',
    content: [
      'At destination C after a clean Collect with m_after active members:',
      'If the path is clean (never contacted a higher label) AND m_after >= 2c:',
      '- Certificate updates: c <- m_after.',
      '- Level increments: ℓ <- ℓ + 1.',
      'Because the certificate at least doubles at each level-up, a group can level up at most O(log k) times.',
      'Geometric double flip: (dx, dy) <- (-dx, -dy) sends next sweep back through the exposed slack.'
    ],
    formula: 'm_{after} \\ge 2c \\implies c \\gets m_{after}, \\ \\ell \\gets \\ell + 1, \\quad c \\ge 2^\\ell',
    keyTakeaways: [
      'Certificate tracks genuine population doubling, preventing premature expansion.',
      'Total levels bounded by ceil(log2(k)).'
    ],
    question: {
      prompt: 'If a group currently has certificate c = 8, what active mass m_after is required to trigger a level-up?',
      options: [
        { text: 'At least 16 agents (m_after >= 2 * 8 = 16).', isCorrect: true, feedback: 'Correct! The doubling condition requires m_after >= 2c.' },
        { text: 'At least 9 agents.', isCorrect: false, feedback: 'Incorrect. Merely gaining 1 agent does not double the certificate.' }
      ]
    }
  },
  {
    id: 16,
    title: 'Theoretical Guarantees & Optimal Bounds',
    subtitle: 'Achieving O(√k) synchronous rounds and O(log k) bits memory',
    content: [
      'Time Complexity: Theorem 4.8 proves SRC terminates in O(√k) rounds.',
      'Proof intuition: Level ℓ costs O(2^(ℓ/2)) rounds. Summing the geometric series over ℓ <= log2(k) yields O(√k).',
      'This matches the lower bound Ω(√k) (Theorem 2.1), closing the open problem from Kshemkalyani et al.',
      'Memory Complexity: Storing IDs, levels, relative displacements, and counters requires O(log k) bits per agent, matching the memory lower bound.',
      'Boundary Independence: Runs unchanged on infinite oriented grids.'
    ],
    formula: '\\sum_{\\ell \\le \\log_2 k} O(2^{\\ell / 2}) = O(\\sqrt{k}) \\text{ rounds}, \\quad O(\\log k) \\text{ persistent bits per agent}',
    keyTakeaways: [
      'Optimal time O(√k) in the local communication model.',
      'Optimal memory O(log k) persistent bits per agent.'
    ],
    question: {
      prompt: 'What is the round complexity of SRC for dispersing k agents on an oriented square grid?',
      options: [
        { text: 'O(√k) rounds, matching the theoretical lower bound.', isCorrect: true, feedback: 'Correct! SRC achieves the optimal O(√k) time bound.' },
        { text: 'O(k) rounds.', isCorrect: false, feedback: 'Incorrect. O(k) is linear; SRC achieves optimal sublinear O(√k).' }
      ]
    }
  }
];
