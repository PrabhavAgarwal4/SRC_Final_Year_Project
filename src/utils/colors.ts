/**
 * Color utilities for consistent visual semantics across the visualizer.
 */

// Group colors — distinct, colorblind-friendly palette
export const GROUP_COLORS = [
  { fill: '#3B82F6', stroke: '#2563EB', bg: 'bg-blue-500', text: 'text-blue-500', name: 'Blue' },
  { fill: '#EF4444', stroke: '#DC2626', bg: 'bg-rose-500', text: 'text-rose-500', name: 'Rose' },
  { fill: '#10B981', stroke: '#059669', bg: 'bg-emerald-500', text: 'text-emerald-500', name: 'Green' },
  { fill: '#F59E0B', stroke: '#D97706', bg: 'bg-amber-500', text: 'text-amber-500', name: 'Amber' },
  { fill: '#8B5CF6', stroke: '#7C3AED', bg: 'bg-purple-500', text: 'text-purple-500', name: 'Purple' },
  { fill: '#06B6D4', stroke: '#0891B2', bg: 'bg-cyan-500', text: 'text-cyan-500', name: 'Cyan' },
  { fill: '#F97316', stroke: '#EA580C', bg: 'bg-orange-500', text: 'text-orange-500', name: 'Orange' },
  { fill: '#EC4899', stroke: '#DB2777', bg: 'bg-pink-500', text: 'text-pink-500', name: 'Pink' },
];

// Phase colors
export const PHASE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  spread: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-800 dark:text-emerald-300', label: 'Spread' },
  reverse: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-800 dark:text-amber-300', label: 'Reverse' },
  collect: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-800 dark:text-blue-300', label: 'Collect' },
  waiting: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-800 dark:text-yellow-300', label: 'Waiting' },
  'recovery-reverse': { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-800 dark:text-orange-300', label: 'Recovery Rev.' },
  'recovery-collect': { bg: 'bg-teal-100 dark:bg-teal-900/40', text: 'text-teal-800 dark:text-teal-300', label: 'Recovery Col.' },
  idle: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', label: 'Idle' },
  terminated: { bg: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-300', label: 'Terminated' },
};

// Status colors
export const STATUS_COLORS: Record<string, { fill: string; stroke: string }> = {
  moving: { fill: '#FFFFFF', stroke: '#000000' },
  claiming: { fill: '#FEF3C7', stroke: '#F59E0B' },
  settled: { fill: '#D1FAE5', stroke: '#10B981' },
  terminated: { fill: '#E2E8F0', stroke: '#94A3B8' },
};

// Get group color by a consistent hash of the initial group id
export function getGroupColor(groupId: number): typeof GROUP_COLORS[0] {
  return GROUP_COLORS[groupId % GROUP_COLORS.length];
}

// Format a label for display
export function formatLabel(label: { level: number; certificate: number; leaderId: number }): string {
  return `(${label.level}, ${label.certificate}, ${label.leaderId})`;
}

// Format position
export function formatPosition(pos: { x: number; y: number }): string {
  return `(${pos.x}, ${pos.y})`;
}
