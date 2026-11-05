import { Coord } from './Grid';

export interface SubgroupPathSegment {
  type: 'firstRow' | 'column' | 'secondRow';
  points: Coord[];
}

export interface Subgroup {
  index: number; // s ∈ {0, ..., γ - 1}
  coveredX: number; // covered column x = ax + s * dx
  path: Coord[]; // full sequence of nodes from A to C
  firstRowLeg: Coord[];
  columnLeg: Coord[];
  secondRowLeg: Coord[];
  memberIds: number[];
  headPos: Coord;
  contacted: boolean;
}

export function cloneSubgroup(subgroup: Subgroup): Subgroup {
  return {
    ...subgroup,
    path: subgroup.path.map(p => ({ ...p })),
    firstRowLeg: subgroup.firstRowLeg.map(p => ({ ...p })),
    columnLeg: subgroup.columnLeg.map(p => ({ ...p })),
    secondRowLeg: subgroup.secondRowLeg.map(p => ({ ...p })),
    memberIds: [...subgroup.memberIds],
    headPos: { ...subgroup.headPos },
  };
}
