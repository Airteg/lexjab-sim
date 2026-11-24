import type { CSSProperties } from 'react';
import type { RunResult } from '@lexjab/sim';
import { efText } from '../lib/format.ts';

// Map of one run: rows = units in deck order, columns = lessons.
// Only graded cells become DOM elements ("marks"); the grid and the guides are CSS gradients,
// so the DOM size is about (grades + units + lessons / 10) instead of units × lessons.

/** A guide line and a vertical lesson number every GUIDE lessons; a stronger row guide every GUIDE units. */
const GUIDE = 10;

type Vars = CSSProperties & Record<`--${string}`, string | number>;

export function RunMap({ result }: { result: RunResult }) {
  const rows = result.input.deckSize;
  const cols = result.log.length;
  const lessonsPerDay = result.input.settings.lessonsPerDay;

  const lastEf = new Map<string, number>();
  for (const l of result.log) for (const e of l.entries) lastEf.set(e.itemId, e.efAfter);

  const marks = [];
  const roundStarts: { col: number; round: number }[] = [];
  const roundEnds: number[] = [];
  for (let c = 0; c < cols; c++) {
    const l = result.log[c]!;
    if (c === 0 || result.log[c - 1]!.round !== l.round) roundStarts.push({ col: c, round: l.round });
    if (l.roundEnded) roundEnds.push(c);
    const day = Math.ceil(l.lesson / lessonsPerDay);
    for (const e of l.entries) {
      const r = Number(e.itemId.slice(1)); // unit ids are U0, U1, … in deck order
      marks.push(
        <div
          key={`${c}:${e.itemId}`}
          className={`mark m${e.grade}${e.filler ? ' filler' : ''}`}
          style={{ '--c': c, '--r': r } as Vars}
          title={`${e.itemId}, урок ${l.lesson} (день ${day}, раунд ${l.round}): «${e.grade}», EF ${efText(e.efBefore)} → ${efText(e.efAfter)}${e.filler ? ', заповнювач' : ''}`}
        />,
      );
    }
  }

  const lessonLabels = [];
  for (let c = GUIDE - 1; c < cols; c += GUIDE) {
    lessonLabels.push(
      <div key={c} className="map-lesson" style={{ '--c': c } as Vars}>
        <span>{c + 1}</span>
      </div>,
    );
  }

  return (
    <div className="map-view">
      <div className="map-board" style={{ '--cols': cols, '--rows': rows, '--guide': GUIDE } as Vars}>
        <div className="map-corner">
          <span>Раунд</span>
          <span>Урок</span>
          <span>Юніт · EF</span>
        </div>
        <div className="map-head">
          {roundStarts.map((s) => (
            <div key={s.round} className="map-round" style={{ '--c': s.col } as Vars}>
              {s.round}
            </div>
          ))}
          {lessonLabels}
        </div>
        <div className="map-units">
          {Array.from({ length: rows }, (_, r) => {
            const id = `U${r}`;
            return (
              <div key={id} className={`map-unit${(r + 1) % GUIDE === 0 ? ' guide' : ''}`} style={{ '--r': r } as Vars}>
                <span>{id}</span>
                <span className="ef">{lastEf.has(id) ? efText(lastEf.get(id)!) : '—'}</span>
              </div>
            );
          })}
        </div>
        <div className="map-marks">
          {roundEnds.map((c) => (
            <div key={`end${c}`} className="map-rend" style={{ '--c': c } as Vars} title={`Кінець раунду: урок ${c + 1}`} />
          ))}
          {marks}
        </div>
      </div>
    </div>
  );
}

export function MapLegend() {
  return (
    <div className="legend">
      <span className="swatch m1" /> «1» Ще раз <span className="swatch m3" /> «3» Повторити <span className="swatch m5" /> «5» Добре
      <span className="swatch m5 filler" /> заповнювач <span className="swatch rend-swatch" /> кінець раунду
      <span>· номер уроку — кожен {GUIDE}-й; підказка на риску — юніт, урок, день, EF</span>
    </div>
  );
}
