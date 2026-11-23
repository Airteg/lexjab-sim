// Learner models (spec 02 §3). New methods are added next to existing ones.
import type { Grade } from '@lexjab/core';
import type { Rand } from './rng.ts';

/** Per-unit history the learner may use; counted over the whole run, not per round. */
export interface LearnerContext {
  readonly itemId: string;
  readonly successes: number; // grades 3 or 5
  readonly fives: number;
}

/** Produces one grade for one unit. Must draw exactly the random numbers it needs from `rand`. */
export type GradeFn = (ctx: LearnerContext, rand: Rand) => Grade;

export interface Exp2Params {
  readonly c1: number;
  readonly d1: number;
  readonly e1: number;
}

export interface DiceParams {
  readonly p1: number;
  readonly p3: number;
}

export interface MixShares {
  readonly easy: number;
  readonly medium: number;
}

/** Serializable description of a learner, stored with every run. */
export type LearnerSpec =
  | { readonly method: 'ideal' }
  | ({ readonly method: 'dice' } & DiceParams)
  | ({ readonly method: 'exp2' } & Exp2Params)
  | ({ readonly method: 'forget' } & Exp2Params & { readonly f: number })
  | ({ readonly method: 'mixed' } & MixShares);

export type LearnerMethodId = LearnerSpec['method'];

/** Chances of grades 1 / 3 / 5 (spec 02 §3: a, b, rest). */
export interface Chances {
  readonly 1: number;
  readonly 3: number;
  readonly 5: number;
}

/** Learner profiles from spec 02 §3.3. `strong` is invented [23.11]. */
export const EXP2_PROFILES = {
  strong: { label: 'сильний', c1: 0.1, d1: 0.3, e1: 0.5 },
  average: { label: 'середній', c1: 0.3, d1: 0.5, e1: 0.7 },
  weak: { label: 'слабкий', c1: 0.6, d1: 0.7, e1: 0.85 },
  veryWeak: { label: 'дуже слабкий', c1: 0.7, d1: 0.8, e1: 0.9 },
} as const;

export type Difficulty = 'easy' | 'medium' | 'hard';

/** Spec 02 §3.5: difficulty -> exp2 profile. */
export const MIX_PROFILES: Record<Difficulty, Exp2Params & { label: string }> = {
  easy: { ...EXP2_PROFILES.strong, label: 'легкий' },
  medium: { ...EXP2_PROFILES.average, label: 'середній' },
  hard: { ...EXP2_PROFILES.weak, label: 'важкий' },
};

function fromChances(a: number, b: number, x: number): Grade {
  if (x < a) return 1;
  if (x < a + b) return 3;
  return 5;
}

/** Spec 02 §3.3 (exp2) and §3.4 (forget, f > 0). */
export function exp2Chances(p: Exp2Params, ctx: Pick<LearnerContext, 'successes' | 'fives'>, f = 0): Chances {
  const a = ctx.successes > 0 ? f : p.c1;
  const b = Math.min(p.d1 * p.e1 ** ctx.fives, 1 - a);
  return { 1: a, 3: b, 5: 1 - a - b };
}

/** Spec 02 §3.3, taken verbatim from the Python code of experiment 2. One random number per grade. */
export function exp2(params: Exp2Params): GradeFn {
  return (ctx, rand) => {
    const c = exp2Chances(params, ctx);
    return fromChances(c[1], c[3], rand());
  };
}

/** Spec 02 §3.1. Draws no random numbers. */
export function ideal(): GradeFn {
  return () => 5;
}

/** Spec 02 §3.2. */
export function dice(p: DiceParams): GradeFn {
  return (_ctx, rand) => fromChances(p.p1, p.p3, rand());
}

/** Spec 02 §3.4. */
export function forget(p: Exp2Params, f: number): GradeFn {
  return (ctx, rand) => {
    const c = exp2Chances(p, ctx, f);
    return fromChances(c[1], c[3], rand());
  };
}

/** Spec 02 §3.5: one random number per unit, in deck order. */
export function assignDifficulty(itemIds: readonly string[], shares: MixShares, rand: Rand): Map<string, Difficulty> {
  const m = new Map<string, Difficulty>();
  for (const id of itemIds) {
    const y = rand();
    m.set(id, y < shares.easy ? 'easy' : y < shares.easy + shares.medium ? 'medium' : 'hard');
  }
  return m;
}

/** Spec 02 §3.5. Difficulty is assigned before the first lesson. */
export function mixed(shares: MixShares, itemIds: readonly string[], rand: Rand): GradeFn {
  const difficulty = assignDifficulty(itemIds, shares, rand);
  return (ctx, r) => {
    const c = exp2Chances(MIX_PROFILES[difficulty.get(ctx.itemId)!], ctx);
    return fromChances(c[1], c[3], r());
  };
}

/** Builds the grade function of a run. `rand` is the run's generator (spec 02 §2). */
export function learnerFromSpec(spec: LearnerSpec, itemIds: readonly string[], rand: Rand): GradeFn {
  switch (spec.method) {
    case 'ideal':
      return ideal();
    case 'dice':
      return dice(spec);
    case 'exp2':
      return exp2(spec);
    case 'forget':
      return forget(spec, spec.f);
    case 'mixed':
      return mixed(spec, itemIds, rand);
  }
}

/** One row of the chance table on the Constants page: a learner (or difficulty) and its chances per situation. */
export interface ChanceRow {
  readonly label: string;
  readonly cells: readonly Chances[];
}

export interface ChanceTable {
  /** Column headers (situations). */
  readonly columns: readonly string[];
  readonly rows: readonly ChanceRow[];
}

const EXP2_COLUMNS = ['Доки не згаданий', 'Після успіху, «5»: 0', '1', '2', '3'];

function exp2Cells(p: Exp2Params, f = 0): Chances[] {
  return [
    exp2Chances(p, { successes: 0, fives: 0 }, f),
    ...[0, 1, 2, 3].map((k) => exp2Chances(p, { successes: 1, fives: k }, f)),
  ];
}

/** Grade chances of a learner, for the Constants page (spec 02 §3). */
export function chanceTable(spec: LearnerSpec): ChanceTable {
  switch (spec.method) {
    case 'ideal':
      return { columns: ['Кожен тест'], rows: [{ label: 'Ідеальний', cells: [{ 1: 0, 3: 0, 5: 1 }] }] };
    case 'dice':
      return {
        columns: ['Кожен тест'],
        rows: [{ label: 'Кубик', cells: [{ 1: spec.p1, 3: spec.p3, 5: 1 - spec.p1 - spec.p3 }] }],
      };
    case 'exp2':
      return { columns: EXP2_COLUMNS, rows: [{ label: 'Вчиться', cells: exp2Cells(spec) }] };
    case 'forget':
      return { columns: EXP2_COLUMNS, rows: [{ label: 'Забуває', cells: exp2Cells(spec, spec.f) }] };
    case 'mixed': {
      const share: Record<Difficulty, number> = { easy: spec.easy, medium: spec.medium, hard: 1 - spec.easy - spec.medium };
      return {
        columns: EXP2_COLUMNS,
        rows: (Object.keys(MIX_PROFILES) as Difficulty[]).map((d) => ({
          label: `${MIX_PROFILES[d].label} (${Math.round(share[d] * 100)}%)`,
          cells: exp2Cells(MIX_PROFILES[d]),
        })),
      };
    }
  }
}
