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
        <div className="mb-3 flex size-9 items-center justify-center rounded-md border border-line bg-surface-2 text-faint">
          <Icon className="size-4" aria-hidden />
        </div>
      ) : null}
      <p className="text-sm font-medium text-fg">{title}</p>
      {hint ? <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted">{hint}</p> : null}
      {action ? <div className="mt-4 flex items-center gap-2">{action}</div> : null}
    </div>
  );
}
