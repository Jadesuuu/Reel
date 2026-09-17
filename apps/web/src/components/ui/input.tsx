'use client';

import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

const FIELD =
  'w-full rounded border border-ink-700 bg-ink-900 px-2.5 py-1.5 text-sm text-text-100 placeholder:text-text-500 transition-colors focus:border-brass-600 disabled:opacity-50';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(FIELD, 'h-9', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(FIELD, 'min-h-20 resize-y', className)} {...props} />;
}

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-xs font-medium tracking-wide text-text-300 uppercase"
    >
      {children}
    </label>
  );
}
