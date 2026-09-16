import { cn } from '../../lib/cn';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-lg font-medium text-text-100">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-xs text-text-500">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded border border-dashed border-ink-700 bg-ink-900/50 px-6 py-12 text-center">
      <p className="text-sm text-text-300">{title}</p>
      {hint ? <p className="mt-1 text-xs text-text-500">{hint}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-ink-800', className)} />;
}

export function RowsSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
      {message}
    </div>
  );
}
