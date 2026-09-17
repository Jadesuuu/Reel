'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Input, Label } from './ui/input';
import { ApiError } from '../lib/api';

type AuthFormProps = {
  title: string;
  submitLabel: string;
  pending: boolean;
  error: unknown;
  footer: { prompt: string; href: string; label: string };
  onSubmit: (credentials: { email: string; password: string }) => void;
};

function errorMessage(error: unknown): string | null {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return 'Something went wrong. Is the API running?';
  }
  return null;
}

export function AuthForm({ title, submitLabel, pending, error, footer, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const message = errorMessage(error);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <div className="mb-1 font-mono text-xs tracking-[0.3em] text-brass-500 uppercase">
            Reel
          </div>
          <h1 className="text-xl font-medium text-text-100">{title}</h1>
        </div>

        <form
          className="rounded border border-ink-700 bg-ink-900 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit({ email, password });
          }}
        >
          <div className="mb-3">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={10}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {message ? (
            <p className="mb-3 rounded border border-danger/40 bg-danger/10 px-2.5 py-1.5 text-xs text-danger">
              {message}
            </p>
          ) : null}

          <Button type="submit" variant="primary" className="w-full" disabled={pending}>
            {pending ? 'Working…' : submitLabel}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-text-500">
          {footer.prompt}{' '}
          <Link href={footer.href} className="text-brass-500 hover:underline">
            {footer.label}
          </Link>
        </p>
      </div>
    </main>
  );
}
