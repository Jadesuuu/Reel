'use client';

import { useState } from 'react';
import { ExternalLink, Play, Plus, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { SourceBadge } from '../../../../components/source-badge';
import { Button } from '../../../../components/ui/button';
import { Field, Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import { RowsSkeleton } from '../../../../components/ui/skeleton';
import { ErrorState, Panel, SectionTitle } from '../../../../components/ui/states';
import { Switch } from '../../../../components/ui/switch';
import { Tip } from '../../../../components/ui/tooltip';
import { ApiError } from '../../../../lib/api';
import { relativeTime } from '../../../../lib/format';
import {
  useAddBoard,
  useBoards,
  useRemoveBoard,
  useRunIngest,
  useSources,
  useToggleSource,
} from '../../../../lib/queries';
import {
  BOARD_HINT,
  BOARD_PROVIDERS,
  slugFromBoardInput,
  sourceLabel,
} from '../../../../lib/sources';
import type { BoardProvider, SourceInfo } from '../../../../lib/types';

function RunDot({ info }: { info: SourceInfo }) {
  const run = info.lastRun;
  const tone =
    run === null
      ? 'bg-line-strong'
      : run.status === 'FAILED'
        ? 'bg-danger'
        : run.status === 'RUNNING'
          ? 'bg-info animate-pulse'
          : 'bg-success';
  const label = run
    ? `${run.status.toLowerCase()} ${relativeTime(run.startedAt)} · ${run.itemsSeen} seen, ${run.postingsCreated} new`
    : 'never run';
  return (
    <Tip content={label}>
      <span className="inline-flex items-center gap-2 text-fine text-faint">
        <span className={`size-2 rounded-full ${tone}`} aria-hidden />
        {run ? relativeTime(run.startedAt) : 'never run'}
      </span>
    </Tip>
  );
}

function SourceRow({
  info,
  onRun,
  running,
}: {
  info: SourceInfo;
  onRun: () => void;
  running: boolean;
}) {
  const toggle = useToggleSource();
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap">
      <Switch
        checked={info.enabled}
        ariaLabel={`${info.enabled ? 'Disable' : 'Enable'} ${info.label}`}
        onCheckedChange={(enabled) =>
          toggle.mutate(
            { source: info.source, enabled },
            { onError: () => toast.error(`Could not update ${info.label}`) },
          )
        }
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-body text-fg">{info.label}</span>
          <a
            href={info.homepage}
            target="_blank"
            rel="noreferrer noopener"
            className="text-faint hover:text-fg"
            aria-label={`Open ${info.label}`}
          >
            <ExternalLink className="size-4" />
          </a>
        </div>
        <p className="truncate text-fine text-faint">
          {info.attribution ??
            (info.kind === 'board' ? 'Company boards you watch' : 'Monthly hiring thread')}
        </p>
      </div>
      <span className="tabular w-16 text-right font-mono text-caption text-muted">
        {info.postings.toLocaleString()}
      </span>
      <RunDot info={info} />
      {info.kind === 'feed' ? (
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Run ${info.label} now`}
          onClick={onRun}
          loading={running}
          disabled={!info.enabled}
        >
          <Play className="size-4" />
        </Button>
      ) : (
        <span className="size-8" />
      )}
    </li>
  );
}

function Boards() {
  const boards = useBoards();
  const add = useAddBoard();
  const remove = useRemoveBoard();
  const runIngest = useRunIngest();
  const [provider, setProvider] = useState<BoardProvider>('GREENHOUSE');
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const slug = slugFromBoardInput(provider, input);

  return (
    <Panel>
      <SectionTitle aside="Greenhouse · Lever · Ashby">Company boards</SectionTitle>
      <p className="mb-4 max-w-[60ch] text-caption text-muted">
        Paste a careers-page link or the board slug. Reel checks the board exists, then pulls every
        job on it each cycle. Boards are shared by every account on this install.
      </p>

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          if (!slug) return;
          add.mutate(
            { provider, slug },
            {
              onSuccess: (board) => {
                setInput('');
                toast.success(`Watching ${board.company}`, {
                  description: 'The next ingest cycle picks it up, or run it now.',
                  action: {
                    label: 'Run now',
                    onClick: () =>
                      runIngest.mutate({ source: board.provider, boardId: board.slug }),
                  },
                });
              },
              onError: (err) =>
                setError(err instanceof ApiError ? err.message : 'Could not add the board'),
            },
          );
        }}
      >
        <Field label="Provider" className="w-36">
          <Select
            value={provider}
            onValueChange={setProvider}
            options={BOARD_PROVIDERS.map((value) => ({ value, label: sourceLabel(value) }))}
            ariaLabel="Board provider"
          />
        </Field>
        <Field
          label="Board"
          htmlFor="board-slug"
          hint={BOARD_HINT[provider].urlPattern}
          className="min-w-56 flex-1"
          error={error}
        >
          <Input
            id="board-slug"
            placeholder={`e.g. ${BOARD_HINT[provider].example}`}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            aria-invalid={error ? true : undefined}
          />
        </Field>
        <Button
          type="submit"
          variant="primary"
          disabled={!slug}
          loading={add.isPending}
          className="mb-[1px]"
        >
          <Plus className="size-5" /> Watch
        </Button>
      </form>

      <div className="mt-5">
        {boards.isPending ? <RowsSkeleton rows={2} height="h-11" /> : null}
        {boards.isError ? (
          <ErrorState message="Could not load boards." onRetry={() => boards.refetch()} />
        ) : null}
        {boards.data && boards.data.items.length === 0 ? (
          <p className="rounded-md border border-dashed border-line px-4 py-6 text-center text-caption text-faint">
            No boards yet. Try <span className="font-mono text-muted">stripe</span> on Greenhouse.
          </p>
        ) : null}
        {boards.data && boards.data.items.length > 0 ? (
          <ul className="divide-y divide-line rounded-md border border-line">
            <AnimatePresence initial={false}>
              {boards.data.items.map((board) => (
                <motion.li
                  key={board.id}
                  layout
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.18 }}
                  className="flex items-center gap-3 px-4 py-2"
                >
                  <SourceBadge source={board.provider} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body text-fg">{board.company}</p>
                    <p className="truncate font-mono text-fine text-faint">{board.slug}</p>
                  </div>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Run ${board.company} now`}
                    onClick={() =>
                      runIngest.mutate(
                        { source: board.provider, boardId: board.slug },
                        { onSuccess: () => toast.success(`Queued ${board.company}`) },
                      )
                    }
                  >
                    <Play className="size-4" />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Stop watching ${board.company}`}
                    className="text-faint hover:text-danger"
                    loading={remove.isPending && remove.variables === board.id}
                    onClick={() =>
                      remove.mutate(board.id, {
                        onSuccess: () => toast(`Stopped watching ${board.company}`),
                        onError: () => toast.error('Could not remove the board'),
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        ) : null}
      </div>
    </Panel>
  );
}

export default function SourcesPage() {
  const sources = useSources();
  const runIngest = useRunIngest();

  const feeds = sources.data?.items.filter((item) => item.kind === 'feed') ?? [];
  const boards = sources.data?.items.filter((item) => item.kind === 'board') ?? [];

  return (
    <div className="space-y-4">
      <Panel padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <SectionTitle className="mb-0">Job feeds</SectionTitle>
          <Button
            size="sm"
            variant="primary"
            loading={runIngest.isPending && !runIngest.variables?.source}
            onClick={() =>
              runIngest.mutate(
                {},
                {
                  onSuccess: () =>
                    toast.success('Ingest queued for every enabled source', {
                      description: 'Each source runs as its own job. Watch them under Ingest runs.',
                    }),
                  onError: () => toast.error('Could not queue the ingest'),
                },
              )
            }
          >
            <Play className="size-4" /> Run all now
          </Button>
        </div>
        {sources.isPending ? (
          <div className="p-4">
            <RowsSkeleton rows={6} height="h-11" />
          </div>
        ) : null}
        {sources.isError ? (
          <div className="p-4">
            <ErrorState message="Could not load sources." onRetry={() => sources.refetch()} />
          </div>
        ) : null}
        {sources.data ? (
          <>
            <ul className="divide-y divide-line">
              {feeds.map((info) => (
                <SourceRow
                  key={info.source}
                  info={info}
                  running={runIngest.isPending && runIngest.variables?.source === info.source}
                  onRun={() =>
                    runIngest.mutate(
                      { source: info.source },
                      {
                        onSuccess: () => toast.success(`Queued ${info.label}`),
                        onError: () => toast.error(`Could not queue ${info.label}`),
                      },
                    )
                  }
                />
              ))}
            </ul>
            <div className="border-t border-line bg-surface-2/50 px-4 py-2">
              <span className="stamp text-faint">Board providers</span>
            </div>
            <ul className="divide-y divide-line">
              {boards.map((info) => (
                <SourceRow key={info.source} info={info} running={false} onRun={() => undefined} />
              ))}
            </ul>
          </>
        ) : null}
      </Panel>

      <Boards />
    </div>
  );
}
