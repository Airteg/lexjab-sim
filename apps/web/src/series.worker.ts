// Runs a series off the main thread so the page stays responsive on a tablet.
import { runDeck, summarize } from '@lexjab/sim';
import type { RunResult, SeriesInput, SeriesResult } from '@lexjab/sim';

export type WorkerOut =
  | { type: 'progress'; done: number; total: number }
  | { type: 'done'; result: SeriesResult };

self.onmessage = (e: MessageEvent<SeriesInput>) => {
  const input = e.data;
  const results: RunResult[] = [];
  const step = Math.max(1, Math.floor(input.runs / 50));
  for (let i = 0; i < input.runs; i++) {
    const r = runDeck({ ...input.run, seed: input.baseSeed + i });
    results.push({ ...r, log: [] }); // keep metrics only
    if ((i + 1) % step === 0) postMessage({ type: 'progress', done: i + 1, total: input.runs } satisfies WorkerOut);
  }
  postMessage({ type: 'done', result: summarize(input, results) } satisfies WorkerOut);
};
