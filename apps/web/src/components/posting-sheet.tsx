'use client';

import { ExternalLink, MapPin, Plus } from 'lucide-react';
import { hostOf, longDate, remoteLabel } from '../lib/format';
import { usePosting } from '../lib/queries';
import type { PostingSummary } from '../lib/types';
import { SourceBadge } from './source-badge';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Sheet, SheetContent } from './ui/sheet';
import { RowsSkeleton } from './ui/skeleton';
import { ErrorState } from './ui/states';
import { useSavePosting } from './use-save-posting';

export function PostingSheet({
  posting,
  onClose,
}: {
  posting: PostingSummary | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={posting !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      {posting ? <PostingSheetBody posting={posting} /> : null}
    </Sheet>
  );
}

function PostingSheetBody({ posting }: { posting: PostingSummary }) {
  const detail = usePosting(posting.id);
  const saver = useSavePosting();
  const data = detail.data ?? posting;
  const applyHref = data.applyUrl ?? data.url;

  return (
    <SheetContent
      title={data.company ?? 'Unknown company'}
      width="lg"
      header={
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2">
            <SourceBadge source={data.source} href={data.url} />
            <span className="text-fine text-faint">{longDate(data.postedAt)}</span>
          </div>
          <h2 className="truncate text-title font-semibold tracking-tight text-fg">
            {data.company ?? 'Unknown company'}
          </h2>
          <p className="truncate text-body text-muted">{data.role ?? 'Role not parsed'}</p>
        </div>
      }
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="md"
            loading={saver.isPending}
            onClick={() =>
              saver.save({ postingId: data.id, company: data.company, role: data.role })
            }
          >
            <Plus className="size-5" /> Save to pipeline
          </Button>
          {applyHref ? (
            <Button asChild variant="outline" size="md">
              <a href={applyHref} target="_blank" rel="noreferrer noopener">
                {hostOf(applyHref) ? `Apply on ${hostOf(applyHref)}` : 'Open apply link'}{' '}
                <ExternalLink className="size-4" />
              </a>
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={data.remote === 'REMOTE' ? 'accent' : 'neutral'}>
          {remoteLabel(data.remote)}
        </Badge>
        {data.location ? (
          <Badge tone="outline">
            <MapPin className="size-4" /> {data.location}
          </Badge>
        ) : null}
        {data.salaryText ? <Badge tone="success">{data.salaryText}</Badge> : null}
      </div>

      {data.stackKeywords.length > 0 ? (
        <div className="mt-4">
          <div className="stamp mb-2 text-faint">Stack</div>
          <div className="flex flex-wrap gap-1.5">
            {data.stackKeywords.map((keyword) => (
              <Badge key={keyword} tone="outline">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 border-t border-line pt-4">
        <div className="stamp mb-2 text-faint">Posting</div>
        {detail.isPending ? <RowsSkeleton rows={4} height="h-5" /> : null}
        {detail.isError ? (
          <ErrorState message="Could not load the full posting." onRetry={() => detail.refetch()} />
        ) : null}
        {detail.data ? (
          <pre className="max-w-[72ch] font-sans text-body-sm leading-relaxed whitespace-pre-wrap text-muted [&_a]:text-accent">
            {detail.data.rawText ?? detail.data.headline}
          </pre>
        ) : null}
      </div>
    </SheetContent>
  );
}
