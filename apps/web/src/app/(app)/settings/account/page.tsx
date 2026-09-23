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

export default function AccountPage() {
  const session = useSession();
  const logout = useLogout();
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel>
        <SectionTitle>Account</SectionTitle>
        <dl className="space-y-3 text-sm">
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
                      <span className="inline-flex items-center gap-1">
                        <Moon className="size-3" /> Dark
                      </span>
                    ),
                  },
                  {
                    value: 'light',
                    label: (
                      <span className="inline-flex items-center gap-1">
                        <Sun className="size-3" /> Light
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
            <LogOut className="size-3.5" /> Log out of this device
          </Button>
          <p className="mt-2 text-xs text-faint">
            Sessions last seven days. Logging out clears the cookie on this browser only.
          </p>
        </div>
      </Panel>

      <Panel>
        <SectionTitle>Keyboard</SectionTitle>
        <ul className="divide-y divide-line">
          {SHORTCUTS.map((item) => (
            <li key={item.does} className="flex items-center justify-between gap-4 py-2 text-xs">
              <span className="text-muted">{item.does}</span>
              <span className="flex gap-1">
                {item.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
