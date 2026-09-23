'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Search,
  Settings,
  UserRound,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { modKey } from '../lib/keyboard';
import { useIngestRuns } from '../lib/queries';
import { useLogout, useSession } from '../lib/session';
import { relativeTime } from '../lib/format';
import { Tip } from './ui/tooltip';
import { CommandPalette } from './command-palette';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from './ui/dropdown-menu';
import { Kbd } from './ui/kbd';

export const NAV = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    hint: 'What is due and what came in',
  },
  { href: '/inbox', label: 'Inbox', icon: Inbox, hint: 'Postings scored against your criteria' },
  {
    href: '/postings',
    label: 'Postings',
    icon: Newspaper,
    hint: 'Everything ingested from every source',
  },
  { href: '/pipeline', label: 'Pipeline', icon: KanbanSquare, hint: 'Applications by stage' },
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    hint: 'Criteria, sources, ingest, account',
  },
] as const;

function IngestState() {
  const runs = useIngestRuns({ page: 1 });
  const running = runs.data?.items.filter((run) => run.status === 'RUNNING').length ?? 0;
  const latest = runs.data?.items[0];
  if (!latest) return null;
  return (
    <Tip
      content={
        running > 0
          ? `${running} ingest ${running === 1 ? 'job' : 'jobs'} running`
          : `Last ingest ${relativeTime(latest.startedAt)} · ${latest.status.toLowerCase()}`
      }
    >
      <Link
        href="/settings/ingest"
        className="hidden items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[10.5px] tracking-wide text-faint uppercase hover:bg-surface-2 hover:text-fg lg:inline-flex"
      >
        <span
          className={cn(
            'size-1.5 rounded-full',
            running > 0
              ? 'animate-pulse bg-info'
              : latest.status === 'FAILED'
                ? 'bg-danger'
                : 'bg-success',
          )}
        />
        {running > 0 ? 'ingesting' : relativeTime(latest.startedAt)}
      </Link>
    </Tip>
  );
}

export function AppShell({
  children,
  email,
  banner,
}: {
  children: React.ReactNode;
  email: string;
  banner?: React.ReactNode;
}) {
  const pathname = usePathname();
  const logout = useLogout();
  const session = useSession();
  const [paletteOpen, setPaletteOpen] = useState(false);

  const current = NAV.find((item) => pathname.startsWith(item.href));

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="flex h-14 items-center px-5">
          <Link
            href="/dashboard"
            className="font-mono text-[12px] tracking-[0.32em] text-accent uppercase"
          >
            Reel
          </Link>
        </div>
        <nav className="flex-1 space-y-0.5 px-3" aria-label="Primary">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[13px] transition-colors duration-150',
                  active ? 'bg-surface-3 text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
                )}
              >
                <Icon
                  className={cn(
                    'size-4',
                    active ? 'text-accent' : 'text-faint group-hover:text-muted',
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {banner}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-md md:px-6">
          <Link
            href="/dashboard"
            className="font-mono text-[12px] tracking-[0.32em] text-accent uppercase md:hidden"
          >
            Reel
          </Link>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden h-8 w-full max-w-md items-center gap-2 rounded-md border border-line bg-surface px-2.5 text-left text-xs text-muted transition-colors hover:border-line-strong hover:text-fg md:flex"
          >
            <Search className="size-3.5" />
            <span className="flex-1 truncate">
              Search {current ? current.label.toLowerCase() : 'Reel'}, jump anywhere, run an action…
            </span>
            <Kbd>{modKey()}</Kbd>
            <Kbd>K</Kbd>
          </button>
          <IngestState />
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label="Search"
              onClick={() => setPaletteOpen(true)}
            >
              <Search className="size-4" />
            </Button>
            <ThemeToggle />
            <Menu>
              <MenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 pl-1.5"
                  aria-label="Account menu"
                >
                  <span className="flex size-5 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <UserRound className="size-3" />
                  </span>
                  <span className="hidden max-w-40 truncate text-xs sm:inline">{email}</span>
                </Button>
              </MenuTrigger>
              <MenuContent>
                <MenuLabel>Signed in as</MenuLabel>
                <div className="truncate px-2 pb-1.5 text-xs text-muted">{email}</div>
                <MenuSeparator />
                <MenuItem asChild>
                  <Link href="/settings/account">Account settings</Link>
                </MenuItem>
                <MenuItem asChild>
                  <Link href="/settings/sources">Sources &amp; ingest</Link>
                </MenuItem>
                <MenuSeparator />
                <MenuItem onSelect={() => logout.mutate()} disabled={logout.isPending}>
                  <LogOut className="size-3.5" /> Log out
                </MenuItem>
              </MenuContent>
            </Menu>
          </div>
        </header>

        <main className="flex-1 px-4 pt-6 pb-24 md:px-6 md:pb-10 lg:px-8">
          <div className="mx-auto w-full max-w-[1200px]">{children}</div>
        </main>
      </div>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2 text-[10.5px] transition-colors',
                active ? 'text-accent' : 'text-faint',
              )}
            >
              <Icon className="size-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        email={session.data?.email ?? email}
      />
    </div>
  );
}
