'use client';

import { Check, ChevronDown } from 'lucide-react';
import { Select as RadixSelect } from 'radix-ui';
import { cn } from '../../lib/cn';

const EMPTY = '__all__';

export type SelectOption<T extends string> = { value: T; label: string; hint?: string };

export function Select<T extends string>({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  size = 'md',
  ariaLabel,
  disabled,
}: {
  value: T;
  onValueChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md';
  ariaLabel?: string;
  disabled?: boolean;
}) {
  return (
    <RadixSelect.Root
      value={value === '' ? EMPTY : value}
      onValueChange={(next) => onValueChange((next === EMPTY ? '' : next) as T)}
      disabled={disabled}
    >
      <RadixSelect.Trigger
        aria-label={ariaLabel}
        className={cn(
          'inline-flex items-center justify-between gap-2 rounded-md border border-line bg-surface text-fg outline-none',
          'transition-[border-color,box-shadow] duration-150 ease-out hover:border-line-strong focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25',
          'data-[placeholder]:text-faint disabled:opacity-50',
          size === 'sm' ? 'h-7 px-2 text-xs' : 'h-9 px-2.5 text-sm',
          className,
        )}
      >
        <RadixSelect.Value placeholder={placeholder} />
        <RadixSelect.Icon>
          <ChevronDown className="size-3.5 text-faint" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>
      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={6}
          collisionPadding={8}
          className="reel-pop z-[60] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-line bg-surface-2 p-1 shadow-md"
        >
          <RadixSelect.Viewport>
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value || EMPTY}
                value={option.value === '' ? EMPTY : option.value}
                className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pr-2 pl-7 text-[13px] text-fg outline-none data-[highlighted]:bg-surface-3 data-[state=checked]:text-accent"
              >
                <RadixSelect.ItemIndicator className="absolute left-2 inline-flex">
                  <Check className="size-3.5" />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                {option.hint ? (
                  <span className="ml-auto pl-3 text-xs text-faint">{option.hint}</span>
                ) : null}
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}
