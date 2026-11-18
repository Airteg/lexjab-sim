import type { RunResult } from '@lexjab/sim';

export function downloadText(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Run log as CSV: one row per graded unit. EF stays in hundredths to avoid decimal-separator issues. */
export function runLogCsv(r: RunResult): string {
  const rows = [['lesson', 'round', 'item_id', 'grade', 'filler', 'ef_before', 'ef_after', 'round_ended'].join(',')];
  for (const l of r.log) {
    for (const e of l.entries) {
      rows.push(
        [l.lesson, l.round, e.itemId, e.grade, e.filler ? 1 : 0, e.efBefore, e.efAfter, l.roundEnded ? 1 : 0].join(','),
      );
    }
  }
  return `${rows.join('\n')}\n`;
}
