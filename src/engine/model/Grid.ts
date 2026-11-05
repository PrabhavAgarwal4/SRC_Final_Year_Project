/**
 * Grid coordinates and cardinal directions.
 */
export interface Coord {
  x: number;
  y: number;
}

export type Port = 1 | 2 | 3 | 4; // 1: North (+y), 2: East (+x), 3: South (-y), 4: West (-x)
export type Direction = { dx: -1 | 1; dy: -1 | 1 };

export function areCoordsEqual(a: Coord, b: Coord): boolean {
  return a.x === b.x && a.y === b.y;
}

export function coordToString(c: Coord): string {
  return `(${c.x}, ${c.y})`;
}

export function manhattanDistance(a: Coord, b: Coord): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function clip(z: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, z));
}

export interface GridConfig {
  width: number;
  height: number;
}
