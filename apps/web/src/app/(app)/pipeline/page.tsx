'use client';

import { useState } from 'react';
import { ApplicationSheet } from '../../../components/application-sheet';
import { Button } from '../../../components/ui/button';
import { Input, Label, Textarea } from '../../../components/ui/input';
import { EmptyState, ErrorState, PageHeader, RowsSkeleton } from '../../../components/ui/states';
import { daysSince } from '../../../lib/format';
import { useApplications, useCreateApplication } from '../../../lib/queries';
import { ACTIVE_STAGES, CLOSED_STAGES, STAGE_ACCENT, STAGE_LABEL } from '../../../lib/stages';
import type { Application, Stage } from '../../../lib/types';

function AddDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateApplication();
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Cancel"
        className="absolute inset-0 bg-ink-950/70"
        onClick={onClose}
      />
      <form
        className="relative w-full max-w-md rounded border border-ink-700 bg-ink-900 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate(
            {
              company,
              role,
              ...(url.trim() ? { url: url.trim() } : {}),
              ...(notes.trim() ? { notes: notes.trim() } : {}),
            },
            { onSuccess: onClose },
          );
        }}
      >
        <h2 className="mb-4 text-sm font-medium text-text-100">Add an application</h2>

        <div className="mb-3">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            required
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
        </div>

        <div className="mb-3">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            required
            value={role}
            onChange={(event) => setRole(event.target.value)}
          />
        </div>

        <div className="mb-3">
          <Label htmlFor="add-url">Link</Label>
          <Input
            id="add-url"
            placeholder="https://"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </div>

        <div className="mb-4">
          <Label htmlFor="add-notes">Notes</Label>
          <Textarea
            id="add-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        {create.isError ? <p className="mb-3 text-xs text-danger">Could not save that.</p> : null}

        <div className="flex justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" variant="primary" disabled={create.isPending}>
            {create.isPending ? 'Adding…' : 'Add'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Column({
  stage,
  applications,
  onSelect,
}: {
  stage: Stage;
  applications: Application[];
  onSelect: (id: string) => void;
}) {
  return (
    <section className="flex min-w-60 flex-1 flex-col rounded border border-ink-700 bg-ink-900/60">
      <header className="flex items-center justify-between border-b border-ink-700 px-3 py-2">
        <span className={`font-mono text-xs uppercase ${STAGE_ACCENT[stage]}`}>
          {STAGE_LABEL[stage]}
        </span>
        <span className="font-mono text-xs text-text-500">{applications.length}</span>
      </header>

      <ul className="flex-1 space-y-2 p-2">
        {applications.map((application) => (
          <li key={application.id}>
            <button
              type="button"
              onClick={() => onSelect(application.id)}
              className="w-full rounded border border-ink-700 bg-ink-850 p-2.5 text-left transition-colors hover:border-ink-600"
            >
              <p className="truncate text-sm text-text-100">{application.company}</p>
              <p className="truncate text-xs text-text-500">{application.role}</p>
              <p className="mt-1.5 font-mono text-[11px] text-text-500">
                {daysSince(application.stageChangedAt)}d in stage
              </p>
            </button>
          </li>
        ))}

        {applications.length === 0 ? (
          <li className="px-1 py-6 text-center text-xs text-text-500">Nothing here</li>
        ) : null}
      </ul>
    </section>
  );
}

export default function PipelinePage() {
  const [showClosed, setShowClosed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const applications = useApplications();

  const columns = showClosed ? [...ACTIVE_STAGES, ...CLOSED_STAGES] : ACTIVE_STAGES;

  const byStage = (stage: Stage) =>
    (applications.data?.items ?? []).filter((item) => item.stage === stage);

  return (
    <>
      <PageHeader
        title="Pipeline"
        subtitle="Everything you are pursuing, by stage"
        actions={
          <>
            <Button
              size="sm"
              variant={showClosed ? 'secondary' : 'ghost'}
              onClick={() => setShowClosed((value) => !value)}
            >
              {showClosed ? 'Hide closed' : 'Show closed'}
            </Button>
            <Button size="sm" variant="primary" onClick={() => setAdding(true)}>
              Add application
            </Button>
          </>
        }
      />

      {applications.isPending ? <RowsSkeleton rows={3} /> : null}
      {applications.isError ? <ErrorState message="Could not load your pipeline." /> : null}

      {applications.data && applications.data.items.length === 0 ? (
        <EmptyState
          title="Nothing in the pipeline yet."
          hint="Save a match from the Inbox, or add one by hand."
          action={
            <Button size="sm" variant="primary" onClick={() => setAdding(true)}>
              Add application
            </Button>
          }
        />
      ) : null}

      {applications.data && applications.data.items.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {columns.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              applications={byStage(stage)}
              onSelect={setSelected}
            />
          ))}
        </div>
      ) : null}

      {selected ? <ApplicationSheet id={selected} onClose={() => setSelected(null)} /> : null}
      {adding ? <AddDialog onClose={() => setAdding(false)} /> : null}
    </>
  );
}
