import React from 'react';
import { useSimulationStore, PlaybackSpeed } from '../../state/simulationStore';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const PlaybackControls: React.FC = () => {
  const {
    isPlaying,
    speed,
    play,
    pause,
    setSpeed,
    stepForward,
    stepBackward,
    jumpToRound,
    engine,
  } = useSimulationStore();

  const totalRounds = engine.getTotalRounds();
  const currentRound = engine.getCurrentRound();

  const speeds: PlaybackSpeed[] = [0.25, 0.5, 1, 2, 4];

  return (
    <div className="flex items-center space-x-3">
      {/* Rewind to Start */}
      <button
        onClick={() => jumpToRound(0)}
        disabled={currentRound === 0}
        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 dark:text-slate-300 transition-colors"
        title="Jump to Start (Round 0)"
      >
        <SkipBack className="w-4 h-4" />
      </button>

      {/* Step Backward 1 round */}
      <button
        onClick={stepBackward}
        disabled={!engine.canStepBackward()}
        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 dark:text-slate-300 transition-colors"
        title="Step Backward (Previous Round)"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Play / Pause */}
      <button
        onClick={isPlaying ? pause : play}
        className={`p-2.5 rounded-full transition-transform active:scale-95 text-white ${
          isPlaying
            ? 'bg-amber-500 hover:bg-amber-600'
            : 'bg-brand-600 hover:bg-brand-700'
        } shadow-sm`}
        title={isPlaying ? 'Pause' : 'Play Simulation'}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      {/* Step Forward 1 round */}
      <button
        onClick={stepForward}
        disabled={!engine.canStepForward()}
        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 dark:text-slate-300 transition-colors"
        title="Step Forward (Next Round)"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Jump to Latest Round */}
      <button
        onClick={() => jumpToRound(totalRounds)}
        disabled={currentRound === totalRounds}
        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-700 dark:text-slate-300 transition-colors"
        title="Jump to Latest Recorded Round"
      >
        <SkipForward className="w-4 h-4" />
      </button>

      <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

      {/* Speed Selector */}
      <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
        {speeds.map(s => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-1.5 py-0.5 text-[11px] font-mono rounded transition-colors ${
              speed === s
                ? 'bg-white dark:bg-slate-700 font-bold text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
};
