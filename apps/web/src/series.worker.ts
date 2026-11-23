// Runs one or more series off the main thread so the page stays responsive on a tablet.
// One item = a plain series (Серія page); several items = the "Усі учні" series (spec 02 §6.1).
import { runDeck, summarize } from '@lexjab/sim';
import type { RunResult, SeriesInput, SeriesResult } from '@lexjab/sim';

export interface WorkerIn {
  readonly items: readonly SeriesInput[];
}

export type WorkerOut =
  | { type: 'progress'; done: number; total: number }
  | { type: 'done'; results: SeriesResult[] };

self.onmessage = (e: MessageEvent<WorkerIn>) => {
  const { items } = e.data;
  const total = items.reduce((s, x) => s + x.runs, 0);
  const step = Math.max(1, Math.floor(total / 50));
  let done = 0;
  const out: SeriesResult[] = [];
  for (const input of items) {
    const results: RunResult[] = [];
    for (let i = 0; i < input.runs; i++) {
      const r = runDeck({ ...input.run, seed: input.baseSeed + i });
      results.push({ ...r, log: [] }); // keep metrics only
      done += 1;
      if (done % step === 0) postMessage({ type: 'progress', done, total } satisfies WorkerOut);
    }
    out.push(summarize(input, results));
  }
  postMessage({ type: 'done', results: out } satisfies WorkerOut);
};
