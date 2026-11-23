// Constants registry (spec 02 §7). The Constants page of the site is generated from it.
// Labels and descriptions are UI text, therefore Ukrainian.
import { DEFAULT_PARAMS } from '@lexjab/core';
import type { Grade, Params } from '@lexjab/core';
import { EXP2_PROFILES } from './learners.ts';
import type { LearnerMethodId, LearnerSpec } from './learners.ts';
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
  DICE_P1: number;
  DICE_P3: number;
  C1: number;
  D1: number;
  E1: number;
  FORGET: number;
  MIX_EASY: number;
  MIX_MEDIUM: number;
  ROUNDS_PER_RUN: number;
  MAX_TESTS_PER_UNIT: number;
  RUNS: number;
  BASE_SEED: number;
  PERCENTILE: number;
  MAP_MAX_UNITS: number;
}

export type ConstantKey = keyof ConstantValues;

interface Base<K extends ConstantKey> {
  readonly key: K;
  readonly group: ConstantGroup;
  readonly label: string;
  readonly description: string;
  readonly spec: string;
  /** Shown only for these learner methods; absent = always shown. */
  readonly methods?: readonly LearnerMethodId[];
}

export interface MethodOption {
  readonly id: LearnerMethodId;
  readonly label: string;
  /** Plain-language rule shown under the selector (spec 02 §3). */
  readonly description: string;
}

export const LEARNER_METHODS: readonly MethodOption[] = [
  {
    id: 'ideal',
    label: 'Ідеальний',
    description: 'Завжди «5». Показує нижню межу: швидше пройти колоду неможливо. Не життєвий, лише для порівняння.',
  },
  {
    id: 'dice',
    label: 'Кубик',
    description:
      'Кожен тест — однакові шанси «1» / «3» / «5», незалежно від того, що юніт отримував раніше. «1» може випасти будь-коли. Еталон для порівняння.',
  },
  {
    id: 'exp2',
    label: 'Вчиться',
    description:
      'Учень помиляється, доки вперше не згадає юніт (шанс «1» = C1). Після першого успіху «1» більше не випадає, а шанс «3» з кожною «5» множиться на E1. Модель експерименту 2.',
  },
  {
    id: 'forget',
    label: 'Забуває',
    description:
      'Як «Вчиться», але після першого успіху учень інколи забуває: «1» випадає з шансом F. Цей шанс береться з шансу «5».',
  },
  {
    id: 'mixed',
    label: 'Змішана колода',
    description:
      'Перед першим уроком кожен юніт випадково стає легким, середнім або важким. Далі — правило «Вчиться»: легкий юніт як у сильного учня, середній — як у середнього, важкий — як у слабкого.',
  },
];

export type ConstantDef =
  | (Base<ConstantKey> & { readonly kind: 'int'; readonly min?: number; readonly max?: number })
  | (Base<ConstantKey> & { readonly kind: 'prob' })
  | (Base<ConstantKey> & { readonly kind: 'grades' })
  | (Base<ConstantKey> & { readonly kind: 'method'; readonly options: readonly MethodOption[] });

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
  DICE_P1: 0.2,
  DICE_P3: 0.4,
  C1: avg.c1,
  D1: avg.d1,
  E1: avg.e1,
  FORGET: 0.05,
  MIX_EASY: 0.3,
  MIX_MEDIUM: 0.5,
  ROUNDS_PER_RUN: 2,
  MAX_TESTS_PER_UNIT: 100,
  RUNS: 1000,
  BASE_SEED: 1,
  PERCENTILE: 90,
  MAP_MAX_UNITS: 500,
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
  { key: 'LEARNER_METHOD', group: 'learner', kind: 'method', options: LEARNER_METHODS, label: 'Модель учня', description: 'Правило, за яким вигаданий учень ставить оцінки.', spec: 'ТЗ-02 §3' },
  { key: 'DICE_P1', group: 'learner', kind: 'prob', methods: ['dice'], label: 'P1 — шанс «1»', description: 'На кожному тесті.', spec: 'ТЗ-02 §3.2' },
  { key: 'DICE_P3', group: 'learner', kind: 'prob', methods: ['dice'], label: 'P3 — шанс «3»', description: 'На кожному тесті. Шанс «5» — решта: 1 − P1 − P3.', spec: 'ТЗ-02 §3.2' },
  { key: 'C1', group: 'learner', kind: 'prob', methods: ['exp2', 'forget'], label: 'C1 — шанс «1» до першого успіху', description: 'Поки юніт жодного разу не мав «3» чи «5».', spec: 'ТЗ-02 §3.3' },
  { key: 'D1', group: 'learner', kind: 'prob', methods: ['exp2', 'forget'], label: 'D1 — шанс «3» на старті', description: 'Обрізається, щоб разом із шансом «1» не перевищити 1.', spec: 'ТЗ-02 §3.3' },
  { key: 'E1', group: 'learner', kind: 'prob', methods: ['exp2', 'forget'], label: 'E1 — множник шансу «3» за кожну «5»', description: 'Шанс «3» = D1 × E1^(кількість «5» юніта).', spec: 'ТЗ-02 §3.3' },
  { key: 'FORGET', group: 'learner', kind: 'prob', methods: ['forget'], label: 'F — шанс забути', description: 'Шанс «1» після першого успіху.', spec: 'ТЗ-02 §3.4' },
  { key: 'MIX_EASY', group: 'learner', kind: 'prob', methods: ['mixed'], label: 'Л — частка легких юнітів', description: 'Легкий юніт оцінюється як у сильного учня.', spec: 'ТЗ-02 §3.5' },
  { key: 'MIX_MEDIUM', group: 'learner', kind: 'prob', methods: ['mixed'], label: 'С — частка середніх юнітів', description: 'Середній — як у середнього учня. Частка важких (як у слабкого) — решта: 1 − Л − С.', spec: 'ТЗ-02 §3.5' },
  { key: 'ROUNDS_PER_RUN', group: 'run', kind: 'int', min: 1, label: 'Раундів у прогоні', description: 'Прогін завершується, коли пройдено стільки раундів. 1 — мінімум, 2 — оптимум.', spec: 'ТЗ-02 §4' },
  { key: 'MAX_TESTS_PER_UNIT', group: 'run', kind: 'int', min: 1, label: 'Аварійна межа: тестувань на юніт', description: 'Якщо тестувань стільки на юніт, прогін зупиняється як незавершений.', spec: 'ТЗ-02 §4' },
  { key: 'RUNS', group: 'run', kind: 'int', min: 1, label: 'Прогонів у серії', description: 'Скільки прогонів рахувати для статистики.', spec: 'ТЗ-02 §6' },
  { key: 'BASE_SEED', group: 'run', kind: 'int', min: 0, label: 'Початкове зерно', description: 'Прогін № i отримує зерно BASE_SEED + i. Те саме зерно — той самий прогін.', spec: 'ТЗ-02 §2' },
  { key: 'PERCENTILE', group: 'run', kind: 'int', min: 1, max: 100, label: 'Гарантія, %', description: 'У скількох відсотках прогонів результат не гірший за показаний.', spec: 'ТЗ-02 §6' },
  { key: 'MAP_MAX_UNITS', group: 'run', kind: 'int', min: 1, label: 'Карта прогону: найбільше юнітів', description: 'Якщо юнітів у колоді більше, карта на сторінці «Прогін» не малюється. Дані прогону — у «Журнал CSV».', spec: 'ТЗ-02 §4' },
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
  // Small tolerance: 0.3 + 0.7 must pass despite floating point.
  if (v.DICE_P1 + v.DICE_P3 > 1 + 1e-9) errors.push('Кубик: P1 + P3 не більше 1');
  if (v.MIX_EASY + v.MIX_MEDIUM > 1 + 1e-9) errors.push('Змішана колода: Л + С не більше 1');
  return errors;
}

/** Whether a constant is shown for the selected learner method. */
export function isRelevant(def: ConstantDef, v: ConstantValues): boolean {
  return def.methods === undefined || def.methods.includes(v.LEARNER_METHOD);
}

/** Learner spec for a given method, with parameters taken from the constants (spec 02 §3). */
export function learnerSpec(v: ConstantValues, method: LearnerMethodId = v.LEARNER_METHOD): LearnerSpec {
  switch (method) {
    case 'ideal':
      return { method };
    case 'dice':
      return { method, p1: v.DICE_P1, p3: v.DICE_P3 };
    case 'exp2':
      return { method, c1: v.C1, d1: v.D1, e1: v.E1 };
    case 'forget':
      return { method, c1: v.C1, d1: v.D1, e1: v.E1, f: v.FORGET };
    case 'mixed':
      return { method, easy: v.MIX_EASY, medium: v.MIX_MEDIUM };
  }
}

/** Spec 02 §6.1: the 8 learners of the "Усі учні" series, in order. */
export function allLearners(v: ConstantValues): { label: string; learner: LearnerSpec }[] {
  const pct = (x: number) => `${Math.round(x * 1000) / 10}%`.replace('.', ',');
  const num = (x: number) => String(x).replace('.', ',');
  return [
    { label: 'Ідеальний', learner: { method: 'ideal' } },
    { label: `Кубик (${pct(v.DICE_P1)} / ${pct(v.DICE_P3)} / ${pct(1 - v.DICE_P1 - v.DICE_P3)})`, learner: learnerSpec(v, 'dice') },
    ...Object.values(EXP2_PROFILES).map((p) => ({
      label: `Вчиться — ${p.label}`,
      learner: { method: 'exp2' as const, c1: p.c1, d1: p.d1, e1: p.e1 },
    })),
    { label: `Забуває (C1 ${num(v.C1)} · D1 ${num(v.D1)} · E1 ${num(v.E1)} · F ${pct(v.FORGET)})`, learner: learnerSpec(v, 'forget') },
    {
      label: `Змішана колода (${pct(v.MIX_EASY)} / ${pct(v.MIX_MEDIUM)} / ${pct(1 - v.MIX_EASY - v.MIX_MEDIUM)})`,
      learner: learnerSpec(v, 'mixed'),
    },
  ];
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

export function toSeriesInput(v: ConstantValues, learner: LearnerSpec = learnerSpec(v)): SeriesInput {
  return {
    run: {
      deckSize: v.DECK_SIZE,
      settings: { unitsPerLesson: v.UNITS_PER_LESSON, lessonsPerDay: v.LESSONS_PER_DAY, deadlineLessons: null },
      params: toParams(v),
      learner,
      roundsPerRun: v.ROUNDS_PER_RUN,
      maxTestsPerUnit: v.MAX_TESTS_PER_UNIT,
    },
    runs: v.RUNS,
    baseSeed: v.BASE_SEED,
    percentile: v.PERCENTILE,
  };
}
