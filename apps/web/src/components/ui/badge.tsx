import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/cn';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 font-mono text-fine leading-none whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'border-line bg-surface-2 text-muted',
        outline: 'border-line bg-transparent text-muted',
        accent: 'border-accent/40 bg-accent-soft text-accent',
        success: 'border-success/40 bg-success-soft text-success',
        danger: 'border-danger/40 bg-danger-soft text-danger',
        info: 'border-info/40 bg-info-soft text-info',
        solid: 'border-transparent bg-fg text-canvas',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export function ScoreBadge({ score, className }: { score: number; className?: string }) {
  const tone =
    score >= 80
      ? 'border-accent bg-accent text-accent-fg'
      : score >= 60
        ? 'border-accent/50 bg-accent-soft text-accent'
        : 'border-line bg-surface-2 text-muted';

  return (
    <span
      className={cn(
        'tabular inline-flex h-9 min-w-12 items-center justify-center rounded-sm border px-2 font-mono text-measure font-medium',
        tone,
        className,
      )}
      title={`Score ${score} of 110`}
    >
      {score}
    </span>
  );
}
