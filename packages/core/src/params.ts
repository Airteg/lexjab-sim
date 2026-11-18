import type { Params } from './types.ts';

/** Version of the algorithm norm (spec header). Bump on any rule or default change. */
export const ALGORITHM_VERSION = '0.1.0';

/** Default constants = the norm from spec §3. */
export const DEFAULT_PARAMS: Params = Object.freeze({
  efDelta: Object.freeze({ 1: -54, 3: -14, 5: 10 }),
  efMin: 130,
  efStart: 130,
  exitStreak: 2,
  fillerReturnGrades: Object.freeze([1] as const),
});
