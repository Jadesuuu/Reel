'use client';

import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brass-500 text-ink-950 hover:bg-brass-400 disabled:hover:bg-brass-500',
  secondary: 'bg-ink-800 text-text-100 border border-ink-700 hover:border-ink-600 hover:bg-ink-700',
  ghost: 'text-text-300 hover:text-text-100 hover:bg-ink-800',
  danger:
    'bg-transparent text-danger border border-ink-700 hover:border-danger/60 hover:bg-danger/10',
};

const SIZES: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-9 px-3.5 text-sm',
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ variant = 'secondary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}
