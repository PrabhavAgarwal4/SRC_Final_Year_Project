/**
 * Label comparison utilities for the SRC algorithm.
 *
 * Labels are compared lexicographically: (level, certificate, leaderId).
 * A "higher" label wins in every conflict.
 */

import type { Label } from './types';

/**
 * Lexicographic comparison of two labels.
 * Order: level → certificate → leaderId.
 *
 * @returns -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareLabels(a: Label, b: Label): -1 | 0 | 1 {
  if (a.level !== b.level) return a.level < b.level ? -1 : 1;
  if (a.certificate !== b.certificate) return a.certificate < b.certificate ? -1 : 1;
  if (a.leaderId !== b.leaderId) return a.leaderId < b.leaderId ? -1 : 1;
  return 0;
}

/** True when label `a` is strictly greater than label `b`. */
export function isHigherLabel(a: Label, b: Label): boolean {
  return compareLabels(a, b) === 1;
}

/** True when the two labels are identical. */
export function labelsEqual(a: Label, b: Label): boolean {
  return compareLabels(a, b) === 0;
}

/**
 * Create the initial label for a newly formed group.
 * Level starts at 0; certificate equals the group size; leaderId is the
 * maximum agent id within the group.
 */
export function createInitialLabel(size: number, leaderId: number): Label {
  return { level: 0, certificate: size, leaderId };
}

/** Deep-clone a label (plain object, so spread is sufficient). */
export function cloneLabel(l: Label): Label {
  return { ...l };
}
