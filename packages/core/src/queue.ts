import type { Grade, UnitState } from './types.ts';

// Spec §5.2: last grade order "1" -> untested -> "3" -> "5".
const GRADE_RANK: Record<Grade, number> = { 1: 0, 3: 2, 5: 3 };
const UNTESTED_RANK = 1;

function gradeRank(grade: Grade | null): number {
  return grade === null ? UNTESTED_RANK : GRADE_RANK[grade];
}

/**
 * Queue order (spec §5). `index` is the unit's position in the deck.
 * lastLesson null only occurs for untested units, which already tie on rank;
 * -1 keeps the comparison total.
 */
export function compareUnits(
  a: UnitState,
  aIndex: number,
  b: UnitState,
  bIndex: number,
): number {
  if (a.ef !== b.ef) return a.ef - b.ef;
  const rank = gradeRank(a.lastGrade) - gradeRank(b.lastGrade);
  if (rank !== 0) return rank;
  const wait = (a.lastLesson ?? -1) - (b.lastLesson ?? -1);
  if (wait !== 0) return wait;
  return aIndex - bIndex;
}

/** Returns item ids of `units` filtered by `pick`, in queue order. */
export function orderedIds(
  units: readonly UnitState[],
  pick: (unit: UnitState) => boolean,
): string[] {
  return units
    .map((unit, index) => ({ unit, index }))
    .filter(({ unit }) => pick(unit))
    .sort((x, y) => compareUnits(x.unit, x.index, y.unit, y.index))
    .map(({ unit }) => unit.itemId);
}
