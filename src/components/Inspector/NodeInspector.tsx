import React from 'react';
import { Coord, coordToString } from '../../engine/model/Grid';
import { Agent } from '../../engine/model/Agent';
import { formatLabel } from '../../engine/model/Label';
import { useSimulationStore } from '../../state/simulationStore';

interface NodeInspectorProps {
  node: Coord;
  agents: Agent[];
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({ node, agents }) => {
  const { selectAgent } = useSimulationStore();
  const occupants = agents.filter(
    a => a.currentPos.x === node.x && a.currentPos.y === node.y
  );

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <span className="font-bold text-sm text-slate-900 dark:text-white">
          Grid Node {coordToString(node)}
        </span>
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {occupants.length} {occupants.length === 1 ? 'agent' : 'agents'}
        </span>
      </div>

      {occupants.length === 0 ? (
        <div className="p-4 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded border border-dashed border-slate-200 dark:border-slate-800">
          This node is currently empty.
        </div>
      ) : (
        <div className="space-y-2">
          {occupants.map(ag => (
            <div
              key={ag.id}
              onClick={() => selectAgent(ag.id)}
              className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-brand-500 bg-slate-50 dark:bg-slate-800/40 cursor-pointer transition-colors space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Agent #{ag.id}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold capitalize ${
                    ag.status === 'settled'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'bg-brand-500/15 text-brand-600 dark:text-brand-400'
                  }`}
                >
                  {ag.status}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Label: {formatLabel(ag.label)} | Subgroup: {ag.subgroup}
              </div>
              {ag.settleMeta && (
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                  Settled at round {ag.settleMeta.round} (Marker for Group {ag.groupId})
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
