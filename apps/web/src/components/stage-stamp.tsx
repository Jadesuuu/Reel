import { cn } from '../lib/cn';
import { STAGE_BORDER, STAGE_LABEL, STAGE_TEXT } from '../lib/stages';
import type { Stage } from '../lib/types';

export function StageStamp({
  stage,
  className,
  size = 'sm',
}: {
  stage: Stage;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <span
      className={cn(
        'stamp inline-flex items-center rounded-[3px] border bg-transparent',
        size === 'sm' ? 'h-6 px-2' : 'h-7 px-2.5 text-fine',
        STAGE_BORDER[stage],
        STAGE_TEXT[stage],
        className,
      )}
    >
      {STAGE_LABEL[stage]}
    </span>
  );
}

export function StageDot({ stage, className }: { stage: Stage; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block size-2 rounded-full', className)}
      style={{ background: `var(--stage-${stage.toLowerCase()})` }}
    />
  );
}
