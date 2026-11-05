import React, { useState } from 'react';
import { PlaybackControls } from './PlaybackControls';
import { Timeline } from './Timeline';
import { useSimulationStore } from '../../state/simulationStore';
import { EventLog } from '../Panels/EventLog';
import { CertificatePanel } from '../Panels/CertificatePanel';
import { StatisticsPanel } from '../Panels/StatisticsPanel';
import { ChevronUp, ChevronDown, ListFilter, Award, BarChart3, HelpCircle } from 'lucide-react';

export const BottomBar: React.FC = () => {
  const { currentState, openWhyModal } = useSimulationStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'events' | 'certificate' | 'stats'>('events');

  const latestEvent = currentState.events[currentState.events.length - 1];
  const mainGroup = currentState.groups[0];

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-20 flex flex-col shadow-lg">
      {/* Drawer content when expanded */}
      {drawerOpen && (
        <div className="h-64 border-b border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
          {/* Drawer tab bar */}
          <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
            <button
              onClick={() => setDrawerTab('events')}
              className={`py-2 px-3 flex items-center space-x-1.5 border-b-2 font-medium transition-colors ${
                drawerTab === 'events'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Event Stream ({currentState.events.length})</span>
            </button>

            {mainGroup && (
              <button
                onClick={() => setDrawerTab('certificate')}
                className={`py-2 px-3 flex items-center space-x-1.5 border-b-2 font-medium transition-colors ${
                  drawerTab === 'certificate'
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Certificate & Level</span>
              </button>
            )}

            <button
              onClick={() => setDrawerTab('stats')}
              className={`py-2 px-3 flex items-center space-x-1.5 border-b-2 font-medium transition-colors ${
                drawerTab === 'stats'
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Theory & Complexity</span>
            </button>
          </div>

          <div className="flex-1 overflow-hidden p-3">
            {drawerTab === 'events' && <EventLog events={currentState.events} />}
            {drawerTab === 'certificate' && mainGroup && <CertificatePanel group={mainGroup} />}
            {drawerTab === 'stats' && (
              <StatisticsPanel
                statistics={currentState.statistics}
                round={currentState.round}
                isDispersed={currentState.isDispersed}
              />
            )}
          </div>
        </div>
      )}

      {/* Main Bottom Controls Bar */}
      <div className="h-14 px-4 flex items-center justify-between space-x-4">
        {/* Left: Playback Controls */}
        <PlaybackControls />

        {/* Middle: Timeline Scrubber */}
        <Timeline />

        {/* Right: Quick Event Banner + Drawer Toggle */}
        <div className="flex items-center space-x-2">
          {latestEvent ? (
            <div className="hidden lg:flex items-center space-x-2 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/60 max-w-sm truncate text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {latestEvent.type}: {latestEvent.summary}
              </span>
              <button
                onClick={() => openWhyModal(latestEvent)}
                className="text-brand-600 dark:text-brand-400 font-bold hover:underline shrink-0 text-[11px]"
              >
                Why?
              </button>
            </div>
          ) : (
            <div className="hidden lg:block text-xs text-slate-400 italic">
              Initial round ready.
            </div>
          )}

          <button
            onClick={() => setDrawerOpen(o => !o)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Panels</span>
            {drawerOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
