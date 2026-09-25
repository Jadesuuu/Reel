'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/app-shell';
import { DemoBanner } from '../../components/demo-banner';
import { isDemoMode } from '../../demo';
import { useHotkeys } from '../../lib/keyboard';
import { useSession } from '../../lib/session';

const GO: Record<string, string> = {
  d: '/dashboard',
  i: '/inbox',
  p: '/postings',
  b: '/pipeline',
  s: '/settings/criteria',
};

function useGoShortcuts() {
  const router = useRouter();
  const armed = useRef<number | null>(null);

  useHotkeys(
    useMemo(
      () => [
        {
          key: 'g',
          handler: () => {
            armed.current = Date.now();
          },
        },
        ...Object.entries(GO).map(([key, href]) => ({
          key,
          handler: () => {
            if (armed.current && Date.now() - armed.current < 1200) {
              armed.current = null;
              router.push(href);
            }
          },
        })),
      ],
      [router],
    ),
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useSession();
  useGoShortcuts();

  useEffect(() => {
    if (session.isError) {
      router.replace('/login');
    }
  }, [session.isError, router]);

  if (session.isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center" aria-busy>
        <span className="font-mono text-caption tracking-[0.32em] text-accent uppercase">Reel</span>
      </div>
    );
  }

  if (!session.data) {
    return null;
  }

  return (
    <AppShell email={session.data.email} banner={isDemoMode() ? <DemoBanner /> : undefined}>
      {children}
    </AppShell>
  );
}
