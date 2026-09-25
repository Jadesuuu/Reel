import { cn } from '../lib/cn';
import { Badge } from './ui/badge';
import { Tip } from './ui/tooltip';

export function explainReason(reason: string): { label: string; points: string; detail: string } {
  if (reason === 'remote') {
    return { label: 'remote', points: '+25', detail: 'The posting is remote.' };
  }
  if (reason.startsWith('role:')) {
    const keyword = reason.slice(5);
    return {
      label: `role · ${keyword}`,
      points: '+30',
      detail: `Your role keyword “${keyword}” appears in the headline. Only the first role match counts.`,
    };
  }
  if (reason.startsWith('stack:')) {
    const keyword = reason.slice(6);
    return {
      label: keyword,
      points: '+10',
      detail: `Your include keyword “${keyword}” appears in the headline or stack. Stack points cap at +40.`,
    };
  }
  if (reason === 'salary') {
    return { label: 'salary', points: '+10', detail: 'A USD salary was parsed from the posting.' };
  }
  if (reason === 'apply-url') {
    return { label: 'apply link', points: '+5', detail: 'The posting includes a link to apply.' };
  }
  if (reason === 'not-remote') {
    return { label: 'not remote', points: '0', detail: 'Your criteria are remote-only.' };
  }
  if (reason.startsWith('excluded:')) {
    return {
      label: `excluded · ${reason.slice(9)}`,
      points: '0',
      detail: 'An exclude keyword matched, so the posting scores zero.',
    };
  }
  if (reason.startsWith('outside:')) {
    const term = reason.slice(8);
    return {
      label: `outside · ${term}`,
      points: '0',
      detail: `The posting is limited to “${term}” and none of your regions appear, so it scores zero.`,
    };
  }
  if (reason === 'below-min-salary') {
    return {
      label: 'below minimum',
      points: '0',
      detail: 'The salary ceiling is under your minimum.',
    };
  }
  return { label: reason, points: '', detail: reason };
}

export function ReasonChips({
  reasons,
  limit = 5,
  className,
}: {
  reasons: string[];
  limit?: number;
  className?: string;
}) {
  const shown = reasons.slice(0, limit);
  const rest = reasons.length - shown.length;
  return (
    <span className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {shown.map((reason) => {
        const info = explainReason(reason);
        return (
          <Tip
            key={reason}
            content={
              <span>
                <span className="font-mono text-accent">{info.points}</span> · {info.detail}
              </span>
            }
          >
            <Badge tone="neutral" className="cursor-help">
              {info.label}
            </Badge>
          </Tip>
        );
      })}
      {rest > 0 ? (
        <Tip
          content={reasons
            .slice(limit)
            .map((reason) => explainReason(reason).label)
            .join(', ')}
        >
          <Badge tone="outline" className="cursor-help">
            +{rest}
          </Badge>
        </Tip>
      ) : null}
    </span>
  );
}
