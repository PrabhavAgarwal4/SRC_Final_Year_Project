import React from 'react';
import { Agent } from '../../engine/model/Agent';
import { Group } from '../../engine/model/Group';

interface AgentRendererProps {
  agents: Agent[];
  groups: Group[];
  cellSize: number;
  offset: number;
  gridHeight: number;
  selectedAgentId: number | null;
  onSelectAgent: (id: number) => void;
  showLabels: boolean;
}

export const AgentRenderer: React.FC<AgentRendererProps> = ({
  agents,
  groups,
  cellSize,
  offset,
  gridHeight,
  selectedAgentId,
  onSelectAgent,
  showLabels,
}) => {
  const toSvgX = (gx: number) => offset + (gx + 0.5) * cellSize;
  const toSvgY = (gy: number) => offset + (gridHeight - 1 - gy + 0.5) * cellSize;

  // Group agents by current position
  const agentsByPos = new Map<string, Agent[]>();
  for (const ag of agents) {
    const key = `${ag.currentPos.x},${ag.currentPos.y}`;
    if (!agentsByPos.has(key)) {
      agentsByPos.set(key, []);
    }
    agentsByPos.get(key)!.push(ag);
  }

  const groupColorMap = new Map<string, string>();
  for (const g of groups) {
    groupColorMap.set(g.id, g.color);
  }

  return (
    <g className="agents-layer">
      {Array.from(agentsByPos.entries()).map(([posKey, cluster]) => {
        const [gx, gy] = posKey.split(',').map(Number);
        const cx = toSvgX(gx);
        const cy = toSvgY(gy);

        if (cluster.length === 1) {
          const agent = cluster[0];
          const isSelected = selectedAgentId === agent.id;
          const color = groupColorMap.get(agent.groupId) || '#0284c7';
          const r = cellSize * 0.32;

          return (
            <g
              key={agent.id}
              className="cursor-pointer transition-transform hover:scale-110"
              onClick={e => {
                e.stopPropagation();
                onSelectAgent(agent.id);
              }}
            >
              {/* Pulse highlight if selected */}
              {isSelected && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r + 5}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  className="animate-pulse"
                />
              )}

              {/* Late Adopter Ring */}
              {agent.isLateAdopter && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r + 3}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2"
                  strokeDasharray="2 2"
                />
              )}

              {/* Main Agent Body */}
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={agent.status === 'settled' ? color : color}
                fillOpacity={agent.status === 'settled' ? 0.9 : 1}
                stroke={
                  agent.status === 'settled'
                    ? '#ffffff'
                    : agent.isOverflow
                    ? '#f59e0b'
                    : '#ffffff'
                }
                strokeWidth={agent.isOverflow ? 2.5 : 1.5}
                className="drop-shadow-sm"
              />

              {/* Settled Marker Indicator (Inner ring or Lock) */}
              {agent.status === 'settled' && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r * 0.55}
                  fill="#ffffff"
                  fillOpacity={0.85}
                  stroke={color}
                  strokeWidth="1.5"
                />
              )}

              {/* Leader Star */}
              {agent.isLeader && (
                <path
                  d={`M ${cx} ${cy - r - 4} L ${cx + 2.5} ${cy - r + 1} L ${cx + 6} ${
                    cy - r + 1
                  } L ${cx + 3} ${cy - r + 3.5} L ${cx + 4.5} ${cy - r + 7} L ${cx} ${
                    cy - r + 5
                  } L ${cx - 4.5} ${cy - r + 7} L ${cx - 3} ${cy - r + 3.5} L ${
                    cx - 6
                  } ${cy - r + 1} L ${cx - 2.5} ${cy - r + 1} Z`}
                  fill="#f59e0b"
                  stroke="#b45309"
                  strokeWidth="0.5"
                />
              )}

              {/* Agent ID Text */}
              {showLabels && (
                <text
                  cx={cx}
                  cy={cy}
                  x={cx}
                  y={agent.status === 'settled' ? cy + 3.5 : cy + 4}
                  fontSize={Math.max(8, cellSize * 0.22)}
                  fontWeight="bold"
                  fill={agent.status === 'settled' ? color : '#ffffff'}
                  textAnchor="middle"
                  className="pointer-events-none select-none"
                >
                  {agent.id}
                </text>
              )}
            </g>
          );
        }

        // Multiple agents co-located on node (cluster)
        const primaryAgent = cluster.reduce((max, a) => (a.id > max.id ? a : max), cluster[0]);
        const isAnySelected = cluster.some(a => a.id === selectedAgentId);
        const color = groupColorMap.get(primaryAgent.groupId) || '#0284c7';
        const r = cellSize * 0.36;

        return (
          <g
            key={`cluster-${posKey}`}
            className="cursor-pointer transition-transform hover:scale-110"
            onClick={e => {
              e.stopPropagation();
              onSelectAgent(primaryAgent.id);
            }}
          >
            {isAnySelected && (
              <circle
                cx={cx}
                cy={cy}
                r={r + 5}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="3"
                className="animate-pulse"
              />
            )}

            {/* Clustered multi-agent badge */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={color}
              stroke="#ffffff"
              strokeWidth="2"
              className="drop-shadow"
            />

            {/* Small satellite dots indicating cluster density */}
            {cluster.slice(0, 4).map((ag, i) => {
              const angle = (i * 2 * Math.PI) / Math.min(cluster.length, 4) - Math.PI / 2;
              const sx = cx + Math.cos(angle) * (r + 4);
              const sy = cy + Math.sin(angle) * (r + 4);
              return (
                <circle
                  key={ag.id}
                  cx={sx}
                  cy={sy}
                  r={2.5}
                  fill="#ffffff"
                  stroke={color}
                  strokeWidth="1"
                />
              );
            })}

            {/* Cluster count */}
            <text
              x={cx}
              y={cy + 4}
              fontSize={Math.max(9, cellSize * 0.25)}
              fontWeight="bold"
              fill="#ffffff"
              textAnchor="middle"
              className="pointer-events-none select-none"
            >
              ×{cluster.length}
            </text>
          </g>
        );
      })}
    </g>
  );
};
