import React from 'react';
import { useSimulationStore } from '../../state/simulationStore';

export const Timeline: React.FC = () => {
  const { engine, jumpToRound } = useSimulationStore();
  const currentRound = engine.getCurrentRound();
  const totalRounds = engine.getTotalRounds();

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    jumpToRound(val);
  };

  return (
    <div className="flex-1 flex items-center space-x-3 px-2">
      <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400 min-w-8">
        R{currentRound}
      </span>

      <div className="flex-1 relative flex items-center">
        <input
          type="range"
          min={0}
          max={Math.max(1, totalRounds)}
          value={currentRound}
          onChange={handleSliderChange}
          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-brand-500 hover:accent-brand-600 transition-colors"
        />
      </div>

      <span className="font-mono text-xs text-slate-400 min-w-8 text-right">
        /{totalRounds}
      </span>
    </div>
  );
};
