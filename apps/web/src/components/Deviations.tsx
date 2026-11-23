import type { ConstantValues } from '@lexjab/sim';
import { deviations } from '../lib/deviation.ts';

/** Shows which constants of a result differ from the norm (spec defaults). */
export function Deviations({ values, skipLearner = false }: { values: ConstantValues; skipLearner?: boolean }) {
  const d = deviations(values, skipLearner);
  if (d.length === 0) return <p className="muted">{skipLearner ? 'Інші константи — за нормою ТЗ.' : 'Усі константи — за нормою ТЗ.'}</p>;
  return (
    <p className="muted">
      Відхилення від норми:{' '}
      {d.map((x, i) => (
        <span key={x.label}>
          {i > 0 && '; '}
          {x.label} = <b>{x.value}</b> (норма {x.norm})
        </span>
      ))}
    </p>
  );
}
