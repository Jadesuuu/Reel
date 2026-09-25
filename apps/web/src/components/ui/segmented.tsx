'use client';

import { ToggleGroup } from 'radix-ui';
import { cn } from '../../lib/cn';

export type SegmentOption<T extends string> = { value: T; label: React.ReactNode; count?: number };

export function Segmented<T extends string>({
  value,
  onValueChange,
  options,
  ariaLabel,
  className,
  size = 'sm',
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentOption<T>[];
  ariaLabel: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onValueChange(next as T);
      }}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md border border-line bg-surface-2 p-0.5',
        className,
      )}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          className={cn(
            'inline-flex items-center gap-2 rounded-[4px] whitespace-nowrap text-muted outline-none transition-[background-color,color,box-shadow] duration-150 ease-out',
            'hover:text-fg data-[state=on]:bg-surface data-[state=on]:text-fg data-[state=on]:shadow-sm',
            'focus-visible:outline-2 focus-visible:outline-offset-[-1px] focus-visible:outline-accent',
            size === 'sm' ? 'h-8 px-3 text-caption' : 'h-9 px-4 text-body',
          )}
        >
          {option.label}
          {option.count !== undefined ? (
            <span className="tabular font-mono text-measure-sm text-faint">{option.count}</span>
          ) : null}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}
