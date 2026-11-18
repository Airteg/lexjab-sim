import { applyGrade, nextLesson } from '../src/index.ts';
import type { DeckState, Grade, UnitState } from '../src/index.ts';

/** Unit state in the notation of spec §7: ef/last grade/streak5/в|поза/lastLesson, "—" = null. */
export function notation(u: UnitState): string {
  const dash = (v: number | null) => (v === null ? '—' : String(v));
  return `${u.ef}/${dash(u.lastGrade)}/${u.streak5}/${u.out ? 'поза' : 'в'}/${dash(u.lastLesson)}`;
}

export function states(deck: DeckState): Record<string, string> {
  return Object.fromEntries(deck.units.map((u) => [u.itemId, notation(u)]));
}

/** Composes the next lesson and grades its units in lesson order. */
export function playLesson(deck: DeckState, grades: readonly Grade[]): DeckState {
  let d = nextLesson(deck);
  d.lessonItems.forEach((id, i) => {
    const g = grades[i];
    if (g !== undefined) d = applyGrade(d, id, g);
  });
  return d;
}
