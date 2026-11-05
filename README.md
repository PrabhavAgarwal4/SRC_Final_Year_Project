# SRC Algorithm Visualizer
### Interactive Research Visualizer for Mobile-Agent Grid Dispersion

An interactive, research-grade visualization platform for the paper:  
**"Beyond the Boundary: Optimal Grid Dispersion by Spread, Reverse, and Collect"**  
*Manish Kumar, Anisur Rahaman Molla, Debasish Pattanayak, and Subhajit Pramanick (2026)*

---

## 1. Overview & Theoretical Highlights

The **Spread–Reverse–Collect (SRC)** algorithm solves deterministic mobile-agent dispersion on an anonymous oriented square grid $G = (V, E)$ in the local-communication CCM (Communicate–Compute–Move) model:
- **Optimal Time Complexity:** $O(\sqrt{k})$ synchronous rounds for any $k \le n$ agents, matching the $\Omega(\sqrt{k})$ lower bound.
- **Optimal Memory Complexity:** $O(\log k)$ persistent memory bits per agent (using relative-coordinate storage from anchors).
- **Boundary Independence:** Agents do not know the grid dimensions $n$ or population $k$. Boundary contact is detected locally when outgoing ports are absent, and the group reflects its sweep back inward. The algorithm runs unchanged on infinite oriented grids.

---

## 2. Key Features

1. **Standalone Algorithm Engine (`src/engine/`):**
   - Pure TypeScript simulation engine completely decoupled from React and DOM rendering.
   - Strict CCM synchrony (Communicate, Compute, Move) with simultaneous movement and deterministic arbitration.
2. **Interactive SVG Grid Visualizer:**
   - Multi-agent cluster rendering (handling co-located clusters and solo agents).
   - Real-time $\Gamma$-shaped subgroup path projections with 3 distinct legs: First Row, Column, and Second Row.
   - Anchor ($A$), Ideal Corner ($C^*$), and Realized Corner ($C$) visual markers.
   - Pan, zoom, node coordinates display, and visual legend.
3. **Comprehensive Inspector Suite:**
   - **Agent Inspector:** ID, level, certified size, leader status, active mass, current/initial coordinates, subgroup index, rank, step, and stored marker metadata.
   - **Group Inspector:** Group ID, color swatch, phase, phase length ($\lambda$), $\gamma$, active/settled/overflow counts, boundary excesses ($t_x, t_y$), and clean path status.
   - **Subgroup Inspector:** Detailed table of all $\gamma$ subgroups showing covered columns, heads, member IDs, and click-to-highlight paths.
   - **Node Inspector:** Coordinates, multi-agent occupancy, and marker records.
4. **Historical Time Travel & Replay:**
   - Play/pause, step forward, step backward, jump to start, jump to end, speed selection ($0.25\times, 0.5\times, 1\times, 2\times, 4\times$), and scrubbable timeline slider.
5. **Algorithmic Explanation Engine ("Why did this happen?"):**
   - Structured 5-point explanation for every milestone event:
     1. What happened?
     2. Which rule of SRC applies?
     3. Why was this action selected?
     4. What state changed?
     5. What should happen next?
6. **14 Predefined Research Scenarios:**
   - Covers clean cycles, subgroup ranking, partial absorption, marker overwriting during Reverse, moving absorption during Reverse, recruitment during Collect, boundary bounces, terminating whole-grid sweeps, late adoption, recovery Reverse–Collect, and certificate doubling.
7. **Custom Initial Configuration Editor:**
   - Allows users to configure custom grid sizes ($4\times 4$ to $12\times 12$), click intersections to build multi-agent clusters, and save/load scenarios via `localStorage`.
8. **16-Chapter Guided Course (Tutorial Mode):**
   - Full curriculum from dispersion foundations to asymptotic proofs, with formulas and interactive knowledge-check quizzes.
9. **Formal Invariant Validation Suite:**
   - Verifies agent conservation, valid grid coordinates, Lemma 4.9 (at most 1 settled agent per node), Lemma 4.3 (doubling invariant $c \ge 2^\ell$), and bounded bounces ($\le 4$).

---

## 3. Technology Stack

- **Framework:** React 18, TypeScript 5.7, Vite 6
- **Styling:** Tailwind CSS (Dark/Light mode support)
- **State Management:** Zustand
- **Icons:** Lucide React
- **Celebration Effects:** Canvas Confetti
- **Testing:** Vitest

---

## 4. Setup & Running Locally

Ensure Node.js ($\ge 18$) is installed.

### 4.1 Install Dependencies
```bash
npm install
```

### 4.2 Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4.3 Run Test Suite
```bash
npm test
```
Executes all 32 unit and scenario tests covering geometry, interaction resolution, phase execution, and invariants.

### 4.4 Build for Production
```bash
npm run build
```
Typechecks with `tsc` and generates the optimized production bundle in `dist/`.

---

## 5. Architecture & Code Structure

```
src/
├── engine/                       # Pure algorithmic engine (decoupled from UI)
│   ├── model/                    # Data models: Agent, Group, Subgroup, Label, Grid, SimulationState
│   ├── geometry/                 # Sweep bounds, Γ-path generation, boundary reflection
│   ├── interactions/             # Lexicographical comparison, settlement handshake, absorption, late adoption, recovery
│   ├── simulation/               # Synchronous CCM round execution & SimulationEngine
│   ├── events/                   # SimulationEvent model & structured explanation factory
│   └── validation/               # Invariant validation checks
├── state/                        # Zustand application state store (simulationStore.ts)
├── scenarios/                    # 14 Preset scenarios & localStorage persistence
├── components/
│   ├── Header/                   # Navigation bar, quick indicators, theme toggle
│   ├── Grid/                     # SVG grid, AgentRenderer, PathRenderer, GridControls
│   ├── Inspector/                # Agent, Group, Subgroup, and Node inspectors
│   ├── Controls/                 # Playback controls, scrubbable timeline, bottom drawer
│   ├── Panels/                   # Event log, WhyModal, CertificatePanel, StatisticsPanel
│   ├── Tutorial/                 # 16-chapter guided course modal & quizzes
│   └── Scenarios/                # Scenario library modal & custom configuration editor
└── utils/                        # Formatting and coordinate utilities
```

---

## 6. How to Add a New Scenario

To add a new preset scenario, append an entry to `PRESET_SCENARIOS` in `src/scenarios/presetScenarios.ts`:

```typescript
{
  id: 'scenario-custom',
  number: 15,
  title: 'My Custom Experiment',
  category: 'Interactions',
  description: 'Detailed description of the experiment.',
  gridWidth: 8,
  gridHeight: 8,
  placements: [
    { id: 101, pos: { x: 1, y: 1 } },
    { id: 102, pos: { x: 1, y: 1 } },
    { id: 201, pos: { x: 3, y: 2 } },
  ],
  expectedEvents: ['SweepStarted', 'AgentSettled'],
  expectedOutcome: 'Expected final dispersed configuration.',
  guidedExplanation: [
    'Explanation of key algorithmic steps.',
  ],
}
```

The new scenario will automatically appear in the Scenario Library and run in the unit test suite.

---

## 7. Theoretical Invariants & Guarantees

- **Doubling Invariant (Lemma 4.3):** Whenever a group attains level $\ell$, its certified size satisfies $c \ge 2^\ell$. Thus, no agent ever exceeds level $\lceil \log_2 k \rceil$.
- **Bounded Bounces (Lemma 4.5):** While $\gamma \le \sqrt{n}$, a group undergoes at most 4 boundary bounces before its next clean Spread.
- **Settlement Uniqueness (Lemma 4.9):** At each round, at most 1 settled agent occupies any grid node.
- **Overlap Resolution (Lemma 4.10):** Competing groups resolve ties lexicographically by label $\Lambda = (\ell, c, \text{id})$.
- **Complexity (Theorem 4.8 & 4.11):** Dispersion finishes in $O(\sqrt{k})$ rounds and $O(\log k)$ bits per agent from any initial placement $C_0$.
