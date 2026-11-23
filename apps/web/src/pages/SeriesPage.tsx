import { toSeriesInput } from '@lexjab/sim';
import type { ConstantValues, SeriesResult, Stat } from '@lexjab/sim';
import { useRef, useState } from 'react';
import { Deviations } from '../components/Deviations.tsx';
import { downloadText } from '../lib/download.ts';
import { fmt, parseNumber, pct } from '../lib/format.ts';
import { startSeries } from '../lib/seriesWorker.ts';
import type { SeriesJob } from '../lib/seriesWorker.ts';

interface Props {
  values: ConstantValues;
  errors: string[];
  result: { values: ConstantValues; series: SeriesResult } | null;
  onResult: (r: { values: ConstantValues; series: SeriesResult }) => void;
  /** Opens run i of the series on the Run page, with the series' constants. */
  onOpenRun: (values: ConstantValues, seed: number) => void;
}

function roundName(k: number): string {
  if (k === 1) return 'Мінімум (раунд 1)';
  if (k === 2) return 'Оптимум (раунд 2)';
  return `Раунд ${k}`;
}

function StatCells({ s }: { s: Stat }) {
  return (
    <td>
      {fmt(s.avg)} / {fmt(s.max)}
    </td>
  );
}

export function SeriesPage({ values, errors, result, onResult, onOpenRun }: Props) {
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [runIndex, setRunIndex] = useState('0');
  const job = useRef<SeriesJob | null>(null);

  const start = () => {
    job.current?.stop();
    const snapshot = values;
    setProgress({ done: 0, total: snapshot.RUNS });
    job.current = startSeries(
      [toSeriesInput(snapshot)],
      (done, total) => setProgress({ done, total }),
      ([series]) => {
        onResult({ values: snapshot, series: series! });
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

  const s = result?.series;
  const idx = parseNumber(runIndex);
  const idxOk = result !== null && Number.isInteger(idx) && idx >= 0 && idx < result.values.RUNS;

  return (
    <div>
      <div className="toolbar">
        <button className="primary" disabled={errors.length > 0 || progress !== null} onClick={start}>
          Запустити серію ({values.RUNS} прогонів)
        </button>
        {progress && (
          <>
            <progress max={progress.total} value={progress.done} /> {progress.done} / {progress.total}
            <button onClick={stop}>Зупинити</button>
          </>
        )}
        {result && (
          <button
            onClick={() =>
              downloadText(
                `series-seed-${result.values.BASE_SEED}.json`,
                JSON.stringify({ constants: result.values, ...result.series }, null, 1),
                'application/json',
              )
            }
          >
            Серія JSON
          </button>
        )}
      </div>
      {errors.length > 0 && <div className="errors">Виправ константи на сторінці «Константи».</div>}

      {result && s && (
        <>
          <p className="muted">
            {result.values.RUNS} прогонів · зерна {result.values.BASE_SEED}…{result.values.BASE_SEED + result.values.RUNS - 1} ·
            гарантія {result.values.PERCENTILE}% · алгоритм {s.algorithmVersion} · симулятор {s.simVersion}
          </p>
          <Deviations values={result.values} />
          <table className="stats">
            <thead>
              <tr>
                <th>З гарантією {result.values.PERCENTILE}%</th>
                <th>Уроків</th>
                <th>Тестувань на юніт</th>
                <th>Днів</th>
              </tr>
            </thead>
            <tbody>
              {s.rounds.map((r) => (
                <tr key={r.round}>
                  <td>{roundName(r.round)}</td>
                  <td>{fmt(r.lesson, 'не завершено')}</td>
                  <td>{fmt(r.testsPerUnit, 'не завершено')}</td>
                  <td>{fmt(r.days, 'не завершено')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="stats">
            <tbody>
              <tr><td>Незавершених прогонів</td><td>{pct(s.incompleteShare)}</td></tr>
              <tr><td>Прогонів із неперевіреним юнітом</td><td>{pct(s.neverTestedShare)}</td></tr>
              <tr><td>Урок першого тесту останнього юніта (сер. / макс.)</td><StatCells s={s.firstTestLastUnit} /></tr>
              <tr><td>Повернення після «1», уроків (сер. / макс.)</td><StatCells s={s.returnAfter1} /></tr>
              <tr><td>Найдовша серія уроків поспіль (сер. / макс.)</td><StatCells s={s.longestStreak} /></tr>
              <tr><td>Вільних місць на прогін, сер.</td><td>{fmt(s.emptySlotsAvg)}</td></tr>
              <tr><td>Місць заповнювачів на прогін, сер.</td><td>{fmt(s.fillerSlotsAvg)}</td></tr>
            </tbody>
          </table>
          <div className="toolbar">
            <label>
              Розгорнути прогін №{' '}
              <input className="num" type="text" inputMode="numeric" value={runIndex} onChange={(e) => setRunIndex(e.target.value)} />
            </label>
            <span className="muted">від 0 до {result.values.RUNS - 1}</span>
            <button disabled={!idxOk} onClick={() => onOpenRun(result.values, result.values.BASE_SEED + idx)}>
              Відкрити
            </button>
          </div>
        </>
      )}
    </div>
  );
}
