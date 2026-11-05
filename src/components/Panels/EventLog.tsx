import React from 'react';
import { SimulationEvent } from '../../engine/events/SimulationEvent';
import { useSimulationStore } from '../../state/simulationStore';
import { HelpCircle, Bell } from 'lucide-react';

interface EventLogProps {
  events: SimulationEvent[];
}

export const EventLog: React.FC<EventLogProps> = ({ events }) => {
  const { openWhyModal } = useSimulationStore();

  if (events.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
        <Bell className="w-6 h-6 text-slate-300 dark:text-slate-700 mb-1" />
        <span>No events recorded for this round. Advance or play to observe algorithmic transitions.</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-2 p-2 text-xs">
      {events.map(ev => (
        <div
          key={ev.id}
          className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-start justify-between space-x-2"
        >
          <div className="space-y-1 flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                R{ev.round}
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {ev.type}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400">
                {ev.phase}
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-snug">
              {ev.summary}
            </p>
          </div>

          <button
            onClick={() => openWhyModal(ev)}
            className="px-2 py-1 rounded bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-[11px] font-medium flex items-center space-x-1 shrink-0 transition-colors"
            title="Inspect Algorithmic Decision & Theory"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Why?</span>
          </button>
        </div>
      ))}
    </div>
  );
};
