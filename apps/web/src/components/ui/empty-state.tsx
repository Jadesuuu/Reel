import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/cn';

export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
  className,
  compact = false,
}: {
  icon?: LucideIcon;
  title: string;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'enter flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong/70 text-center',
        compact ? 'px-4 py-8' : 'px-6 py-14',
        className,
      )}
    >
      {Icon ? (
        <div className="mb-3 flex size-10 items-center justify-center rounded-md border border-line bg-surface-2 text-faint">
          <Icon className="size-5" aria-hidden />
        </div>
      ) : null}
      <p className="text-title-sm font-semibold text-fg">{title}</p>
      {hint ? (
        <p className="mt-1.5 max-w-md text-body-sm leading-relaxed text-muted">{hint}</p>
      ) : null}
      {action ? <div className="mt-4 flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
