import { chanceTable } from '@lexjab/sim';
import type { LearnerSpec } from '@lexjab/sim';

const nf = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 1 });
const p = (x: number) => nf.format(Math.max(0, x) * 100);

/** Chances of «1» / «3» / «5» for the current learner parameters (spec 02 §3). */
export function ChanceTable({ learner }: { learner: LearnerSpec }) {
  const t = chanceTable(learner);
  return (
    <div className="chance-wrap">
      <table className="chances">
        <thead>
          <tr>
            <th>Шанси «1» / «3» / «5», %</th>
            {t.columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {t.rows.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              {r.cells.map((c, i) => (
                <td key={i}>
                  <span className="c1">{p(c[1])}</span> / <span className="c3">{p(c[3])}</span> / <span className="c5">{p(c[5])}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
