'use client';

import { Switch as RadixSwitch } from 'radix-ui';
import { cn } from '../../lib/cn';

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  ariaLabel,
  id,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  id?: string;
}) {
  return (
    <RadixSwitch.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-line-strong bg-surface-3 transition-colors duration-150 ease-out',
        'data-[state=checked]:border-accent data-[state=checked]:bg-accent disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        className,
      )}
    >
      <RadixSwitch.Thumb
        className={cn(
          'block size-4 translate-x-0.5 rounded-full bg-fg shadow-sm transition-transform duration-150 ease-out',
          'data-[state=checked]:translate-x-6 data-[state=checked]:bg-accent-fg',
        )}
      />
    </RadixSwitch.Root>
  );
}
