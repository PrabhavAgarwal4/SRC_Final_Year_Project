import React from 'react';
import { Group } from '../../engine/model/Group';
import { formatLabel } from '../../engine/model/Label';
import { Award, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';

interface CertificatePanelProps {
  group: Group;
}

export const CertificatePanel: React.FC<CertificatePanelProps> = ({ group }) => {
  const { label, mass, gamma, isClean } = group;
  const doublingTarget = 2 * label.certificate;
  const satisfiesDoubling = mass >= doublingTarget;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 text-xs">
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded bg-amber-500/10 text-amber-500">
            <Award className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white">
            Certificate & Level Status
          </span>
        </div>
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
          Level {label.level}
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-400">Certified Size (c)</div>
          <div className="font-mono text-base font-bold text-slate-800 dark:text-slate-100">
            {label.certificate}
          </div>
        </div>

        <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-400">Active Mass (m)</div>
          <div className="font-mono text-base font-bold text-brand-600 dark:text-brand-400">
            {mass}
          </div>
        </div>

        <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-400">Sweep Param (γ)</div>
          <div className="font-mono text-base font-bold text-slate-800 dark:text-slate-100">
            {gamma}
          </div>
        </div>
      </div>

      {/* Doubling Condition Analysis */}
      <div className="p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 space-y-1.5">
        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
          <span>Promotion Doubling Rule:</span>
          <span className="font-mono text-[11px] text-slate-500">
            m_after ≥ 2c ({doublingTarget})
          </span>
        </div>

        <div className="flex items-center space-x-1.5 text-[11px]">
          {satisfiesDoubling ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          )}
          <span className="text-slate-600 dark:text-slate-300">
            {satisfiesDoubling
              ? `Population condition satisfied (${mass} >= ${doublingTarget}).`
              : `Population condition not met (${mass} < ${doublingTarget}).`}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 text-[11px]">
          {isClean ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          )}
          <span className="text-slate-600 dark:text-slate-300">
            {isClean
              ? 'Path is clean (no higher label contacted).'
              : 'Path contacted higher label; non-promoting losing remnant.'}
          </span>
        </div>
      </div>

      {/* Invariant Note */}
      <div className="text-[10px] text-slate-400 leading-tight">
        <strong>Lemma 4.3 (Doubling Invariant):</strong> c ≥ 2^ℓ. Level increments strictly require doubling the certified base, bounding total levels to O(log k).
      </div>
    </div>
  );
};
