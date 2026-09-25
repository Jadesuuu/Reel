'use client';

import { LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '../../../../components/ui/button';
import { Kbd } from '../../../../components/ui/kbd';
import { Segmented } from '../../../../components/ui/segmented';
import { Panel, SectionTitle } from '../../../../components/ui/states';
import { longDate } from '../../../../lib/format';
import { modKey } from '../../../../lib/keyboard';
import { useLogout, useSession } from '../../../../lib/session';
import { isDemoMode } from '../../../../demo';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../../lib/api';
import { Mail } from 'lucide-react';
import { dateTime } from '../../../../lib/format';

const SHORTCUTS = [
  { keys: [`${modKey()}`, 'K'], does: 'Open the command palette' },
  { keys: ['g', 'd'], does: 'Go to Dashboard' },
  { keys: ['g', 'i'], does: 'Go to Inbox' },
  { keys: ['g', 'p'], does: 'Go to Postings' },
  { keys: ['g', 'b'], does: 'Go to Pipeline' },
  { keys: ['j', 'k'], does: 'Move through the inbox' },
  { keys: ['s'], does: 'Save the focused match' },
  { keys: ['d'], does: 'Dismiss the focused match' },
  { keys: ['a'], does: 'Open the apply link' },
  { keys: ['n'], does: 'Add an application (pipeline)' },
];

type DemoMail = { id: string; to: string; subject: string; text: string; sentAt: string };

function Outbox() {
  const mail = useQuery({
    queryKey: ['demo', 'mail'],
    queryFn: () => apiFetch<{ items: DemoMail[] }>('/demo/mail'),
    refetchInterval: 5_000,
  });
  const items = mail.data?.items ?? [];
  return (
    <Panel className="xl:col-span-2">
      <SectionTitle aside="what the worker would have emailed">Reminder emails</SectionTitle>
      {items.length === 0 ? (
        <p className="text-caption text-faint">
          None yet. Move an application to Applied, then use “Fast-forward 10 days” in the demo bar
          and the stale-application email lands here.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((message) => (
            <li key={message.id} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="inline-flex items-center gap-2 text-body text-fg">
                  <Mail className="size-4 text-accent" /> {message.subject}
                </p>
                <span className="tabular font-mono text-fine text-faint">
                  {dateTime(message.sentAt)}
                </span>
              </div>
              <p className="mt-1 text-fine text-faint">to {message.to}</p>
              <pre className="mt-2 max-w-[72ch] font-sans text-caption leading-relaxed whitespace-pre-wrap text-muted">
                {message.text}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export default function AccountPage() {
  const session = useSession();
  const logout = useLogout();
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel>
        <SectionTitle>Account</SectionTitle>
        <dl className="space-y-3 text-body">
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
            <dt className="text-muted">Email</dt>
            <dd className="truncate text-fg">{session.data?.email ?? '—'}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
            <dt className="text-muted">Timezone</dt>
            <dd className="text-fg">{session.data?.timezone ?? 'Asia/Manila'}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
            <dt className="text-muted">Member since</dt>
            <dd className="text-fg">
              {session.data?.createdAt ? longDate(session.data.createdAt) : '—'}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted">Theme</dt>
            <dd>
              <Segmented
                ariaLabel="Theme"
                value={theme === 'light' ? 'light' : 'dark'}
                onValueChange={(value) => setTheme(value)}
                options={[
                  {
                    value: 'dark',
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <Moon className="size-4" /> Dark
                      </span>
                    ),
                  },
                  {
                    value: 'light',
                    label: (
                      <span className="inline-flex items-center gap-1.5">
                        <Sun className="size-4" /> Light
                      </span>
                    ),
                  },
                ]}
              />
            </dd>
          </div>
        </dl>
        <div className="mt-5 border-t border-line pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout.mutate()}
            loading={logout.isPending}
          >
            <LogOut className="size-4" /> Log out of this device
          </Button>
          <p className="mt-2 text-caption text-faint">
            Sessions last seven days. Logging out clears the cookie on this browser only.
          </p>
        </div>
      </Panel>

      <Panel>
        <SectionTitle>Keyboard</SectionTitle>
        <ul className="divide-y divide-line">
          {SHORTCUTS.map((item) => (
            <li
              key={item.does}
              className="flex items-center justify-between gap-4 py-2 text-caption"
            >
              <span className="text-muted">{item.does}</span>
              <span className="flex gap-1.5">
                {item.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
      {isDemoMode() ? <Outbox /> : null}
    </div>
  );
}
