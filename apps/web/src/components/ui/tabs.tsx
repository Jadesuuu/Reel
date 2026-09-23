'use client';

import { Tabs as RadixTabs } from 'radix-ui';
import { cn } from '../../lib/cn';

export const Tabs = RadixTabs.Root;
export const TabsContent = RadixTabs.Content;

export function TabsList({ className, ...props }: React.ComponentProps<typeof RadixTabs.List>) {
  return (
    <RadixTabs.List
      className={cn('flex items-center gap-1 border-b border-line', className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  children,
  count,
  ...props
}: React.ComponentProps<typeof RadixTabs.Trigger> & { count?: number }) {
  return (
    <RadixTabs.Trigger
      className={cn(
        'relative -mb-px inline-flex h-9 items-center gap-1.5 border-b-2 border-transparent px-2.5 text-[13px] text-muted outline-none transition-colors duration-150',
        'hover:text-fg data-[state=active]:border-accent data-[state=active]:text-fg',
        'focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent',
        className,
      )}
      {...props}
    >
      {children}
      {count !== undefined ? (
        <span className="tabular rounded-sm bg-surface-3 px-1 font-mono text-[10.5px] text-faint">
          {count}
        </span>
      ) : null}
    </RadixTabs.Trigger>
  );
}
