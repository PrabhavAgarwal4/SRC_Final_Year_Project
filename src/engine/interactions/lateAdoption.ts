import { Agent, LateAdoptionState, AlgorithmPhase } from '../model/Agent';
import { Coord } from '../model/Grid';
import { compareLabels, cloneLabel } from '../model/Label';
import { SimulationEvent } from '../events/SimulationEvent';
import { createLateAdoptionEvent } from '../events/eventFactory';

export interface LateAdoptionPrediction {
  predictedPhase: AlgorithmPhase;
  predictedStep: number;
  targetPos: Coord;
  shouldWaitAtC: boolean;
}

/**
 * Predict higher group's head position and phase from stored marker metadata.
 */
export function predictHigherSubgroupState(
  agentCurrentRound: number,
  markerRoundSet: number,
  markerStep: number,
  markerGamma: number,
  markerExcessX: number,
  markerExcessY: number
): { predictedPhase: AlgorithmPhase; predictedStep: number } {
  const age = Math.max(0, agentCurrentRound - markerRoundSet);
  const lambda = Math.max(1, 2 * (markerGamma - 1) - markerExcessX - markerExcessY);

  const totalStepsFromMarker = markerStep + age;

  if (totalStepsFromMarker <= lambda) {
    return {
      predictedPhase: 'Spread',
      predictedStep: totalStepsFromMarker,
    };
  } else if (totalStepsFromMarker <= 2 * lambda) {
    return {
      predictedPhase: 'Reverse',
      predictedStep: totalStepsFromMarker - lambda,
    };
  } else if (totalStepsFromMarker <= 3 * lambda) {
    return {
      predictedPhase: 'Collect',
      predictedStep: totalStepsFromMarker - 2 * lambda,
    };
  } else {
    // Missed live traffic, go to C and wait
    return {
      predictedPhase: 'WaitAtC',
      predictedStep: lambda,
    };
  }
}

/**
 * Execute late adoption on a lower-labeled moving agent encountering a higher-labeled settled marker.
 */
export function applyLateAdoption(
  agent: Agent,
  settledMarker: Agent,
  currentRound: number
): SimulationEvent | null {
  if (!settledMarker.settleMeta) return null;

  const cmp = compareLabels(agent.label, settledMarker.label);
  if (cmp >= 0) return null; // Only lower-labeled agent adopts

  const oldLabel = cloneLabel(agent.label);
  const newLabel = cloneLabel(settledMarker.label);
  const meta = settledMarker.settleMeta;

  const excessX = Math.abs(meta.storedIdealCorner.x - meta.storedAnchor.x);
  const excessY = Math.abs(meta.storedIdealCorner.y - meta.storedAnchor.y);

  const { predictedPhase, predictedStep } = predictHigherSubgroupState(
    currentRound,
    meta.round,
    meta.stepWhenHeadLeft,
    meta.storedGamma,
    0,
    0
  );

  agent.label = cloneLabel(newLabel);
  agent.contact = true; // losing path
  agent.isLateAdopter = true;
  agent.anchor = { ...meta.storedAnchor };
  agent.idealCorner = { ...meta.storedIdealCorner };
  agent.dir = { ...meta.storedDir };
  agent.subgroup = meta.storedSubgroup;
  agent.mass = meta.storedGamma;
  agent.epoch = meta.storedEpoch;

  const lateState: LateAdoptionState = {
    originalLabel: oldLabel,
    adoptedLabel: newLabel,
    predictedPhase,
    predictedStep,
    waitTimer: 2 * meta.storedGamma,
    recoveryInitiator: false,
  };

  agent.lateAdoption = lateState;

  return createLateAdoptionEvent(
    currentRound,
    agent.id,
    oldLabel,
    newLabel,
    agent.currentPos,
    predictedPhase
  );
}
