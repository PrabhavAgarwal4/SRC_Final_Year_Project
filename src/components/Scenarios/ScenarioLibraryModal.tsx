import React, { useState } from 'react';
import { useSimulationStore } from '../../state/simulationStore';
import { PRESET_SCENARIOS, PresetScenario } from '../../scenarios/presetScenarios';
import { loadSavedScenarios, deleteSavedScenario } from '../../scenarios/scenarioStorage';
import { Library, X, Play, Tag, CheckCircle2, Trash2 } from 'lucide-react';

export const ScenarioLibraryModal: React.FC = () => {
  const { isScenarioLibraryOpen, closeScenarioLibrary, loadScenario, currentScenario } =
    useSimulationStore();

  const [activeCategory, setActiveCategory] = useState<string>('All');

  if (!isScenarioLibraryOpen) return null;

  const customScenarios = loadSavedScenarios();
  const allScenarios = [...PRESET_SCENARIOS, ...customScenarios];

  const categories = [
    'All',
    'Basics',
    'Cycle & Phases',
    'Interactions',
    'Late Adoption',
    'Certificates & Advanced',
    'Custom',
  ];

  const filtered = allScenarios.filter(s => {
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Custom') return s.id.startsWith('custom-');
    return s.category === activeCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-600 dark:text-brand-400">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                SRC Algorithm Scenario Library
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                14 Research Scenarios Covering Foundational & Edge Cases
              </p>
            </div>
          </div>

          <button
            onClick={closeScenarioLibrary}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center space-x-1.5 overflow-x-auto text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Scenarios Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(sc => {
            const isCurrent = currentScenario.id === sc.id;
            return (
              <div
                key={sc.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                  isCurrent
                    ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                      Scenario #{sc.number}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                      {sc.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {sc.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {sc.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {sc.gridWidth}×{sc.gridHeight} • {sc.placements.length} agents
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {sc.id.startsWith('custom-') && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          deleteSavedScenario(sc.id);
                        }}
                        className="p-1.5 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Delete custom scenario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        loadScenario(sc);
                        closeScenarioLibrary();
                      }}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-lg font-semibold transition-colors ${
                        isCurrent
                          ? 'bg-brand-500 text-white'
                          : 'bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800'
                      }`}
                    >
                      <Play className="w-3 h-3" />
                      <span>{isCurrent ? 'Reset & Run' : 'Load & Run'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
