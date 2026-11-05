import React from 'react';
import { Group } from '../../engine/model/Group';
import { useSimulationStore } from '../../state/simulationStore';
import { coordToString } from '../../engine/model/Grid';

interface SubgroupInspectorProps {
  group: Group;
}

export const SubgroupInspector: React.FC<SubgroupInspectorProps> = ({ group }) => {
  const { selectedSubgroupIndex, selectSubgroup } = useSimulationStore();

  return (
    <div className="space-y-2 text-xs">
      <div className="text-slate-500 dark:text-slate-400 text-[11px]">
        Showing {group.subgroups.length} subgroups for Group {group.id}. Click a row to highlight its path on the grid:
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/80 text-[10px] text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
              <th className="p-2">Subgroup (s)</th>
              <th className="p-2">Covered Col (x)</th>
              <th className="p-2">Head Node</th>
              <th className="p-2">Members</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {group.subgroups.map(sg => {
              const isSelected = selectedSubgroupIndex === sg.index;
              return (
                <tr
                  key={sg.index}
                  onClick={() => selectSubgroup(isSelected ? null : sg.index)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-brand-500/15 text-brand-700 dark:text-brand-300 font-medium'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <td className="p-2 font-mono font-bold">s = {sg.index}</td>
                  <td className="p-2 font-mono">x = {sg.coveredX}</td>
                  <td className="p-2 font-mono text-[11px]">{coordToString(sg.headPos)}</td>
                  <td className="p-2">
                    {sg.memberIds.length === 0 ? (
                      <span className="text-slate-400 italic">empty</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {sg.memberIds.map(id => (
                          <span
                            key={id}
                            className="px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]"
                          >
                            #{id}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
