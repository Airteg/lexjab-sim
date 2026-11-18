import { DEFAULT_VALUES, REGISTRY } from '@lexjab/sim';
import type { ConstantKey, ConstantValues } from '@lexjab/sim';

export function valueText(v: ConstantValues[ConstantKey]): string {
  if (Array.isArray(v)) return v.length ? `{${[...v].sort().join(', ')}}` : '{}';
  if (typeof v === 'number') return String(v).replace('.', ',');
  return String(v);
}

export function isChanged(key: ConstantKey, values: ConstantValues): boolean {
  return valueText(values[key]) !== valueText(DEFAULT_VALUES[key]);
}

/** Constants that differ from the norm (spec defaults). */
export function deviations(values: ConstantValues): { label: string; value: string; norm: string }[] {
  return REGISTRY.filter((d) => isChanged(d.key, values)).map((d) => ({
    label: d.label,
    value: valueText(values[d.key]),
    norm: valueText(DEFAULT_VALUES[d.key]),
  }));
}
