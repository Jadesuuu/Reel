'use client';

import { useState } from 'react';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { EmptyState, ErrorState, PageHeader, RowsSkeleton } from '../../../components/ui/states';
import { hostOf, shortDate } from '../../../lib/format';
import { useCreateApplication, usePosting, usePostings } from '../../../lib/queries';

const REMOTE_FILTERS = ['', 'REMOTE', 'HYBRID', 'ONSITE'] as const;

function PostingDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const posting = usePosting(id);
  const save = useCreateApplication();

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <button
        type="button"
        aria-label="Close details"
        className="flex-1 bg-ink-950/70"
        onClick={onClose}
      />
      <aside className="flex w-full max-w-md flex-col overflow-y-auto border-l border-ink-700 bg-ink-900 p-4">
        {posting.isPending ? <RowsSkeleton rows={3} /> : null}
        {posting.isError ? <ErrorState message="Could not load this posting." /> : null}

        {posting.data ? (
          <>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-medium text-text-100">
                  {posting.data.company ?? 'Unknown company'}
                </h2>
                <p className="text-xs text-text-500">{posting.data.role ?? 'Role not parsed'}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              <Badge>{posting.data.remote.toLowerCase()}</Badge>
              {posting.data.location ? <Badge>{posting.data.location}</Badge> : null}
              {posting.data.salaryText ? <Badge>{posting.data.salaryText}</Badge> : null}
              {posting.data.stackKeywords.slice(0, 8).map((keyword) => (
                <Badge key={keyword}>{keyword}</Badge>
              ))}
            </div>

            <div className="mb-4 flex gap-2">
              <Button
                size="sm"
                variant="primary"
                disabled={save.isPending || save.isSuccess}
                onClick={() => save.mutate({ postingId: posting.data.id })}
              >
                {save.isSuccess ? 'Saved to pipeline' : 'Save to pipeline'}
              </Button>
              {posting.data.applyUrl ? (
                <a
                  href={posting.data.applyUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex h-7 items-center rounded border border-ink-700 px-2.5 text-xs text-text-300 hover:border-ink-600 hover:text-text-100"
                >
                  {hostOf(posting.data.applyUrl)}
                </a>
              ) : null}
            </div>

            <pre className="flex-1 border-t border-ink-700 pt-3 font-sans text-xs leading-relaxed whitespace-pre-wrap text-text-300">
              {posting.data.rawText ?? posting.data.headline}
            </pre>
          </>
        ) : null}
      </aside>
    </div>
  );
}

export default function PostingsPage() {
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [remote, setRemote] = useState<string>('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);

  const postings = usePostings({ q, remote, page });

  return (
    <>
      <PageHeader title="Postings" subtitle="Everything ingested from the thread" />

      <form
        className="mb-4 flex flex-wrap items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setQ(search);
          setPage(1);
        }}
      >
        <Input
          className="max-w-xs"
          placeholder="Search company, role, headline"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button type="submit" size="sm" variant="secondary">
          Search
        </Button>

        <div className="ml-auto flex items-center gap-1">
          {REMOTE_FILTERS.map((value) => (
            <Button
              key={value || 'all'}
              size="sm"
              variant={remote === value ? 'secondary' : 'ghost'}
              onClick={() => {
                setRemote(value);
                setPage(1);
              }}
              type="button"
            >
              {value === '' ? 'All' : value.toLowerCase()}
            </Button>
          ))}
        </div>
      </form>

      {postings.isPending ? <RowsSkeleton /> : null}
      {postings.isError ? <ErrorState message="Could not load postings." /> : null}

      {postings.data && postings.data.items.length === 0 ? (
        <EmptyState
          title="No postings match."
          hint="Clear the filters, or run an ingest from Settings."
        />
      ) : null}

      {postings.data && postings.data.items.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded border border-ink-700">
            <table className="w-full min-w-2xl text-left text-sm">
              <thead className="border-b border-ink-700 bg-ink-850 text-xs tracking-wide text-text-500 uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">Company</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Remote</th>
                  <th className="px-3 py-2 font-medium">Salary</th>
                  <th className="px-3 py-2 font-medium">Posted</th>
                </tr>
              </thead>
              <tbody>
                {postings.data.items.map((posting) => (
                  <tr
                    key={posting.id}
                    onClick={() => setSelected(posting.id)}
                    className="cursor-pointer border-b border-ink-800 last:border-0 hover:bg-ink-850"
                  >
                    <td className="max-w-48 truncate px-3 py-2 text-text-100">
                      {posting.company ?? '—'}
                    </td>
                    <td className="max-w-64 truncate px-3 py-2 text-text-300">
                      {posting.role ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-text-500">
                      {posting.remote.toLowerCase()}
                    </td>
                    <td className="px-3 py-2 text-xs text-text-500">{posting.salaryText ?? '—'}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap text-text-500">
                      {shortDate(posting.postedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-text-500">
            <span>{postings.data.total} postings</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={page === 1}
                onClick={() => setPage((value) => value - 1)}
              >
                Previous
              </Button>
              <span>page {page}</span>
              <Button
                size="sm"
                variant="ghost"
                disabled={page * postings.data.pageSize >= postings.data.total}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}

      {selected ? <PostingDrawer id={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}
