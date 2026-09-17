'use client';

import { useState } from 'react';
import { Badge, ScoreBadge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { EmptyState, ErrorState, PageHeader, RowsSkeleton } from '../../../components/ui/states';
import { relativeDays } from '../../../lib/format';
import {
  useCreateApplication,
  useDismissMatch,
  useMatches,
  useRescore,
} from '../../../lib/queries';
import type { Match } from '../../../lib/types';

function MatchRow({ match }: { match: Match }) {
  const [expanded, setExpanded] = useState(false);
  const dismiss = useDismissMatch();
  const save = useCreateApplication();
  const posting = match.posting;

  return (
    <li className="rounded border border-ink-700 bg-ink-900 transition-colors hover:border-ink-600">
      <div className="flex items-start gap-3 p-3">
        <ScoreBadge score={match.score} />

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="block w-full text-left"
          >
            <p className="truncate text-sm font-medium text-text-100">
              {posting.company ?? 'Unknown company'}
              {posting.role ? <span className="text-text-300"> · {posting.role}</span> : null}
            </p>
            <p className="mt-0.5 truncate text-xs text-text-500">{posting.headline}</p>
          </button>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge className="border-ink-600 text-text-300">{posting.remote.toLowerCase()}</Badge>
            {posting.salaryText ? <Badge>{posting.salaryText}</Badge> : null}
            {match.reasons.slice(0, 4).map((reason) => (
              <Badge key={reason}>{reason}</Badge>
            ))}
            <span className="ml-auto text-[11px] text-text-500">
              {relativeDays(posting.postedAt)}
            </span>
          </div>

          {expanded ? (
            <p className="mt-3 max-h-64 overflow-y-auto border-t border-ink-700 pt-3 text-xs leading-relaxed whitespace-pre-wrap text-text-300">
              {posting.headline}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-1.5">
          <Button
            size="sm"
            variant="primary"
            disabled={save.isPending}
            onClick={() => save.mutate({ postingId: posting.id })}
          >
            {save.isSuccess ? 'Saved' : 'Save'}
          </Button>
          {posting.applyUrl ? (
            <a
              href={posting.applyUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-7 items-center justify-center rounded border border-ink-700 px-2.5 text-xs text-text-300 hover:border-ink-600 hover:text-text-100"
            >
              Apply
            </a>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            disabled={dismiss.isPending}
            onClick={() => dismiss.mutate(match.id)}
          >
            Dismiss
          </Button>
        </div>
      </div>
    </li>
  );
}

export default function InboxPage() {
  const [dismissed, setDismissed] = useState(false);
  const [page, setPage] = useState(1);
  const matches = useMatches({ dismissed, page });
  const rescore = useRescore();

  return (
    <>
      <PageHeader
        title="Inbox"
        subtitle="Postings scored against your criteria"
        actions={
          <>
            <Button
              size="sm"
              variant={dismissed ? 'secondary' : 'ghost'}
              onClick={() => {
                setDismissed((value) => !value);
                setPage(1);
              }}
            >
              {dismissed ? 'Showing dismissed' : 'Show dismissed'}
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled={rescore.isPending}
              onClick={() => rescore.mutate()}
            >
              {rescore.isPending ? 'Rescoring…' : 'Rescore'}
            </Button>
          </>
        }
      />

      {rescore.isSuccess ? (
        <p className="mb-3 text-xs text-success">Rescored {rescore.data.rescored} matches.</p>
      ) : null}

      {matches.isPending ? <RowsSkeleton /> : null}
      {matches.isError ? <ErrorState message="Could not load matches." /> : null}

      {matches.data && matches.data.items.length === 0 ? (
        <EmptyState
          title={dismissed ? 'Nothing dismissed yet.' : 'No matches yet.'}
          hint={
            dismissed ? undefined : 'Run an ingest from Settings, then rescore to fill this list.'
          }
        />
      ) : null}

      {matches.data && matches.data.items.length > 0 ? (
        <>
          <ul className="space-y-2">
            {matches.data.items.map((match) => (
              <MatchRow key={match.id} match={match} />
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between text-xs text-text-500">
            <span>
              {matches.data.total} match
              {matches.data.total === 1 ? '' : 'es'}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={page === 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </Button>
              <span>page {page}</span>
              <Button
                size="sm"
                variant="ghost"
                disabled={page * matches.data.pageSize >= matches.data.total}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
