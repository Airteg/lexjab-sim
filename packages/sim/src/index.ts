export { EXP2_PROFILES, exp2, learnerFromSpec } from './learners.ts';
export type { Exp2Params, GradeFn, LearnerContext, LearnerMethodId, LearnerSpec } from './learners.ts';
export { computeRunMetrics } from './metrics.ts';
export type { RoundEnd, RunMetrics } from './metrics.ts';
export {
  DEFAULT_VALUES,
  GROUP_LABELS,
  REGISTRY,
  toParams,
  toSeriesInput,
  validateValues,
} from './registry.ts';
export type { ConstantDef, ConstantGroup, ConstantKey, ConstantValues } from './registry.ts';
export { mulberry32 } from './rng.ts';
export type { Rand } from './rng.ts';
export { runDeck, simulate, unitIds } from './run.ts';
export type { LessonLog, LogEntry, RunInput, RunResult } from './run.ts';
export { nearestRank, runSeries, summarize } from './series.ts';
export type { RoundStat, SeriesInput, SeriesResult, Stat } from './series.ts';
export { SIM_VERSION } from './version.ts';
