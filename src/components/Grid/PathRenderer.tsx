import React from 'react';
import { Group } from '../../engine/model/Group';
import { Subgroup } from '../../engine/model/Subgroup';

interface PathRendererProps {
  groups: Group[];
  cellSize: number;
  offset: number;
  selectedSubgroupIndex: number | null;
  selectedGroupId: string | null;
  gridHeight: number;
}

export const PathRenderer: React.FC<PathRendererProps> = ({
  groups,
  cellSize,
  offset,
  selectedSubgroupIndex,
  selectedGroupId,
  gridHeight,
}) => {
  // Convert grid coordinates (x, y) to SVG (cx, cy)
  // Grid y: 0 is at bottom (South), max is at top (North)
  const toSvgX = (gx: number) => offset + (gx + 0.5) * cellSize;
  const toSvgY = (gy: number) => offset + (gridHeight - 1 - gy + 0.5) * cellSize;

  return (
    <g className="paths-layer pointer-events-none">
      {groups.map(group => {
        const isGroupSelected = selectedGroupId === null || selectedGroupId === group.id;

        return (
          <g key={group.id} opacity={isGroupSelected ? 1 : 0.25}>
            {/* Draw Anchor A */}
            <circle
              cx={toSvgX(group.anchor.x)}
              cy={toSvgY(group.anchor.y)}
              r={cellSize * 0.35}
              fill="none"
              stroke={group.color}
              strokeWidth="2.5"
              strokeDasharray="3 3"
            />
            <text
              x={toSvgX(group.anchor.x)}
              y={toSvgY(group.anchor.y) + cellSize * 0.45}
              fontSize={10}
              fontWeight="bold"
              fill={group.color}
              textAnchor="middle"
            >
              A
            </text>

            {/* Draw Realized Corner C */}
            <rect
              x={toSvgX(group.realizedCorner.x) - cellSize * 0.3}
              y={toSvgY(group.realizedCorner.y) - cellSize * 0.3}
              width={cellSize * 0.6}
              height={cellSize * 0.6}
              fill="none"
              stroke={group.color}
              strokeWidth="2.5"
            />
            <text
              x={toSvgX(group.realizedCorner.x)}
              y={toSvgY(group.realizedCorner.y) + cellSize * 0.45}
              fontSize={10}
              fontWeight="bold"
              fill={group.color}
              textAnchor="middle"
            >
              C
            </text>

            {/* Subgroups paths */}
            {group.subgroups.map(subgroup => {
              const isSubgroupSelected =
                selectedSubgroupIndex === null || selectedSubgroupIndex === subgroup.index;
              const pathOpacity = isSubgroupSelected ? 0.85 : 0.15;
              const strokeW = isSubgroupSelected ? 2.5 : 1.2;

              if (subgroup.path.length < 2) return null;

              // Generate SVG path d string
              const pointsStr = subgroup.path
                .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${toSvgX(p.x)} ${toSvgY(p.y)}`)
                .join(' ');

              return (
                <g key={`sg-${subgroup.index}`}>
                  <path
                    d={pointsStr}
                    fill="none"
                    stroke={group.color}
                    strokeWidth={strokeW}
                    strokeOpacity={pathOpacity}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Mark Covered Column Node highlights */}
                  {isSubgroupSelected && (
                    <line
                      x1={toSvgX(subgroup.coveredX)}
                      y1={toSvgY(0)}
                      x2={toSvgX(subgroup.coveredX)}
                      y2={toSvgY(gridHeight - 1)}
                      stroke={group.color}
                      strokeWidth={1}
                      strokeDasharray="2 4"
                      strokeOpacity={0.4}
                    />
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
};
