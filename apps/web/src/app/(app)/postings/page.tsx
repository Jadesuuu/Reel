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
  const [open, setOpen] = useState(true);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PostingSummary | null>(null);

  const q = useDebounced(search.trim());
  const postings = usePostings({ q, remote, source, stack, open, page });
  const stats = usePostingStats();
  const saver = useSavePosting();

  useEffect(() => {
    setPage(1);
  }, [q, remote, source, stack, open]);

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

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-faint" />
          <Input
            className="h-10 pl-9 text-body-sm"
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
              <X className="size-4" />
            </button>
          ) : null}
        </div>
        <Select
          size="sm"
          ariaLabel="Source"
          value={source}
          onValueChange={(value) => setSource(value as Source | '')}
          options={sourceOptions}
          className="min-w-44"
        />
        <Segmented
          ariaLabel="Remote"
          value={remote}
          onValueChange={setRemote}
          options={REMOTE_OPTIONS}
        />
        <Segmented
          ariaLabel="Regions"
          value={open ? 'open' : 'all'}
          onValueChange={(value) => setOpen(value === 'open')}
          options={[
            { value: 'open', label: 'Open to me' },
            { value: 'all', label: 'Everywhere' },
          ]}
        />
        {stack ? (
          <Badge tone="accent" className="h-8 gap-2 px-2 text-caption">
            stack: {stack}
            <button type="button" aria-label="Clear stack filter" onClick={() => setStack('')}>
              <X className="size-4" />
            </button>
          </Badge>
        ) : null}
      </div>

      {postings.isPending ? <RowsSkeleton rows={8} height="h-16" /> : null}
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
          <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_11rem_7.5rem_8rem] gap-4 border-b border-line bg-surface-2 px-4 py-2.5 text-stamp font-mono text-muted uppercase md:grid">
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
                  className="group grid cursor-pointer grid-cols-1 gap-1.5 px-4 py-3.5 transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none md:grid-cols-[minmax(14rem,1.2fr)_minmax(0,1.5fr)_11rem_7.5rem_8rem] md:items-center md:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <SourceBadge source={posting.source} href={posting.url} />
                    <span className="truncate text-body font-medium text-fg">
                      {posting.company ?? '—'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-body text-fg">{posting.role ?? posting.headline}</p>
                    {posting.stackKeywords.length > 0 ? (
                      <div className="mt-1 hidden flex-wrap gap-1.5 lg:flex">
                        {posting.stackKeywords.slice(0, 3).map((keyword) => (
                          <button
                            key={keyword}
                            type="button"
                            className="rounded-sm border border-line px-1.5 py-px font-mono text-measure-sm text-muted hover:border-line-strong hover:text-fg"
                            onClick={(event) => {
                              event.stopPropagation();
                              setStack(keyword);
                            }}
                          >
                            {keyword}
                          </button>
                        ))}
                        {posting.stackKeywords.length > 3 ? (
                          <Badge tone="outline">+{posting.stackKeywords.length - 3}</Badge>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex min-w-0 items-center gap-2 text-body-sm text-muted">
                    {posting.remote !== 'UNKNOWN' ? (
                      <Badge tone={posting.remote === 'REMOTE' ? 'accent' : 'outline'}>
                        {remoteLabel(posting.remote)}
                      </Badge>
                    ) : null}
                    {posting.location ? (
                      <span className="hidden max-w-40 truncate xl:inline">{posting.location}</span>
                    ) : null}
                  </div>
                  <div className="tabular truncate font-mono text-measure-sm text-muted">
                    {posting.salaryText ?? <span className="text-faint">—</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2 md:justify-end">
                    <span className="text-caption whitespace-nowrap text-muted">
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
                      <Plus className="size-4" /> Save
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
