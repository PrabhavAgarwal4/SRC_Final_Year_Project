import { Label, formatLabel } from '../engine/model/Label';
import { Coord, coordToString } from '../engine/model/Grid';
import { AlgorithmPhase } from '../engine/model/Agent';

export function getPhaseBadgeColor(phase: AlgorithmPhase): string {
  switch (phase) {
    case 'Spread':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
    case 'Reverse':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    case 'Collect':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
    case 'WaitAtC':
      return 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30';
    case 'RecoveryReverse':
    case 'RecoveryCollect':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30';
    case 'Terminated':
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
    default:
      return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
  }
}

export function formatPhaseName(phase: AlgorithmPhase): string {
  switch (phase) {
    case 'Spread':
      return 'Spread (A → C)';
    case 'Reverse':
      return 'Reverse (C → A)';
    case 'Collect':
      return 'Collect (A → C)';
    case 'WaitAtC':
      return 'Wait at Corner C';
    case 'RecoveryReverse':
      return 'Recovery Reverse';
    case 'RecoveryCollect':
      return 'Recovery Collect';
    case 'Terminated':
      return 'Terminated / Dispersed';
    default:
      return phase;
  }
}
