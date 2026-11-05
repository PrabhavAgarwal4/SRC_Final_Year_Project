import React from 'react';
import { Agent } from '../../engine/model/Agent';
import { formatLabel } from '../../engine/model/Label';
import { coordToString } from '../../engine/model/Grid';

interface AgentInspectorProps {
  agent: Agent;
}

export const AgentInspector: React.FC<AgentInspectorProps> = ({ agent }) => {
  return (
    <div className="space-y-3 text-xs">
      {/* Header with ID and Status */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            Agent #{agent.id}
          </span>
          {agent.isLeader && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              LEADER
            </span>
          )}
        </div>
        <span
          className={`px-2 py-0.5 rounded-full font-medium capitalize text-[11px] ${
            agent.status === 'settled'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : agent.status === 'claiming'
              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 animate-pulse'
              : 'bg-brand-500/15 text-brand-600 dark:text-brand-400'
          }`}
        >
          {agent.status}
        </span>
      </div>

      {/* Grid attributes */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-400">Position</div>
          <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
            {coordToString(agent.currentPos)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Initial: {coordToString(agent.initialPos)}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-400">Label Λ = (ℓ, c, id)</div>
          <div className="font-mono font-bold text-brand-600 dark:text-brand-400">
            {formatLabel(agent.label)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Group: {agent.groupId}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-400">Subgroup & Rank</div>
          <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
            s = {agent.subgroup} <span className="text-slate-400 font-normal">(Rank {agent.rank})</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Step: {agent.step}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] text-slate-400">Direction & Mass</div>
          <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
            δ = ({agent.dir.dx}, {agent.dir.dy})
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Active mass m = {agent.mass}
          </div>
        </div>
      </div>

      {/* Sweep bounds */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded border border-slate-200 dark:border-slate-800 space-y-1">
        <div className="font-semibold text-slate-700 dark:text-slate-300">Sweep Coordinates</div>
        <div className="grid grid-cols-3 gap-1 font-mono text-[11px]">
          <div>
            <span className="text-slate-400">Anchor A:</span> {coordToString(agent.anchor)}
          </div>
          <div>
            <span className="text-slate-400">Ideal C*:</span> {coordToString(agent.idealCorner)}
          </div>
          <div>
            <span className="text-slate-400">Corner C:</span> {coordToString(agent.destination)}
          </div>
        </div>
      </div>

      {/* Settled Marker Metadata */}
      {agent.settleMeta && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded border border-emerald-200 dark:border-emerald-800/50 space-y-1">
          <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <span>Stored Marker Record</span>
            <span className="text-[10px] font-mono">Settled Round {agent.settleMeta.round}</span>
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
            Head left at step: {agent.settleMeta.stepWhenHeadLeft} | Subgroup: {agent.settleMeta.storedSubgroup} | Epoch: {agent.settleMeta.storedEpoch}
          </div>
        </div>
      )}

      {/* Late Adoption Status */}
      {agent.lateAdoption && (
        <div className="bg-purple-50 dark:bg-purple-950/30 p-2 rounded border border-purple-200 dark:border-purple-800/50 space-y-1">
          <div className="font-semibold text-purple-800 dark:text-purple-300">
            Late Adoption Status
          </div>
          <div className="text-[11px] text-purple-700 dark:text-purple-400">
            Predicted Phase: {agent.lateAdoption.predictedPhase} (Step {agent.lateAdoption.predictedStep})
          </div>
          {agent.lateAdoption.predictedPhase === 'WaitAtC' && (
            <div className="text-[11px] text-purple-600 dark:text-purple-300">
              Waiting at C timeout: {agent.lateAdoption.waitTimer} rounds
            </div>
          )}
        </div>
      )}
    </div>
  );
};
