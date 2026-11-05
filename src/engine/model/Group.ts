import { Coord, Direction } from './Grid';
import { Label } from './Label';
import { Subgroup, cloneSubgroup } from './Subgroup';
import { AlgorithmPhase } from './Agent';

export interface Group {
  id: string;
  label: Label;
  mass: number; // m
  gamma: number; // γ = 2 * ceil(sqrt(m))
  anchor: Coord; // A
  idealCorner: Coord; // C*
  realizedCorner: Coord; // C
  direction: Direction; // δ = (dx, dy)
  epoch: number;
  phase: AlgorithmPhase;
  phaseStep: number; // step within current phase 0..lambda
  phaseLength: number; // lambda = 2(γ - 1) - tx - ty
  boundaryExcessX: number; // tx
  boundaryExcessY: number; // ty
  bouncesCount: number;
  subgroups: Subgroup[];
  activeMemberIds: number[];
  settledMemberIds: number[];
  overflowMemberIds: number[];
  isClean: boolean; // false if any subgroup contacted higher label
  isTerminated: boolean;
  color: string;
}

export function cloneGroup(group: Group): Group {
  return {
    ...group,
    label: { ...group.label },
    anchor: { ...group.anchor },
    idealCorner: { ...group.idealCorner },
    realizedCorner: { ...group.realizedCorner },
    direction: { ...group.direction },
    subgroups: group.subgroups.map(cloneSubgroup),
    activeMemberIds: [...group.activeMemberIds],
    settledMemberIds: [...group.settledMemberIds],
    overflowMemberIds: [...group.overflowMemberIds],
  };
}
