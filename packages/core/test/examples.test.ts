// Control examples from spec §7. Each row of the spec tables is one assertion block.
import { describe, expect, it } from 'vitest';
import { createDeck, nextLesson } from '../src/index.ts';
import type { DeckState } from '../src/index.ts';
import { playLesson, states } from './helpers.ts';

const settings = (n: number) => ({ unitsPerLesson: n, lessonsPerDay: 5, deadlineLessons: null });

function row(deck: DeckState, lesson: number, round: number, items: string[]) {
  expect(deck.lesson).toBe(lesson);
  expect(deck.round).toBe(round);
  expect(deck.lessonItems).toEqual(items);
}

describe('spec §7, example A: queue, leaving the round, new round', () => {
  it('matches the spec table lesson by lesson', () => {
    let d = createDeck(['U0', 'U1', 'U2', 'U3'], settings(2));

    d = playLesson(d, [1, 5]);
    row(d, 1, 1, ['U0', 'U1']);
    expect(states(d)).toEqual({ U0: '130/1/0/в/1', U1: '140/5/1/в/1', U2: '130/—/0/в/—', U3: '130/—/0/в/—' });

    d = playLesson(d, [3, 5]);
    row(d, 2, 1, ['U0', 'U2']);
    expect(states(d)).toEqual({ U0: '130/3/0/в/2', U1: '140/5/1/в/1', U2: '140/5/1/в/2', U3: '130/—/0/в/—' });

    d = playLesson(d, [5, 5]);
    row(d, 3, 1, ['U3', 'U0']);
    expect(states(d)).toEqual({ U0: '140/5/1/в/3', U1: '140/5/1/в/1', U2: '140/5/1/в/2', U3: '140/5/1/в/3' });

    d = playLesson(d, [5, 5]);
    row(d, 4, 1, ['U1', 'U2']);
    expect(states(d)).toEqual({ U0: '140/5/1/в/3', U1: '150/5/2/поза/4', U2: '150/5/2/поза/4', U3: '140/5/1/в/3' });

    d = playLesson(d, [5, 5]);
    row(d, 5, 1, ['U0', 'U3']);
    expect(states(d)).toEqual({ U0: '150/5/2/поза/5', U1: '150/5/2/поза/4', U2: '150/5/2/поза/4', U3: '150/5/2/поза/5' });

    d = nextLesson(d);
    row(d, 6, 2, ['U1', 'U2']);
    for (const u of d.units) {
      expect(u.out).toBe(false);
      expect(u.streak5).toBe(0);
    }
  });
});

describe('spec §7, example B: fillers', () => {
  it('matches the spec table lesson by lesson', () => {
    let d = createDeck(['U0', 'U1', 'U2'], settings(2));

    d = playLesson(d, [5, 5]);
    row(d, 1, 1, ['U0', 'U1']);
    expect(states(d)).toEqual({ U0: '140/5/1/в/1', U1: '140/5/1/в/1', U2: '130/—/0/в/—' });

    d = playLesson(d, [5, 5]);
    row(d, 2, 1, ['U2', 'U0']);
    expect(states(d)).toEqual({ U0: '150/5/2/поза/2', U1: '140/5/1/в/1', U2: '140/5/1/в/2' });

    d = playLesson(d, [5, 3]);
    row(d, 3, 1, ['U1', 'U2']);
    expect(states(d)).toEqual({ U0: '150/5/2/поза/2', U1: '150/5/2/поза/3', U2: '130/3/0/в/3' });

    d = playLesson(d, [5, 1]);
    row(d, 4, 1, ['U2', 'U0']);
    expect(states(d)).toEqual({ U0: '130/1/0/в/4', U1: '150/5/2/поза/3', U2: '140/5/1/в/4' });

    d = playLesson(d, [5, 5]);
    row(d, 5, 1, ['U0', 'U2']);
    expect(states(d)).toEqual({ U0: '140/5/1/в/5', U1: '150/5/2/поза/3', U2: '150/5/2/поза/5' });

    d = nextLesson(d);
    row(d, 6, 1, ['U0', 'U1']);
  });
});
