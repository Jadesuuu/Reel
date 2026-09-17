'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input, Label, Textarea } from './ui/input';
import { ErrorState, RowsSkeleton } from './ui/states';
import { dateTime, daysSince, hostOf } from '../lib/format';
import {
  useApplication,
  useChangeStage,
  useDeleteApplication,
  useUpdateApplication,
} from '../lib/queries';
import { ALLOWED, STAGE_ACCENT, STAGE_LABEL } from '../lib/stages';
import type { Stage } from '../lib/types';

export function ApplicationSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const application = useApplication(id);
  const update = useUpdateApplication(id);
  const changeStage = useChangeStage(id);
  const remove = useDeleteApplication();

  const [notes, setNotes] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (application.data) {
      setNotes(application.data.notes ?? '');
      setUrl(application.data.url ?? '');
    }
  }, [application.data]);

  const detail = application.data;
  const nextStages: Stage[] = detail ? ALLOWED[detail.stage] : [];
  const pendingReminder = detail?.reminders.find(
    (reminder) => reminder.sentAt === null && reminder.cancelledAt === null,
  );

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <button
        type="button"
        aria-label="Close application"
        className="flex-1 bg-ink-950/70"
        onClick={onClose}
      />
      <aside className="w-full max-w-md overflow-y-auto border-l border-ink-700 bg-ink-900 p-4">
        {application.isPending ? <RowsSkeleton rows={4} /> : null}
        {application.isError ? <ErrorState message="Could not load this application." /> : null}

        {detail ? (
          <>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-base font-medium text-text-100">{detail.company}</h2>
                <p className="truncate text-xs text-text-500">{detail.role}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className={`font-mono text-xs uppercase ${STAGE_ACCENT[detail.stage]}`}>
                {STAGE_LABEL[detail.stage]}
              </span>
              <span className="text-xs text-text-500">
                {daysSince(detail.stageChangedAt)}d in stage
              </span>
              {pendingReminder ? (
                <span className="text-xs text-brass-500">
                  reminder {dateTime(pendingReminder.dueAt)}
                </span>
              ) : null}
            </div>

            {nextStages.length > 0 ? (
              <div className="mb-5 rounded border border-ink-700 bg-ink-850 p-3">
                <Label>Move to</Label>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {nextStages.map((stage) => (
                    <Button
                      key={stage}
                      size="sm"
                      variant="secondary"
                      disabled={changeStage.isPending}
                      onClick={() =>
                        changeStage.mutate({
                          to: stage,
                          ...(note.trim() ? { note: note.trim() } : {}),
                        })
                      }
                    >
                      {STAGE_LABEL[stage]}
                    </Button>
                  ))}
                </div>
                <Input
                  placeholder="Optional note for this move"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
            ) : (
              <p className="mb-5 text-xs text-text-500">
                {STAGE_LABEL[detail.stage]} is a terminal stage.
              </p>
            )}

            <div className="mb-3">
              <Label htmlFor="url">Link</Label>
              <Input
                id="url"
                value={url}
                placeholder="https://"
                onChange={(event) => setUrl(event.target.value)}
              />
              {detail.url ? (
                <a
                  href={detail.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-1 inline-block text-xs text-brass-500 hover:underline"
                >
                  {hostOf(detail.url)}
                </a>
              ) : null}
            </div>

            <div className="mb-3">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                placeholder="Who you spoke to, what they asked, what to do next"
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>

            <div className="mb-6 flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                disabled={update.isPending}
                onClick={() => update.mutate({ notes, url: url.trim() || undefined })}
              >
                {update.isPending ? 'Saving…' : 'Save changes'}
              </Button>
              <Button
                size="sm"
                variant="danger"
                disabled={remove.isPending}
                onClick={() => {
                  remove.mutate(id);
                  onClose();
                }}
              >
                Delete
              </Button>
            </div>

            <div className="border-t border-ink-700 pt-3">
              <h3 className="mb-2 text-xs tracking-wide text-text-500 uppercase">History</h3>
              <ol className="space-y-2">
                {detail.events.map((event) => (
                  <li key={event.id} className="flex gap-2 text-xs">
                    <span className="w-24 shrink-0 text-text-500">{dateTime(event.createdAt)}</span>
                    <span className="text-text-300">
                      {event.fromStage
                        ? `${STAGE_LABEL[event.fromStage]} → ${STAGE_LABEL[event.toStage]}`
                        : `Created as ${STAGE_LABEL[event.toStage]}`}
                      {event.note ? (
                        <span className="block text-text-500">{event.note}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </>
        ) : null}
      </aside>
    </div>
  );
}
