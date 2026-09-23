'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Inbox as InboxIcon, Plus, RefreshCw, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { PostingSheet } from '../../../components/posting-sheet';
import { ReasonChips } from '../../../components/reasons';
import { SourceBadge } from '../../../components/source-badge';
import { Badge, ScoreBadge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { EmptyState } from '../../../components/ui/empty-state';
import { Kbd } from '../../../components/ui/kbd';
import { Pagination } from '../../../components/ui/pagination';
import { Segmented } from '../../../components/ui/segmented';
import { Select } from '../../../components/ui/select';
import { RowsSkeleton } from '../../../components/ui/skeleton';
import { ErrorState, PageHeader } from '../../../components/ui/states';
import { useSavePosting } from '../../../components/use-save-posting';
import { cn } from '../../../lib/cn';
import { hostOf, relativeDays } from '../../../lib/format';
import { useHotkeys } from '../../../lib/keyboard';
import { listItem, listStagger } from '../../../lib/motion';
import {
  useDismissMatch,
  useMatches,
  usePosting,
  usePrefetchMatches,
  useRescore,
  useSources,
} from '../../../lib/queries';
import { SOURCES, sourceLabel } from '../../../lib/sources';
import type { Match, PostingSummary, Source } from '../../../lib/types';

const MIN_SCORE_OPTIONS = [
  { value: '0', label: 'Any score' },
  { value: '50', label: '50 and up' },
  { value: '70', label: '70 and up' },
  { value: '90', label: '90 and up' },
];

function MatchRow({
  match,
  focused,
  onFocus,
  onOpen,
  onDismiss,
  onSave,
  saving,
}: {
  match: Match;
  focused: boolean;
  onFocus: () => void;
  onOpen: () => void;
  onDismiss: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const posting = match.posting;
  const ref = useRef<HTMLLIElement>(null);
  const detail = usePosting(focused ? posting.id : null);

  useEffect(() => {
    if (focused) ref.current?.scrollIntoView({ block: 'nearest' });
  }, [focused]);

  const applyHref = posting.applyUrl ?? posting.url;
  const applyHost = applyHref ? hostOf(applyHref) : null;
  const excerpt = detail.data?.rawText
    ?.split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(1, 5)
    .join(' ');

  return (
    <motion.li
      ref={ref}
      layout
      variants={listItem}
      exit="exit"
      data-focused={focused || undefined}
      onMouseEnter={onFocus}
      className={cn(
        'group border-b border-line transition-colors duration-150',
        focused ? 'bg-surface-2' : 'hover:bg-surface-2/50',
      )}
    >
      <div className="grid grid-cols-[auto_1fr] gap-x-3 px-3 py-3 sm:grid-cols-[auto_1fr_auto]">
        <ScoreBadge score={match.score} className="mt-0.5" />

        <button type="button" onClick={onOpen} className="min-w-0 text-left" onFocus={onFocus}>
          <p className="truncate text-[14px] font-medium text-fg">
            {posting.company ?? 'Unknown company'}
            {posting.role ? (
              <span className="font-normal text-muted"> · {posting.role}</span>
            ) : null}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted">{posting.headline}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <SourceBadge source={posting.source} />
            {posting.salaryText ? <Badge tone="success">{posting.salaryText}</Badge> : null}
            <ReasonChips reasons={match.reasons} limit={focused ? 8 : 3} />
            <span className="ml-auto text-[11px] text-faint">{relativeDays(posting.postedAt)}</span>
          </div>
        </button>

        <div
          className={cn(
            'col-span-2 flex items-center gap-1 sm:col-span-1 sm:self-start',
            focused
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100',
          )}
        >
          <Button size="sm" variant="ghost" onClick={onDismiss} aria-label="Dismiss">
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {focused ? (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-3 border-t border-line/70 px-3 py-3 sm:pl-[3.75rem]">
              <p className="max-w-[80ch] text-[13px] leading-relaxed text-muted">
                {detail.isPending ? (
                  <span className="skeleton inline-block h-3 w-3/4 rounded-sm align-middle" />
                ) : excerpt && excerpt.length > 0 ? (
                  <>
                    {excerpt.slice(0, 420)}
                    {excerpt.length > 420 ? '…' : ''}
                  </>
                ) : (
                  posting.headline
                )}
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button size="sm" variant="primary" loading={saving} onClick={onSave}>
                  <Plus className="size-3.5" /> Save to pipeline
                </Button>
                {applyHref ? (
                  <Button asChild size="sm" variant="outline">
                    <a href={applyHref} target="_blank" rel="noreferrer noopener">
                      {applyHost ? `Apply on ${applyHost}` : 'Open apply link'}{' '}
                      <ExternalLink className="size-3" />
                    </a>
                  </Button>
                ) : null}
                <Button size="sm" variant="ghost" onClick={onOpen}>
                  Full posting
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  );
}

export default function InboxPage() {
  const [dismissed, setDismissed] = useState(false);
  const [page, setPage] = useState(1);
  const [source, setSource] = useState<Source | ''>('');
  const [minScore, setMinScore] = useState('0');
  const [focusIndex, setFocusIndex] = useState(0);
  const [selected, setSelected] = useState<PostingSummary | null>(null);

  const matches = useMatches({
    dismissed,
    page,
    source,
    minScore: minScore === '0' ? undefined : Number(minScore),
  });
  const sources = useSources();
  const dismiss = useDismissMatch();
  const rescore = useRescore();
  const saver = useSavePosting();

  const items = matches.data?.items ?? [];
  const focused = items[focusIndex];

  usePrefetchMatches(
    {
      dismissed,
      page: page + 1,
      source,
      minScore: minScore === '0' ? undefined : Number(minScore),
    },
    matches.data !== undefined && page * matches.data.pageSize < matches.data.total,
  );

  useEffect(() => {
    setFocusIndex((index) => Math.min(index, Math.max(0, items.length - 1)));
  }, [items.length]);

  function dismissMatch(match: Match) {
    dismiss.mutate(match.id, {
      onSuccess: () =>
        toast(`Dismissed ${match.posting.company ?? 'posting'}`, {
          description: 'Find it again under Dismissed.',
        }),
      onError: () => toast.error('Could not dismiss that match'),
    });
  }

  function saveMatch(match: Match) {
    saver.save({
      postingId: match.posting.id,
      company: match.posting.company,
      role: match.posting.role,
    });
  }

  useHotkeys(
    useMemo(
      () => [
        {
          key: 'j',
          handler: () => setFocusIndex((index) => Math.min(items.length - 1, index + 1)),
        },
        { key: 'k', handler: () => setFocusIndex((index) => Math.max(0, index - 1)) },
        {
          key: 'ArrowDown',
          handler: () => setFocusIndex((index) => Math.min(items.length - 1, index + 1)),
        },
        { key: 'ArrowUp', handler: () => setFocusIndex((index) => Math.max(0, index - 1)) },
        { key: 'Enter', handler: () => focused && setSelected(focused.posting) },
        { key: 'o', handler: () => focused && setSelected(focused.posting) },
        { key: 's', handler: () => focused && saveMatch(focused) },
        { key: 'd', handler: () => focused && !dismissed && dismissMatch(focused) },
        {
          key: 'a',
          handler: () =>
            focused?.posting.applyUrl &&
            window.open(focused.posting.applyUrl, '_blank', 'noopener'),
        },
      ],
      [items.length, focused, dismissed, saveMatch, dismissMatch],
    ),
    selected === null,
  );

  const sourceOptions = [
    { value: '', label: 'All sources' },
    ...SOURCES.filter(
      (entry) =>
        (sources.data?.items.find((item) => item.source === entry)?.postings ?? 0) > 0 ||
        entry === 'HN',
    ).map((entry) => ({ value: entry, label: sourceLabel(entry) })),
  ];

  return (
    <>
      <PageHeader
        title="Inbox"
        lede="Every posting scored against your criteria. The number is the sum of the chips beside it."
        actions={
          <>
            <Segmented
              ariaLabel="Show"
              value={dismissed ? 'dismissed' : 'new'}
              onValueChange={(value) => {
                setDismissed(value === 'dismissed');
                setPage(1);
              }}
              options={[
                { value: 'new', label: 'New' },
                { value: 'dismissed', label: 'Dismissed' },
              ]}
            />
            <Button
              size="sm"
              variant="outline"
              loading={rescore.isPending}
              onClick={() =>
                rescore.mutate(undefined, {
                  onSuccess: (data) => toast.success(`Rescored — ${data.rescored} matches`),
                  onError: () => toast.error('Could not rescore'),
                })
              }
            >
              <RefreshCw className="size-3.5" /> Rescore
            </Button>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Select
          size="sm"
          ariaLabel="Filter by source"
          value={source}
          onValueChange={(value) => {
            setSource(value as Source | '');
            setPage(1);
          }}
          options={sourceOptions}
          className="min-w-40"
        />
        <Select
          size="sm"
          ariaLabel="Minimum score"
          value={minScore}
          onValueChange={(value) => {
            setMinScore(value);
            setPage(1);
          }}
          options={MIN_SCORE_OPTIONS}
          className="min-w-32"
        />
        <div className="ml-auto hidden items-center gap-1 text-[11px] text-faint lg:flex">
          <Kbd>j</Kbd>
          <Kbd>k</Kbd> move · <Kbd>s</Kbd> save · <Kbd>d</Kbd> dismiss · <Kbd>a</Kbd> apply ·{' '}
          <Kbd>↵</Kbd> open
        </div>
      </div>

      {matches.isPending ? <RowsSkeleton rows={6} height="h-24" /> : null}
      {matches.isError ? (
        <ErrorState message="Could not load matches." onRetry={() => matches.refetch()} />
      ) : null}

      {matches.data && items.length === 0 ? (
        <EmptyState
          icon={InboxIcon}
          title={
            dismissed
              ? 'Nothing dismissed'
              : source || minScore !== '0'
                ? 'No matches with these filters'
                : 'No matches yet'
          }
          hint={
            dismissed
              ? 'Matches you dismiss land here, in case you change your mind.'
              : source || minScore !== '0'
                ? 'Loosen the source or score filter to see more.'
                : 'Run an ingest from Settings, then rescore. Matches need a score of 40 or more against your criteria.'
          }
          action={
            dismissed ? undefined : (
              <>
                <Button asChild size="sm" variant="primary">
                  <a href="/settings/ingest">Run an ingest</a>
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <a href="/settings/criteria">Edit criteria</a>
                </Button>
              </>
            )
          }
        />
      ) : null}

      {items.length > 0 ? (
        <div
          className={cn(
            'rounded-lg border border-line bg-surface',
            matches.isPlaceholderData && 'opacity-60',
          )}
        >
          <motion.ul
            variants={listStagger}
            initial="hidden"
            animate="visible"
            className="[&>li:last-child]:border-b-0"
          >
            <AnimatePresence initial={false}>
              {items.map((match, index) => (
                <MatchRow
                  key={match.id}
                  match={match}
                  focused={index === focusIndex}
                  onFocus={() => setFocusIndex(index)}
                  onOpen={() => setSelected(match.posting)}
                  onDismiss={() => dismissMatch(match)}
                  onSave={() => saveMatch(match)}
                  saving={saver.isPending && saver.variables?.postingId === match.posting.id}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        </div>
      ) : null}

      {matches.data ? (
        <Pagination
          page={page}
          pageSize={matches.data.pageSize}
          total={matches.data.total}
          onPageChange={(next) => {
            setPage(next);
            setFocusIndex(0);
          }}
          noun="matches"
        />
      ) : null}

      <PostingSheet posting={selected} onClose={() => setSelected(null)} />
    </>
  );
}
