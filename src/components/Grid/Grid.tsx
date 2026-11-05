import React, { useRef, useState } from 'react';
import { useSimulationStore } from '../../state/simulationStore';
import { PathRenderer } from './PathRenderer';
import { AgentRenderer } from './AgentRenderer';
import { GridControls } from './GridControls';

export const Grid: React.FC = () => {
  const {
    currentState,
    selectedAgentId,
    selectedGroupId,
    selectedSubgroupIndex,
    selectedNode,
    showSubgroupPaths,
    showCoverageGrid,
    showLabels,
    showLegend,
    selectAgent,
    selectNode,
  } = useSimulationStore();

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  const gridWidth = currentState.gridWidth;
  const gridHeight = currentState.gridHeight;

  const CELL_SIZE = 54;
  const PADDING = 40;
  const svgWidth = gridWidth * CELL_SIZE + PADDING * 2;
  const svgHeight = gridHeight * CELL_SIZE + PADDING * 2;

  // Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(z * 1.25, 4));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.25, 0.4));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  // Convert grid coordinates to SVG canvas coordinates
  const toSvgX = (gx: number) => PADDING + (gx + 0.5) * CELL_SIZE;
  const toSvgY = (gy: number) => PADDING + (gridHeight - 1 - gy + 0.5) * CELL_SIZE;

  return (
    <div
      className="relative w-full h-full bg-slate-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <GridControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />

      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.15s ease-out',
        }}
        onClick={() => {
          selectAgent(null);
          selectNode(null);
        }}
      >
        <defs>
          {/* Subtle grid pattern */}
          <pattern
            id="grid-dots"
            x={PADDING}
            y={PADDING}
            width={CELL_SIZE}
            height={CELL_SIZE}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={CELL_SIZE / 2} cy={CELL_SIZE / 2} r="1.5" className="fill-slate-300 dark:fill-slate-700" />
          </pattern>
        </defs>

        {/* Background Grid Canvas */}
        <rect
          x={PADDING}
          y={PADDING}
          width={gridWidth * CELL_SIZE}
          height={gridHeight * CELL_SIZE}
          className="fill-white dark:fill-slate-900 stroke-slate-300 dark:stroke-slate-800"
          strokeWidth="2"
          rx="6"
        />

        {/* Grid lines */}
        {Array.from({ length: gridWidth + 1 }).map((_, i) => (
          <line
            key={`vl-${i}`}
            x1={PADDING + i * CELL_SIZE}
            y1={PADDING}
            x2={PADDING + i * CELL_SIZE}
            y2={PADDING + gridHeight * CELL_SIZE}
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: gridHeight + 1 }).map((_, j) => (
          <line
            key={`hl-${j}`}
            x1={PADDING}
            y1={PADDING + j * CELL_SIZE}
            x2={PADDING + gridWidth * CELL_SIZE}
            y2={PADDING + j * CELL_SIZE}
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth="1"
          />
        ))}

        {/* Grid Node interactive cells */}
        {Array.from({ length: gridWidth }).map((_, x) =>
          Array.from({ length: gridHeight }).map((_, y) => {
            const isNodeSelected =
              selectedNode && selectedNode.x === x && selectedNode.y === y;
            const cx = toSvgX(x);
            const cy = toSvgY(y);

            return (
              <g
                key={`node-${x}-${y}`}
                className="cursor-pointer"
                onClick={e => {
                  e.stopPropagation();
                  selectNode({ x, y });
                }}
              >
                {/* Node selection indicator */}
                {isNodeSelected && (
                  <rect
                    x={cx - CELL_SIZE * 0.45}
                    y={cy - CELL_SIZE * 0.45}
                    width={CELL_SIZE * 0.9}
                    height={CELL_SIZE * 0.9}
                    fill="#0ea5e9"
                    fillOpacity={0.15}
                    stroke="#0ea5e9"
                    strokeWidth="2"
                    rx="4"
                  />
                )}

                {/* Node center dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="2.5"
                  className="fill-slate-300 dark:fill-slate-700 hover:fill-brand-500 transition-colors"
                />

                {/* Coordinate text */}
                {showCoverageGrid && (
                  <text
                    x={cx}
                    y={cy + CELL_SIZE * 0.4}
                    fontSize="7"
                    className="fill-slate-400 dark:fill-slate-600 font-mono pointer-events-none select-none"
                    textAnchor="middle"
                  >
                    {x},{y}
                  </text>
                )}
              </g>
            );
          })
        )}

        {/* Subgroup Paths Layer */}
        {showSubgroupPaths && (
          <PathRenderer
            groups={currentState.groups}
            cellSize={CELL_SIZE}
            offset={PADDING}
            selectedSubgroupIndex={selectedSubgroupIndex}
            selectedGroupId={selectedGroupId}
            gridHeight={gridHeight}
          />
        )}

        {/* Agents Layer */}
        <AgentRenderer
          agents={currentState.agents}
          groups={currentState.groups}
          cellSize={CELL_SIZE}
          offset={PADDING}
          gridHeight={gridHeight}
          selectedAgentId={selectedAgentId}
          onSelectAgent={selectAgent}
          showLabels={showLabels}
        />
      </svg>

      {/* Visual Legend */}
      {showLegend && (
        <div className="absolute bottom-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-md text-xs space-y-1.5 z-10 pointer-events-auto">
          <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1 border-b border-slate-200 dark:border-slate-800 pb-1">
            Legend
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-brand-500 inline-block border border-white" />
            <span className="text-slate-600 dark:text-slate-400">Active Moving Agent</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-brand-500 border-2 border-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </span>
            <span className="text-slate-600 dark:text-slate-400">Passive-Settled Marker</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 border-2 border-amber-300" />
            <span className="text-slate-600 dark:text-slate-400">Overflow Member</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full border-2 border-dashed border-purple-500" />
            <span className="text-slate-600 dark:text-slate-400">Late Adopter</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-amber-500">★</span>
            <span className="text-slate-600 dark:text-slate-400">Group Leader</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-brand-500">A / C</span>
            <span className="text-slate-600 dark:text-slate-400">Anchor (A) / Corner (C)</span>
          </div>
        </div>
      )}
    </div>
  );
};
