'use client';

import { useEffect, useState } from 'react';
import { TagInput } from '../../../components/tag-input';
import { Button } from '../../../components/ui/button';
import { Input, Label } from '../../../components/ui/input';
import { ErrorState, PageHeader, RowsSkeleton } from '../../../components/ui/states';
import { dateTime } from '../../../lib/format';
import { useCriteria, useIngestRuns, useRunIngest, useSaveCriteria } from '../../../lib/queries';

const STATUS_TONE: Record<string, string> = {
  SUCCEEDED: 'text-success',
  FAILED: 'text-danger',
  RUNNING: 'text-brass-400',
};

export default function SettingsPage() {
  const criteria = useCriteria();
  const save = useSaveCriteria();
  const runs = useIngestRuns();
  const runIngest = useRunIngest();

  const [remoteOnly, setRemoteOnly] = useState(true);
  const [roleKeywords, setRoleKeywords] = useState<string[]>([]);
  const [includeKeywords, setIncludeKeywords] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [minSalary, setMinSalary] = useState('');

  useEffect(() => {
    if (criteria.data) {
      setRemoteOnly(criteria.data.remoteOnly);
      setRoleKeywords(criteria.data.roleKeywords);
      setIncludeKeywords(criteria.data.includeKeywords);
      setExcludeKeywords(criteria.data.excludeKeywords);
      setMinSalary(criteria.data.minSalaryUsd === null ? '' : String(criteria.data.minSalaryUsd));
    }
  }, [criteria.data]);

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="What counts as a match, and when to look for new ones"
      />

      <section className="mb-8 max-w-2xl">
        <h2 className="mb-3 text-xs tracking-wide text-text-500 uppercase">Criteria</h2>

        {criteria.isPending ? <RowsSkeleton rows={3} /> : null}
        {criteria.isError ? <ErrorState message="Could not load your criteria." /> : null}

        {criteria.data ? (
          <form
            className="space-y-4 rounded border border-ink-700 bg-ink-900 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate({
                remoteOnly,
                roleKeywords,
                includeKeywords,
                excludeKeywords,
                minSalaryUsd: minSalary.trim() === '' ? null : Number(minSalary),
              });
            }}
          >
            <label className="flex items-center gap-2 text-sm text-text-100">
              <input
                type="checkbox"
                className="size-4 accent-[var(--brass-500)]"
                checked={remoteOnly}
                onChange={(event) => setRemoteOnly(event.target.checked)}
              />
              Remote only
            </label>

            <TagInput
              label="Role keywords"
              hint="One match awards 30 points."
              values={roleKeywords}
              onChange={setRoleKeywords}
            />
            <TagInput
              label="Include keywords"
              hint="10 points each, capped at 40."
              values={includeKeywords}
              onChange={setIncludeKeywords}
            />
            <TagInput
              label="Exclude keywords"
              hint="Any hit drops the posting entirely."
              values={excludeKeywords}
              onChange={setExcludeKeywords}
            />

            <div className="max-w-40">
              <Label htmlFor="min-salary">Minimum salary (USD)</Label>
              <Input
                id="min-salary"
                inputMode="numeric"
                placeholder="none"
                value={minSalary}
                onChange={(event) => setMinSalary(event.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" size="sm" variant="primary" disabled={save.isPending}>
                {save.isPending ? 'Saving…' : 'Save criteria'}
              </Button>
              {save.isSuccess ? (
                <span className="text-xs text-success">
                  Saved. Rescore from the Inbox to apply.
                </span>
              ) : null}
              {save.isError ? <span className="text-xs text-danger">Could not save.</span> : null}
            </div>
          </form>
        ) : null}
      </section>

      <section className="max-w-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs tracking-wide text-text-500 uppercase">Ingest runs</h2>
          <Button
            size="sm"
            variant="secondary"
            disabled={runIngest.isPending}
            onClick={() => runIngest.mutate()}
          >
            {runIngest.isPending ? 'Queuing…' : 'Run ingest now'}
          </Button>
        </div>

        {runIngest.isSuccess ? (
          <p className="mb-2 text-xs text-text-500">
            Queued as {runIngest.data.jobId}. The worker picks it up within a few seconds.
          </p>
        ) : null}

        {runs.isPending ? <RowsSkeleton rows={3} /> : null}
        {runs.isError ? <ErrorState message="Could not load run history." /> : null}

        {runs.data && runs.data.items.length === 0 ? (
          <p className="rounded border border-dashed border-ink-700 px-4 py-8 text-center text-xs text-text-500">
            No ingest has run yet.
          </p>
        ) : null}

        {runs.data && runs.data.items.length > 0 ? (
          <div className="overflow-x-auto rounded border border-ink-700">
            <table className="w-full min-w-xl text-left text-sm">
              <thead className="border-b border-ink-700 bg-ink-850 text-xs tracking-wide text-text-500 uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">Started</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Seen</th>
                  <th className="px-3 py-2 font-medium">New</th>
                  <th className="px-3 py-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {runs.data.items.map((run) => (
                  <tr key={run.id} className="border-b border-ink-800 last:border-0">
                    <td className="px-3 py-2 text-xs whitespace-nowrap text-text-300">
                      {dateTime(run.startedAt)}
                    </td>
                    <td
                      className={`px-3 py-2 font-mono text-xs ${STATUS_TONE[run.status] ?? 'text-text-300'}`}
                    >
                      {run.status.toLowerCase()}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs tabular-nums text-text-300">
                      {run.commentsSeen}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs tabular-nums text-text-300">
                      {run.postingsCreated}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs tabular-nums text-text-300">
                      {run.postingsUpdated}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </>
  );
}
