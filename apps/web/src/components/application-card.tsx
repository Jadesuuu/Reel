'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { Bell, CalendarClock, MapPin } from 'lucide-react';
import { cn } from '../lib/cn';
import { daysSince, dueLabel, shortDate } from '../lib/format';
import type { ApplicationListItem } from '../lib/types';
import { SourceBadge } from './source-badge';
import { Tip } from './ui/tooltip';

type Props = HTMLAttributes<HTMLDivElement> & {
  application: ApplicationListItem;
  dragging?: boolean;
  overlay?: boolean;
};

export const ApplicationCard = forwardRef<HTMLDivElement, Props>(function ApplicationCard(
  { application, dragging = false, overlay = false, className, ...props },
  ref,
) {
  const days = daysSince(application.stageChangedAt);
  const reminder = application.reminders[0];
  const stale = application.stage === 'APPLIED' && days >= 7;

  return (
    <div
      ref={ref}
      className={cn(
        'group relative rounded-md border border-line bg-surface p-3 text-left shadow-sm transition-[border-color,box-shadow,transform] duration-150 ease-out',
        'hover:border-line-strong hover:shadow-md',
        dragging && 'opacity-30',
        overlay && 'rotate-[1.5deg] border-accent/60 shadow-lg',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate text-[14px] font-medium text-fg">{application.company}</p>
        {application.posting?.source ? (
          <SourceBadge source={application.posting.source} />
        ) : application.via ? (
          <span className="shrink-0 rounded-sm border border-dashed border-line px-1.5 font-mono text-[10.5px] tracking-wide text-faint uppercase">
            {application.via}
          </span>
        ) : null}
      </div>
      <p className="mt-0.5 truncate text-xs text-muted">{application.role}</p>

      {application.location || application.salaryText ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-faint">
          {application.location ? (
            <span className="inline-flex max-w-full items-center gap-1 truncate">
              <MapPin className="size-3 shrink-0" />{' '}
              <span className="truncate">{application.location}</span>
            </span>
          ) : null}
          {application.salaryText ? (
            <span className="tabular">{application.salaryText}</span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-2.5 flex items-center gap-2 border-t border-line pt-2 text-[11px]">
        <Tip content={`In this stage since ${shortDate(application.stageChangedAt)}`}>
          <span className={cn('tabular font-mono', stale ? 'text-warning' : 'text-faint')}>
            {days}d
          </span>
        </Tip>
        {reminder ? (
          <Tip
            content={`${reminder.kind === 'FOLLOW_UP' ? 'Follow-up' : 'Stale check'} ${dueLabel(reminder.dueAt)}`}
          >
            <span className="inline-flex items-center gap-1 text-accent">
              <Bell className="size-3" /> {shortDate(reminder.dueAt)}
            </span>
          </Tip>
        ) : null}
        {application.nextStepAt ? (
          <Tip content={`Next step ${dueLabel(application.nextStepAt)}`}>
            <span className="inline-flex items-center gap-1 text-info">
              <CalendarClock className="size-3" /> {shortDate(application.nextStepAt)}
            </span>
          </Tip>
        ) : null}
      </div>
    </div>
  );
});
