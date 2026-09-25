import { ExternalLink } from 'lucide-react';
import { cn } from '../lib/cn';
import { SOURCE_META, sourceLabel, sourceShort } from '../lib/sources';
import type { Source } from '../lib/types';
import { Tip } from './ui/tooltip';

export function SourceBadge({
  source,
  href,
  className,
  full = false,
}: {
  source: Source;
  href?: string | null;
  className?: string;
  full?: boolean;
}) {
  const meta = SOURCE_META[source];
  const label = full ? sourceLabel(source) : sourceShort(source);
  const tip = meta?.attribution ?? `From ${sourceLabel(source)}`;
  const body = (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-sm border border-line bg-surface-2 px-2 font-mono text-stamp whitespace-nowrap text-muted uppercase',
        href && 'hover:border-line-strong hover:text-fg',
        className,
      )}
    >
      {label}
      {href ? <ExternalLink className="size-3" aria-hidden /> : null}
    </span>
  );

  if (href) {
    return (
      <Tip content={tip}>
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`Open on ${sourceLabel(source)}`}
          onClick={(event) => event.stopPropagation()}
          className="inline-flex rounded-sm"
        >
          {body}
        </a>
      </Tip>
    );
  }

  return <Tip content={tip}>{body}</Tip>;
}
