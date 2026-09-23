'use client';

import { Tooltip as RadixTooltip } from 'radix-ui';
import { cn } from '../../lib/cn';

export function Tip({
  content,
  children,
  side = 'top',
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}) {
  if (!content) return <>{children}</>;
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className={cn(
            'reel-pop z-[60] max-w-64 rounded-md border border-line bg-surface-2 px-2.5 py-1.5 text-xs leading-snug text-fg shadow-md',
            className,
          )}
        >
          {content}
          <RadixTooltip.Arrow className="fill-surface-2" width={10} height={5} />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
