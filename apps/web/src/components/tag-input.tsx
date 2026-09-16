'use client';

import { useState } from 'react';
import { Label } from './ui/input';

export function TagInput({
  label,
  hint,
  values,
  onChange,
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  function commit() {
    const entry = draft.trim().toLowerCase();
    if (entry.length > 0 && !values.includes(entry)) {
      onChange([...values, entry]);
    }
    setDraft('');
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-1.5 rounded border border-ink-700 bg-ink-900 p-1.5">
        {values.map((value) => (
          <span
            key={value}
            className="inline-flex items-center gap-1 rounded-sm border border-ink-600 bg-ink-850 py-0.5 pr-1 pl-1.5 font-mono text-[11px] text-text-300"
          >
            {value}
            <button
              type="button"
              aria-label={`Remove ${value}`}
              className="text-text-500 hover:text-danger"
              onClick={() => onChange(values.filter((item) => item !== value))}
            >
              ×
            </button>
          </span>
        ))}

        <input
          className="h-6 min-w-32 flex-1 bg-transparent px-1 text-sm text-text-100 outline-none placeholder:text-text-500"
          placeholder={values.length === 0 ? 'type and press Enter' : ''}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              commit();
            }
            if (event.key === 'Backspace' && draft === '' && values.length > 0) {
              onChange(values.slice(0, -1));
            }
          }}
        />
      </div>
      {hint ? <p className="mt-1 text-xs text-text-500">{hint}</p> : null}
    </div>
  );
}
