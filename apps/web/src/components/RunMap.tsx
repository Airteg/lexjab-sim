import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RunResult } from '@lexjab/sim';
import { efText } from '../lib/format.ts';
import { stickyHeight } from '../lib/sticky.ts';

// Map of one run: rows = units in deck order, columns = lessons.
// Only graded cells become DOM elements ("marks"); the grid and the guides are CSS gradients.
// Geometry scales with `zoom`; label fonts do not. Labels thin out (every 1, 2, 5, 10, … rows or days)
// so that they never overlap, whatever the zoom.

/** Cell size at zoom 1, px. */
const BASE_COL = 14;
const BASE_ROW = 14;
const ZOOM_MIN = 0.05;
const ZOOM_MAX = 4;
const ZOOM_STEP = 1.25;
/** Smallest distance between two labels, px. */
const LABEL_GAP = 13;
/** Width of the unit column, px. */
const AXIS_W = 72;
/** Height of the header (round + day), px. */
const HEAD_H = 56;
const STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
/** Strong guide every GUIDE rows or days. */
const GUIDE = 10;

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** Mark colours: "pure" — bright red / green and a blue filler; "soft" — the previous muted set. */
type Palette = 'pure' | 'soft';
const PALETTE_KEY = 'lexjab-sim/map-palette';

function loadPalette(): Palette {
  try {
    return localStorage.getItem(PALETTE_KEY) === 'soft' ? 'soft' : 'pure';
  } catch {
    return 'pure';
  }
}

const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
const labelStep = (px: number) => STEPS.find((s) => s * px >= LABEL_GAP) ?? STEPS[STEPS.length - 1]!;
const pct = (z: number) => `${Math.round(z * 100)}%`;

export function RunMap({ result }: { result: RunResult }) {
  const rows = result.input.deckSize;
  const cols = result.log.length;
  const lpd = result.input.settings.lessonsPerDay;
  const days = Math.ceil(cols / lpd);

  const [zoom, setZoom] = useState(1);
  const [palette, setPalette] = useState<Palette>(loadPalette);
  const togglePalette = () => {
    const next: Palette = palette === 'pure' ? 'soft' : 'pure';
    setPalette(next);
    try {
      localStorage.setItem(PALETTE_KEY, next);
    } catch {
      // storage unavailable: the choice lasts until reload
    }
  };
  const view = useRef<HTMLDivElement>(null);
  // Content point (in cells) that must stay under the same screen point after a zoom change.
  const anchor = useRef<{ cx: number; cy: number; ax: number; ay: number } | null>(null);

  const colPx = BASE_COL * zoom;
  const rowPx = BASE_ROW * zoom;

  /** Zooms keeping the content under (ax, ay) — a point inside the view, px — in place. */
  const zoomTo = (next: number, ax?: number, ay?: number) => {
    const v = view.current;
    const z = clampZoom(next);
    if (!v || z === zoom) return;
    const x = ax ?? (v.clientWidth - AXIS_W) / 2 + AXIS_W;
    const y = ay ?? (v.clientHeight - HEAD_H) / 2 + HEAD_H;
    anchor.current = {
      cx: (v.scrollLeft + x - AXIS_W) / colPx,
      cy: (v.scrollTop + y - HEAD_H) / rowPx,
      ax: x,
      ay: y,
    };
    setZoom(z);
  };

  const section = useRef<HTMLDivElement>(null);

  /**
   * «Вмістити»: scrolls the page so that legend, tools and map sit right under the sticky bars,
   * and picks the zoom at which the whole map fits the frame there (width and height).
   */
  const fit = () => {
    const v = view.current;
    const sec = section.current;
    if (!v || !sec) return;
    const sticky = stickyHeight();
    // Space for the frame: window below the sticky bars, minus legend and tools above the frame.
    const above = v.getBoundingClientRect().top - sec.getBoundingClientRect().top;
    const frameH = window.innerHeight - sticky - above - 2; // 2 = frame border
    const frameW = v.offsetWidth - 2;
    // 0.995: keep a pixel of slack so rounding never brings the scrollbars back.
    const z = 0.995 * Math.min((frameW - AXIS_W) / (cols * BASE_COL), (frameH - HEAD_H) / (rows * BASE_ROW));
    anchor.current = null;
    setZoom(clampZoom(z));
    v.scrollTo(0, 0);
    window.scrollTo({ top: window.scrollY + sec.getBoundingClientRect().top - sticky, behavior: 'instant' });
  };

  useLayoutEffect(() => {
    const v = view.current;
    const a = anchor.current;
    if (!v || !a) return;
    v.scrollLeft = a.cx * colPx + AXIS_W - a.ax;
    v.scrollTop = a.cy * rowPx + HEAD_H - a.ay;
    anchor.current = null;
  }, [colPx, rowPx]);

  // Ctrl + wheel zooms around the cursor. Needs a non-passive listener to stop the page zoom.
  const zoomRef = useRef(zoomTo);
  zoomRef.current = zoomTo;
  useEffect(() => {
    const v = view.current;
    if (!v) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const r = v.getBoundingClientRect();
      zoomRef.current(zoom * (e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP), e.clientX - r.left, e.clientY - r.top);
    };
    v.addEventListener('wheel', onWheel, { passive: false });
    return () => v.removeEventListener('wheel', onWheel);
  }, [zoom]);

  // Drag with the mouse to scroll, like a finger on a tablet. Touch keeps the browser's own scrolling.
  const drag = useRef<{ x: number; y: number; left: number; top: number; id: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const v = e.currentTarget;
    drag.current = { x: e.clientX, y: e.clientY, left: v.scrollLeft, top: v.scrollTop, id: e.pointerId };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const v = e.currentTarget;
    if (!dragging && Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 3) {
      setDragging(true);
      v.setPointerCapture(d.id);
    }
    v.scrollLeft = d.left - (e.clientX - d.x);
    v.scrollTop = d.top - (e.clientY - d.y);
  };
  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  const lastEf = new Map<string, number>();
  for (const l of result.log) for (const e of l.entries) lastEf.set(e.itemId, e.efAfter);

  const marks = [];
  const roundStarts: { col: number; round: number }[] = [];
  const roundEnds: number[] = [];
  for (let c = 0; c < cols; c++) {
    const l = result.log[c]!;
    if (c === 0 || result.log[c - 1]!.round !== l.round) roundStarts.push({ col: c, round: l.round });
    if (l.roundEnded) roundEnds.push(c);
    const day = Math.ceil(l.lesson / lpd);
    for (const e of l.entries) {
      const r = Number(e.itemId.slice(1)); // unit ids are U0, U1, … in deck order
      marks.push(
        <div
          key={`${c}:${e.itemId}`}
          className={`mark m${e.grade}${e.filler ? ' filler' : ''}`}
          style={{ '--c': c, '--r': r } as Vars}
          title={`${e.itemId}, день ${day}, урок ${l.lesson}, раунд ${l.round}: «${e.grade}», EF ${efText(e.efBefore)} → ${efText(e.efAfter)}${e.filler ? ', заповнювач' : ''}`}
        />,
      );
    }
  }

  const dayStep = labelStep(lpd * colPx);
  const dayLabels = [];
  for (let d = 1; d <= days; d++) {
    if (d !== 1 && d % dayStep !== 0) continue;
    dayLabels.push(
      <div key={d} className="map-day" style={{ '--c': (d - 1) * lpd } as Vars}>
        <span>{d}</span>
      </div>,
    );
  }

  const unitStep = labelStep(rowPx);
  const unitLabels = [];
  for (let r = 0; r < rows; r++) {
    if (unitStep > 1 && r % unitStep !== 0) continue;
    const id = `U${r}`;
    unitLabels.push(
      <div key={id} className="map-unit" style={{ '--r': r } as Vars}>
        <span>{id}</span>
        {unitStep === 1 && <span className="ef">{lastEf.has(id) ? efText(lastEf.get(id)!) : '—'}</span>}
      </div>,
    );
  }

  const boardVars: Vars = {
    '--cols': cols,
    '--rows': rows,
    '--col-w': `${colPx}px`,
    '--row-h': `${rowPx}px`,
    '--axis-w': `${AXIS_W}px`,
    '--head-h': `${HEAD_H}px`,
    '--day-w': `${lpd * colPx}px`,
    '--guide': GUIDE,
    // Thin cell lines only when cells are big enough to see them.
    '--grid-x': lpd * colPx >= 6 ? 'var(--grid)' : 'transparent',
    '--grid-y': rowPx >= 6 ? 'var(--grid)' : 'transparent',
  };

  return (
    <div ref={section} className={`map-section palette-${palette}`}>
      <MapLegend />
      <div className="map-tools">
        <button onClick={() => zoomTo(zoom / ZOOM_STEP)} disabled={zoom <= ZOOM_MIN} title="Зменшити (Ctrl + коліщатко)">
          −
        </button>
        <span className="map-zoom">{pct(zoom)}</span>
        <button onClick={() => zoomTo(zoom * ZOOM_STEP)} disabled={zoom >= ZOOM_MAX} title="Збільшити (Ctrl + коліщатко)">
          +
        </button>
        <button onClick={() => zoomTo(1)}>100%</button>
        <button onClick={fit}>Вмістити</button>
        <label className="map-palette">
          <input type="checkbox" checked={palette === 'pure'} onChange={togglePalette} /> Чисті кольори
        </label>
        <span className="muted">
          Тягни мишею, щоб рухати карту. Підписи: юніти — {unitStep === 1 ? 'усі, з EF' : `кожен ${unitStep}-й`}, дні —{' '}
          {dayStep === 1 ? 'усі' : `кожен ${dayStep}-й`}.
        </span>
      </div>
      <div
        ref={view}
        className={`map-view${dragging ? ' dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="map-board" style={boardVars}>
          <div className="map-corner">
            <span>Раунд</span>
            <span>День</span>
            <span>{unitStep === 1 ? 'Юніт · EF' : 'Юніт'}</span>
          </div>
          <div className="map-head">
            {roundStarts.map((s) => (
              <div key={s.round} className="map-round" style={{ '--c': s.col } as Vars}>
                {s.round}
              </div>
            ))}
            {dayLabels}
          </div>
          <div className="map-units">{unitLabels}</div>
          <div className="map-marks">
            {roundEnds.map((c) => (
              <div key={`end${c}`} className="map-rend" style={{ '--c': c } as Vars} title={`Кінець раунду: урок ${c + 1}`} />
            ))}
            {marks}
          </div>
        </div>
      </div>
    </div>
  );
}

function MapLegend() {
  return (
    <div className="legend">
      <span className="swatch m1" /> «1» Ще раз <span className="swatch m3" /> «3» Повторити <span className="swatch m5" /> «5» Добре
      <span className="swatch m5 filler" /> заповнювач <span className="swatch rend-swatch" /> кінець раунду
      <span>· сірі лінії — межі днів і кожен {GUIDE}-й юніт; підказка на риску — юніт, день, урок, EF</span>
    </div>
  );
}
