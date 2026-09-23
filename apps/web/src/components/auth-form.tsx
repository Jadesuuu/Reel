'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { ApiError } from '../lib/api';
import { STAGE_LABEL, ACTIVE_STAGES } from '../lib/stages';
import { StageStamp } from './stage-stamp';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';
import { Field, Input } from './ui/input';

type AuthFormProps = {
  mode: 'login' | 'register';
  pending: boolean;
  error: unknown;
  onSubmit: (credentials: { email: string; password: string }) => void;
  extra?: React.ReactNode;
};

function errorMessage(error: unknown): string | null {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'That email and password do not match.';
    if (error.status === 409) return 'An account with that email already exists.';
    if (error.status === 429) return 'Too many attempts. Wait a minute and try again.';
    return error.message;
  }
  if (error instanceof Error) {
    return 'The API did not answer. Is it running?';
  }
  return null;
}

const PREVIEW = [
  { company: 'Northwind Labs', role: 'Full Stack Engineer', stage: 'INTERVIEWING', days: 3 },
  { company: 'Contoso', role: 'Backend Engineer', stage: 'APPLIED', days: 9 },
  { company: 'Initech', role: 'Platform Engineer', stage: 'SAVED', days: 1 },
] as const;

export function AuthForm({ mode, pending, error, onSubmit, extra }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const message = errorMessage(error);
  const isRegister = mode === 'register';

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden border-r border-line bg-surface lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="surface-noise pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative">
          <span className="font-mono text-[12px] tracking-[0.32em] text-accent uppercase">
            Reel
          </span>
          <h2 className="mt-10 max-w-md text-[34px] leading-[1.1] font-semibold tracking-tight text-fg">
            Ten job sources read for you. Every posting scored. Nothing forgotten.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            The monthly Hacker News thread, six remote boards, and any company careers page you
            watch — parsed, scored against your criteria, and tracked from saved to offer with
            reminders that only fire when something has gone quiet.
          </p>
        </div>

        <div className="relative">
          <ul className="space-y-2">
            {PREVIEW.map((item, index) => (
              <motion.li
                key={item.company}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * index + 0.1, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="flex items-center gap-3 rounded-md border border-line bg-canvas/60 px-3.5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{item.company}</p>
                  <p className="truncate text-xs text-muted">{item.role}</p>
                </div>
                <span className="tabular font-mono text-[11px] text-faint">{item.days}d</span>
                <StageStamp stage={item.stage} />
              </motion.li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-1.5">
            {ACTIVE_STAGES.map((stage, index) => (
              <span key={stage} className="flex items-center gap-1.5 text-[11px] text-faint">
                {STAGE_LABEL[stage]}
                {index < ACTIVE_STAGES.length - 1 ? <ArrowRight className="size-3" /> : null}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col px-5 py-8 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between lg:justify-end">
          <span className="font-mono text-[12px] tracking-[0.32em] text-accent uppercase lg:hidden">
            Reel
          </span>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center">
          <div className="w-full max-w-sm">
            <h1 className="text-[22px] font-semibold tracking-tight text-fg">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {isRegister
                ? 'One account, one pipeline. Your data never leaves your database.'
                : 'Sign in to pick up where you left off.'}
            </p>

            <form
              className="mt-8 space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit({ email: email.trim().toLowerCase(), password });
              }}
            >
              <Field label="Email" htmlFor="email">
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Field>

              <Field
                label="Password"
                htmlFor="password"
                hint={isRegister ? 'at least 10 characters' : undefined}
              >
                <Input
                  id="password"
                  type="password"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  required
                  minLength={10}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-invalid={message ? true : undefined}
                />
              </Field>

              {message ? (
                <p
                  role="alert"
                  className="rounded-md border border-danger/40 bg-danger-soft px-3 py-2 text-xs text-fg"
                >
                  {message}
                </p>
              ) : null}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={pending}
              >
                {isRegister ? 'Create account' : 'Sign in'}
              </Button>
              {extra}
            </form>

            <p className="mt-6 text-xs text-muted">
              {isRegister ? 'Already have an account? ' : 'No account yet? '}
              <Link
                href={isRegister ? '/login' : '/register'}
                className="text-accent hover:underline"
              >
                {isRegister ? 'Sign in' : 'Create one'}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
