import { DEFAULT_VALUES, LEARNER_METHODS, REGISTRY, isRelevant } from '@lexjab/sim';
import type { ConstantKey, ConstantValues } from '@lexjab/sim';

export function valueText(v: ConstantValues[ConstantKey]): string {
  if (Array.isArray(v)) return v.length ? `{${[...v].sort().join(', ')}}` : '{}';
  if (typeof v === 'number') return String(v).replace('.', ',');
  // The only string constant is the learner method: show its Ukrainian name.
  return LEARNER_METHODS.find((m) => m.id === v)?.label ?? String(v);
}

export function isChanged(key: ConstantKey, values: ConstantValues): boolean {
  return valueText(values[key]) !== valueText(DEFAULT_VALUES[key]);
}

/** Constants that differ from the norm (spec defaults); parameters of other learner models are skipped. */
export function deviations(values: ConstantValues, skipLearner = false): { label: string; value: string; norm: string }[] {
  return REGISTRY.filter((d) => !(skipLearner && d.group === 'learner') && isRelevant(d, values) && isChanged(d.key, values)).map((d) => ({
    label: d.label,
    value: valueText(values[d.key]),
    norm: valueText(DEFAULT_VALUES[d.key]),
  }));
}
