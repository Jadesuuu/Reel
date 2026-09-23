import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from './button';

export function PageHeader({
  title,
  lede,
  actions,
  className,
}: {
  title: string;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3', className)}>
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold tracking-tight text-fg">{title}</h1>
        {lede ? <p className="mt-1 max-w-[60ch] text-sm text-muted">{lede}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionTitle({
  children,
  aside,
  className,
}: {
  children: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-3 flex items-baseline justify-between gap-3', className)}>
      <h2 className="text-[13px] font-semibold tracking-tight text-fg">{children}</h2>
      {aside ? <div className="text-xs text-faint">{aside}</div> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-md border border-danger/40 bg-danger-soft px-4 py-3 text-sm text-fg',
        className,
      )}
    >
      <AlertTriangle className="size-4 shrink-0 text-danger" aria-hidden />
      <span className="flex-1">{message}</span>
      {onRetry ? (
        <Button size="sm" variant="outline" onClick={onRetry}>
          <RefreshCw className="size-3.5" /> Try again
        </Button>
      ) : null}
    </div>
  );
}

export function Panel({
  children,
  className,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn('rounded-lg border border-line bg-surface', padded && 'p-4', className)}>
      {children}
    </section>
  );
}
