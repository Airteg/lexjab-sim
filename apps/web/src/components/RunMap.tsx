import type { LogEntry, RunResult } from '@lexjab/sim';
import { efText } from '../lib/format.ts';

/** Full map of one run: rows = units in deck order, columns = lessons. */
export function RunMap({ result }: { result: RunResult }) {
  const ids = Array.from({ length: result.input.deckSize }, (_, i) => `U${i}`);
  const byLesson = result.log.map((l) => new Map(l.entries.map((e) => [e.itemId, e])));
  const lastEf = new Map<string, number>();
  for (const l of result.log) for (const e of l.entries) lastEf.set(e.itemId, e.efAfter);

  return (
    <div className="map-wrap">
      <table className="map">
        <thead>
          <tr>
            <th className="sticky">Раунд</th>
            {result.log.map((l, i) => (
              <th key={l.lesson} className={l.roundEnded ? 'rend' : ''}>
                {i === 0 || result.log[i - 1]!.round !== l.round ? l.round : ''}
              </th>
            ))}
            <th />
          </tr>
          <tr>
            <th className="sticky">Урок</th>
            {result.log.map((l) => (
              <th key={l.lesson} className={l.roundEnded ? 'rend' : ''}>
                {l.lesson}
              </th>
            ))}
            <th>EF</th>
          </tr>
        </thead>
        <tbody>
          {ids.map((id) => (
            <tr key={id}>
              <th className="sticky">{id}</th>
              {result.log.map((l, i) => {
                const e: LogEntry | undefined = byLesson[i]!.get(id);
                const cls = [e ? `g${e.grade}` : '', e?.filler ? 'filler' : '', l.roundEnded ? 'rend' : ''].join(' ');
                return (
                  <td
                    key={l.lesson}
                    className={cls}
                    title={e ? `${id}, урок ${l.lesson}: «${e.grade}», EF ${efText(e.efBefore)} → ${efText(e.efAfter)}${e.filler ? ', заповнювач' : ''}` : undefined}
                  >
                    {e ? e.grade : ''}
                  </td>
                );
              })}
              <td className="ef">{lastEf.has(id) ? efText(lastEf.get(id)!) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MapLegend() {
  return (
    <div className="legend">
      <span className="chip g1">1</span> «Ще раз» <span className="chip g3">3</span> «Повторити»
      <span className="chip g5">5</span> «Добре» <span className="chip g5 filler">5</span> заповнювач
      <span className="chip rend-chip" /> кінець раунду
    </div>
  );
}
