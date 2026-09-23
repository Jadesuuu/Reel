'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { Slot } from 'radix-ui';
import { cn } from '../../lib/cn';

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium',
    'transition-[background-color,border-color,color,transform,box-shadow] duration-150 ease-out',
    'select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-fg shadow-sm hover:bg-accent-strong active:shadow-none',
        secondary:
          'bg-surface-2 text-fg border border-line hover:border-line-strong hover:bg-surface-3',
        ghost: 'text-muted hover:text-fg hover:bg-surface-3',
        outline: 'border border-line text-fg hover:border-line-strong hover:bg-surface-2',
        danger: 'text-danger border border-line hover:border-danger/60 hover:bg-danger-soft',
        link: 'text-accent underline-offset-4 hover:underline h-auto px-0',
      },
      size: {
        xs: 'h-6 px-2 text-[11px] rounded-sm gap-1',
        sm: 'h-7 px-2.5 text-xs',
        md: 'h-9 px-3.5 text-sm',
        lg: 'h-10 px-4 text-sm',
        icon: 'size-8 p-0',
        'icon-sm': 'size-7 p-0',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
  ref,
) {
  if (asChild) {
    return (
      <Slot.Root ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props}>
        {children}
      </Slot.Root>
    );
  }
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
});
