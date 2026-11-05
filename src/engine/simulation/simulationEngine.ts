import { Coord } from '../model/Grid';
import { Agent } from '../model/Agent';
import { Group } from '../model/Group';
import { SimulationState, cloneSimulationState } from '../model/SimulationState';
import { executeSynchronousRound } from './ccmCycle';
import { calculateGamma, calculateSweepBounds } from '../geometry/sweepGeometry';
import { buildSubgroups } from '../geometry/pathGeneration';
import { resetEventCounter } from '../events/eventFactory';

export interface InitialAgentPlacement {
  id: number;
  pos: Coord;
}

const GROUP_PALETTE = [
  '#0284c7', // Sky Blue
  '#f97316', // Orange
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#eab308', // Amber
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#f43f5e', // Rose
];

export class SimulationEngine {
  private history: SimulationState[] = [];
  private currentIndex: number = 0;
  private gridWidth: number;
  private gridHeight: number;
  private initialPlacements: InitialAgentPlacement[];

  constructor(
    gridWidth: number,
    gridHeight: number,
    initialPlacements: InitialAgentPlacement[]
  ) {
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.initialPlacements = initialPlacements;
    this.reset();
  }

  public reset(): void {
    resetEventCounter();
    this.history = [];
    const initialSnapshot = this.buildInitialState();
    this.history.push(initialSnapshot);
    this.currentIndex = 0;
  }

  private buildInitialState(): SimulationState {
    const agents: Agent[] = [];
    const groups: Group[] = [];

    // Group agents by initial position
    const posMap = new Map<string, InitialAgentPlacement[]>();
    for (const p of this.initialPlacements) {
      const key = `${p.pos.x},${p.pos.y}`;
      if (!posMap.has(key)) {
        posMap.set(key, []);
      }
      posMap.get(key)!.push(p);
    }

    let groupIdx = 0;
    for (const [posKey, cluster] of posMap.entries()) {
      const [ax, ay] = posKey.split(',').map(Number);
      const anchor: Coord = { x: ax, y: ay };
      const m = cluster.length;
      const gamma = calculateGamma(m);
      const color = GROUP_PALETTE[groupIdx % GROUP_PALETTE.length];
      const groupId = `grp-${groupIdx + 1}`;

      // Sort cluster by decreasing ID
      const sorted = [...cluster].sort((a, b) => b.id - a.id);
      const leaderId = sorted[0].id;
      const initialLabel = { level: 0, certificate: m, leaderId };
      const direction = { dx: 1 as const, dy: 1 as const };

      const bounds = calculateSweepBounds(
        anchor,
        direction,
        gamma,
        this.gridWidth,
        this.gridHeight
      );

      const memberRanks = new Map<number, number>();
      sorted.forEach((p, idx) => {
        memberRanks.set(p.id, idx + 1);
      });

      const subgroups = buildSubgroups(
        gamma,
        memberRanks,
        bounds,
        this.gridWidth,
        this.gridHeight
      );

      // Create agents
      sorted.forEach((p, idx) => {
        const rank = idx + 1;
        const subgroup = rank % gamma;

        const isSingleton = m === 1;

        const agent: Agent = {
          id: p.id,
          status: isSingleton ? 'settled' : 'moving',
          label: { ...initialLabel },
          mass: m,
          subgroup,
          rank,
          step: 0,
          dir: { ...direction },
          anchor: { ...anchor },
          idealCorner: { ...bounds.idealCorner },
          destination: { ...bounds.realizedCorner },
          contact: false,
          epoch: 0,
          initialPos: { ...p.pos },
          currentPos: { ...p.pos },
          groupId,
          initialGroupId: groupId,
          isLeader: p.id === leaderId,
          isOverflow: false,
          isLateAdopter: false,
          totalMoves: 0,
        };

        if (isSingleton) {
          agent.settleMeta = {
            round: 0,
            stepWhenHeadLeft: 0,
            storedLabel: { ...initialLabel },
            storedGamma: gamma,
            storedAnchor: { ...anchor },
            storedIdealCorner: { ...bounds.idealCorner },
            storedDir: { ...direction },
            storedSubgroup: 0,
            storedEpoch: 0,
          };
        }

        agents.push(agent);
      });

      const group: Group = {
        id: groupId,
        label: { ...initialLabel },
        mass: m,
        gamma,
        anchor: { ...anchor },
        idealCorner: { ...bounds.idealCorner },
        realizedCorner: { ...bounds.realizedCorner },
        direction: { ...direction },
        epoch: 0,
        phase: 'Spread',
        phaseStep: 0,
        phaseLength: bounds.length,
        boundaryExcessX: bounds.excessX,
        boundaryExcessY: bounds.excessY,
        bouncesCount: 0,
        subgroups,
        activeMemberIds: m === 1 ? [] : sorted.map(p => p.id),
        settledMemberIds: m === 1 ? [sorted[0].id] : [],
        overflowMemberIds: [],
        isClean: true,
        isTerminated: m === 1,
        color,
      };

      groups.push(group);
      groupIdx++;
    }

    const settledCount = agents.filter(a => a.status === 'settled').length;
    const activeCount = agents.filter(a => a.status === 'moving').length;

    return {
      round: 0,
      gridWidth: this.gridWidth,
      gridHeight: this.gridHeight,
      agents,
      groups,
      events: [],
      isTerminated: activeCount === 0,
      isDispersed: activeCount === 0 && posMap.size === agents.length,
      statistics: {
        totalAgents: agents.length,
        gridNodes: this.gridWidth * this.gridHeight,
        settledCount,
        activeCount,
        groupsCount: groups.length,
        completedCycles: 0,
        highestLevel: 0,
        bouncesCount: 0,
        lateAdoptionsCount: 0,
        recoveryCyclesCount: 0,
      },
    };
  }

  public getCurrentState(): SimulationState {
    return this.history[this.currentIndex];
  }

  public getCurrentRound(): number {
    return this.history[this.currentIndex].round;
  }

  public getTotalRounds(): number {
    return this.history.length - 1;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public canStepForward(): boolean {
    const cur = this.getCurrentState();
    return !cur.isTerminated || this.currentIndex < this.history.length - 1;
  }

  public canStepBackward(): boolean {
    return this.currentIndex > 0;
  }

  public stepForward(): SimulationState {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.getCurrentState();
    }

    const cur = this.getCurrentState();
    if (cur.isTerminated) {
      return cur;
    }

    const nextState = executeSynchronousRound(cur);
    this.history.push(nextState);
    this.currentIndex++;
    return nextState;
  }

  public stepBackward(): SimulationState {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
    return this.getCurrentState();
  }

  public jumpToRound(targetRound: number): SimulationState {
    // If target is within existing history
    if (targetRound < this.history.length) {
      this.currentIndex = Math.max(0, targetRound);
      return this.getCurrentState();
    }

    // Advance until targetRound or termination
    while (this.history.length <= targetRound) {
      const cur = this.history[this.history.length - 1];
      if (cur.isTerminated) break;
      const next = executeSynchronousRound(cur);
      this.history.push(next);
    }

    this.currentIndex = Math.min(targetRound, this.history.length - 1);
    return this.getCurrentState();
  }

  public runUntilDispersed(maxRounds = 500): SimulationState {
    while (!this.getCurrentState().isTerminated && this.history.length < maxRounds) {
      this.stepForward();
    }
    return this.getCurrentState();
  }

  public getAllHistory(): SimulationState[] {
    return this.history;
  }
}
