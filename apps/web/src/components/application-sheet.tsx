'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bell,
  BellOff,
  CalendarClock,
  ExternalLink,
  MessageSquareText,
  Trash2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { ApiError } from '../lib/api';
import { cn } from '../lib/cn';
import {
  dateTime,
  daysSince,
  dueLabel,
  fromDateInputValue,
  hostOf,
  longDate,
  shortDate,
  toDateInputValue,
} from '../lib/format';
import {
  useAddNote,
  useApplication,
  useCancelReminder,
  useChangeStage,
  useDeleteApplication,
  useScheduleReminder,
  useUpdateApplication,
} from '../lib/queries';
import { ALLOWED, STAGE_LABEL, STAGE_TEXT, isClosed } from '../lib/stages';
import type { ApplicationDetail, Reminder, Stage, StageEvent } from '../lib/types';
import { SourceBadge } from './source-badge';
import { StageDot, StageStamp } from './stage-stamp';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogFooter } from './ui/dialog';
import { Field, Input, Textarea } from './ui/input';
import { Sheet, SheetContent } from './ui/sheet';
import { RowsSkeleton } from './ui/skeleton';
import { ErrorState } from './ui/states';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export function ApplicationSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  return (
    <Sheet open={id !== null} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      {id ? <Body id={id} onClose={onClose} /> : null}
    </Sheet>
  );
}

function Body({ id, onClose }: { id: string; onClose: () => void }) {
  const application = useApplication(id);
  const detail = application.data;

  return (
    <SheetContent
      title={detail?.company ?? 'Application'}
      width="lg"
      header={
        detail ? (
          <div className="min-w-0">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <StageStamp stage={detail.stage} size="md" />
              <span className="text-fine text-faint">
                {daysSince(detail.stageChangedAt)}d in stage · added {shortDate(detail.createdAt)}
              </span>
            </div>
            <h2 className="truncate text-title font-semibold tracking-tight text-fg">
              {detail.company}
            </h2>
            <p className="truncate text-body text-muted">{detail.role}</p>
          </div>
        ) : undefined
      }
    >
      {application.isPending ? <RowsSkeleton rows={5} /> : null}
      {application.isError ? (
        <ErrorState
          message="Could not load this application."
          onRetry={() => application.refetch()}
        />
      ) : null}
      {detail ? <Detail detail={detail} onDeleted={onClose} /> : null}
    </SheetContent>
  );
}

function StageMover({ detail }: { detail: ApplicationDetail }) {
  const changeStage = useChangeStage();
  const [note, setNote] = useState('');
  const next: Stage[] = ALLOWED[detail.stage];

  if (next.length === 0) {
    return (
      <p className="rounded-md border border-line bg-surface-2 px-4 py-2 text-caption text-muted">
        {STAGE_LABEL[detail.stage]} is final. The history below is kept as it was.
      </p>
    );
  }

  return (
    <div className="rounded-md border border-line bg-surface-2 p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="stamp text-faint">Move to</span>
        {next.map((stage) => (
          <Button
            key={stage}
            size="sm"
            variant={stage === 'REJECTED' || stage === 'WITHDRAWN' ? 'outline' : 'secondary'}
            loading={changeStage.isPending && changeStage.variables?.to === stage}
            onClick={() =>
              changeStage.mutate(
                { id: detail.id, to: stage, note: note.trim() || undefined },
                {
                  onSuccess: () => {
                    setNote('');
                    toast.success(`${detail.company} → ${STAGE_LABEL[stage]}`, {
                      description:
                        stage === 'APPLIED'
                          ? 'A follow-up reminder is set for ten days from now.'
                          : undefined,
                    });
                  },
                  onError: (error) =>
                    toast.error('Could not move it', {
                      description: error instanceof ApiError ? error.message : undefined,
                    }),
                },
              )
            }
          >
            <StageDot stage={stage} /> {STAGE_LABEL[stage]}
          </Button>
        ))}
      </div>
      <Input
        placeholder="Optional note for this move — who, what, when"
        className="h-9 text-body-sm"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
    </div>
  );
}

function Overview({ detail }: { detail: ApplicationDetail }) {
  const update = useUpdateApplication(detail.id);
  const [form, setForm] = useState(() => toForm(detail));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setForm(toForm(detail));
    setDirty(false);
  }, [detail]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((state) => ({ ...state, [key]: value }));
    setDirty(true);
  }

  function submit() {
    update.mutate(
      {
        company: form.company.trim() || detail.company,
        role: form.role.trim() || detail.role,
        url: form.url.trim() || null,
        notes: form.notes,
        location: form.location.trim() || null,
        salaryText: form.salaryText.trim() || null,
        via: form.via.trim() || null,
        appliedAt: fromDateInputValue(form.appliedAt),
        nextStepAt: fromDateInputValue(form.nextStepAt),
        contactName: form.contactName.trim() || null,
        contactEmail: form.contactEmail.trim() || null,
      },
      {
        onSuccess: () => {
          setDirty(false);
          toast.success('Saved');
        },
        onError: (error) =>
          toast.error('Could not save', {
            description: error instanceof ApiError ? error.message : undefined,
          }),
      },
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Company" htmlFor="company">
          <Input
            id="company"
            value={form.company}
            onChange={(event) => set('company', event.target.value)}
          />
        </Field>
        <Field label="Role" htmlFor="role">
          <Input
            id="role"
            value={form.role}
            onChange={(event) => set('role', event.target.value)}
          />
        </Field>
        <Field
          label="Link"
          htmlFor="url"
          hint={form.url ? (hostOf(form.url) ?? undefined) : undefined}
        >
          <Input
            id="url"
            placeholder="https://"
            value={form.url}
            onChange={(event) => set('url', event.target.value)}
          />
        </Field>
        <Field label="Found via" htmlFor="via" hint="LinkedIn, referral, a friend…">
          <Input id="via" value={form.via} onChange={(event) => set('via', event.target.value)} />
        </Field>
        <Field label="Location" htmlFor="location">
          <Input
            id="location"
            value={form.location}
            onChange={(event) => set('location', event.target.value)}
          />
        </Field>
        <Field label="Salary" htmlFor="salary">
          <Input
            id="salary"
            placeholder="$140k–$170k"
            value={form.salaryText}
            onChange={(event) => set('salaryText', event.target.value)}
          />
        </Field>
        <Field label="Applied on" htmlFor="appliedAt">
          <Input
            id="appliedAt"
            type="date"
            value={form.appliedAt}
            onChange={(event) => set('appliedAt', event.target.value)}
          />
        </Field>
        <Field label="Next step" htmlFor="nextStepAt" hint="interview, deadline, reply due">
          <Input
            id="nextStepAt"
            type="date"
            value={form.nextStepAt}
            onChange={(event) => set('nextStepAt', event.target.value)}
          />
        </Field>
        <Field label="Contact" htmlFor="contactName">
          <Input
            id="contactName"
            placeholder="Recruiter or hiring manager"
            value={form.contactName}
            onChange={(event) => set('contactName', event.target.value)}
          />
        </Field>
        <Field label="Contact email" htmlFor="contactEmail">
          <Input
            id="contactEmail"
            type="email"
            value={form.contactEmail}
            onChange={(event) => set('contactEmail', event.target.value)}
          />
        </Field>
      </div>
      <Field label="Notes" htmlFor="notes" hint="kept with the application">
        <Textarea
          id="notes"
          placeholder="What they asked, what you promised, what to prepare"
          value={form.notes}
          onChange={(event) => set('notes', event.target.value)}
        />
      </Field>

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!dirty}
          loading={update.isPending}
        >
          Save changes
        </Button>
        {detail.url ? (
          <Button asChild size="sm" variant="ghost">
            <a href={detail.url} target="_blank" rel="noreferrer noopener">
              Open posting <ExternalLink className="size-4" />
            </a>
          </Button>
        ) : null}
        {detail.posting ? (
          <span className="ml-auto flex items-center gap-2 text-fine text-faint">
            from <SourceBadge source={detail.posting.source} href={detail.posting.url} />
          </span>
        ) : null}
      </div>
    </form>
  );
}

function toForm(detail: ApplicationDetail) {
  return {
    company: detail.company,
    role: detail.role,
    url: detail.url ?? '',
    notes: detail.notes ?? '',
    location: detail.location ?? '',
    salaryText: detail.salaryText ?? '',
    via: detail.via ?? '',
    appliedAt: toDateInputValue(detail.appliedAt),
    nextStepAt: toDateInputValue(detail.nextStepAt),
    contactName: detail.contactName ?? '',
    contactEmail: detail.contactEmail ?? '',
  };
}

function Timeline({ detail }: { detail: ApplicationDetail }) {
  const addNote = useAddNote(detail.id);
  const [note, setNote] = useState('');
  const events = detail.events.toReversed();

  return (
    <div>
      <form
        className="mb-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!note.trim()) return;
          addNote.mutate(note, {
            onSuccess: () => setNote(''),
            onError: () => toast.error('Could not add the note'),
          });
        }}
      >
        <Input
          placeholder="Log what happened — a call, an email, a question to ask"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="h-10"
          aria-label="New note"
        />
        <Button
          type="submit"
          variant="secondary"
          size="md"
          disabled={!note.trim()}
          loading={addNote.isPending}
        >
          <MessageSquareText className="size-5" /> Log
        </Button>
      </form>

      <ol className="relative ml-2 border-l border-line">
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <TimelineItem key={event.id} event={event} />
          ))}
        </AnimatePresence>
      </ol>
    </div>
  );
}

function TimelineItem({ event }: { event: StageEvent }) {
  const isNote = event.kind === 'NOTE';
  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="relative pb-4 pl-5 last:pb-0"
    >
      <span
        aria-hidden
        className={cn(
          'absolute top-1.5 -left-[5px] size-[9px] rounded-full border-2 border-surface',
          isNote ? 'bg-line-strong' : '',
        )}
        style={isNote ? undefined : { background: `var(--stage-${event.toStage.toLowerCase()})` }}
      />
      <div className="flex flex-wrap items-baseline gap-x-2 text-caption">
        <span className="tabular font-mono text-fine text-faint">{dateTime(event.createdAt)}</span>
        {isNote ? (
          <span className="text-muted">Note</span>
        ) : event.fromStage ? (
          <span className="flex items-center gap-1.5 text-fg">
            <span className={STAGE_TEXT[event.fromStage]}>{STAGE_LABEL[event.fromStage]}</span>
            <ArrowRight className="size-4 text-faint" />
            <span className={STAGE_TEXT[event.toStage]}>{STAGE_LABEL[event.toStage]}</span>
          </span>
        ) : (
          <span className="text-fg">
            Created as{' '}
            <span className={STAGE_TEXT[event.toStage]}>{STAGE_LABEL[event.toStage]}</span>
          </span>
        )}
      </div>
      {event.note ? (
        <p className="mt-1 max-w-[60ch] text-body-sm leading-relaxed whitespace-pre-wrap text-muted">
          {event.note}
        </p>
      ) : null}
    </motion.li>
  );
}

function Reminders({ detail }: { detail: ApplicationDetail }) {
  const schedule = useScheduleReminder(detail.id);
  const cancel = useCancelReminder(detail.id);
  const [date, setDate] = useState('');

  const pending = detail.reminders.filter((reminder) => !reminder.sentAt && !reminder.cancelledAt);
  const past = detail.reminders.filter((reminder) => reminder.sentAt || reminder.cancelledAt);

  return (
    <div className="space-y-5">
      {!isClosed(detail.stage) ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const iso = fromDateInputValue(date);
            if (!iso) return;
            schedule.mutate(iso, {
              onSuccess: () => {
                setDate('');
                toast.success(`Reminder set for ${longDate(iso)}`);
              },
              onError: (error) =>
                toast.error('Could not set the reminder', {
                  description: error instanceof ApiError ? error.message : undefined,
                }),
            });
          }}
        >
          <Field label="Remind me on" htmlFor="remind" className="flex-1 min-w-44">
            <Input
              id="remind"
              type="date"
              min={toDateInputValue(new Date(Date.now() + 86_400_000).toISOString())}
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>
          <Button type="submit" variant="secondary" disabled={!date} loading={schedule.isPending}>
            <Bell className="size-5" /> Set follow-up
          </Button>
        </form>
      ) : null}

      <div>
        <div className="stamp mb-2 text-faint">Pending</div>
        {pending.length === 0 ? (
          <p className="text-caption text-faint">
            {detail.stage === 'APPLIED'
              ? 'No reminder pending. Moving to Applied again sets a ten-day one automatically.'
              : 'Nothing pending. A follow-up can be set on any open application.'}
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-md border border-line">
            {pending.map((reminder) => (
              <ReminderRow
                key={reminder.id}
                reminder={reminder}
                onCancel={() =>
                  cancel.mutate(reminder.id, {
                    onSuccess: () => toast('Reminder cancelled'),
                    onError: () => toast.error('Could not cancel it'),
                  })
                }
                cancelling={cancel.isPending && cancel.variables === reminder.id}
              />
            ))}
          </ul>
        )}
      </div>

      {past.length > 0 ? (
        <div>
          <div className="stamp mb-2 text-faint">History</div>
          <ul className="divide-y divide-line rounded-md border border-line opacity-80">
            {past.map((reminder) => (
              <ReminderRow key={reminder.id} reminder={reminder} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ReminderRow({
  reminder,
  onCancel,
  cancelling,
}: {
  reminder: Reminder;
  onCancel?: () => void;
  cancelling?: boolean;
}) {
  const status = reminder.sentAt
    ? `sent ${shortDate(reminder.sentAt)}`
    : reminder.cancelledAt
      ? `cancelled ${shortDate(reminder.cancelledAt)}`
      : dueLabel(reminder.dueAt);
  return (
    <li className="flex items-center gap-3 px-4 py-2 text-caption">
      {reminder.kind === 'FOLLOW_UP' ? (
        <CalendarClock className="size-4 text-info" />
      ) : (
        <Bell className="size-4 text-accent" />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-fg">
          {reminder.kind === 'FOLLOW_UP' ? 'Follow-up' : 'Stale-application check'} ·{' '}
          {longDate(reminder.dueAt)}
        </p>
        <p className="text-faint">{status}</p>
      </div>
      {onCancel ? (
        <Button size="xs" variant="ghost" onClick={onCancel} loading={cancelling}>
          <BellOff className="size-4" /> Cancel
        </Button>
      ) : null}
    </li>
  );
}

function Detail({ detail, onDeleted }: { detail: ApplicationDetail; onDeleted: () => void }) {
  const remove = useDeleteApplication();
  const [confirming, setConfirming] = useState(false);
  const pendingCount = detail.reminders.filter(
    (reminder) => !reminder.sentAt && !reminder.cancelledAt,
  ).length;

  return (
    <div className="space-y-5">
      <StageMover detail={detail} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Details</TabsTrigger>
          <TabsTrigger value="timeline" count={detail.events.length}>
            Timeline
          </TabsTrigger>
          <TabsTrigger value="reminders" count={pendingCount}>
            Reminders
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-4 outline-none">
          <Overview detail={detail} />
        </TabsContent>
        <TabsContent value="timeline" className="pt-4 outline-none">
          <Timeline detail={detail} />
        </TabsContent>
        <TabsContent value="reminders" className="pt-4 outline-none">
          <Reminders detail={detail} />
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between border-t border-line pt-4">
        <span className="text-fine text-faint">Updated {dateTime(detail.updatedAt)}</span>
        <Button size="sm" variant="danger" onClick={() => setConfirming(true)}>
          <Trash2 className="size-4" /> Delete
        </Button>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent
          size="sm"
          title={`Delete ${detail.company}?`}
          description="This removes the application, its history, and any pending reminders. There is no undo."
        >
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={remove.isPending}
              onClick={() =>
                remove.mutate(detail.id, {
                  onSuccess: () => {
                    setConfirming(false);
                    onDeleted();
                    toast(`Deleted ${detail.company}`);
                  },
                  onError: () => toast.error('Could not delete it'),
                })
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
