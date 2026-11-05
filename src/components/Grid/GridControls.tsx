import React from 'react';
import { useSimulationStore } from '../../state/simulationStore';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Route,
  Grid,
  Tag,
  Info,
} from 'lucide-react';

interface GridControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export const GridControls: React.FC<GridControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onResetZoom,
}) => {
  const {
    showSubgroupPaths,
    showCoverageGrid,
    showLabels,
    showLegend,
    togglePaths,
    toggleCoverage,
    toggleLabels,
    toggleLegend,
  } = useSimulationStore();

  return (
    <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
      {/* Zoom controls */}
      <div className="flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-lg p-1 shadow-sm">
        <button
          onClick={onZoomIn}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={onResetZoom}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          title="Reset Zoom & Pan"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Layer Toggles */}
      <div className="flex flex-col bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-lg p-1 shadow-sm">
        <button
          onClick={togglePaths}
          className={`p-1.5 rounded transition-colors ${
            showSubgroupPaths
              ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 font-semibold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
          }`}
          title="Toggle Subgroup Paths"
        >
          <Route className="w-4 h-4" />
        </button>
        <button
          onClick={toggleCoverage}
          className={`p-1.5 rounded transition-colors ${
            showCoverageGrid
              ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 font-semibold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
          }`}
          title="Toggle Grid Coordinates"
        >
          <Grid className="w-4 h-4" />
        </button>
        <button
          onClick={toggleLabels}
          className={`p-1.5 rounded transition-colors ${
            showLabels
              ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 font-semibold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
          }`}
          title="Toggle Agent ID Labels"
        >
          <Tag className="w-4 h-4" />
        </button>
        <button
          onClick={toggleLegend}
          className={`p-1.5 rounded transition-colors ${
            showLegend
              ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 font-semibold'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
          }`}
          title="Toggle Legend"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
