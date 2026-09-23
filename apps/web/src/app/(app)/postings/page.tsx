'use client';

import { useEffect, useState } from 'react';
import { Newspaper, Plus, Search, X } from 'lucide-react';
import { motion } from 'motion/react';
import { PostingSheet } from '../../../components/posting-sheet';
import { SourceBadge } from '../../../components/source-badge';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { EmptyState } from '../../../components/ui/empty-state';
import { Input } from '../../../components/ui/input';
import { Pagination } from '../../../components/ui/pagination';
import { Segmented } from '../../../components/ui/segmented';
import { Select } from '../../../components/ui/select';
import { RowsSkeleton } from '../../../components/ui/skeleton';
import { ErrorState, PageHeader } from '../../../components/ui/states';
import { useSavePosting } from '../../../components/use-save-posting';
import { cn } from '../../../lib/cn';
import { relativeDays, remoteLabel } from '../../../lib/format';
import { listItem, listStagger } from '../../../lib/motion';
import { usePostingStats, usePostings } from '../../../lib/queries';
import { sourceLabel } from '../../../lib/sources';
import type { PostingSummary, Source } from '../../../lib/types';

const REMOTE_OPTIONS = [
  { value: '', label: 'Anywhere' },
  { value: 'REMOTE', label: 'Remote' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'ONSITE', label: 'On-site' },
];

function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}

export default function PostingsPage() {
  const [search, setSearch] = useState('');
  const [remote, setRemote] = useState('');
  const [source, setSource] = useState<Source | ''>('');
  const [stack, setStack] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PostingSummary | null>(null);

  const q = useDebounced(search.trim());
  const postings = usePostings({ q, remote, source, stack, page });
  const stats = usePostingStats();
  const saver = useSavePosting();

  useEffect(() => {
    setPage(1);
  }, [q, remote, source, stack]);

  const sourceOptions = [
    {
      value: '',
      label: 'All sources',
      hint: stats.data ? stats.data.total.toLocaleString() : undefined,
    },
    ...(stats.data?.bySource ?? []).map((row) => ({
      value: row.source,
      label: sourceLabel(row.source),
      hint: row.count.toLocaleString(),
    })),
  ];

  const hasFilters = q !== '' || remote !== '' || source !== '' || stack !== '';
  const items = postings.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Postings"
        lede="Everything ingested from every enabled source, newest first. Click a row for the full text."
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-faint" />
          <Input
            className="h-8 pl-8 text-[13px]"
            placeholder="Company, role, or headline"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search postings"
          />
          {search ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-2 -translate-y-1/2 text-faint hover:text-fg"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
        <Select
          size="sm"
          ariaLabel="Source"
          value={source}
          onValueChange={(value) => setSource(value as Source | '')}
          options={sourceOptions}
          className="min-w-40"
        />
        <Segmented
          ariaLabel="Remote"
          value={remote}
          onValueChange={setRemote}
          options={REMOTE_OPTIONS}
        />
        {stack ? (
          <Badge tone="accent" className="h-7 gap-1.5 px-2 text-xs">
            stack: {stack}
            <button type="button" aria-label="Clear stack filter" onClick={() => setStack('')}>
              <X className="size-3" />
            </button>
          </Badge>
        ) : null}
      </div>

      {postings.isPending ? <RowsSkeleton rows={8} height="h-14" /> : null}
      {postings.isError ? (
        <ErrorState message="Could not load postings." onRetry={() => postings.refetch()} />
      ) : null}

      {postings.data && items.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title={hasFilters ? 'No postings match' : 'No postings yet'}
          hint={
            hasFilters
              ? 'Try fewer filters. Stack filters match the parsed keyword exactly.'
              : 'Run an ingest from Settings and the worker will fill this in within a minute.'
          }
          action={
            hasFilters ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setRemote('');
                  setSource('');
                  setStack('');
                }}
              >
                Clear filters
              </Button>
            ) : (
              <Button asChild size="sm" variant="primary">
                <a href="/settings/ingest">Run an ingest</a>
              </Button>
            )
          }
        />
      ) : null}

      {items.length > 0 ? (
        <div
          className={cn(
            'overflow-hidden rounded-lg border border-line bg-surface',
            postings.isPlaceholderData && 'opacity-60',
          )}
        >
          <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.6fr)_9rem_7rem_8rem] gap-3 border-b border-line bg-surface-2 px-3 py-2 text-[11px] tracking-wide text-faint uppercase md:grid">
            <span>Company</span>
            <span>Role</span>
            <span>Where</span>
            <span>Salary</span>
            <span className="text-right">Posted</span>
          </div>
          <motion.ul
            variants={listStagger}
            initial="hidden"
            animate="visible"
            className="divide-y divide-line"
          >
            {items.map((posting) => (
              <motion.li key={posting.id} variants={listItem}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(posting)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelected(posting);
                    }
                  }}
                  className="group grid cursor-pointer grid-cols-1 gap-1 px-3 py-2.5 transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none md:grid-cols-[minmax(12rem,1.1fr)_minmax(0,1.6fr)_9rem_7rem_8rem] md:items-center md:gap-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <SourceBadge source={posting.source} href={posting.url} />
                    <span className="truncate text-[14px] font-medium text-fg">
                      {posting.company ?? '—'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] text-fg">
                      {posting.role ?? posting.headline}
                    </p>
                    {posting.stackKeywords.length > 0 ? (
                      <div className="mt-1 hidden flex-wrap gap-1 lg:flex">
                        {posting.stackKeywords.slice(0, 5).map((keyword) => (
                          <button
                            key={keyword}
                            type="button"
                            className="rounded-sm border border-line px-1 font-mono text-[10.5px] text-faint hover:border-line-strong hover:text-fg"
                            onClick={(event) => {
                              event.stopPropagation();
                              setStack(keyword);
                            }}
                          >
                            {keyword}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
                    {posting.remote !== 'UNKNOWN' ? (
                      <Badge tone={posting.remote === 'REMOTE' ? 'accent' : 'outline'}>
                        {remoteLabel(posting.remote)}
                      </Badge>
                    ) : null}
                    {posting.location ? (
                      <span className="hidden max-w-32 truncate xl:inline">{posting.location}</span>
                    ) : null}
                  </div>
                  <div className="tabular truncate font-mono text-[11px] text-muted">
                    {posting.salaryText ?? <span className="text-faint">—</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2 md:justify-end">
                    <span className="text-[11px] whitespace-nowrap text-faint">
                      {relativeDays(posting.postedAt)}
                    </span>
                    <Button
                      size="xs"
                      variant="ghost"
                      className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                      loading={saver.isPending && saver.variables?.postingId === posting.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        saver.save({
                          postingId: posting.id,
                          company: posting.company,
                          role: posting.role,
                        });
                      }}
                    >
                      <Plus className="size-3" /> Save
                    </Button>
                  </div>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      ) : null}

      {postings.data ? (
        <Pagination
          page={page}
          pageSize={postings.data.pageSize}
          total={postings.data.total}
          onPageChange={setPage}
          noun="postings"
        />
      ) : null}

      <PostingSheet posting={selected} onClose={() => setSelected(null)} />
    </>
  );
}
