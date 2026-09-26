'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Newspaper,
  RefreshCw,
  Search,
  Settings,
  UserRound,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { modKey } from '../lib/keyboard';
import { useIngestRuns, useRunIngest } from '../lib/queries';
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
  const router = useRouter();
  const runs = useIngestRuns({ page: 1 });
  const runIngest = useRunIngest();
  const running = runs.data?.items.filter((run) => run.status === 'RUNNING').length ?? 0;
  const latest = runs.data?.items[0];
  const busy = running > 0 || runIngest.isPending;

  const refetch = () =>
    runIngest.mutate(
      {},
      {
        onSuccess: () =>
          toast.success('Refetching every source', {
            description:
              'Each enabled source runs in the worker. New postings are scored as they land.',
            action: { label: 'Watch', onClick: () => router.push('/settings/ingest') },
          }),
        onError: () => toast.error('Could not queue the refetch. Is the API running?'),
      },
    );

  return (
    <div className="flex items-center">
      {latest ? (
        <Tip
          content={
            running > 0
              ? `${running} ingest ${running === 1 ? 'job' : 'jobs'} running`
              : `Last ingest ${relativeTime(latest.startedAt)} · ${latest.status.toLowerCase()}`
          }
          side="bottom"
        >
          <Link
            href="/settings/ingest"
            aria-label={
              running > 0 ? 'Ingest running' : `Last ingest ${relativeTime(latest.startedAt)}`
            }
            className="inline-flex h-8 items-center gap-2 rounded-md px-2 font-mono text-stamp tracking-wide text-faint uppercase transition-colors duration-150 hover:bg-surface-2 hover:text-fg"
          >
            <span
              className={cn(
                'size-2 rounded-full',
                running > 0
                  ? 'animate-pulse bg-info'
                  : latest.status === 'FAILED'
                    ? 'bg-danger'
                    : 'bg-success',
              )}
            />
            <span className="tabular hidden sm:inline">
              {running > 0 ? 'ingesting' : relativeTime(latest.startedAt)}
            </span>
          </Link>
        </Tip>
      ) : null}
      <Tip content="Refetch every source" side="bottom">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={busy ? 'Refetching every source' : 'Refetch every source'}
          aria-busy={busy}
          disabled={busy}
          onClick={refetch}
        >
          <RefreshCw
            className={cn('size-5', busy && 'animate-spin text-info motion-reduce:animate-none')}
          />
        </Button>
      </Tip>
    </div>
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
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="flex h-16 items-center px-6">
          <Link
            href="/dashboard"
            className="font-mono text-caption tracking-[0.32em] text-accent uppercase"
          >
            Reel
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-4" aria-label="Primary">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'group flex h-11 items-center gap-3 rounded-md px-3 text-body transition-colors duration-150',
                  active ? 'bg-surface-3 text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
                )}
              >
                <Icon
                  className={cn(
                    'size-5',
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
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-md md:px-6">
          <Link
            href="/dashboard"
            className="font-mono text-caption tracking-[0.32em] text-accent uppercase md:hidden"
          >
            Reel
          </Link>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden h-10 w-full max-w-lg items-center gap-2.5 rounded-md border border-line bg-surface px-3 text-left text-body-sm text-muted transition-colors hover:border-line-strong hover:text-fg md:flex"
          >
            <Search className="size-4" />
            <span className="flex-1 truncate">
              Search {current ? current.label.toLowerCase() : 'Reel'}, jump anywhere, run an action…
            </span>
            <Kbd>{modKey()}</Kbd>
            <Kbd>K</Kbd>
          </button>
          <div className="ml-auto flex items-center gap-1.5">
            <IngestState />
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label="Search"
              onClick={() => setPaletteOpen(true)}
            >
              <Search className="size-5" />
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
                  <span className="flex size-6 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <UserRound className="size-4" />
                  </span>
                  <span className="hidden max-w-48 truncate text-body-sm sm:inline">{email}</span>
                </Button>
              </MenuTrigger>
              <MenuContent>
                <MenuLabel>Signed in as</MenuLabel>
                <div className="truncate px-2 pb-2 text-body-sm text-muted">{email}</div>
                <MenuSeparator />
                <MenuItem asChild>
                  <Link href="/settings/account">Account settings</Link>
                </MenuItem>
                <MenuItem asChild>
                  <Link href="/settings/sources">Sources &amp; ingest</Link>
                </MenuItem>
                <MenuSeparator />
                <MenuItem onSelect={() => logout.mutate()} disabled={logout.isPending}>
                  <LogOut className="size-4" /> Log out
                </MenuItem>
              </MenuContent>
            </Menu>
          </div>
        </header>

        <main className="flex-1 px-4 pt-8 pb-28 md:px-8 md:pb-12 lg:px-10">
          <div className="mx-auto w-full max-w-[1360px]">{children}</div>
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
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-fine font-medium transition-colors',
                active ? 'text-accent' : 'text-faint',
              )}
            >
              <Icon className="size-[22px]" />
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
