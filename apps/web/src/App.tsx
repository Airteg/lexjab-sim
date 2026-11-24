import { ALGORITHM_VERSION } from '@lexjab/core';
import { runDeck, toSeriesInput, validateValues } from '@lexjab/sim';
import type { ConstantValues, RunResult, SeriesResult } from '@lexjab/sim';
import { useEffect, useMemo, useState } from 'react';
import type { AllLearnersResult } from './components/AllLearners.tsx';
import { loadValues, saveValues } from './lib/storage.ts';
import { SITE_VERSION, buildStamp } from './version.ts';
import { ConstantsPage } from './pages/ConstantsPage.tsx';
import { RunPage } from './pages/RunPage.tsx';
import { SeriesPage } from './pages/SeriesPage.tsx';

type Tab = 'constants' | 'run' | 'series';
const TABS: { id: Tab; label: string }[] = [
  { id: 'constants', label: 'Константи' },
  { id: 'run', label: 'Прогін' },
  { id: 'series', label: 'Серія' },
];

function tabFromHash(): Tab {
  const h = location.hash.replace('#/', '');
  return TABS.some((t) => t.id === h) ? (h as Tab) : 'constants';
}

export function App() {
  const [tab, setTab] = useState<Tab>(tabFromHash);
  const [values, setValues] = useState<ConstantValues>(loadValues);
  const [seed, setSeed] = useState<number>(values.BASE_SEED);
  const [runResult, setRunResult] = useState<{ values: ConstantValues; run: RunResult } | null>(null);
  const [seriesResult, setSeriesResult] = useState<{ values: ConstantValues; series: SeriesResult } | null>(null);
  const [allResult, setAllResult] = useState<AllLearnersResult | null>(null);
  const errors = useMemo(() => validateValues(values), [values]);

  useEffect(() => saveValues(values), [values]);
  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  const go = (t: Tab) => {
    location.hash = `#/${t}`;
    setTab(t);
  };

  const openRun = (v: ConstantValues, s: number) => {
    setSeed(s);
    setRunResult({ values: v, run: runDeck({ ...toSeriesInput(v).run, seed: s }) });
    go('run');
  };

  return (
    <div className="app">
      <header>
        <h1>LexJab Sim</h1>
        <span className="muted">
          версія {SITE_VERSION} · алгоритм {ALGORITHM_VERSION} · зібрано {buildStamp()}
        </span>
      </header>
      <nav>
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => go(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <main>
        {tab === 'constants' && (
          <ConstantsPage values={values} errors={errors} onChange={setValues} allResult={allResult} onAllResult={setAllResult} />
        )}
        {tab === 'run' && (
          <RunPage
            key={seed}
            values={values}
            errors={errors}
            seed={seed}
            onSeed={setSeed}
            result={runResult}
            onResult={setRunResult}
          />
        )}
        {tab === 'series' && (
          <SeriesPage values={values} errors={errors} result={seriesResult} onResult={setSeriesResult} onOpenRun={openRun} />
        )}
      </main>
    </div>
  );
}
