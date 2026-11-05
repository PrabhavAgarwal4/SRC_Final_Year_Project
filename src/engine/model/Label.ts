/**
 * Group Label: Λ = (ℓ, c, id)
 * ℓ = level (doubling count)
 * c = certified group size (at initialization or most recent level-up)
 * id = leader identifier
 */
export interface Label {
  level: number;
  certificate: number;
  leaderId: number;
}

/**
 * Compare two labels lexicographically.
 * Returns:
 *  > 0 if a > b (a strictly higher priority)
 *  < 0 if a < b (b strictly higher priority)
 *  = 0 if a == b
 */
export function compareLabels(a: Label, b: Label): number {
  if (a.level !== b.level) {
    return a.level - b.level;
  }
  if (a.certificate !== b.certificate) {
    return a.certificate - b.certificate;
  }
  return a.leaderId - b.leaderId;
}

export function areLabelsEqual(a: Label, b: Label): boolean {
  return a.level === b.level && a.certificate === b.certificate && a.leaderId === b.leaderId;
}

export function formatLabel(label: Label): string {
  return `(ℓ:${label.level}, c:${label.certificate}, id:${label.leaderId})`;
}

export function cloneLabel(label: Label): Label {
  return {
    level: label.level,
    certificate: label.certificate,
    leaderId: label.leaderId,
  };
}
