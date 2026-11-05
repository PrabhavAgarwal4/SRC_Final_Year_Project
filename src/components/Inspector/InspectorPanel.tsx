import React, { useState, useEffect } from 'react';
import { useSimulationStore } from '../../state/simulationStore';
import { AgentInspector } from './AgentInspector';
import { GroupInspector } from './GroupInspector';
import { SubgroupInspector } from './SubgroupInspector';
import { NodeInspector } from './NodeInspector';
import { User, Users, Network, MapPin, Award } from 'lucide-react';

export const InspectorPanel: React.FC = () => {
  const {
    currentState,
    selectedAgentId,
    selectedGroupId,
    selectedNode,
    selectGroup,
  } = useSimulationStore();

  const [activeTab, setActiveTab] = useState<'agent' | 'group' | 'subgroups' | 'node'>('agent');

  // Auto-switch tabs when selection changes
  useEffect(() => {
    if (selectedAgentId !== null) {
      setActiveTab('agent');
    }
  }, [selectedAgentId]);

  useEffect(() => {
    if (selectedNode !== null) {
      setActiveTab('node');
    }
  }, [selectedNode]);

  const selectedAgent = currentState.agents.find(a => a.id === selectedAgentId);
  const selectedGroup =
    currentState.groups.find(g => g.id === selectedGroupId) ||
    (selectedAgent
      ? currentState.groups.find(g => g.id === selectedAgent.groupId)
      : currentState.groups[0]);

  return (
    <div className="w-80 h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col z-10 shadow-sm">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-xs">
        <button
          onClick={() => setActiveTab('agent')}
          className={`flex-1 py-2.5 flex items-center justify-center space-x-1 border-b-2 transition-colors ${
            activeTab === 'agent'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-semibold bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Agent</span>
        </button>

        <button
          onClick={() => setActiveTab('group')}
          className={`flex-1 py-2.5 flex items-center justify-center space-x-1 border-b-2 transition-colors ${
            activeTab === 'group'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-semibold bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Group</span>
        </button>

        <button
          onClick={() => setActiveTab('subgroups')}
          className={`flex-1 py-2.5 flex items-center justify-center space-x-1 border-b-2 transition-colors ${
            activeTab === 'subgroups'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-semibold bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Subgroups</span>
        </button>

        <button
          onClick={() => setActiveTab('node')}
          className={`flex-1 py-2.5 flex items-center justify-center space-x-1 border-b-2 transition-colors ${
            activeTab === 'node'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400 font-semibold bg-white dark:bg-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Node</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'agent' && (
          selectedAgent ? (
            <AgentInspector agent={selectedAgent} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs p-4">
              <User className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
              <span>Click on any agent on the grid to inspect its state, label, and history.</span>
            </div>
          )
        )}

        {activeTab === 'group' && (
          selectedGroup ? (
            <GroupInspector group={selectedGroup} />
          ) : (
            <div className="text-center text-slate-400 text-xs p-4">No active groups.</div>
          )
        )}

        {activeTab === 'subgroups' && (
          selectedGroup ? (
            <SubgroupInspector group={selectedGroup} />
          ) : (
            <div className="text-center text-slate-400 text-xs p-4">No active groups.</div>
          )
        )}

        {activeTab === 'node' && (
          selectedNode ? (
            <NodeInspector node={selectedNode} agents={currentState.agents} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs p-4">
              <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
              <span>Click on any grid intersection to inspect node occupancy and markers.</span>
            </div>
          )
        )}
      </div>
    </div>
  );
};
