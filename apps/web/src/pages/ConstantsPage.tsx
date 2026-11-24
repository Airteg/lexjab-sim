import { DEFAULT_VALUES, EXP2_PROFILES, GROUP_LABELS, LEARNER_METHODS, REGISTRY, isRelevant, learnerSpec } from '@lexjab/sim';
import type { ConstantDef, ConstantGroup, ConstantValues } from '@lexjab/sim';
import type { Grade } from '@lexjab/core';
import { useEffect, useState } from 'react';
import { AllLearners } from '../components/AllLearners.tsx';
import type { AllLearnersResult } from '../components/AllLearners.tsx';
import { ChanceTable } from '../components/ChanceTable.tsx';
import { isChanged, valueText } from '../lib/deviation.ts';
import { parseNumber } from '../lib/format.ts';

interface Props {
  values: ConstantValues;
  errors: string[];
  onChange: (values: ConstantValues) => void;
  allResult: AllLearnersResult | null;
  onAllResult: (r: AllLearnersResult) => void;
}

function NumberField({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(Number.isNaN(value) ? '' : String(value).replace('.', ','));
  // Keep the text in sync when the value is changed elsewhere (reset, profile buttons).
  useEffect(() => {
    if (parseNumber(text) !== value && !(Number.isNaN(value) && text.trim() === '')) {
      setText(Number.isNaN(value) ? '' : String(value).replace('.', ','));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      className="num"
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(parseNumber(e.target.value));
      }}
    />
  );
}

function Field({ def, values, onChange }: { def: ConstantDef; values: ConstantValues; onChange: (v: ConstantValues) => void }) {
  const set = (v: ConstantValues[typeof def.key]) => onChange({ ...values, [def.key]: v });
  const value = values[def.key];
  let control;
  if (def.kind === 'int' || def.kind === 'prob') {
    control = <NumberField value={value as number} onChange={set} />;
  } else if (def.kind === 'grades') {
    const grades = value as Grade[];
    control = (
      <span className="grades">
        {([1, 3, 5] as const).map((g) => (
          <label key={g}>
            <input
              type="checkbox"
              checked={grades.includes(g)}
              onChange={(e) => set(e.target.checked ? [...grades, g].sort() : grades.filter((x) => x !== g))}
            />
            «{g}»
          </label>
        ))}
      </span>
    );
  } else {
    control = (
      <select value={value as string} onChange={(e) => set(e.target.value as ConstantValues['LEARNER_METHOD'])}>
        {def.options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }
  const changed = isChanged(def.key, values);
  return (
    <div className={`field${changed ? ' changed' : ''}`}>
      <div className="field-head">
        <span className="field-label">{def.label}</span>
        {control}
      </div>
      <div className="field-note">
        {def.description} <span className="spec">{def.spec}</span>
        {changed && <span className="norm"> · норма: {valueText(DEFAULT_VALUES[def.key])}</span>}
      </div>
      {def.kind === 'method' && (
        <div className="method-note">{LEARNER_METHODS.find((m) => m.id === value)?.description}</div>
      )}
    </div>
  );
}

export function ConstantsPage({ values, errors, onChange, allResult, onAllResult }: Props) {
  // Page columns; groups in one column are stacked cards in one grid cell.
  const columns: ConstantGroup[][] = [['deck', 'view'], ['algorithm'], ['learner'], ['run']];
  return (
    <div>
      <div className="toolbar">
        <button onClick={() => onChange({ ...DEFAULT_VALUES, FILLER_RETURN_GRADES: [...DEFAULT_VALUES.FILLER_RETURN_GRADES] })}>
          Скинути все до норми
        </button>
      </div>
      {errors.length > 0 && (
        <div className="errors">
          {errors.map((e) => (
            <div key={e}>{e}</div>
          ))}
        </div>
      )}
      <div className="groups">
        {columns.map((col) => (
          <div key={col.join('+')} className="group-col">
            {col.map((g) => (
              <section key={g} className="group">
                <h2>{GROUP_LABELS[g]}</h2>
                {g === 'learner' && (values.LEARNER_METHOD === 'exp2' || values.LEARNER_METHOD === 'forget') && (
                  <div className="toolbar">
                    Профіль:
                    {Object.values(EXP2_PROFILES).map((p) => (
                      <button key={p.label} onClick={() => onChange({ ...values, C1: p.c1, D1: p.d1, E1: p.e1 })}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}
                {REGISTRY.filter((d) => d.group === g && isRelevant(d, values)).map((d) => (
                  <Field key={d.key} def={d} values={values} onChange={onChange} />
                ))}
              </section>
            ))}
          </div>
        ))}
      </div>
      <section className="learner-chances">
        <h2>Шанси оцінок: {LEARNER_METHODS.find((m) => m.id === values.LEARNER_METHOD)?.label}</h2>
        <p className="muted">Для поточних параметрів моделі учня. «5» у заголовках — скільки «5» юніт уже отримав. ТЗ-02 §3</p>
        {errors.length === 0 ? <ChanceTable learner={learnerSpec(values)} /> : <p className="muted">Виправ помилки вище.</p>}
      </section>
      <AllLearners values={values} errors={errors} result={allResult} onResult={onAllResult} />
    </div>
  );
}
