// Constants registry (spec 02 §7). The Constants page of the site is generated from it.
// Labels and descriptions are UI text, therefore Ukrainian.
import { DEFAULT_PARAMS } from '@lexjab/core';
import type { Grade, Params } from '@lexjab/core';
import { EXP2_PROFILES } from './learners.ts';
import type { LearnerMethodId } from './learners.ts';
import type { SeriesInput } from './series.ts';

export type ConstantGroup = 'deck' | 'algorithm' | 'learner' | 'run';

export const GROUP_LABELS: Record<ConstantGroup, string> = {
  deck: 'Колода й урок',
  algorithm: 'Алгоритм',
  learner: 'Модель учня',
  run: 'Прогін і серія',
};

export interface ConstantValues {
  DECK_SIZE: number;
  UNITS_PER_LESSON: number;
  LESSONS_PER_DAY: number;
  EF_DELTA_1: number;
  EF_DELTA_3: number;
  EF_DELTA_5: number;
  EF_MIN: number;
  EF_START: number;
  EXIT_STREAK: number;
  FILLER_RETURN_GRADES: Grade[];
  LEARNER_METHOD: LearnerMethodId;
  C1: number;
  D1: number;
  E1: number;
  ROUNDS_PER_RUN: number;
  MAX_TESTS_PER_UNIT: number;
  RUNS: number;
  BASE_SEED: number;
  PERCENTILE: number;
}

export type ConstantKey = keyof ConstantValues;

interface Base<K extends ConstantKey> {
  readonly key: K;
  readonly group: ConstantGroup;
  readonly label: string;
  readonly description: string;
  readonly spec: string;
}

export type ConstantDef =
  | (Base<ConstantKey> & { readonly kind: 'int'; readonly min?: number; readonly max?: number })
  | (Base<ConstantKey> & { readonly kind: 'prob' })
  | (Base<ConstantKey> & { readonly kind: 'grades' })
  | (Base<ConstantKey> & { readonly kind: 'method'; readonly options: readonly { id: LearnerMethodId; label: string }[] });

const avg = EXP2_PROFILES.average;

export const DEFAULT_VALUES: Readonly<ConstantValues> = Object.freeze({
  DECK_SIZE: 20,
  UNITS_PER_LESSON: 5,
  LESSONS_PER_DAY: 5,
  EF_DELTA_1: DEFAULT_PARAMS.efDelta[1],
  EF_DELTA_3: DEFAULT_PARAMS.efDelta[3],
  EF_DELTA_5: DEFAULT_PARAMS.efDelta[5],
  EF_MIN: DEFAULT_PARAMS.efMin,
  EF_START: DEFAULT_PARAMS.efStart,
  EXIT_STREAK: DEFAULT_PARAMS.exitStreak,
  FILLER_RETURN_GRADES: [...DEFAULT_PARAMS.fillerReturnGrades],
  LEARNER_METHOD: 'exp2',
  C1: avg.c1,
  D1: avg.d1,
  E1: avg.e1,
  ROUNDS_PER_RUN: 2,
  MAX_TESTS_PER_UNIT: 100,
  RUNS: 1000,
  BASE_SEED: 1,
  PERCENTILE: 90,
});

export const REGISTRY: readonly ConstantDef[] = [
  { key: 'DECK_SIZE', group: 'deck', kind: 'int', min: 1, label: 'Юнітів у колоді', description: 'Скільки юнітів у колоді (U0, U1, …).', spec: 'ТЗ-02 §4' },
  { key: 'UNITS_PER_LESSON', group: 'deck', kind: 'int', min: 1, label: 'Юнітів в уроці', description: 'Скільки різних юнітів іде в один урок.', spec: 'ТЗ-01 §4.2' },
  { key: 'LESSONS_PER_DAY', group: 'deck', kind: 'int', min: 1, label: 'Уроків на день', description: 'Потрібно, щоб перевести уроки в дні.', spec: 'ТЗ-01 §4.2' },
  { key: 'EF_DELTA_1', group: 'algorithm', kind: 'int', label: 'Зміна EF за «1»', description: 'У сотих: −54 означає −0,54.', spec: 'ТЗ-01 §3' },
  { key: 'EF_DELTA_3', group: 'algorithm', kind: 'int', label: 'Зміна EF за «3»', description: 'У сотих.', spec: 'ТЗ-01 §3' },
  { key: 'EF_DELTA_5', group: 'algorithm', kind: 'int', label: 'Зміна EF за «5»', description: 'У сотих.', spec: 'ТЗ-01 §3' },
  { key: 'EF_MIN', group: 'algorithm', kind: 'int', min: 1, label: 'Мінімальний EF', description: 'У сотих: 130 = 1,30. EF не опускається нижче.', spec: 'ТЗ-01 §3' },
  { key: 'EF_START', group: 'algorithm', kind: 'int', min: 1, label: 'Стартовий EF', description: 'У сотих. Не менше за мінімальний EF.', spec: 'ТЗ-01 §3' },
  { key: 'EXIT_STREAK', group: 'algorithm', kind: 'int', min: 1, label: '«5» поспіль для виходу з раунду', description: 'Після стількох «5» поспіль юніт виходить із раунду.', spec: 'ТЗ-01 §3' },
  { key: 'FILLER_RETURN_GRADES', group: 'algorithm', kind: 'grades', label: 'Оцінки, що повертають заповнювача', description: 'Заповнювач (юніт поза раундом на вільному місці) з такою оцінкою повертається в раунд.', spec: 'ТЗ-01 §3' },
  { key: 'LEARNER_METHOD', group: 'learner', kind: 'method', options: [{ id: 'exp2', label: 'Експеримент 2 (C1 / D1 / E1)' }], label: 'Метод генерації оцінок', description: 'Як вигаданий учень ставить оцінки.', spec: 'ТЗ-02 §3' },
  { key: 'C1', group: 'learner', kind: 'prob', label: 'C1 — імовірність «1» до першого успіху', description: 'Поки юніт жодного разу не мав «3» чи «5».', spec: 'ТЗ-02 §3' },
  { key: 'D1', group: 'learner', kind: 'prob', label: 'D1 — імовірність «3» на старті', description: 'Обрізається, щоб разом з імовірністю «1» не перевищити 1.', spec: 'ТЗ-02 §3' },
  { key: 'E1', group: 'learner', kind: 'prob', label: 'E1 — множник імовірності «3» за кожну «5»', description: 'Імовірність «3» = D1 × E1^(кількість «5»).', spec: 'ТЗ-02 §3' },
  { key: 'ROUNDS_PER_RUN', group: 'run', kind: 'int', min: 1, label: 'Раундів у прогоні', description: 'Прогін завершується, коли пройдено стільки раундів. 1 — мінімум, 2 — оптимум.', spec: 'ТЗ-02 §4' },
  { key: 'MAX_TESTS_PER_UNIT', group: 'run', kind: 'int', min: 1, label: 'Аварійна межа: тестувань на юніт', description: 'Якщо тестувань стільки на юніт, прогін зупиняється як незавершений.', spec: 'ТЗ-02 §4' },
  { key: 'RUNS', group: 'run', kind: 'int', min: 1, label: 'Прогонів у серії', description: 'Скільки прогонів рахувати для статистики.', spec: 'ТЗ-02 §6' },
  { key: 'BASE_SEED', group: 'run', kind: 'int', min: 0, label: 'Перший варіант оцінок', description: 'Номер варіанту випадкових оцінок; сам по собі нічого не означає. Прогін № i серії отримує варіант «перший + i». Той самий варіант — той самий прогін.', spec: 'ТЗ-02 §2' },
  { key: 'PERCENTILE', group: 'run', kind: 'int', min: 1, max: 100, label: 'Гарантія, %', description: 'У скількох відсотках прогонів результат не гірший за показаний.', spec: 'ТЗ-02 §6' },
];

/** Returns Ukrainian error messages; empty array means the values are valid. */
export function validateValues(v: ConstantValues): string[] {
  const errors: string[] = [];
  for (const def of REGISTRY) {
    const value = v[def.key];
    if (def.kind === 'int') {
      if (typeof value !== 'number' || !Number.isInteger(value)) errors.push(`${def.label}: має бути ціле число`);
      else if (def.min !== undefined && value < def.min) errors.push(`${def.label}: не менше ${def.min}`);
      else if (def.max !== undefined && value > def.max) errors.push(`${def.label}: не більше ${def.max}`);
    } else if (def.kind === 'prob') {
      if (typeof value !== 'number' || !(value >= 0 && value <= 1)) errors.push(`${def.label}: від 0 до 1`);
    } else if (def.kind === 'grades') {
      if (!Array.isArray(value) || !value.every((g) => g === 1 || g === 3 || g === 5)) {
        errors.push(`${def.label}: лише оцінки 1, 3, 5`);
      }
    } else if (!def.options.some((o) => o.id === value)) {
      errors.push(`${def.label}: невідомий метод`);
    }
  }
  if (Number.isInteger(v.EF_START) && Number.isInteger(v.EF_MIN) && v.EF_START < v.EF_MIN) {
    errors.push('Стартовий EF: не менше за мінімальний EF');
  }
  return errors;
}

export function toParams(v: ConstantValues): Params {
  return {
    efDelta: { 1: v.EF_DELTA_1, 3: v.EF_DELTA_3, 5: v.EF_DELTA_5 },
    efMin: v.EF_MIN,
    efStart: v.EF_START,
    exitStreak: v.EXIT_STREAK,
    fillerReturnGrades: [...new Set(v.FILLER_RETURN_GRADES)],
  };
}

export function toSeriesInput(v: ConstantValues): SeriesInput {
  return {
    run: {
      deckSize: v.DECK_SIZE,
      settings: { unitsPerLesson: v.UNITS_PER_LESSON, lessonsPerDay: v.LESSONS_PER_DAY, deadlineLessons: null },
      params: toParams(v),
      learner: { method: v.LEARNER_METHOD, c1: v.C1, d1: v.D1, e1: v.E1 },
      roundsPerRun: v.ROUNDS_PER_RUN,
      maxTestsPerUnit: v.MAX_TESTS_PER_UNIT,
    },
    runs: v.RUNS,
    baseSeed: v.BASE_SEED,
    percentile: v.PERCENTILE,
  };
}
