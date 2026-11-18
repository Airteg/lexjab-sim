// Learner models (spec 02 §3). New methods are added next to existing ones.
import type { Grade } from '@lexjab/core';
import type { Rand } from './rng.ts';

/** Per-unit history the learner may use; counted over the whole run, not per round. */
export interface LearnerContext {
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

/** Serializable description of a learner, stored with every run. */
export type LearnerSpec = { readonly method: 'exp2' } & Exp2Params;

export type LearnerMethodId = LearnerSpec['method'];

/** Spec 02 §3, taken verbatim from the Python code of experiment 2. One random number per grade. */
export function exp2(params: Exp2Params): GradeFn {
  return (ctx, rand) => {
    const a = ctx.successes > 0 ? 0 : params.c1;
    const b = Math.min(params.d1 * params.e1 ** ctx.fives, 1 - a);
    const x = rand();
    if (x < a) return 1;
    if (x < a + b) return 3;
    return 5;
  };
}

export function learnerFromSpec(spec: LearnerSpec): GradeFn {
  switch (spec.method) {
    case 'exp2':
      return exp2(spec);
  }
}

/** Learner profiles from spec 02 §3. */
export const EXP2_PROFILES = {
  average: { label: 'середній', c1: 0.3, d1: 0.5, e1: 0.7 },
  weak: { label: 'слабкий', c1: 0.6, d1: 0.7, e1: 0.85 },
  veryWeak: { label: 'дуже слабкий', c1: 0.7, d1: 0.8, e1: 0.9 },
} as const;
