import React from 'react';
import { useSimulationStore } from '../../state/simulationStore';
import { formatPhaseName, getPhaseBadgeColor } from '../../utils/formatting';
import {
  Compass,
  BookOpen,
  Library,
  Sliders,
  RotateCcw,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentScenario,
    currentState,
    theme,
    toggleTheme,
    reset,
    openTutorial,
    openScenarioLibrary,
    openScenarioEditor,
  } = useSimulationStore();

  const mainGroup = currentState.groups[0];
  const activePhase = mainGroup ? mainGroup.phase : 'Spread';

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between z-20">
      {/* Brand & Scenario */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400 font-bold text-lg tracking-tight">
          <div className="p-1.5 bg-brand-500/10 dark:bg-brand-400/10 rounded-lg border border-brand-500/20">
            <Compass className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <span>SRC Visualizer</span>
        </div>

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

        <div className="flex items-center space-x-2">
          <button
            onClick={openScenarioLibrary}
            className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors border border-slate-300/50 dark:border-slate-700"
          >
            <Library className="w-3.5 h-3.5 text-brand-500" />
            <span className="font-semibold text-slate-900 dark:text-white">
              #{currentScenario.number}: {currentScenario.title}
            </span>
          </button>

          <span className="text-xs text-slate-400">
            {currentState.gridWidth}×{currentState.gridHeight} Grid ({currentState.statistics.totalAgents} agents)
          </span>
        </div>
      </div>

      {/* Middle Status Indicators */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs font-mono">
          <span className="text-slate-400">ROUND</span>
          <span className="font-bold text-brand-600 dark:text-brand-400 text-sm">
            {currentState.round}
          </span>
        </div>

        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md border text-xs font-medium ${getPhaseBadgeColor(
            activePhase
          )}`}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span>{formatPhaseName(activePhase)}</span>
        </div>

        {currentState.isDispersed && (
          <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold animate-bounce">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Dispersed!</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => openTutorial(1)}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 transition-colors"
          title="Interactive Guided Course"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Tutorial</span>
        </button>

        <button
          onClick={openScenarioEditor}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
          title="Create Custom Initial Placement"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Custom</span>
        </button>

        <button
          onClick={reset}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          title="Reset Simulation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
