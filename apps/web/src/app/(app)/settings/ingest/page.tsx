'use client';

import { useState } from 'react';
import { AlertTriangle, Play } from 'lucide-react';
import { toast } from 'sonner';
import { SourceBadge } from '../../../../components/source-badge';
import { Button } from '../../../../components/ui/button';
import { EmptyState } from '../../../../components/ui/empty-state';
import { Pagination } from '../../../../components/ui/pagination';
import { Select } from '../../../../components/ui/select';
import { RowsSkeleton } from '../../../../components/ui/skeleton';
import { ErrorState, Panel, SectionTitle } from '../../../../components/ui/states';
import { Tip } from '../../../../components/ui/tooltip';
import { cn } from '../../../../lib/cn';
import { dateTime, relativeTime } from '../../../../lib/format';
import { useIngestRuns, useRunIngest } from '../../../../lib/queries';
import { SOURCES, sourceLabel } from '../../../../lib/sources';
import type { IngestRun, Source } from '../../../../lib/types';

function StatusPill({ run }: { run: IngestRun }) {
  const cls =
    run.status === 'SUCCEEDED'
      ? 'border-success/40 bg-success-soft text-success'
      : run.status === 'FAILED'
        ? 'border-danger/40 bg-danger-soft text-danger'
        : 'border-info/40 bg-info-soft text-info';
  return (
    <span
      className={cn('stamp inline-flex h-5 items-center gap-1 rounded-[3px] border px-1.5', cls)}
    >
      {run.status === 'RUNNING' ? (
        <span className="size-1.5 animate-pulse rounded-full bg-info" />
      ) : null}
      {run.status.toLowerCase()}
    </span>
  );
}

function duration(run: IngestRun): string {
  if (!run.finishedAt) return '…';
  const seconds = Math.round(
    (new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000,
  );
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default function IngestPage() {
  const [source, setSource] = useState<Source | ''>('');
  const [page, setPage] = useState(1);
  const runs = useIngestRuns({ source, page });
  const runIngest = useRunIngest();

  const items = runs.data?.items ?? [];
  const running = items.filter((run) => run.status === 'RUNNING').length;

  return (
    <Panel padded={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <SectionTitle
          className="mb-0"
          aside={running > 0 ? `${running} running` : 'refreshes every 8s'}
        >
          Ingest runs
        </SectionTitle>
        <div className="flex items-center gap-2">
          <Select
            size="sm"
            ariaLabel="Filter by source"
            value={source}
            onValueChange={(value) => {
              setSource(value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All sources' },
              ...SOURCES.map((entry) => ({ value: entry, label: sourceLabel(entry) })),
            ]}
            className="min-w-40"
          />
          <Button
            size="sm"
            variant="primary"
            loading={runIngest.isPending}
            onClick={() =>
              runIngest.mutate(source ? { source } : {}, {
                onSuccess: () =>
                  toast.success(
                    source
                      ? `Queued ${sourceLabel(source)}`
                      : 'Ingest queued for every enabled source',
                  ),
                onError: () => toast.error('Could not queue the ingest'),
              })
            }
          >
            <Play className="size-3.5" /> Run {source ? sourceLabel(source) : 'all'}
          </Button>
        </div>
      </div>

      {runs.isPending ? (
        <div className="p-4">
          <RowsSkeleton rows={6} height="h-10" />
        </div>
      ) : null}
      {runs.isError ? (
        <div className="p-4">
          <ErrorState message="Could not load run history." onRetry={() => runs.refetch()} />
        </div>
      ) : null}

      {runs.data && items.length === 0 ? (
        <div className="p-4">
          <EmptyState
            compact
            title="No runs yet"
            hint="Queue one and the worker will report here within seconds. Every source gets its own row per cycle."
          />
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className={cn('overflow-x-auto', runs.isPlaceholderData && 'opacity-60')}>
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead className="border-b border-line text-[11px] tracking-wide text-faint uppercase">
              <tr>
                <th className="px-4 py-2 font-medium">Started</th>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium">Board</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Seen</th>
                <th className="px-3 py-2 text-right font-medium">New</th>
                <th className="px-3 py-2 text-right font-medium">Updated</th>
                <th className="px-4 py-2 text-right font-medium">Took</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((run) => (
                <tr key={run.id} className="hover:bg-surface-2/60">
                  <td className="px-4 py-2 whitespace-nowrap text-muted">
                    <Tip content={dateTime(run.startedAt)}>
                      <span>{relativeTime(run.startedAt)}</span>
                    </Tip>
                  </td>
                  <td className="px-3 py-2">
                    <SourceBadge source={run.source} />
                  </td>
                  <td className="max-w-40 truncate px-3 py-2 font-mono text-[11px] text-faint">
                    {run.boardId}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <StatusPill run={run} />
                      {run.error ? (
                        <Tip content={run.error}>
                          <AlertTriangle className="size-3.5 text-danger" />
                        </Tip>
                      ) : null}
                    </div>
                  </td>
                  <td className="tabular px-3 py-2 text-right font-mono text-xs text-muted">
                    {run.itemsSeen}
                  </td>
                  <td className="tabular px-3 py-2 text-right font-mono text-xs text-fg">
                    {run.postingsCreated}
                  </td>
                  <td className="tabular px-3 py-2 text-right font-mono text-xs text-muted">
                    {run.postingsUpdated}
                  </td>
                  <td className="tabular px-4 py-2 text-right font-mono text-xs text-faint">
                    {duration(run)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {runs.data && runs.data.total > runs.data.pageSize ? (
        <div className="px-4 pb-3">
          <Pagination
            page={page}
            pageSize={runs.data.pageSize}
            total={runs.data.total}
            onPageChange={setPage}
            noun="runs"
          />
        </div>
      ) : null}
    </Panel>
  );
}
