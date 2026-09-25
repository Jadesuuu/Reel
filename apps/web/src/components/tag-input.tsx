'use client';

import { useId, useState } from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/cn';
import { Label } from './ui/input';

export function TagInput({
  label,
  hint,
  values,
  onChange,
  placeholder = 'type and press Enter',
  suggestions = [],
  max = 50,
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  max?: number;
}) {
  const [draft, setDraft] = useState('');
  const id = useId();

  function commit(raw = draft) {
    const entry = raw.trim().toLowerCase();
    if (entry.length > 0 && !values.includes(entry) && values.length < max) {
      onChange([...values, entry]);
    }
    setDraft('');
  }

  const remaining = suggestions.filter((item) => !values.includes(item)).slice(0, 8);

  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <div
        className={cn(
          'flex min-h-9 flex-wrap items-center gap-2 rounded-md border border-line bg-surface p-1.5 transition-[border-color,box-shadow] duration-150',
          'focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25 hover:border-line-strong',
        )}
        onClick={(event) => {
          (event.currentTarget.querySelector('input') as HTMLInputElement | null)?.focus();
        }}
      >
        <AnimatePresence initial={false}>
          {values.map((value) => (
            <motion.span
              key={value}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.14, ease: [0.23, 1, 0.32, 1] }}
              className="inline-flex h-7 items-center gap-1.5 rounded-sm border border-line bg-surface-2 pr-1 pl-2 font-mono text-fine text-fg"
            >
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                className="flex size-5 items-center justify-center rounded-sm text-faint hover:bg-surface-3 hover:text-danger"
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(values.filter((item) => item !== value));
                }}
              >
                <X className="size-4" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>

        <input
          id={id}
          className="h-7 min-w-36 flex-1 bg-transparent px-1 text-body text-fg outline-none placeholder:text-faint"
          placeholder={values.length === 0 ? placeholder : ''}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => commit()}
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
      {remaining.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="text-fine text-faint">Add:</span>
          {remaining.map((item) => (
            <button
              key={item}
              type="button"
              className="rounded-sm border border-dashed border-line px-1.5 py-0.5 font-mono text-fine text-muted hover:border-line-strong hover:text-fg"
              onClick={() => commit(item)}
            >
              {item}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
