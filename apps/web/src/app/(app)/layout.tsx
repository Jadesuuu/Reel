'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/cn';
import { useLogout, useSession } from '../../lib/session';

const NAV = [
  { href: '/inbox', label: 'Inbox' },
  { href: '/postings', label: 'Postings' },
  { href: '/pipeline', label: 'Pipeline' },
  { href: '/settings', label: 'Settings' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();
  const logout = useLogout();

  useEffect(() => {
    if (session.isError) {
      router.replace('/login');
    }
  }, [session.isError, router]);

  if (session.isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-xs text-text-500">
        Loading…
      </div>
    );
  }

  if (!session.data) {
    return null;
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-ink-700 bg-ink-950/90 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-4 px-4">
          <Link
            href="/inbox"
            className="font-mono text-xs tracking-[0.3em] text-brass-500 uppercase"
          >
            Reel
          </Link>

          <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded px-2.5 py-1.5 text-sm whitespace-nowrap transition-colors',
                  pathname.startsWith(item.href)
                    ? 'bg-ink-800 text-text-100'
                    : 'text-text-300 hover:bg-ink-850 hover:text-text-100',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <span className="hidden text-xs text-text-500 sm:inline">{session.data.email}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
