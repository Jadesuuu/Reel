import { cn } from '../../lib/cn';

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border border-ink-700 bg-ink-850 px-1.5 py-0.5 font-mono text-[11px] text-text-300',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 70
      ? 'border-brass-600 bg-brass-600/15 text-brass-400'
      : score >= 50
        ? 'border-ink-600 bg-ink-800 text-text-100'
        : 'border-ink-700 bg-ink-850 text-text-300';

  return (
    <span
      className={cn(
        'inline-flex h-6 min-w-9 items-center justify-center rounded-sm border px-1.5 font-mono text-xs font-medium tabular-nums',
        tone,
      )}
    >
      {score}
    </span>
  );
}
