// One run (spec 02 §4).
import { ALGORITHM_VERSION, applyGrade, createDeck, nextLesson } from '@lexjab/core';
import type { Grade, Params, Settings } from '@lexjab/core';
import { learnerFromSpec } from './learners.ts';
import type { GradeFn, LearnerSpec } from './learners.ts';
import { computeRunMetrics } from './metrics.ts';
import type { RunMetrics } from './metrics.ts';
import { mulberry32 } from './rng.ts';
import type { Rand } from './rng.ts';
import { SIM_VERSION } from './version.ts';

export interface RunInput {
  readonly deckSize: number;
  readonly settings: Settings;
  readonly params: Params;
  readonly learner: LearnerSpec;
  readonly seed: number;
  readonly roundsPerRun: number;
  readonly maxTestsPerUnit: number;
}

export interface LogEntry {
  readonly itemId: string;
  readonly grade: Grade;
  readonly filler: boolean;
  readonly efBefore: number;
  readonly efAfter: number;
}

export interface LessonLog {
  readonly lesson: number;
  readonly round: number;
  readonly entries: readonly LogEntry[];
  /** True if every unit has left the round after this lesson (spec 02 §4). */
  readonly roundEnded: boolean;
}

export interface RunResult {
  readonly simVersion: string;
  readonly algorithmVersion: string;
  readonly input: RunInput;
  readonly completed: boolean;
  readonly log: readonly LessonLog[];
  readonly metrics: RunMetrics;
}

export function unitIds(deckSize: number): string[] {
  return Array.from({ length: deckSize }, (_, i) => `U${i}`);
}

/** Runs the deck with an explicit grade function. Used by runDeck and by tests with scripted grades. */
export function simulate(input: RunInput, gradeFn: GradeFn, rand: Rand): RunResult {
  let deck = createDeck(unitIds(input.deckSize), input.settings, input.params);
  const counters = new Map<string, { successes: number; fives: number }>(
    deck.units.map((u) => [u.itemId, { successes: 0, fives: 0 }]),
  );
  const maxTests = input.maxTestsPerUnit * input.deckSize;
  const log: LessonLog[] = [];
  let totalTests = 0;
  let roundsDone = 0;

  while (roundsDone < input.roundsPerRun && totalTests < maxTests) {
    deck = nextLesson(deck);
    const entries: LogEntry[] = [];
    for (const itemId of deck.lessonItems) {
      const before = deck.units.find((u) => u.itemId === itemId)!;
      const c = counters.get(itemId)!;
      const grade = gradeFn(c, rand);
      deck = applyGrade(deck, itemId, grade);
      const after = deck.units.find((u) => u.itemId === itemId)!;
      if (grade !== 1) c.successes += 1;
      if (grade === 5) c.fives += 1;
      totalTests += 1;
      entries.push({ itemId, grade, filler: before.out, efBefore: before.ef, efAfter: after.ef });
    }
    // Round k ends after the lesson in which every unit has left it.
    const roundEnded = deck.units.every((u) => u.out);
    if (roundEnded) roundsDone += 1;
    log.push({ lesson: deck.lesson, round: deck.round, entries, roundEnded });
  }

  return {
    simVersion: SIM_VERSION,
    algorithmVersion: ALGORITHM_VERSION,
    input,
    completed: roundsDone >= input.roundsPerRun,
    log,
    metrics: computeRunMetrics(log, input),
  };
}

/** Spec 02 §4: one run with the learner model from the input. */
export function runDeck(input: RunInput): RunResult {
  return simulate(input, learnerFromSpec(input.learner), mulberry32(input.seed));
}
