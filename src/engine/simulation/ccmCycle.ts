import { SimulationState } from '../model/SimulationState';
import { Agent, AlgorithmPhase } from '../model/Agent';
import { Group } from '../model/Group';
import { Coord, areCoordsEqual } from '../model/Grid';
import { compareLabels, cloneLabel } from '../model/Label';
import { SimulationEvent } from '../events/SimulationEvent';
import {
  createSimulationEvent,
  createSettlementEvent,
  createLevelUpEvent,
  createLateAdoptionEvent,
} from '../events/eventFactory';
import { calculateSweepBounds, calculateGamma } from '../geometry/sweepGeometry';
import { buildSubgroups } from '../geometry/pathGeneration';
import { evaluateBoundaryContact } from '../geometry/boundaryDetection';
import { resolveNodeSettlement, isNodeCoveredBySubgroup } from '../interactions/settlement';
import { handleCoLocatedAbsorption } from '../interactions/absorption';
import { applyLateAdoption } from '../interactions/lateAdoption';
import { initiateRecoveryCycle } from '../interactions/recovery';

/**
 * Executes a single synchronous CCM round across all agents and groups.
 */
export function executeSynchronousRound(prevState: SimulationState): SimulationState {
  const round = prevState.round + 1;
  const events: SimulationEvent[] = [];

  // Deep clone agents and groups for immutability
  const agents: Agent[] = prevState.agents.map(a => ({
    ...a,
    label: { ...a.label },
    dir: { ...a.dir },
    anchor: { ...a.anchor },
    idealCorner: { ...a.idealCorner },
    destination: { ...a.destination },
    initialPos: { ...a.initialPos },
    currentPos: { ...a.currentPos },
    settleMeta: a.settleMeta ? {
      ...a.settleMeta,
      storedLabel: { ...a.settleMeta.storedLabel },
      storedAnchor: { ...a.settleMeta.storedAnchor },
      storedIdealCorner: { ...a.settleMeta.storedIdealCorner },
      storedDir: { ...a.settleMeta.storedDir },
    } : undefined,
    lateAdoption: a.lateAdoption ? {
      ...a.lateAdoption,
      originalLabel: { ...a.lateAdoption.originalLabel },
      adoptedLabel: { ...a.lateAdoption.adoptedLabel },
    } : undefined,
  }));

  const groups: Group[] = prevState.groups.map(g => ({
    ...g,
    label: { ...g.label },
    anchor: { ...g.anchor },
    idealCorner: { ...g.idealCorner },
    realizedCorner: { ...g.realizedCorner },
    direction: { ...g.direction },
    subgroups: g.subgroups.map(sg => ({
      ...sg,
      path: sg.path.map(p => ({ ...p })),
      firstRowLeg: sg.firstRowLeg.map(p => ({ ...p })),
      columnLeg: sg.columnLeg.map(p => ({ ...p })),
      secondRowLeg: sg.secondRowLeg.map(p => ({ ...p })),
      memberIds: [...sg.memberIds],
      headPos: { ...sg.headPos },
    })),
    activeMemberIds: [...g.activeMemberIds],
    settledMemberIds: [...g.settledMemberIds],
    overflowMemberIds: [...g.overflowMemberIds],
  }));

  const groupMap = new Map<string, Group>();
  for (const g of groups) {
    groupMap.set(g.id, g);
  }

  // 1. COMMUNICATE & RESOLVE LOCAL HANDSHAKES FROM PREVIOUS STEP (Settlement / Handshake Resolution)
  // Check any claiming agents that claimed in the previous step
  const claimingAgentsByNode = new Map<string, Agent[]>();
  for (const ag of agents) {
    if (ag.status === 'claiming') {
      const key = `${ag.currentPos.x},${ag.currentPos.y}`;
      if (!claimingAgentsByNode.has(key)) {
        claimingAgentsByNode.set(key, []);
      }
      claimingAgentsByNode.get(key)!.push(ag);
    }
  }

  for (const [nodeKey, candidates] of claimingAgentsByNode.entries()) {
    const [nx, ny] = nodeKey.split(',').map(Number);
    const pos = { x: nx, y: ny };
    const existingSettled = agents.find(
      a => a.status === 'settled' && areCoordsEqual(a.currentPos, pos)
    );

    const res = resolveNodeSettlement(pos, candidates, existingSettled, round);
    events.push(...res.events);

    if (res.settledAgent) {
      const group = groupMap.get(res.settledAgent.groupId);
      if (group) {
        group.activeMemberIds = group.activeMemberIds.filter(id => id !== res.settledAgent!.id);
        group.settledMemberIds.push(res.settledAgent.id);
      }
    }
  }

  // 2. CHECK COMPUTE & MOVE FOR ACTIVE AGENTS
  // Group agents by current position to detect co-located encounters
  const movingAgents = agents.filter(a => a.status === 'moving');

  // Move each moving agent along its current phase trajectory
  for (const ag of movingAgents) {
    const group = groupMap.get(ag.groupId);
    if (!group) continue;

    // Check if agent is waiting at C
    if (ag.lateAdoption && ag.lateAdoption.predictedPhase === 'WaitAtC') {
      ag.lateAdoption.waitTimer--;
      if (ag.lateAdoption.waitTimer <= 0 && !ag.lateAdoption.recoveryInitiator) {
        // Find all waiting adopters at this position
        const waitingAtC = agents.filter(
          a =>
            a.status === 'moving' &&
            areCoordsEqual(a.currentPos, ag.currentPos) &&
            a.lateAdoption &&
            a.lateAdoption.predictedPhase === 'WaitAtC' &&
            !a.lateAdoption.recoveryInitiator
        );

        if (waitingAtC.length > 0) {
          const recRes = initiateRecoveryCycle(
            waitingAtC,
            round,
            prevState.gridWidth,
            prevState.gridHeight
          );
          groups.push(recRes.recoveryGroup);
          groupMap.set(recRes.recoveryGroup.id, recRes.recoveryGroup);
          events.push(recRes.event);
        }
      }
      continue;
    }

    const subgroup = group.subgroups.find(sg => sg.index === ag.subgroup);
    if (!subgroup) continue;

    // Determine current phase path
    let currentPath = subgroup.path;
    if (group.phase === 'Reverse' || group.phase === 'RecoveryReverse') {
      currentPath = [...subgroup.path].reverse();
    }

    // Step forward if not at end of phase
    if (ag.step < currentPath.length - 1) {
      ag.step++;
      ag.currentPos = { ...currentPath[ag.step] };
      ag.totalMoves++;

      // Check if entering covered node during Spread to initiate settlement handshake
      if (
        (group.phase === 'Spread') &&
        isNodeCoveredBySubgroup(ag.currentPos, ag.subgroup, group)
      ) {
        // Is this agent the lowest ID still-moving in this subgroup?
        const movingInSg = agents.filter(
          a =>
            a.status === 'moving' &&
            a.groupId === group.id &&
            a.subgroup === ag.subgroup
        );
        const minIdAgent = movingInSg.reduce((min, cur) => (cur.id < min.id ? cur : min), ag);

        if (ag.id === minIdAgent.id) {
          // Check if cell already has a settled marker of equal label (blocked)
          const existingMarker = agents.find(
            a => a.status === 'settled' && areCoordsEqual(a.currentPos, ag.currentPos)
          );

          if (!existingMarker || compareLabels(ag.label, existingMarker.label) > 0) {
            ag.status = 'claiming';
            events.push(
              createSimulationEvent({
                round,
                type: 'ClaimStarted',
                phase: 'Spread',
                agentIds: [ag.id],
                groupId: group.id,
                label: ag.label,
                position: ag.currentPos,
                previousState: 'moving',
                newState: 'claiming',
                reason: `Agent ${ag.id} initiated 1-round claim handshake on covered column x = ${subgroup.coveredX}.`,
                summary: `Agent ${ag.id} is claiming node (${ag.currentPos.x}, ${ag.currentPos.y}). Handshake resolves next round.`,
                explanation: {
                  whatHappened: `Lowest-ID moving agent of subgroup ${ag.subgroup} stepped onto an unblocked covered node.`,
                  ruleApplied: `Section 3.3 Spread Settlement: 1-round local claim handshake.`,
                  whyActionSelected: `Under CCM, candidates claim during compute/move, and label conflicts resolve in the subsequent communication step.`,
                  stateChanged: `Agent status changed from moving to claiming.`,
                  whatHappensNext: `Next round, label comparisons resolve whether the candidate settles or continues.`,
                },
              })
            );
          }
        }
      }
    }
  }

  // 3. RESOLVE CO-LOCATED ENCOUNTERS & ABSORPTION
  // Check co-located agents at every node
  const agentsByNode = new Map<string, Agent[]>();
  for (const ag of agents) {
    const key = `${ag.currentPos.x},${ag.currentPos.y}`;
    if (!agentsByNode.has(key)) {
      agentsByNode.set(key, []);
    }
    agentsByNode.get(key)!.push(ag);
  }

  for (const [nodeKey, nodeAgents] of agentsByNode.entries()) {
    const [nx, ny] = nodeKey.split(',').map(Number);
    const pos = { x: nx, y: ny };
    const moving = nodeAgents.filter(a => a.status === 'moving' || a.status === 'claiming');
    const settled = nodeAgents.find(a => a.status === 'settled');

    if (moving.length > 0) {
      // Find the group of the moving agents
      const mainGroup = groupMap.get(moving[0].groupId);
      const currentPhase = mainGroup ? mainGroup.phase : 'Spread';

      // Absorption among moving agents or with settled marker
      const absRes = handleCoLocatedAbsorption(pos, currentPhase, moving, settled, round);
      events.push(...absRes.events);

      // Check if moving agents encountered a higher-labeled settled marker (Late Adoption)
      if (settled) {
        for (const mov of moving) {
          if (compareLabels(mov.label, settled.label) < 0) {
            const lateEvent = applyLateAdoption(mov, settled, round);
            if (lateEvent) {
              events.push(lateEvent);
            }
          }
        }
      }
    }
  }

  // 4. CHECK PHASE COMPLETION FOR EACH GROUP
  for (const group of groups) {
    if (group.isTerminated) continue;

    // Check if all active members reached the end of their current phase path
    const activeMembers = agents.filter(
      a => a.groupId === group.id && (a.status === 'moving' || a.status === 'claiming')
    );

    // Singleton rule check: If single agent on its own, it passive-settles
    if (activeMembers.length === 1 && activeMembers[0].mass === 1) {
      const single = activeMembers[0];
      single.status = 'settled';
      single.settleMeta = {
        round,
        stepWhenHeadLeft: single.step,
        storedLabel: cloneLabel(single.label),
        storedGamma: 2,
        storedAnchor: { ...single.anchor },
        storedIdealCorner: { ...single.idealCorner },
        storedDir: { ...single.dir },
        storedSubgroup: 0,
        storedEpoch: single.epoch,
      };
      group.activeMemberIds = [];
      group.settledMemberIds.push(single.id);
      events.push(
        createSimulationEvent({
          round,
          type: 'AgentSettled',
          phase: group.phase,
          agentIds: [single.id],
          groupId: group.id,
          label: single.label,
          position: single.currentPos,
          previousState: 'moving',
          newState: 'settled',
          reason: `Singleton agent with mass 1 is already dispersed on its own.`,
          summary: `Agent ${single.id} passive-settled at (${single.currentPos.x}, ${single.currentPos.y}) by Singleton Rule.`,
          explanation: {
            whatHappened: `Single isolated agent reached settlement condition on its node.`,
            ruleApplied: `Section 3.2 Singleton Rule.`,
            whyActionSelected: `An isolated single agent requires no further dispersion unless recruited later.`,
            stateChanged: `Agent status changed to passive-settled.`,
            whatHappensNext: `Agent remains stationary until a same- or higher-labeled Collect passes.`,
          },
        })
      );
      continue;
    }

    if (activeMembers.length === 0) {
      continue;
    }

    // Check if phase step reached phase length
    const allAtEnd = activeMembers.every(ag => {
      const sg = group.subgroups.find(s => s.index === ag.subgroup);
      if (!sg) return true;
      return ag.step >= sg.path.length - 1;
    });

    if (allAtEnd) {
      // Phase completed!
      if (group.phase === 'Spread') {
        const bounds = calculateSweepBounds(
          group.anchor,
          group.direction,
          group.gamma,
          prevState.gridWidth,
          prevState.gridHeight
        );

        // Check if clipped (tx > 0 or ty > 0)
        if (bounds.isClipped) {
          const bounceRes = evaluateBoundaryContact(
            bounds,
            prevState.gridWidth,
            prevState.gridHeight
          );

          if (bounceRes.isTerminatingWholeGrid) {
            // Terminating whole-grid sweep!
            group.isTerminated = true;
            for (const ag of activeMembers) {
              ag.status = 'settled';
            }
            events.push(
              createSimulationEvent({
                round,
                type: 'AgentTerminated',
                phase: 'Spread',
                agentIds: activeMembers.map(a => a.id),
                groupId: group.id,
                label: group.label,
                reason: `γ (${group.gamma}) exceeds grid side and clips on both axes. Terminating whole-grid sweep.`,
                summary: `Group terminated via whole-grid sweep. All active members dispersed and stopped.`,
                explanation: {
                  whatHappened: `Sweep clipped on both axes with γ > sqrt(n), indicating whole-grid coverage.`,
                  ruleApplied: `Section 3.7 Terminating whole-grid sweep (γ > sqrt(n)).`,
                  whyActionSelected: `The square exceeds the grid dimensions; flipping cannot fit. Agents cover grid nodes and stop.`,
                  stateChanged: `All active agents transitioned to settled/terminated.`,
                  whatHappensNext: `Algorithm dispersion complete for this group.`,
                },
              })
            );
          } else {
            // Boundary bounce!
            group.bouncesCount++;
            group.anchor = { ...bounceRes.newAnchor };
            group.direction = { ...bounceRes.newDirection };

            const newBounds = calculateSweepBounds(
              group.anchor,
              group.direction,
              group.gamma,
              prevState.gridWidth,
              prevState.gridHeight
            );

            // Recompute sweep and reset members at new anchor
            const memberRanks = new Map<number, number>();
            activeMembers.forEach((ag, idx) => {
              memberRanks.set(ag.id, idx + 1);
              ag.rank = idx + 1;
              ag.subgroup = (idx + 1) % group.gamma;
              ag.step = 0;
              ag.currentPos = { ...group.anchor };
            });

            group.subgroups = buildSubgroups(
              group.gamma,
              memberRanks,
              newBounds,
              prevState.gridWidth,
              prevState.gridHeight
            );
            group.phase = 'Spread';
            group.phaseStep = 0;
            group.phaseLength = newBounds.length;

            events.push(
              createSimulationEvent({
                round,
                type: 'BoundaryBounce',
                phase: 'Spread',
                agentIds: activeMembers.map(a => a.id),
                groupId: group.id,
                label: group.label,
                position: group.anchor,
                reason: `Spread reached grid boundary. Bounced from (${bounds.realizedCorner.x}, ${bounds.realizedCorner.y}) towards interior.`,
                summary: `Boundary bounce #${group.bouncesCount}: direction flipped to (${group.direction.dx}, ${group.direction.dy}). New Spread started.`,
                explanation: {
                  whatHappened: `The intended sweep square exceeded grid boundaries (${bounds.excessX} x-excess, ${bounds.excessY} y-excess).`,
                  ruleApplied: `Section 3.7 Boundary Bounce (γ <= sqrt(n)).`,
                  whyActionSelected: `Bouncing reflects the square back into the interior without changing γ or certificate.`,
                  stateChanged: `Anchor reset to C, hit axis direction flipped, subgroups recomputed.`,
                  whatHappensNext: `Next Spread begins moving away from the hit boundary.`,
                },
              })
            );
          }
        } else {
          // Clean Spread completed
          const overflowAgents = activeMembers.filter(
            a => a.status === 'moving' && areCoordsEqual(a.currentPos, group.realizedCorner)
          );

          if (overflowAgents.length === 0) {
            // Everyone settled!
            events.push(
              createSimulationEvent({
                round,
                type: 'DispersionAchieved',
                phase: 'Spread',
                agentIds: [],
                groupId: group.id,
                label: group.label,
                reason: `All active agents of group successfully settled during clean Spread.`,
                summary: `Group dispersed completely in clean Spread with 0 overflow!`,
                explanation: {
                  whatHappened: `All moving members claimed free nodes during the sweep.`,
                  ruleApplied: `Section 3.3 End of Spread.`,
                  whyActionSelected: `No moving agents reached C, completing the dispersion cycle.`,
                  stateChanged: `Group active count is now 0.`,
                  whatHappensNext: `Settled markers remain on grid as final dispersed configuration.`,
                },
              })
            );
          } else {
            // Nonempty overflow: move to Reverse phase!
            group.overflowMemberIds = overflowAgents.map(a => a.id);
            for (const ag of overflowAgents) {
              ag.isOverflow = true;
            }

            // Re-rank overflow members by decreasing ID
            const sortedOverflow = [...overflowAgents].sort((a, b) => b.id - a.id);
            const memberRanks = new Map<number, number>();
            sortedOverflow.forEach((ag, idx) => {
              memberRanks.set(ag.id, idx + 1);
              ag.rank = idx + 1;
              ag.subgroup = (idx + 1) % group.gamma;
              ag.step = 0;
            });

            group.subgroups = buildSubgroups(
              group.gamma,
              memberRanks,
              bounds,
              prevState.gridWidth,
              prevState.gridHeight
            );
            group.phase = 'Reverse';
            group.phaseStep = 0;

            events.push(
              createSimulationEvent({
                round,
                type: 'ReverseStarted',
                phase: 'Reverse',
                agentIds: overflowAgents.map(a => a.id),
                groupId: group.id,
                label: group.label,
                position: group.realizedCorner,
                reason: `Clean Spread left ${overflowAgents.length} unsettled overflow agents at C. Starting Reverse towards A.`,
                summary: `Reverse phase started for ${overflowAgents.length} overflow agents from C to A.`,
                explanation: {
                  whatHappened: `Some nodes were occupied or unavailable, leaving overflow agents at destination corner C.`,
                  ruleApplied: `Section 3.4 Reverse Phase: Rendezvous retracing paths from C to A.`,
                  whyActionSelected: `Reverse absorbs co-located lower moving agents and claims lower settled markers.`,
                  stateChanged: `Group phase transitioned to Reverse. Subgroups re-assigned by rank mod γ.`,
                  whatHappensNext: `Subgroups step backwards along their paths towards anchor A.`,
                },
              })
            );
          }
        }
      } else if (group.phase === 'Reverse' || group.phase === 'RecoveryReverse') {
        // Reverse completed at A!
        // Transition to Collect!
        const nextPhase = group.phase === 'RecoveryReverse' ? 'RecoveryCollect' : 'Collect';
        group.phase = nextPhase;
        group.phaseStep = 0;

        const bounds = calculateSweepBounds(
          group.anchor,
          group.direction,
          group.gamma,
          prevState.gridWidth,
          prevState.gridHeight
        );

        // Re-rank members at A
        const sortedAtA = [...activeMembers].sort((a, b) => b.id - a.id);
        const memberRanks = new Map<number, number>();
        sortedAtA.forEach((ag, idx) => {
          memberRanks.set(ag.id, idx + 1);
          ag.rank = idx + 1;
          ag.subgroup = (idx + 1) % group.gamma;
          ag.step = 0;
        });

        group.subgroups = buildSubgroups(
          group.gamma,
          memberRanks,
          bounds,
          prevState.gridWidth,
          prevState.gridHeight
        );

        events.push(
          createSimulationEvent({
            round,
            type: 'CollectStarted',
            phase: nextPhase,
            agentIds: activeMembers.map(a => a.id),
            groupId: group.id,
            label: group.label,
            position: group.anchor,
            reason: `Surviving moving members gathered at A. Starting Collect towards C.`,
            summary: `${nextPhase} started: subgroups advancing A -> C to recruit eligible settled agents.`,
            explanation: {
              whatHappened: `All surviving reversing agents successfully rendezvoused at anchor A.`,
              ruleApplied: `Section 3.5 Collect Phase: Re-rank at A and sweep towards C.`,
              whyActionSelected: `Collect recruits earlier settled markers and moving agents to enlarge the group.`,
              stateChanged: `Group phase updated to ${nextPhase}. Subgroups re-partitioned.`,
              whatHappensNext: `Subgroups move A -> C, un-settling eligible markers and carrying them to C.`,
            },
          })
        );
      } else if (group.phase === 'Collect' || group.phase === 'RecoveryCollect') {
        // Collect completed at C!
        const mAfter = activeMembers.length;
        const oldLabel = cloneLabel(group.label);

        // End-of-cycle decision (Section 3.8)
        const isCleanPath = group.isClean && activeMembers.every(a => !a.contact);
        const canLevelUp = isCleanPath && mAfter >= 2 * group.label.certificate;

        if (canLevelUp) {
          group.label.certificate = mAfter;
          group.label.level += 1;
          // Leader is largest ID among active members
          const maxId = Math.max(...activeMembers.map(a => a.id));
          group.label.leaderId = maxId;

          for (const ag of activeMembers) {
            ag.label = cloneLabel(group.label);
          }

          events.push(createLevelUpEvent(round, group.id, oldLabel, group.label, mAfter));
        }

        // Geometric keystone: A <- C, flip both axes (dx, dy) <- (-dx, -dy)
        group.anchor = { ...group.realizedCorner };
        group.direction = {
          dx: -group.direction.dx as -1 | 1,
          dy: -group.direction.dy as -1 | 1,
        };

        const newGamma = calculateGamma(mAfter);
        group.gamma = newGamma;
        group.mass = mAfter;

        const newBounds = calculateSweepBounds(
          group.anchor,
          group.direction,
          newGamma,
          prevState.gridWidth,
          prevState.gridHeight
        );

        // Re-rank for next Spread
        const sortedAtC = [...activeMembers].sort((a, b) => b.id - a.id);
        const memberRanks = new Map<number, number>();
        sortedAtC.forEach((ag, idx) => {
          memberRanks.set(ag.id, idx + 1);
          ag.rank = idx + 1;
          ag.subgroup = (idx + 1) % newGamma;
          ag.step = 0;
          ag.anchor = { ...group.anchor };
          ag.dir = { ...group.direction };
          ag.mass = newGamma;
        });

        group.subgroups = buildSubgroups(
          newGamma,
          memberRanks,
          newBounds,
          prevState.gridWidth,
          prevState.gridHeight
        );
        group.phase = 'Spread';
        group.phaseStep = 0;
        group.phaseLength = newBounds.length;

        events.push(
          createSimulationEvent({
            round,
            type: 'SweepStarted',
            phase: 'Spread',
            agentIds: activeMembers.map(a => a.id),
            groupId: group.id,
            label: group.label,
            position: group.anchor,
            reason: `End of clean cycle at C. Mass recomputed: m_after = ${mAfter}, γ_new = ${newGamma}. Double flip applied.`,
            summary: `Starting next cycle Spread from (${group.anchor.x}, ${group.anchor.y}) with direction (${group.direction.dx}, ${group.direction.dy}).`,
            explanation: {
              whatHappened: `Collect phase ended at destination C. Group recomputed active size and updated sweep geometry.`,
              ruleApplied: `Section 3.8 Decision at the End of a Clean Cycle & Double Flip Keystone.`,
              whyActionSelected: `Unconditional double flip sends next sweep back through the exposed region.`,
              stateChanged: `Anchor set to C, direction flipped, active mass and γ updated.`,
              whatHappensNext: `Next Spread begins with enlarged parameter γ = ${newGamma}.`,
            },
          })
        );
      }
    }
  }

  // 5. UPDATE STATISTICS & DISPERSION STATUS
  const settledCount = agents.filter(a => a.status === 'settled').length;
  const activeCount = agents.filter(a => a.status === 'moving' || a.status === 'claiming').length;

  // Dispersion achieved if every occupied cell has at most 1 agent and 0 active agents
  const cellOccupancy = new Map<string, number>();
  for (const ag of agents) {
    const k = `${ag.currentPos.x},${ag.currentPos.y}`;
    cellOccupancy.set(k, (cellOccupancy.get(k) || 0) + 1);
  }
  const maxPerCell = Math.max(...Array.from(cellOccupancy.values()), 0);
  const isDispersed = maxPerCell <= 1 && activeCount === 0;

  const highestLevel = Math.max(...agents.map(a => a.label.level), 0);
  const totalBounces = groups.reduce((acc, g) => acc + g.bouncesCount, 0);

  return {
    round,
    gridWidth: prevState.gridWidth,
    gridHeight: prevState.gridHeight,
    agents,
    groups,
    events,
    isTerminated: isDispersed || activeCount === 0,
    isDispersed,
    statistics: {
      ...prevState.statistics,
      settledCount,
      activeCount,
      highestLevel,
      bouncesCount: totalBounces,
    },
  };
}
