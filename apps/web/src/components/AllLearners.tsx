import { allLearners, toSeriesInput } from '@lexjab/sim';
import type { ConstantValues, SeriesResult } from '@lexjab/sim';
import { Fragment, useRef, useState } from 'react';
import { fmt, pct } from '../lib/format.ts';
import { startSeries } from '../lib/seriesWorker.ts';
import type { SeriesJob } from '../lib/seriesWorker.ts';
import { Deviations } from './Deviations.tsx';

export interface AllLearnersResult {
  values: ConstantValues;
  rows: { label: string; series: SeriesResult }[];
}

interface Props {
  values: ConstantValues;
  errors: string[];
  result: AllLearnersResult | null;
  onResult: (r: AllLearnersResult) => void;
}

function roundName(k: number): string {
  if (k === 1) return 'Мінімум (раунд 1)';
  if (k === 2) return 'Оптимум (раунд 2)';
  return `Раунд ${k}`;
}

/** Spec 02 §6.1: the same series for all 8 learners, one table. */
export function AllLearners({ values, errors, result, onResult }: Props) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const job = useRef<SeriesJob | null>(null);
  const learners = allLearners(values);

  const start = () => {
    job.current?.stop();
    const snapshot = values;
    const list = allLearners(snapshot);
    setProgress({ done: 0, total: snapshot.RUNS * list.length });
    job.current = startSeries(
      list.map((l) => toSeriesInput(snapshot, l.learner)),
      (done, total) => setProgress({ done, total }),
      (series) => {
        onResult({ values: snapshot, rows: list.map((l, i) => ({ label: l.label, series: series[i]! })) });
        setProgress(null);
        job.current = null;
      },
    );
  };

  const stop = () => {
    job.current?.stop();
    job.current = null;
    setProgress(null);
  };

  const rounds = result ? result.values.ROUNDS_PER_RUN : 0;
  return (
    <section className="all-learners">
      <h2>Усі учні</h2>
      <p className="muted">
        Та сама серія (колода, алгоритм, прогони, зерна, гарантія) для {learners.length} учнів по черзі: від ідеального до змішаної
        колоди. ТЗ-02 §6.1
      </p>
      <div className="toolbar">
        <button className="primary" disabled={errors.length > 0 || progress !== null} onClick={start}>
          Усі учні ({learners.length} × {values.RUNS} прогонів)
        </button>
        {progress && (
          <>
            <progress max={progress.total} value={progress.done} /> {progress.done} / {progress.total}
            <button onClick={stop}>Зупинити</button>
          </>
        )}
      </div>
      {result && (
        <>
          <p className="muted">
            {result.values.RUNS} прогонів на учня · зерна {result.values.BASE_SEED}…{result.values.BASE_SEED + result.values.RUNS - 1} ·
            гарантія {result.values.PERCENTILE}% · алгоритм {result.rows[0]?.series.algorithmVersion} · симулятор{' '}
            {result.rows[0]?.series.simVersion}
          </p>
          {/* Learner parameters are shown in the row labels. */}
          <Deviations values={result.values} skipLearner />
          <div className="chance-wrap">
            <table className="stats all">
              <thead>
                <tr>
                  <th rowSpan={2}>Учень</th>
                  {Array.from({ length: rounds }, (_, i) => (
                    <th key={i} colSpan={3} className="grp">
                      {roundName(i + 1)}, гарантія {result.values.PERCENTILE}%
                    </th>
                  ))}
                  <th rowSpan={2}>Незавершених</th>
                </tr>
                <tr>
                  {Array.from({ length: rounds }, (_, i) => (
                    <Fragment key={i}>
                      <th>уроків</th>
                      <th>днів</th>
                      <th>тест./юніт</th>
                    </Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.label}>
                    <td>{r.label}</td>
                    {r.series.rounds.map((k) => (
                      <Fragment key={k.round}>
                        <td>{fmt(k.lesson, 'не завершено')}</td>
                        <td>{fmt(k.days, '—')}</td>
                        <td>{fmt(k.testsPerUnit, '—')}</td>
                      </Fragment>
                    ))}
                    <td>{pct(r.series.incompleteShare)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
