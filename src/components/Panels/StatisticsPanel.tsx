import React from 'react';
import { SimulationStatistics } from '../../engine/model/SimulationState';
import { BarChart3, Clock, Cpu, CheckCircle } from 'lucide-react';

interface StatisticsPanelProps {
  statistics: SimulationStatistics;
  round: number;
  isDispersed: boolean;
}

export const StatisticsPanel: React.FC<StatisticsPanelProps> = ({
  statistics,
  round,
  isDispersed,
}) => {
  const k = statistics.totalAgents;
  const n = statistics.gridNodes;
  const sqrtK = Math.ceil(Math.sqrt(k));

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 text-xs">
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-blue-500/10 text-brand-500">
            <BarChart3 className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white">
            Theory & Empirical Metrics
          </span>
        </div>
        {isDispersed && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            OPTIMAL FINISH
          </span>
        )}
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 font-mono">
        <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-400 font-sans">Observed Rounds</div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {round} rounds
          </div>
          <div className="text-[10px] text-slate-400 font-sans mt-0.5">
            Theory target: O(√k) ≈ {sqrtK}
          </div>
        </div>

        <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-400 font-sans">Settled / Total (k)</div>
          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {statistics.settledCount} / {k} ({Math.round((statistics.settledCount / k) * 100)}%)
          </div>
          <div className="text-[10px] text-slate-400 font-sans mt-0.5">
            Active remaining: {statistics.activeCount}
          </div>
        </div>

        <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-400 font-sans">Max Level & Groups</div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Level {statistics.highestLevel} ({statistics.groupsCount} grps)
          </div>
          <div className="text-[10px] text-slate-400 font-sans mt-0.5">
            Max bound: ⌈log₂ k⌉ = {Math.ceil(Math.log2(k || 1))}
          </div>
        </div>

        <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-400 font-sans">Bounces & Late Adoptions</div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {statistics.bouncesCount} bnc / {statistics.lateAdoptionsCount} adpt
          </div>
          <div className="text-[10px] text-slate-400 font-sans mt-0.5">
            Recovery cycles: {statistics.recoveryCyclesCount}
          </div>
        </div>
      </div>

      {/* Theoretical Guarantees Box */}
      <div className="p-2.5 rounded bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/50 space-y-1">
        <div className="font-semibold text-brand-900 dark:text-brand-300 flex items-center space-x-1">
          <Cpu className="w-3.5 h-3.5" />
          <span>Paper Theoretical Bounds (Theorem 4.8 & 4.11):</span>
        </div>
        <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-brand-800 dark:text-brand-300">
          <li>
            <strong>Time Complexity:</strong> O(√k) synchronous rounds. Matches Ω(√k) lower bound.
          </li>
          <li>
            <strong>Memory per Agent:</strong> O(log k) persistent bits (relative coordinate storage).
          </li>
          <li>
            <strong>Boundary Independence:</strong> Requires 0 knowledge of n; runs on infinite grids.
          </li>
        </ul>
      </div>
    </div>
  );
};
