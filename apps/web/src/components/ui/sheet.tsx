'use client';

import { X } from 'lucide-react';
import { Dialog as RadixDialog } from 'radix-ui';
import { cn } from '../../lib/cn';
import { Button } from './button';

export const Sheet = RadixDialog.Root;
export const SheetTrigger = RadixDialog.Trigger;
export const SheetClose = RadixDialog.Close;

export function SheetContent({
  title,
  description,
  header,
  children,
  footer,
  className,
  width = 'md',
}: {
  title: string;
  description?: string;
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  width?: 'md' | 'lg';
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="reel-overlay fixed inset-0 z-40 bg-canvas/60 backdrop-blur-[1.5px]" />
      <RadixDialog.Content
        className={cn(
          'fixed z-50 flex flex-col bg-surface outline-none shadow-lg',
          'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-lg border-t border-line reel-sheet-bottom',
          'sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-full sm:rounded-none sm:border-t-0 sm:border-l sm:reel-sheet-right',
          width === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg',
          className,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            {header ?? (
              <RadixDialog.Title className="truncate text-[15px] font-semibold tracking-tight text-fg">
                {title}
              </RadixDialog.Title>
            )}
            {header ? <RadixDialog.Title className="sr-only">{title}</RadixDialog.Title> : null}
            <RadixDialog.Description
              className={description ? 'mt-0.5 text-xs text-muted' : 'sr-only'}
            >
              {description ?? title}
            </RadixDialog.Description>
          </div>
          <RadixDialog.Close asChild>
            <Button variant="ghost" size="icon-sm" aria-label="Close panel">
              <X className="size-4" />
            </Button>
          </RadixDialog.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="shrink-0 border-t border-line bg-surface px-5 py-3">{footer}</div>
        ) : null}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
