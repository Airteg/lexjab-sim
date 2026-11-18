const nf = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 2 });

/** Number in Ukrainian format; null/NaN/Infinity -> fallback. */
export function fmt(v: number | null | undefined, fallback = '—'): string {
  return v === null || v === undefined || !Number.isFinite(v) ? fallback : nf.format(v);
}

export function pct(v: number): string {
  return `${nf.format(v * 100)}%`;
}

/** EF in hundredths -> "1,30". */
export function efText(h: number): string {
  return (h / 100).toFixed(2).replace('.', ',');
}

/** Parses user input that may use a decimal comma. Empty or invalid -> NaN. */
export function parseNumber(text: string): number {
  const t = text.trim().replace(',', '.');
  return t === '' ? Number.NaN : Number(t);
}
