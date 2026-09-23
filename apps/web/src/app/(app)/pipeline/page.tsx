'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { KanbanSquare, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { AddApplicationDialog } from '../../../components/add-application-dialog';
import { ApplicationSheet } from '../../../components/application-sheet';
import { PipelineBoard } from '../../../components/pipeline-board';
import { Button } from '../../../components/ui/button';
import { EmptyState } from '../../../components/ui/empty-state';
import { Input } from '../../../components/ui/input';
import { Kbd } from '../../../components/ui/kbd';
import { Segmented } from '../../../components/ui/segmented';
import { Skeleton } from '../../../components/ui/skeleton';
import { ErrorState, PageHeader } from '../../../components/ui/states';
import { ApiError } from '../../../lib/api';
import { useHotkeys } from '../../../lib/keyboard';
import { useApplications, useChangeStage } from '../../../lib/queries';
import { ALLOWED, STAGE_LABEL, canTransition, isClosed } from '../../../lib/stages';
import type { Stage } from '../../../lib/types';

function PipelineInner() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState('');
  const [showClosed, setShowClosed] = useState(false);

  const openId = params.get('open');
  const adding = params.get('new') === '1';

  const applications = useApplications();
  const changeStage = useChangeStage();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null) next.delete(key);
      else next.set(key, value);
      const text = next.toString();
      router.replace(text ? `${pathname}?${text}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  useHotkeys(
    useMemo(() => [{ key: 'n', handler: () => setParam('new', '1') }], [setParam]),
    !openId && !adding,
  );

  const items = useMemo(() => {
    const all = applications.data?.items ?? [];
    const needle = search.trim().toLowerCase();
    if (!needle) return all;
    return all.filter(
      (item) =>
        item.company.toLowerCase().includes(needle) ||
        item.role.toLowerCase().includes(needle) ||
        (item.via ?? '').toLowerCase().includes(needle),
    );
  }, [applications.data, search]);

  const closedCount = items.filter((item) => isClosed(item.stage)).length;

  useEffect(() => {
    const stage = params.get('stage');
    if (stage && isClosed(stage as Stage)) setShowClosed(true);
  }, [params]);

  function move(id: string, from: Stage, to: Stage) {
    if (!canTransition(from, to)) {
      const allowed = ALLOWED[from];
      toast.error(`Can't move ${STAGE_LABEL[from]} to ${STAGE_LABEL[to]}`, {
        description:
          allowed.length === 0
            ? `${STAGE_LABEL[from]} is final.`
            : `From ${STAGE_LABEL[from]} you can go to ${allowed.map((stage) => STAGE_LABEL[stage]).join(', ')}.`,
      });
      return;
    }
    const application = items.find((item) => item.id === id);
    changeStage.mutate(
      { id, to },
      {
        onSuccess: () =>
          toast.success(`${application?.company ?? 'Application'} → ${STAGE_LABEL[to]}`, {
            description:
              to === 'APPLIED' ? 'Follow-up reminder set for ten days from now.' : undefined,
            action: { label: 'Open', onClick: () => setParam('open', id) },
          }),
        onError: (error) =>
          toast.error('The server refused that move', {
            description: error instanceof ApiError ? error.message : undefined,
          }),
      },
    );
  }

  const total = applications.data?.items.length ?? 0;

  return (
    <>
      <PageHeader
        title="Pipeline"
        lede="Drag a card to move it. The server checks every move, so an illegal one snaps back."
        actions={
          <>
            <Segmented
              ariaLabel="Closed stages"
              value={showClosed ? 'all' : 'open'}
              onValueChange={(value) => setShowClosed(value === 'all')}
              options={[
                { value: 'open', label: 'Open' },
                { value: 'all', label: 'With closed', count: closedCount },
              ]}
            />
            <Button size="sm" variant="primary" onClick={() => setParam('new', '1')}>
              <Plus className="size-3.5" /> Add application{' '}
              <Kbd className="ml-1 border-accent-fg/30 bg-transparent text-accent-fg/80">N</Kbd>
            </Button>
          </>
        }
      />

      {total > 0 ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-faint" />
            <Input
              className="h-8 pl-8 text-[13px]"
              placeholder="Filter by company, role, or source"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Filter applications"
            />
            {search ? (
              <button
                type="button"
                aria-label="Clear filter"
                onClick={() => setSearch('')}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-faint hover:text-fg"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
          <span className="tabular text-xs text-faint">
            {items.length === total ? `${total} applications` : `${items.length} of ${total}`}
          </span>
        </div>
      ) : null}

      {applications.isPending ? (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-72 w-72 shrink-0" />
          ))}
        </div>
      ) : null}
      {applications.isError ? (
        <ErrorState
          message="Could not load your pipeline."
          onRetry={() => applications.refetch()}
        />
      ) : null}

      {applications.data && total === 0 ? (
        <EmptyState
          icon={KanbanSquare}
          title="Nothing in the pipeline yet"
          hint="Save a match from the inbox, or add one by hand for a job you found elsewhere. Every stage change is kept as history."
          action={
            <>
              <Button size="sm" variant="primary" onClick={() => setParam('new', '1')}>
                <Plus className="size-3.5" /> Add application
              </Button>
              <Button asChild size="sm" variant="ghost">
                <a href="/inbox">Open inbox</a>
              </Button>
            </>
          }
        />
      ) : null}

      {applications.data && total > 0 ? (
        <PipelineBoard
          items={items}
          showClosed={showClosed}
          onOpen={(id) => setParam('open', id)}
          onMove={move}
        />
      ) : null}

      <ApplicationSheet id={openId} onClose={() => setParam('open', null)} />
      <AddApplicationDialog
        open={adding}
        onOpenChange={(open) => setParam('new', open ? '1' : null)}
        onCreated={(id) => setParam('open', id)}
      />
    </>
  );
}

export default function PipelinePage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <PipelineInner />
    </Suspense>
  );
}
