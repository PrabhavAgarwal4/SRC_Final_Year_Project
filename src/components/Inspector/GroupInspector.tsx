import React from 'react';
import { Group } from '../../engine/model/Group';
import { formatLabel } from '../../engine/model/Label';
import { coordToString } from '../../engine/model/Grid';
import { formatPhaseName } from '../../utils/formatting';

interface GroupInspectorProps {
  group: Group;
}

export const GroupInspector: React.FC<GroupInspectorProps> = ({ group }) => {
  return (
    <div className="space-y-3 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <span
            className="w-3.5 h-3.5 rounded-full"
            style={{ backgroundColor: group.color }}
          />
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            Group {group.id}
          </span>
        </div>
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
          {formatLabel(group.label)}
        </span>
      </div>

      {/* Grid stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-400">Current Phase</div>
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            {formatPhaseName(group.phase)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Phase Length: λ = {group.phaseLength}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-400">Active / Settled</div>
          <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
            {group.activeMemberIds.length} active / {group.settledMemberIds.length} settled
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Overflow: {group.overflowMemberIds.length}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-400">Sweep Param γ</div>
          <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
            γ = {group.gamma} <span className="text-slate-400 font-normal">({group.subgroups.length} subgroups)</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Square Area: γ² = {group.gamma * group.gamma}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-400">Bounces & Excess</div>
          <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
            {group.bouncesCount} bounces
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Excess: tx={group.boundaryExcessX}, ty={group.boundaryExcessY}
          </div>
        </div>
      </div>

      {/* Sweep Coordinates */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-800 space-y-1">
        <div className="font-semibold text-slate-700 dark:text-slate-300">Sweep Points</div>
        <div className="grid grid-cols-3 gap-1 font-mono text-[11px]">
          <div>
            <span className="text-slate-400">Anchor A:</span> {coordToString(group.anchor)}
          </div>
          <div>
            <span className="text-slate-400">Ideal C*:</span> {coordToString(group.idealCorner)}
          </div>
          <div>
            <span className="text-slate-400">Corner C:</span> {coordToString(group.realizedCorner)}
          </div>
        </div>
      </div>

      {/* Clean path status */}
      <div className="flex items-center justify-between p-2 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <span className="text-slate-600 dark:text-slate-400">Subgroup Path Status:</span>
        <span
          className={`font-semibold ${
            group.isClean
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          {group.isClean ? 'Clean (Promotable)' : 'Contacted Higher Label'}
        </span>
      </div>
    </div>
  );
};
