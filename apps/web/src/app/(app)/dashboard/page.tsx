'use client';

import Link from 'next/link';
import { ArrowRight, CalendarClock, Inbox, Plus, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { Bar, BarChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis } from 'recharts';
import { SourceBadge } from '../../../components/source-badge';
import { StageDot, StageStamp } from '../../../components/stage-stamp';
import { Button } from '../../../components/ui/button';
import { EmptyState } from '../../../components/ui/empty-state';
import { RowsSkeleton, Skeleton } from '../../../components/ui/skeleton';
import { ErrorState, Panel, SectionTitle } from '../../../components/ui/states';
import { Tip } from '../../../components/ui/tooltip';
import { cn } from '../../../lib/cn';
import { dueLabel, longDate, percent, plural, relativeTime, shortDate } from '../../../lib/format';
import { listItem, listStagger } from '../../../lib/motion';
import { useApplicationStats, useMatches, usePostingStats, useSources } from '../../../lib/queries';
import { useSession } from '../../../lib/session';
import { ACTIVE_STAGES, STAGE_LABEL } from '../../../lib/stages';
import type { ApplicationStats, UpcomingItem, WeeklyBucket } from '../../../lib/types';

function Today({
  stats,
  newMatches,
}: {
  stats: ApplicationStats | undefined;
  newMatches: number | undefined;
}) {
  const dueSoon =
    stats?.upcoming.filter((item) => new Date(item.at).getTime() - Date.now() < 3 * 86_400_000) ??
    [];
  return (
    <div className="mb-10">
      <h1 className="max-w-[36ch] text-headline font-semibold tracking-tight text-fg lg:text-headline-lg">
        {newMatches === undefined || stats === undefined ? (
          <span className="inline-block h-9 w-96 align-middle">
            <Skeleton className="h-8 w-full" />
          </span>
        ) : (
          <>
            {newMatches > 0 ? (
              <>
                <Link href="/inbox" className="text-accent underline-offset-4 hover:underline">
                  {plural(newMatches, 'new match', 'new matches')}
                </Link>{' '}
                waiting in your inbox
              </>
            ) : (
              'Your inbox is clear'
            )}
            {stats.active > 0 ? (
              <>
                , {plural(stats.active, 'application')} in motion
                {dueSoon.length > 0 ? (
                  <>
                    , and{' '}
                    <Link
                      href="#coming-up"
                      className="text-accent underline-offset-4 hover:underline"
                    >
                      {plural(dueSoon.length, 'thing', 'things')} due
                    </Link>{' '}
                    in the next three days.
                  </>
                ) : (
                  '.'
                )}
              </>
            ) : (
              '. Save a match or add an application to start the pipeline.'
            )}
          </>
        )}
      </h1>
      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <Button asChild variant="primary" size="md">
          <Link href="/inbox">
            <Inbox className="size-4" /> Open inbox
          </Link>
        </Button>
        <Button asChild variant="outline" size="md">
          <Link href="/pipeline?new=1">
            <Plus className="size-4" /> Add application
          </Link>
        </Button>
        <Button asChild variant="ghost" size="md">
          <Link href="/settings/ingest">
            <RefreshCw className="size-4" /> Ingest runs
          </Link>
        </Button>
      </div>
    </div>
  );
}

function Funnel({ stats, upcoming }: { stats: ApplicationStats; upcoming: UpcomingItem[] }) {
  const max = Math.max(1, ...ACTIVE_STAGES.map((stage) => stats.byStage[stage]));
  const dueStages = new Set(upcoming.map((item) => item.stage));
  const median =
    stats.medianDaysToResponse === null
      ? null
      : stats.medianDaysToResponse < 1
        ? '<1'
        : String(Math.round(stats.medianDaysToResponse));

  return (
    <Panel>
      <SectionTitle
        aside={
          <Link href="/pipeline" className="inline-flex items-center gap-1.5 hover:text-fg">
            Pipeline <ArrowRight className="size-4" />
          </Link>
        }
      >
        Where things stand
      </SectionTitle>
      <ol className="divide-y divide-line">
        {ACTIVE_STAGES.map((stage, index) => {
          const count = stats.byStage[stage];
          const width = count === 0 ? 0 : Math.max(6, Math.round((count / max) * 100));
          const due = dueStages.has(stage);
          return (
            <li key={stage}>
              <Link
                href={`/pipeline?stage=${stage}`}
                className="group -mx-2 grid grid-cols-[9.5rem_1fr_3rem] items-center gap-4 rounded-md px-2 py-3 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
              >
                <StageStamp stage={stage} />
                <span className="relative block h-px w-full bg-line">
                  <motion.span
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: index * 0.05 }}
                    className={cn(
                      'absolute top-1/2 left-0 h-[3px] -translate-y-1/2 rounded-full',
                      due ? 'bg-accent' : 'bg-fg/70',
                    )}
                  />
                </span>
                <span className="tabular text-right font-mono text-measure text-fg">{count}</span>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 border-t border-line pt-4 text-caption text-muted">
        <span className="tabular font-mono text-fg">{stats.appliedThisWeek}</span> applied this week
        · <span className="tabular font-mono text-fg">{percent(stats.responseRate)}</span> reply
        rate ·{' '}
        {median === null ? (
          'no replies yet'
        ) : (
          <>
            median <span className="tabular font-mono text-fg">{median}d</span> to first reply
          </>
        )}
      </p>
    </Panel>
  );
}

const WEEKLY_SERIES: Array<{ key: keyof Omit<WeeklyBucket, 'weekStart'>; label: string }> = [
  { key: 'applied', label: 'Applied' },
  { key: 'interviewing', label: 'Interviews' },
  { key: 'offer', label: 'Offers' },
  { key: 'rejected', label: 'Rejections' },
];

function Weekly({ weekly }: { weekly: WeeklyBucket[] }) {
  const total = weekly.reduce(
    (sum, week) => sum + week.applied + week.interviewing + week.offer + week.rejected,
    0,
  );
  return (
    <Panel>
      <SectionTitle aside="last 8 weeks">Activity</SectionTitle>
      {total === 0 ? (
        <p className="py-8 text-center text-body-sm text-muted">
          Stage changes will show up here week by week.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {WEEKLY_SERIES.map((series) => {
            const sum = weekly.reduce((acc, week) => acc + week[series.key], 0);
            return (
              <div key={series.key} className="min-w-0">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-caption text-muted">{series.label}</span>
                  <span className="tabular font-mono text-caption text-fg">{sum}</span>
                </div>
                <div className="h-20 border-b border-line">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weekly}
                      margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
                      barCategoryGap={2}
                    >
                      <XAxis dataKey="weekStart" hide />
                      <ChartTooltip
                        cursor={{ fill: 'var(--surface-3)' }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const week = payload[0]!.payload as WeeklyBucket;
                          return (
                            <div className="rounded-md border border-line bg-surface-2 px-2 py-1 text-fine text-fg shadow-md">
                              Week of {shortDate(week.weekStart)}:{' '}
                              <span className="tabular font-mono">{week[series.key]}</span>
                            </div>
                          );
                        }}
                      />
                      <Bar
                        dataKey={series.key}
                        fill="var(--accent)"
                        radius={[3, 3, 0, 0]}
                        minPointSize={0}
                        isAnimationActive
                        animationDuration={500}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-fine whitespace-nowrap text-faint">
                  <span>{shortDate(weekly[0]!.weekStart)}</span>
                  <span className="text-accent">this week</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

const UPCOMING_LIMIT = 6;

function Upcoming({ items }: { items: UpcomingItem[] }) {
  const shown = items.slice(0, UPCOMING_LIMIT);
  const rest = items.length - shown.length;
  return (
    <Panel className="scroll-mt-20">
      <div id="coming-up" />
      <SectionTitle aside="next 14 days">Coming up</SectionTitle>
      {items.length === 0 ? (
        <EmptyState
          compact
          icon={CalendarClock}
          title="Nothing scheduled"
          hint="Follow-up reminders and next steps you set on an application appear here."
        />
      ) : (
        <motion.ol
          variants={listStagger}
          initial="hidden"
          animate="visible"
          className="divide-y divide-line"
        >
          {shown.map((item) => (
            <motion.li key={`${item.applicationId}-${item.kind}-${item.at}`} variants={listItem}>
              <Link
                href={`/pipeline?open=${item.applicationId}`}
                className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 hover:bg-surface-2"
              >
                <div className="w-[4.5rem] shrink-0">
                  <div className="tabular font-mono text-measure-sm text-fg">
                    {shortDate(item.at)}
                  </div>
                  <div className="text-fine text-muted">{dueLabel(item.at)}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body text-fg">{item.company}</p>
                  <p className="truncate text-body-sm text-muted">
                    {item.kind === 'REMINDER' ? 'Follow-up reminder' : 'Next step'} · {item.role}
                  </p>
                </div>
                <span className="flex items-center gap-2 text-caption text-muted">
                  <StageDot stage={item.stage} /> {STAGE_LABEL[item.stage]}
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ol>
      )}
      {rest > 0 ? (
        <Link
          href="/pipeline"
          className="mt-3 inline-flex items-center gap-1.5 text-body-sm text-muted hover:text-fg"
        >
          {rest} more in the next 14 days <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </Panel>
  );
}

function SourceHealth() {
  const sources = useSources();
  const postings = usePostingStats();

  if (sources.isPending) return <RowsSkeleton rows={4} height="h-9" />;
  if (sources.isError)
    return <ErrorState message="Could not load sources." onRetry={() => sources.refetch()} />;

  const enabled = sources.data.items.filter(
    (item) => item.enabled && (item.kind === 'feed' || item.postings > 0),
  );

  return (
    <Panel>
      <SectionTitle
        aside={
          <Link href="/settings/sources" className="inline-flex items-center gap-1.5 hover:text-fg">
            Sources <ArrowRight className="size-4" />
          </Link>
        }
      >
        Sources
        {postings.data ? (
          <span className="ml-2 text-caption font-normal text-muted">
            <span className="tabular font-mono">{postings.data.total.toLocaleString()}</span>{' '}
            postings
          </span>
        ) : null}
      </SectionTitle>
      <ul className="divide-y divide-line">
        {enabled.map((item) => {
          const run = item.lastRun;
          const tone =
            run === null
              ? 'bg-line-strong'
              : run.status === 'FAILED'
                ? 'bg-danger'
                : run.status === 'RUNNING'
                  ? 'bg-info'
                  : 'bg-success';
          return (
            <li key={item.source} className="flex items-center gap-3 py-2.5 text-body-sm">
              <Tip
                content={
                  run
                    ? `${run.status.toLowerCase()} · ${run.itemsSeen} seen, ${run.postingsCreated} new · ${relativeTime(run.startedAt)}`
                    : 'Never run'
                }
              >
                <span className={`size-2 rounded-full ${tone}`} aria-hidden />
              </Tip>
              <SourceBadge source={item.source} full />
              <span className="tabular ml-auto font-mono text-faint">
                {item.postings.toLocaleString()}
              </span>
              <span className="hidden w-24 text-right text-muted sm:inline">
                {run ? relativeTime(run.startedAt) : '—'}
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export default function DashboardPage() {
  const stats = useApplicationStats();
  const matches = useMatches({ dismissed: false, page: 1, pageSize: 1 });
  const session = useSession();

  return (
    <>
      <Today stats={stats.data} newMatches={matches.data?.total} />

      {stats.isError ? (
        <ErrorState
          message="Could not load your pipeline summary."
          onRetry={() => stats.refetch()}
          className="mb-6"
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          {stats.data ? (
            <Funnel stats={stats.data} upcoming={stats.data.upcoming} />
          ) : (
            <Skeleton className="h-52" />
          )}
          {stats.data ? <Weekly weekly={stats.data.weekly} /> : <Skeleton className="h-40" />}

          <SourceHealth />
        </div>
        <div className="min-w-0 space-y-4">
          {stats.data ? <Upcoming items={stats.data.upcoming} /> : <Skeleton className="h-52" />}
        </div>
      </div>

      <p className="mt-10 text-caption text-faint">
        {session.data ? `${session.data.email} · ` : null}
        {longDate(new Date().toISOString())}
      </p>
    </>
  );
}
