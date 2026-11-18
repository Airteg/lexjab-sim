import { CoreError } from './errors.ts';
import { ALGORITHM_VERSION, DEFAULT_PARAMS } from './params.ts';
import { orderedIds } from './queue.ts';
import type { DeckState, Grade, Params, Report, Settings, UnitState } from './types.ts';

const GRADES: readonly Grade[] = [1, 3, 5];

function isGrade(value: unknown): value is Grade {
  return GRADES.includes(value as Grade);
}

/** Spec §6.1. */
export function createDeck(
  itemIds: readonly string[],
  settings: Settings,
  params: Params = DEFAULT_PARAMS,
): DeckState {
  if (itemIds.length === 0) {
    throw new CoreError('EMPTY_DECK', 'Deck has no units');
  }
  const seen = new Set<string>();
  for (const id of itemIds) {
    if (seen.has(id)) throw new CoreError('DUPLICATE_ITEM', `Duplicate itemId: ${id}`);
    seen.add(id);
  }
  if (!Number.isInteger(settings.unitsPerLesson) || settings.unitsPerLesson < 1) {
    throw new CoreError(
      'INVALID_UNITS_PER_LESSON',
      `unitsPerLesson must be an integer >= 1, got ${settings.unitsPerLesson}`,
    );
  }
  const units: UnitState[] = itemIds.map((itemId) => ({
    itemId,
    ef: params.efStart,
    lastGrade: null,
    streak5: 0,
    out: false,
    lastLesson: null,
    tests: 0,
  }));
  return {
    algorithmVersion: ALGORITHM_VERSION,
    params,
    settings,
    units,
    lesson: 0,
    round: 1,
    lessonItems: [],
    gradedInLesson: [],
  };
}

/** Spec §6.2. */
export function nextLesson(deck: DeckState): DeckState {
  const lesson = deck.lesson + 1;
  let round = deck.round;
  let units = deck.units;

  // §6.2.2: everyone is out -> new round.
  if (units.every((u) => u.out)) {
    round += 1;
    units = units.map((u) => ({ ...u, out: false, streak5: 0 }));
  }

  const n = deck.settings.unitsPerLesson;
  // §6.2.3: units in the round, queue order.
  const inRound = orderedIds(units, (u) => !u.out).slice(0, n);
  // §6.2.4: free slots are filled by units that left the round, same queue order.
  const fillers = orderedIds(units, (u) => u.out).slice(0, n - inRound.length);

  return {
    ...deck,
    units,
    lesson,
    round,
    lessonItems: [...inRound, ...fillers],
    gradedInLesson: [],
  };
}

/** Spec §6.3. */
export function applyGrade(deck: DeckState, itemId: string, grade: Grade): DeckState {
  if (!isGrade(grade)) {
    throw new CoreError('INVALID_GRADE', `Grade must be 1, 3 or 5, got ${String(grade)}`);
  }
  if (!deck.lessonItems.includes(itemId)) {
    throw new CoreError('ITEM_NOT_IN_LESSON', `${itemId} is not in lesson ${deck.lesson}`);
  }
  if (deck.gradedInLesson.includes(itemId)) {
    throw new CoreError('ALREADY_GRADED', `${itemId} is already graded in lesson ${deck.lesson}`);
  }

  const p = deck.params;
  const units = deck.units.map((u) => {
    if (u.itemId !== itemId) return u;
    const streak5 = grade === 5 ? u.streak5 + 1 : 0;
    let out = u.out;
    if (!u.out && streak5 >= p.exitStreak) {
      out = true; // §6.3.4: leaves the round.
    } else if (u.out && p.fillerReturnGrades.includes(grade)) {
      out = false; // §6.3.4: filler returns to the round.
    }
    return {
      ...u,
      ef: Math.max(p.efMin, u.ef + p.efDelta[grade]),
      tests: u.tests + 1,
      lastGrade: grade,
      lastLesson: deck.lesson,
      streak5,
      out,
    };
  });

  return { ...deck, units, gradedInLesson: [...deck.gradedInLesson, itemId] };
}

/** Spec §6.4. */
export function report(deck: DeckState): Report {
  const outCount = deck.units.filter((u) => u.out).length;
  return {
    lesson: deck.lesson,
    round: deck.round,
    completedRounds: deck.round - 1,
    outCount,
    inRoundCount: deck.units.length - outCount,
    forecast: null,
    unreachable: null,
  };
}
