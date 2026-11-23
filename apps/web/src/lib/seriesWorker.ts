import type { SeriesInput, SeriesResult } from '@lexjab/sim';
import type { WorkerIn, WorkerOut } from '../series.worker.ts';

export interface SeriesJob {
  stop: () => void;
}

/** Starts a worker for the given series; reports progress and the results in input order. */
export function startSeries(
  items: readonly SeriesInput[],
  onProgress: (done: number, total: number) => void,
  onDone: (results: SeriesResult[]) => void,
): SeriesJob {
  const w = new Worker(new URL('../series.worker.ts', import.meta.url), { type: 'module' });
  w.onmessage = (e: MessageEvent<WorkerOut>) => {
    if (e.data.type === 'progress') onProgress(e.data.done, e.data.total);
    else {
      w.terminate();
      onDone(e.data.results);
    }
  };
  w.postMessage({ items } satisfies WorkerIn);
  return { stop: () => w.terminate() };
}
