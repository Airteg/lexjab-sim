// Tests for spec 02 §8.
import { DEFAULT_PARAMS } from '@lexjab/core';
import type { Grade } from '@lexjab/core';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VALUES,
  REGISTRY,
  exp2,
  mulberry32,
  nearestRank,
  runDeck,
  runSeries,
  simulate,
  toSeriesInput,
  validateValues,
} from '../src/index.ts';
import type { GradeFn, RunInput } from '../src/index.ts';

const baseInput = (deckSize: number, n: number, extra: Partial<RunInput> = {}): RunInput => ({
  deckSize,
  settings: { unitsPerLesson: n, lessonsPerDay: 5, deadlineLessons: null },
  params: DEFAULT_PARAMS,
  learner: { method: 'exp2', c1: 0.3, d1: 0.5, e1: 0.7 },
  seed: 1,
  roundsPerRun: 2,
  maxTestsPerUnit: 100,
  ...extra,
});

/** Grades taken in order from a list; ignores context and randomness. */
function scripted(grades: readonly Grade[]): GradeFn {
  let i = 0;
  return () => {
    const g = grades[i++];
    if (g === undefined) throw new Error('script exhausted');
    return g;
  };
}

describe('§2 PRNG', () => {
  it('is deterministic and in [0, 1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe('§3 learner exp2', () => {
  function freq(ctx: { successes: number; fives: number }, p: { c1: number; d1: number; e1: number }) {
    const fn = exp2(p);
    const rand = mulberry32(7);
    const count = { 1: 0, 3: 0, 5: 0 };
    const total = 200_000;
    for (let i = 0; i < total; i++) count[fn(ctx, rand)] += 1;
    return { 1: count[1] / total, 3: count[3] / total, 5: count[5] / total };
  }

  it('before the first success: P(1)=C1, P(3)=D1, rest 5', () => {
    const f = freq({ successes: 0, fives: 0 }, { c1: 0.3, d1: 0.5, e1: 0.7 });
    expect(f[1]).toBeCloseTo(0.3, 2);
    expect(f[3]).toBeCloseTo(0.5, 2);
    expect(f[5]).toBeCloseTo(0.2, 2);
  });

  it('after a success: no 1, P(3)=D1×E1^k', () => {
    const f = freq({ successes: 3, fives: 2 }, { c1: 0.3, d1: 0.5, e1: 0.7 });
    expect(f[1]).toBe(0);
    expect(f[3]).toBeCloseTo(0.5 * 0.49, 2);
  });

  it('P(3) is capped by 1 − C1 (weak learner)', () => {
    const f = freq({ successes: 0, fives: 0 }, { c1: 0.6, d1: 0.7, e1: 0.85 });
    expect(f[1]).toBeCloseTo(0.6, 2);
    expect(f[3]).toBeCloseTo(0.4, 2);
    expect(f[5]).toBe(0);
  });
});

describe('§4 run', () => {
  it('same seed gives the same run, another seed a different one', () => {
    const a = runDeck(baseInput(20, 5));
    const b = runDeck(baseInput(20, 5));
    const c = runDeck(baseInput(20, 5, { seed: 2 }));
    expect(a.log).toEqual(b.log);
    expect(a.log).not.toEqual(c.log);
  });

  it('stops after ROUNDS_PER_RUN rounds', () => {
    const r = runDeck(baseInput(20, 5, { roundsPerRun: 2 }));
    expect(r.completed).toBe(true);
    expect(r.metrics.roundEnds.map((e) => e.round)).toEqual([1, 2]);
    expect(r.log.at(-1)?.roundEnded).toBe(true);
  });

  it('stops at the safety cap and is marked incomplete', () => {
    // C1 = 1: every grade is 1, nobody ever leaves the round.
    const r = runDeck(baseInput(4, 2, { learner: { method: 'exp2', c1: 1, d1: 0, e1: 0 }, maxTestsPerUnit: 3 }));
    expect(r.completed).toBe(false);
    expect(r.metrics.totalTests).toBe(12);
    expect(r.metrics.roundEnds).toEqual([]);
  });

  it('records the algorithm and simulator versions with the run', () => {
    const r = runDeck(baseInput(5, 5));
    expect(r.algorithmVersion).toBe('0.1.0');
    expect(r.simVersion).toBe('0.1.0');
  });
});

describe('§5 run metrics on scripted grades', () => {
  it('example A of spec 01 §7', () => {
    const grades: Grade[] = [1, 5, 3, 5, 5, 5, 5, 5, 5, 5];
    const r = simulate(baseInput(4, 2, { roundsPerRun: 1 }), scripted(grades), mulberry32(1));
    expect(r.log.map((l) => l.entries.map((e) => e.itemId))).toEqual([
      ['U0', 'U1'],
      ['U0', 'U2'],
      ['U3', 'U0'],
      ['U1', 'U2'],
      ['U0', 'U3'],
    ]);
    const m = r.metrics;
    expect(r.completed).toBe(true);
    expect(m.roundEnds).toEqual([{ round: 1, lesson: 5, testsPerUnit: 2.5, days: 1 }]);
    expect(m.firstTestLastUnit).toBe(3);
    expect(m.neverTested).toBe(false);
    expect(m.returnAfter1).toEqual([1]);
    expect(m.longestStreak).toBe(3);
    expect(m.emptySlots).toBe(0);
    expect(m.fillerSlots).toBe(0);
  });

  it('example B of spec 01 §7: fillers are counted', () => {
    // 5 lessons × 2 = 10 tests; cap 3 × 3 = 9 stops the run after lesson 5.
    const grades: Grade[] = [5, 5, 5, 5, 5, 3, 5, 1, 5, 5];
    const r = simulate(baseInput(3, 2, { maxTestsPerUnit: 3 }), scripted(grades), mulberry32(1));
    const m = r.metrics;
    expect(r.completed).toBe(false);
    expect(m.lessons).toBe(5);
    expect(m.fillerSlots).toBe(1);
    expect(m.returnAfter1).toEqual([1]);
    expect(r.log[3]?.entries.map((e) => [e.itemId, e.filler])).toEqual([
      ['U2', false],
      ['U0', true],
    ]);
  });

  it('counts empty slots when the deck is smaller than a lesson', () => {
    const r = simulate(baseInput(2, 3, { roundsPerRun: 1 }), scripted([5, 5, 5, 5]), mulberry32(1));
    expect(r.metrics.emptySlots).toBe(2);
    expect(r.metrics.roundEnds[0]?.lesson).toBe(2);
  });
});

describe('§6 series', () => {
  it('nearest-rank percentile', () => {
    const v = Array.from({ length: 10 }, (_, i) => i + 1);
    expect(nearestRank(v, 90)).toBe(9);
    expect(nearestRank(v, 100)).toBe(10);
    expect(nearestRank(v, 1)).toBe(1);
    expect(nearestRank([3, Infinity, 1], 90)).toBe(Infinity);
  });

  it('runs a reproducible series with default constants', () => {
    const input = { ...toSeriesInput({ ...DEFAULT_VALUES }), runs: 50 };
    const a = runSeries(input);
    const b = runSeries(input);
    expect(a).toEqual(b);
    expect(a.rounds).toHaveLength(2);
    expect(a.rounds[0]?.lesson).not.toBeNull();
    expect(a.incompleteShare).toBe(0);
  });

  it('percentile lands on incomplete runs -> null ("не завершено")', () => {
    const input = {
      ...toSeriesInput({ ...DEFAULT_VALUES, C1: 1, D1: 0, E1: 0, MAX_TESTS_PER_UNIT: 2 }),
      runs: 10,
    };
    const s = runSeries(input);
    expect(s.incompleteShare).toBe(1);
    expect(s.rounds[0]?.lesson).toBeNull();
  });
});

describe('§7 registry', () => {
  it('has every constant with a default value', () => {
    expect(REGISTRY.map((d) => d.key).sort()).toEqual(Object.keys(DEFAULT_VALUES).sort());
    expect(validateValues({ ...DEFAULT_VALUES })).toEqual([]);
  });

  it('rejects invalid values', () => {
    const errors = validateValues({ ...DEFAULT_VALUES, C1: 1.5, DECK_SIZE: 0, EF_START: 100 });
    expect(errors).toHaveLength(3);
  });
});
