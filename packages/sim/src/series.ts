// Series of runs (spec 02 §6).
import { runDeck } from './run.ts';
import type { RunInput, RunResult } from './run.ts';
import { SIM_VERSION } from './version.ts';
import { ALGORITHM_VERSION } from '@lexjab/core';

export interface SeriesInput {
  /** Run input without the seed; run i gets seed baseSeed + i. */
  readonly run: Omit<RunInput, 'seed'>;
  readonly runs: number;
  readonly baseSeed: number;
  readonly percentile: number;
}

export interface Stat {
  readonly avg: number | null;
  readonly max: number | null;
}

export interface RoundStat {
  readonly round: number;
  /** null = "не завершено": the percentile lands on an incomplete run. */
  readonly lesson: number | null;
  readonly testsPerUnit: number | null;
  readonly days: number | null;
}

export interface SeriesResult {
  readonly simVersion: string;
  readonly algorithmVersion: string;
  readonly input: SeriesInput;
  readonly rounds: readonly RoundStat[];
  readonly incompleteShare: number;
  readonly neverTestedShare: number;
  readonly firstTestLastUnit: Stat;
  readonly returnAfter1: Stat;
  readonly longestStreak: Stat;
  readonly emptySlotsAvg: number;
  readonly fillerSlotsAvg: number;
}

/** Nearest-rank percentile: value at position ceil(p/100 * n) of the ascending series (1-based). */
export function nearestRank(values: readonly number[], p: number): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(1, Math.ceil((p / 100) * sorted.length));
  return sorted[rank - 1]!;
}

function stat(values: readonly number[]): Stat {
  if (values.length === 0) return { avg: null, max: null };
  let sum = 0;
  let max = -Infinity;
  for (const v of values) {
    sum += v;
    if (v > max) max = v;
  }
  return { avg: sum / values.length, max };
}

function finiteOrNull(v: number): number | null {
  return Number.isFinite(v) ? v : null;
}

export function summarize(input: SeriesInput, results: readonly RunResult[]): SeriesResult {
  const n = results.length;
  const rounds: RoundStat[] = [];
  for (let k = 1; k <= input.run.roundsPerRun; k++) {
    // Incomplete runs count as infinitely long (spec 02 §6).
    const pick = (f: (r: { lesson: number; testsPerUnit: number; days: number }) => number) =>
      finiteOrNull(
        nearestRank(
          results.map((r) => {
            const end = r.metrics.roundEnds[k - 1];
            return end === undefined ? Infinity : f(end);
          }),
          input.percentile,
        ),
      );
    rounds.push({
      round: k,
      lesson: pick((e) => e.lesson),
      testsPerUnit: pick((e) => e.testsPerUnit),
      days: pick((e) => e.days),
    });
  }

  return {
    simVersion: SIM_VERSION,
    algorithmVersion: ALGORITHM_VERSION,
    input,
    rounds,
    incompleteShare: results.filter((r) => !r.completed).length / n,
    neverTestedShare: results.filter((r) => r.metrics.neverTested).length / n,
    firstTestLastUnit: stat(
      results.map((r) => r.metrics.firstTestLastUnit).filter((v): v is number => v !== null),
    ),
    // Pooled over all grade-1 cases of all runs (spec 02 §6).
    returnAfter1: stat(results.flatMap((r) => r.metrics.returnAfter1)),
    longestStreak: stat(results.map((r) => r.metrics.longestStreak)),
    emptySlotsAvg: results.reduce((s, r) => s + r.metrics.emptySlots, 0) / n,
    fillerSlotsAvg: results.reduce((s, r) => s + r.metrics.fillerSlots, 0) / n,
  };
}

/** Runs the whole series. Keeps only metrics of each run to save memory, not the logs. */
export function runSeries(input: SeriesInput): SeriesResult {
  const results: RunResult[] = [];
  for (let i = 0; i < input.runs; i++) {
    const r = runDeck({ ...input.run, seed: input.baseSeed + i });
    results.push({ ...r, log: [] });
  }
  return summarize(input, results);
}
