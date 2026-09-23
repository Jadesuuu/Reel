'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  Briefcase,
  Inbox,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Moon,
  Newspaper,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { useHotkeys } from '../lib/keyboard';
import { useApplications, useRescore, useRunIngest } from '../lib/queries';
import { useLogout } from '../lib/session';
import { STAGE_LABEL } from '../lib/stages';
import { StageDot } from './stage-stamp';
import { Kbd } from './ui/kbd';

const PAGES = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, keys: 'g d' },
  { href: '/inbox', label: 'Inbox', icon: Inbox, keys: 'g i' },
  { href: '/postings', label: 'Postings', icon: Newspaper, keys: 'g p' },
  { href: '/pipeline', label: 'Pipeline', icon: KanbanSquare, keys: 'g b' },
  { href: '/settings/criteria', label: 'Settings', icon: Settings, keys: 'g s' },
];

export function CommandPalette({
  open,
  onOpenChange,
  email,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const logout = useLogout();
  const rescore = useRescore();
  const runIngest = useRunIngest();
  const [search, setSearch] = useState('');
  const applications = useApplications();

  useHotkeys(
    useMemo(
      () => [{ key: 'k', meta: true, allowInInput: true, handler: () => onOpenChange(!open) }],
      [open, onOpenChange],
    ),
  );

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  const items = applications.data?.items ?? [];

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command palette"
      shouldFilter
      overlayClassName="reel-overlay fixed inset-0 z-[70] bg-canvas/70 backdrop-blur-[2px]"
      contentClassName="reel-dialog-enter fixed top-[14vh] left-1/2 z-[80] w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-lg border border-line bg-surface shadow-lg"
    >
      <div className="flex items-center gap-2 border-b border-line px-3">
        <Sparkles className="size-4 text-accent" aria-hidden />
        <Command.Input
          value={search}
          onValueChange={setSearch}
          placeholder="Jump to a page, an application, or run an action…"
          className="h-12 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-faint"
        />
        <Kbd>Esc</Kbd>
      </div>
      <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto p-1.5 [&_[cmdk-group-heading]]:stamp [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-faint">
        <Command.Empty className="px-3 py-8 text-center text-sm text-muted">
          Nothing matches “{search}”.
        </Command.Empty>

        <Command.Group heading="Go to">
          {PAGES.map((page) => {
            const Icon = page.icon;
            return (
              <Item key={page.href} onSelect={() => go(page.href)} keywords={[page.label]}>
                <Icon className="size-4 text-faint" />
                <span className="flex-1">{page.label}</span>
                <span className="flex gap-1">
                  {page.keys.split(' ').map((key) => (
                    <Kbd key={key}>{key}</Kbd>
                  ))}
                </span>
              </Item>
            );
          })}
        </Command.Group>

        <Command.Group heading="Actions">
          <Item onSelect={() => go('/pipeline?new=1')} keywords={['add', 'create', 'application']}>
            <Plus className="size-4 text-faint" />
            <span className="flex-1">Add an application</span>
            <Kbd>N</Kbd>
          </Item>
          <Item
            onSelect={() => {
              onOpenChange(false);
              rescore.mutate(undefined, {
                onSuccess: (data) => toast.success(`Rescored — ${data.rescored} matches`),
                onError: () => toast.error('Could not rescore'),
              });
            }}
            keywords={['score', 'matches']}
          >
            <RefreshCw className="size-4 text-faint" />
            <span className="flex-1">Rescore matches against my criteria</span>
          </Item>
          <Item
            onSelect={() => {
              onOpenChange(false);
              runIngest.mutate(
                {},
                {
                  onSuccess: () =>
                    toast.success('Ingest queued', {
                      description: 'Every enabled source will run in the worker.',
                      action: { label: 'Watch', onClick: () => router.push('/settings/ingest') },
                    }),
                  onError: () => toast.error('Could not queue the ingest'),
                },
              );
            }}
            keywords={['fetch', 'sync', 'sources', 'run']}
          >
            <Newspaper className="size-4 text-faint" />
            <span className="flex-1">Run ingest for every enabled source</span>
          </Item>
          <Item
            onSelect={() => {
              setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
              onOpenChange(false);
            }}
            keywords={['theme', 'dark', 'light']}
          >
            {resolvedTheme === 'light' ? (
              <Moon className="size-4 text-faint" />
            ) : (
              <Sun className="size-4 text-faint" />
            )}
            <span className="flex-1">
              Switch to {resolvedTheme === 'light' ? 'dark' : 'light'} theme
            </span>
          </Item>
          <Item onSelect={() => logout.mutate()} keywords={['sign out', email]}>
            <LogOut className="size-4 text-faint" />
            <span className="flex-1">Log out</span>
          </Item>
        </Command.Group>

        {items.length > 0 ? (
          <Command.Group heading="Applications">
            {items.slice(0, 40).map((application) => (
              <Item
                key={application.id}
                value={`${application.company} ${application.role} ${application.id}`}
                onSelect={() => go(`/pipeline?open=${application.id}`)}
                keywords={[application.company, application.role, STAGE_LABEL[application.stage]]}
              >
                <Briefcase className="size-4 text-faint" />
                <span className="min-w-0 flex-1 truncate">
                  {application.company}
                  <span className="text-muted"> · {application.role}</span>
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-faint">
                  <StageDot stage={application.stage} /> {STAGE_LABEL[application.stage]}
                </span>
              </Item>
            ))}
          </Command.Group>
        ) : null}
      </Command.List>
    </Command.Dialog>
  );
}

function Item({
  children,
  onSelect,
  value,
  keywords,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  value?: string;
  keywords?: string[];
}) {
  return (
    <Command.Item
      value={value}
      keywords={keywords}
      onSelect={onSelect}
      className="flex cursor-default items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-fg data-[selected=true]:bg-surface-3"
    >
      {children}
    </Command.Item>
  );
}
