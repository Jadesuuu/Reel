'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../../../lib/cn';
import { PageHeader } from '../../../components/ui/states';

const TABS = [
  { href: '/settings/criteria', label: 'Criteria', hint: 'What counts as a match' },
  { href: '/settings/sources', label: 'Sources', hint: 'Feeds and company boards' },
  { href: '/settings/ingest', label: 'Ingest runs', hint: 'What the worker did' },
  { href: '/settings/account', label: 'Account', hint: 'You and this device' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <PageHeader
        title="Settings"
        lede="Criteria drive the score. Sources drive what gets scored."
      />
      <div className="grid gap-8 lg:grid-cols-[210px_1fr]">
        <nav aria-label="Settings" className="flex flex-wrap gap-1.5 lg:flex-col">
          {TABS.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'shrink-0 rounded-md px-4 py-2.5 text-body transition-colors',
                  active ? 'bg-surface-3 text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg',
                )}
              >
                <span className="block">{tab.label}</span>
                <span className="hidden text-caption text-muted lg:block">{tab.hint}</span>
              </Link>
            );
          })}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
