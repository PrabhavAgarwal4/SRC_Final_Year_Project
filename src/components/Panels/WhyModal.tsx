import React from 'react';
import { useSimulationStore } from '../../state/simulationStore';
import { formatLabel } from '../../engine/model/Label';
import { coordToString } from '../../engine/model/Grid';
import { HelpCircle, X, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const WhyModal: React.FC = () => {
  const { isWhyModalOpen, selectedEventForWhy, closeWhyModal } = useSimulationStore();

  if (!isWhyModalOpen || !selectedEventForWhy) return null;

  const ev = selectedEventForWhy;
  const expl = ev.explanation;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Algorithmic Explanation Engine
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Round {ev.round} • {ev.type} • {ev.phase} Phase
              </p>
            </div>
          </div>
          <button
            onClick={closeWhyModal}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 5-Step Breakdown from Part 11 */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Summary Banner */}
          <div className="p-3 bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 rounded-lg">
            <div className="font-semibold text-brand-900 dark:text-brand-200 mb-0.5">
              {ev.summary}
            </div>
            <div className="text-brand-700 dark:text-brand-400 text-[11px]">
              {ev.reason}
            </div>
          </div>

          {/* 1. What happened? */}
          <div className="space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                1
              </span>
              <span>What happened?</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 pl-5.5 leading-relaxed">
              {expl.whatHappened}
            </p>
          </div>

          {/* 2. Which rule of SRC applies? */}
          <div className="space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                2
              </span>
              <span>Which rule of SRC applies?</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 pl-5.5 leading-relaxed font-mono bg-slate-50 dark:bg-slate-800/40 p-2 rounded border border-slate-200 dark:border-slate-800">
              {expl.ruleApplied}
            </p>
          </div>

          {/* 3. Why was this action selected? */}
          <div className="space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                3
              </span>
              <span>Why was this action selected?</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 pl-5.5 leading-relaxed">
              {expl.whyActionSelected}
            </p>
          </div>

          {/* 4. What state changed? */}
          <div className="space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                4
              </span>
              <span>What state changed?</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 pl-5.5 leading-relaxed">
              {expl.stateChanged}
            </p>
          </div>

          {/* 5. What should happen next? */}
          <div className="space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                5
              </span>
              <span>What should happen next?</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 pl-5.5 leading-relaxed">
              {expl.whatHappensNext}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex justify-end">
          <button
            onClick={closeWhyModal}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
