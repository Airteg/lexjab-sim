import { runDeck, toSeriesInput } from '@lexjab/sim';
import type { ConstantValues, RunResult } from '@lexjab/sim';
import { useState } from 'react';
import { Deviations } from '../components/Deviations.tsx';
import { MapLegend, RunMap } from '../components/RunMap.tsx';
import { downloadText, runLogCsv } from '../lib/download.ts';
import { fmt, parseNumber } from '../lib/format.ts';

interface Props {
  values: ConstantValues;
  errors: string[];
  seed: number;
  onSeed: (seed: number) => void;
  result: { values: ConstantValues; run: RunResult } | null;
  onResult: (r: { values: ConstantValues; run: RunResult }) => void;
}

function avg(xs: readonly number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

export function RunPage({ values, errors, seed, onSeed, result, onResult }: Props) {
  const [seedText, setSeedText] = useState(String(seed));
  const seedValue = parseNumber(seedText);
  const seedOk = Number.isInteger(seedValue) && seedValue >= 0;

  const run = () => {
    onSeed(seedValue);
    const r = runDeck({ ...toSeriesInput(values).run, seed: seedValue });
    onResult({ values, run: r });
  };

  const m = result?.run.metrics;
  return (
    <div>
      <div className="toolbar">
        <label>
          Зерно{' '}
          <input className="num" type="text" inputMode="numeric" value={seedText} onChange={(e) => setSeedText(e.target.value)} />
        </label>
        <button className="primary" disabled={errors.length > 0 || !seedOk} onClick={run}>
          Прогнати
        </button>
        {result && (
          <>
            <button onClick={() => downloadText(`run-seed-${result.run.input.seed}.csv`, runLogCsv(result.run), 'text/csv')}>
              Журнал CSV
            </button>
            <button
              onClick={() =>
                downloadText(
                  `run-seed-${result.run.input.seed}.json`,
                  JSON.stringify({ constants: result.values, ...result.run }, null, 1),
                  'application/json',
                )
              }
            >
              Прогін JSON
            </button>
          </>
        )}
      </div>
      {errors.length > 0 && <div className="errors">Виправ константи на сторінці «Константи».</div>}

      {result && m && (
        <>
          <p className="muted">
            Зерно {result.run.input.seed} · алгоритм {result.run.algorithmVersion} · симулятор {result.run.simVersion} ·{' '}
            {result.run.completed ? 'прогін завершений' : 'прогін НЕ завершений (аварійна межа)'}
          </p>
          <Deviations values={result.values} />
          <table className="stats">
            <thead>
              <tr>
                <th>Раунд</th>
                <th>Кінець, урок</th>
                <th>Тестувань на юніт</th>
                <th>Днів</th>
              </tr>
            </thead>
            <tbody>
              {m.roundEnds.map((e) => (
                <tr key={e.round}>
                  <td>{e.round}</td>
                  <td>{e.lesson}</td>
                  <td>{fmt(e.testsPerUnit)}</td>
                  <td>{fmt(e.days)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table className="stats">
            <tbody>
              <tr><td>Уроків</td><td>{m.lessons}</td></tr>
              <tr><td>Тестувань</td><td>{m.totalTests}</td></tr>
              <tr><td>Урок першого тесту останнього юніта</td><td>{fmt(m.firstTestLastUnit)}</td></tr>
              <tr><td>Лишився неперевірений юніт</td><td>{m.neverTested ? 'так' : 'ні'}</td></tr>
              <tr><td>Повернення після «1», уроків (сер. / макс.)</td><td>{fmt(avg(m.returnAfter1))} / {fmt(m.returnAfter1.length ? Math.max(...m.returnAfter1) : null)}</td></tr>
              <tr><td>Найдовша серія уроків поспіль</td><td>{m.longestStreak}</td></tr>
              <tr><td>Вільні місця</td><td>{m.emptySlots}</td></tr>
              <tr><td>Місця заповнювачів</td><td>{m.fillerSlots}</td></tr>
            </tbody>
          </table>
          {result.run.input.deckSize <= result.values.MAP_MAX_UNITS ? (
            <>
              <MapLegend />
              <RunMap result={result.run} />
            </>
          ) : (
            <p className="muted">
              Карту не намальовано: у колоді {result.run.input.deckSize} юнітів, межа — {result.values.MAP_MAX_UNITS} (константа «Карта прогону:
              найбільше юнітів»). Повні дані прогону — у «Журнал CSV». ТЗ-02 §4
            </p>
          )}
        </>
      )}
    </div>
  );
}
