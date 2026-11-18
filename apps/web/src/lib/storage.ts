import { DEFAULT_VALUES } from '@lexjab/sim';
import type { ConstantValues } from '@lexjab/sim';

const KEY = 'lexjab-sim/values/v1';

/** Current constants survive a page reload. Storage may be unavailable; then defaults are used. */
export function loadValues(): ConstantValues {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_VALUES, ...(JSON.parse(raw) as Partial<ConstantValues>) };
  } catch {
    // ignore: private mode, quota, malformed JSON
  }
  return { ...DEFAULT_VALUES };
}

export function saveValues(values: ConstantValues): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(values));
  } catch {
    // ignore
  }
}
