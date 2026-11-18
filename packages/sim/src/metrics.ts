// Run metrics (spec 02 §5).
import type { LessonLog, RunInput } from './run.ts';

export interface RoundEnd {
  readonly round: number;
  readonly lesson: number;
  readonly testsPerUnit: number;
  readonly days: number;
}

export interface RunMetrics {
  readonly roundEnds: readonly RoundEnd[];
  readonly lessons: number;
  readonly totalTests: number;
  /** Largest first-test lesson among tested units; null if nothing was tested. */
  readonly firstTestLastUnit: number | null;
  readonly neverTested: boolean;
  /** Gaps (in lessons) between a grade 1 and the unit's next appearance. Unreturned cases are excluded. */
  readonly returnAfter1: readonly number[];
  readonly longestStreak: number;
  readonly emptySlots: number;
  readonly fillerSlots: number;
}

export function computeRunMetrics(log: readonly LessonLog[], input: RunInput): RunMetrics {
  const n = input.settings.unitsPerLesson;
  const firstTest = new Map<string, number>();
  const lastSeen = new Map<string, number>();
  const streak = new Map<string, number>();
  const pendingOne = new Map<string, number>(); // itemId -> lesson of a grade 1 awaiting return
  const returnAfter1: number[] = [];
  const roundEnds: RoundEnd[] = [];
  let totalTests = 0;
  let longestStreak = 0;
  let emptySlots = 0;
  let fillerSlots = 0;

  for (const l of log) {
    emptySlots += Math.max(0, n - l.entries.length);
    for (const e of l.entries) {
      totalTests += 1;
      if (e.filler) fillerSlots += 1;
      if (!firstTest.has(e.itemId)) firstTest.set(e.itemId, l.lesson);

      const p = pendingOne.get(e.itemId);
      if (p !== undefined) {
        returnAfter1.push(l.lesson - p);
        pendingOne.delete(e.itemId);
      }
      if (e.grade === 1) pendingOne.set(e.itemId, l.lesson);

      const s = lastSeen.get(e.itemId) === l.lesson - 1 ? (streak.get(e.itemId) ?? 0) + 1 : 1;
      streak.set(e.itemId, s);
      lastSeen.set(e.itemId, l.lesson);
      longestStreak = Math.max(longestStreak, s);
    }
    if (l.roundEnded) {
      roundEnds.push({
        round: l.round,
        lesson: l.lesson,
        testsPerUnit: totalTests / input.deckSize,
        days: l.lesson / input.settings.lessonsPerDay,
      });
    }
  }

  const firsts = [...firstTest.values()];
  return {
    roundEnds,
    lessons: log.length,
    totalTests,
    firstTestLastUnit: firsts.length > 0 ? Math.max(...firsts) : null,
    neverTested: firstTest.size < input.deckSize,
    returnAfter1,
    longestStreak,
    emptySlots,
    fillerSlots,
  };
}
