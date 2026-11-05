import { create } from 'zustand';
import { SimulationEngine, InitialAgentPlacement } from '../engine/simulation/simulationEngine';
import { SimulationState } from '../engine/model/SimulationState';
import { SimulationEvent } from '../engine/events/SimulationEvent';
import { PRESET_SCENARIOS, PresetScenario } from '../scenarios/presetScenarios';
import { Coord } from '../engine/model/Grid';
import confetti from 'canvas-confetti';

export type PlaybackSpeed = 0.25 | 0.5 | 1 | 2 | 4;

interface SimulationStore {
  // Scenario & Engine
  currentScenario: PresetScenario;
  engine: SimulationEngine;
  currentState: SimulationState;

  // Playback
  isPlaying: boolean;
  speed: PlaybackSpeed;
  playTimerId: number | null;

  // Selections
  selectedAgentId: number | null;
  selectedGroupId: string | null;
  selectedSubgroupIndex: number | null;
  selectedNode: Coord | null;

  // Display toggles
  showSubgroupPaths: boolean;
  showCoverageGrid: boolean;
  showLabels: boolean;
  showLegend: boolean;

  // Modals & Panels
  isTutorialOpen: boolean;
  tutorialChapter: number;
  isScenarioLibraryOpen: boolean;
  isScenarioEditorOpen: boolean;
  isWhyModalOpen: boolean;
  selectedEventForWhy: SimulationEvent | null;

  // Theme
  theme: 'light' | 'dark';

  // Actions
  loadScenario: (scenario: PresetScenario) => void;
  stepForward: () => void;
  stepBackward: () => void;
  jumpToRound: (round: number) => void;
  play: () => void;
  pause: () => void;
  setSpeed: (speed: PlaybackSpeed) => void;
  reset: () => void;

  selectAgent: (id: number | null) => void;
  selectGroup: (id: string | null) => void;
  selectSubgroup: (index: number | null) => void;
  selectNode: (node: Coord | null) => void;

  togglePaths: () => void;
  toggleCoverage: () => void;
  toggleLabels: () => void;
  toggleLegend: () => void;
  toggleTheme: () => void;

  openTutorial: (chapterId?: number) => void;
  closeTutorial: () => void;
  setTutorialChapter: (ch: number) => void;

  openScenarioLibrary: () => void;
  closeScenarioLibrary: () => void;

  openScenarioEditor: () => void;
  closeScenarioEditor: () => void;

  openWhyModal: (event: SimulationEvent) => void;
  closeWhyModal: () => void;
}

const defaultScenario = PRESET_SCENARIOS[0];
const initialEngine = new SimulationEngine(
  defaultScenario.gridWidth,
  defaultScenario.gridHeight,
  defaultScenario.placements
);

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  currentScenario: defaultScenario,
  engine: initialEngine,
  currentState: initialEngine.getCurrentState(),

  isPlaying: false,
  speed: 1,
  playTimerId: null,

  selectedAgentId: null,
  selectedGroupId: null,
  selectedSubgroupIndex: null,
  selectedNode: null,

  showSubgroupPaths: true,
  showCoverageGrid: true,
  showLabels: true,
  showLegend: true,

  isTutorialOpen: false,
  tutorialChapter: 1,
  isScenarioLibraryOpen: false,
  isScenarioEditorOpen: false,
  isWhyModalOpen: false,
  selectedEventForWhy: null,

  theme: 'dark',

  loadScenario: (scenario: PresetScenario) => {
    get().pause();
    const newEngine = new SimulationEngine(
      scenario.gridWidth,
      scenario.gridHeight,
      scenario.placements
    );
    set({
      currentScenario: scenario,
      engine: newEngine,
      currentState: newEngine.getCurrentState(),
      selectedAgentId: null,
      selectedGroupId: null,
      selectedSubgroupIndex: null,
      selectedNode: null,
    });
  },

  stepForward: () => {
    const { engine } = get();
    if (engine.canStepForward()) {
      const nextState = engine.stepForward();

      // Check for level-up celebration event
      const levelUpEvent = nextState.events.find(e => e.type === 'LevelUp');
      if (levelUpEvent) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0284c7', '#38bdf8', '#f59e0b', '#10b981'],
        });
      }

      set({ currentState: nextState });
      if (nextState.isTerminated) {
        get().pause();
      }
    } else {
      get().pause();
    }
  },

  stepBackward: () => {
    const { engine } = get();
    if (engine.canStepBackward()) {
      const prevState = engine.stepBackward();
      set({ currentState: prevState });
    }
  },

  jumpToRound: (round: number) => {
    const { engine } = get();
    const targetState = engine.jumpToRound(round);
    set({ currentState: targetState });
  },

  play: () => {
    const { isPlaying, stepForward, speed } = get();
    if (isPlaying) return;

    const intervalMs = Math.round(1000 / speed);
    const timerId = window.setInterval(() => {
      const state = get().currentState;
      if (state.isTerminated) {
        get().pause();
      } else {
        stepForward();
      }
    }, intervalMs);

    set({ isPlaying: true, playTimerId: timerId });
  },

  pause: () => {
    const { playTimerId } = get();
    if (playTimerId !== null) {
      window.clearInterval(playTimerId);
    }
    set({ isPlaying: false, playTimerId: null });
  },

  setSpeed: (speed: PlaybackSpeed) => {
    const wasPlaying = get().isPlaying;
    get().pause();
    set({ speed });
    if (wasPlaying) {
      get().play();
    }
  },

  reset: () => {
    get().pause();
    const { engine } = get();
    engine.reset();
    set({
      currentState: engine.getCurrentState(),
      selectedAgentId: null,
      selectedGroupId: null,
      selectedSubgroupIndex: null,
      selectedNode: null,
    });
  },

  selectAgent: (id: number | null) => set({ selectedAgentId: id }),
  selectGroup: (id: string | null) => set({ selectedGroupId: id }),
  selectSubgroup: (index: number | null) => set({ selectedSubgroupIndex: index }),
  selectNode: (node: Coord | null) => set({ selectedNode: node }),

  togglePaths: () => set(s => ({ showSubgroupPaths: !s.showSubgroupPaths })),
  toggleCoverage: () => set(s => ({ showCoverageGrid: !s.showCoverageGrid })),
  toggleLabels: () => set(s => ({ showLabels: !s.showLabels })),
  toggleLegend: () => set(s => ({ showLegend: !s.showLegend })),
  toggleTheme: () => set(s => {
    const next = s.theme === 'light' ? 'dark' : 'light';
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: next };
  }),

  openTutorial: (chapterId = 1) => set({ isTutorialOpen: true, tutorialChapter: chapterId }),
  closeTutorial: () => set({ isTutorialOpen: false }),
  setTutorialChapter: (ch: number) => set({ tutorialChapter: ch }),

  openScenarioLibrary: () => set({ isScenarioLibraryOpen: true }),
  closeScenarioLibrary: () => set({ isScenarioLibraryOpen: false }),

  openScenarioEditor: () => set({ isScenarioEditorOpen: true }),
  closeScenarioEditor: () => set({ isScenarioEditorOpen: false }),

  openWhyModal: (event: SimulationEvent) =>
    set({ isWhyModalOpen: true, selectedEventForWhy: event }),
  closeWhyModal: () => set({ isWhyModalOpen: false, selectedEventForWhy: null }),
}));
