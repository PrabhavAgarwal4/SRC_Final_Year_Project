import React, { useState } from 'react';
import { useSimulationStore } from '../../state/simulationStore';
import { PresetScenario } from '../../scenarios/presetScenarios';
import { InitialAgentPlacement } from '../../engine/simulation/simulationEngine';
import { saveScenario } from '../../scenarios/scenarioStorage';
import { Sliders, X, Plus, Trash2, Play, Save } from 'lucide-react';

export const ScenarioEditorModal: React.FC = () => {
  const { isScenarioEditorOpen, closeScenarioEditor, loadScenario } = useSimulationStore();

  const [width, setWidth] = useState(6);
  const [height, setHeight] = useState(6);
  const [title, setTitle] = useState('My Custom Dispersion');
  const [description, setDescription] = useState('Custom multi-agent initial placement');
  const [placements, setPlacements] = useState<InitialAgentPlacement[]>([
    { id: 10, pos: { x: 1, y: 1 } },
    { id: 20, pos: { x: 1, y: 1 } },
    { id: 30, pos: { x: 1, y: 1 } },
  ]);

  if (!isScenarioEditorOpen) return null;

  const handleCellClick = (x: number, y: number) => {
    // If agents already exist here, add one more up to 8, or cycle
    const here = placements.filter(p => p.pos.x === x && p.pos.y === y);
    if (here.length === 0) {
      // Add first agent
      const nextId = (placements.length + 1) * 10;
      setPlacements([...placements, { id: nextId, pos: { x, y } }]);
    } else if (here.length < 6) {
      // Add another agent to this cluster
      const nextId = Math.max(...placements.map(p => p.id), 0) + 1;
      setPlacements([...placements, { id: nextId, pos: { x, y } }]);
    } else {
      // Clear this cell
      setPlacements(placements.filter(p => !(p.pos.x === x && p.pos.y === y)));
    }
  };

  const handleClear = () => setPlacements([]);

  const handleLaunch = (shouldSave = false) => {
    if (placements.length === 0) return;

    const customSc: PresetScenario = {
      id: `custom-${Date.now()}`,
      number: 99,
      title: title || 'Custom Placement',
      category: 'Custom',
      description: description || 'User-defined configuration',
      gridWidth: width,
      gridHeight: height,
      placements,
      expectedEvents: [],
      expectedOutcome: 'Deterministic dispersion by SRC algorithm',
      guidedExplanation: ['Custom scenario executed through full synchronous CCM engine.'],
    };

    if (shouldSave) {
      saveScenario(customSc);
    }

    loadScenario(customSc);
    closeScenarioEditor();
  };

  // Group placements by node for visual counts
  const countMap = new Map<string, number>();
  for (const p of placements) {
    const k = `${p.pos.x},${p.pos.y}`;
    countMap.set(k, (countMap.get(k) || 0) + 1);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-brand-500/10 rounded-xl text-brand-600 dark:text-brand-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                Initial Configuration Editor
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Design custom initial clusters on an oriented square grid
              </p>
            </div>
          </div>

          <button
            onClick={closeScenarioEditor}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Controls */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
              Scenario Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
              Grid Width ({width})
            </label>
            <input
              type="range"
              min={4}
              max={12}
              value={width}
              onChange={e => setWidth(Number(e.target.value))}
              className="w-full accent-brand-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 dark:text-slate-400 mb-1 font-medium">
              Grid Height ({height})
            </label>
            <input
              type="range"
              min={4}
              max={12}
              value={height}
              onChange={e => setHeight(Number(e.target.value))}
              className="w-full accent-brand-500"
            />
          </div>
        </div>

        {/* Interactive Grid Canvas */}
        <div className="flex-1 overflow-auto p-6 bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center">
          <div className="text-xs text-slate-400 mb-3 text-center">
            Click grid intersections to place agents. Click multiple times to build co-located clusters.
          </div>

          <div
            className="grid gap-1 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-800 shadow-sm"
            style={{
              gridTemplateColumns: `repeat(${width}, minmax(36px, 44px))`,
              gridTemplateRows: `repeat(${height}, minmax(36px, 44px))`,
            }}
          >
            {/* Grid rows top to bottom (y from height-1 down to 0) */}
            {Array.from({ length: height }).map((_, rIdx) => {
              const y = height - 1 - rIdx;
              return Array.from({ length: width }).map((_, x) => {
                const count = countMap.get(`${x},${y}`) || 0;
                return (
                  <button
                    key={`${x}-${y}`}
                    onClick={() => handleCellClick(x, y)}
                    className={`rounded-lg border text-xs font-mono font-bold flex flex-col items-center justify-center transition-all ${
                      count > 0
                        ? 'bg-brand-500 border-brand-600 text-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {count > 0 ? (
                      <span>×{count}</span>
                    ) : (
                      <span className="text-[9px] opacity-40 font-normal">
                        {x},{y}
                      </span>
                    )}
                  </button>
                );
              });
            })}
          </div>

          <div className="mt-3 text-xs text-slate-500 font-mono">
            Total Placed: {placements.length} agents across {countMap.size} clusters
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
          <button
            onClick={handleClear}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Grid</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleLaunch(true)}
              disabled={placements.length === 0}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 disabled:opacity-40 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Launch</span>
            </button>

            <button
              onClick={() => handleLaunch(false)}
              disabled={placements.length === 0}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-40 transition-colors shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Launch Engine</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
