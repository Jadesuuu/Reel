'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { MotionConfig } from 'motion/react';
import { Tooltip } from 'radix-ui';
import { Toaster } from 'sonner';
import { ApiError } from '../lib/api';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) =>
              error instanceof ApiError && error.status < 500 ? false : failureCount < 2,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={client}>
        <MotionConfig reducedMotion="user" transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}>
          <Tooltip.Provider delayDuration={350} skipDelayDuration={400}>
            {children}
            <Toaster
              position="bottom-right"
              closeButton
              offset={20}
              toastOptions={{
                classNames: {
                  toast:
                    '!bg-surface-2 !border !border-line !text-fg !shadow-lg !rounded-md !text-[13px]',
                  description: '!text-muted',
                  actionButton: '!bg-accent !text-accent-fg !font-medium',
                  cancelButton: '!bg-surface-3 !text-fg',
                  closeButton: '!bg-surface-2 !border-line !text-muted hover:!text-fg',
                },
              }}
            />
          </Tooltip.Provider>
        </MotionConfig>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
