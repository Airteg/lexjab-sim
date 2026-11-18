// Single-rule tests for spec §3–§6.
import { describe, expect, it } from 'vitest';
import {
  ALGORITHM_VERSION,
  CoreError,
  DEFAULT_PARAMS,
  applyGrade,
  createDeck,
  nextLesson,
  report,
} from '../src/index.ts';
import type { Grade } from '../src/index.ts';
import { playLesson, states } from './helpers.ts';

const settings = (n: number) => ({ unitsPerLesson: n, lessonsPerDay: 5, deadlineLessons: null });

function codeOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (e) {
    return e instanceof CoreError ? e.code : 'not CoreError';
  }
  return undefined;
}

describe('§3 constants', () => {
  it('defaults match the spec', () => {
    expect(ALGORITHM_VERSION).toBe('0.1.0');
    expect(DEFAULT_PARAMS.efDelta).toEqual({ 1: -54, 3: -14, 5: 10 });
    expect(DEFAULT_PARAMS.efMin).toBe(130);
    expect(DEFAULT_PARAMS.efStart).toBe(130);
    expect(DEFAULT_PARAMS.exitStreak).toBe(2);
    expect(DEFAULT_PARAMS.fillerReturnGrades).toEqual([1]);
  });
});

describe('§6.1 createDeck', () => {
  it('sets the start state', () => {
    const d = createDeck(['a', 'b'], settings(1));
    expect(d.lesson).toBe(0);
    expect(d.round).toBe(1);
    expect(d.lessonItems).toEqual([]);
    expect(d.algorithmVersion).toBe('0.1.0');
    expect(states(d)).toEqual({ a: '130/—/0/в/—', b: '130/—/0/в/—' });
    expect(d.units.every((u) => u.tests === 0)).toBe(true);
  });

  it('rejects bad input', () => {
    expect(codeOf(() => createDeck([], settings(1)))).toBe('EMPTY_DECK');
    expect(codeOf(() => createDeck(['a', 'a'], settings(1)))).toBe('DUPLICATE_ITEM');
    expect(codeOf(() => createDeck(['a'], settings(0)))).toBe('INVALID_UNITS_PER_LESSON');
    expect(codeOf(() => createDeck(['a'], settings(1.5)))).toBe('INVALID_UNITS_PER_LESSON');
  });
});

describe('§6.2 nextLesson', () => {
  it('a lesson never has more units than the deck', () => {
    const d = nextLesson(createDeck(['a', 'b'], settings(5)));
    expect(d.lessonItems).toEqual(['a', 'b']);
  });

  it('does not change the input deck', () => {
    const d0 = createDeck(['a', 'b'], settings(1));
    nextLesson(d0);
    expect(d0.lesson).toBe(0);
  });
});

describe('§6.3 applyGrade', () => {
  it('EF changes and is clamped at the minimum', () => {
    let d = createDeck(['a'], settings(1));
    for (const g of [5, 5, 5] as Grade[]) d = playLesson(d, [g]);
    expect(d.units[0]?.ef).toBe(160);
    d = playLesson(d, [1]); // 160 - 54 = 106 -> 130
    expect(d.units[0]?.ef).toBe(130);
  });

  it('counts tests and resets streak5 on 1 and 3', () => {
    let d = createDeck(['a'], settings(1));
    d = playLesson(d, [5]);
    expect(d.units[0]?.streak5).toBe(1);
    d = playLesson(d, [3]);
    expect(d.units[0]?.streak5).toBe(0);
    expect(d.units[0]?.tests).toBe(2);
  });

  it('filler: grade outside fillerReturnGrades keeps it out of the round', () => {
    // Example B up to lesson 3, then the filler U0 gets 3 instead of 1.
    let d = createDeck(['U0', 'U1', 'U2'], settings(2));
    for (const g of [[5, 5], [5, 5], [5, 3]] as Grade[][]) d = playLesson(d, g);
    d = playLesson(d, [5, 3]);
    expect(d.lessonItems).toEqual(['U2', 'U0']);
    expect(states(d).U0).toBe('136/3/0/поза/4');
  });

  it('filler: fillerReturnGrades = {1, 3} returns it after 3', () => {
    const params = { ...DEFAULT_PARAMS, fillerReturnGrades: [1, 3] as const };
    let d = createDeck(['U0', 'U1', 'U2'], settings(2), params);
    for (const g of [[5, 5], [5, 5], [5, 3]] as Grade[][]) d = playLesson(d, g);
    d = playLesson(d, [5, 3]);
    expect(states(d).U0).toBe('136/3/0/в/4');
  });

  it('rejects bad grades and items', () => {
    const d = nextLesson(createDeck(['a', 'b'], settings(1)));
    expect(codeOf(() => applyGrade(d, 'a', 2 as Grade))).toBe('INVALID_GRADE');
    expect(codeOf(() => applyGrade(d, 'b', 5))).toBe('ITEM_NOT_IN_LESSON');
    const graded = applyGrade(d, 'a', 5);
    expect(codeOf(() => applyGrade(graded, 'a', 5))).toBe('ALREADY_GRADED');
  });
});

describe('§6.4 report', () => {
  it('counts rounds and units', () => {
    let d = createDeck(['a', 'b'], settings(2));
    d = playLesson(d, [5, 5]);
    d = playLesson(d, [5, 3]);
    expect(report(d)).toEqual({
      lesson: 2,
      round: 1,
      completedRounds: 0,
      outCount: 1,
      inRoundCount: 1,
      forecast: null,
      unreachable: null,
    });
  });
});
