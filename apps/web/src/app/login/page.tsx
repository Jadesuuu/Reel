'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { AuthForm } from '../../components/auth-form';
import { Button } from '../../components/ui/button';
import { isDemoMode } from '../../demo';
import { apiPost } from '../../lib/api';
import { HOME, SESSION_KEY, useLogin } from '../../lib/session';
import type { User } from '../../lib/types';

function DemoEntry() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const enter = useMutation({
    mutationFn: () => apiPost<User>('/auth/demo'),
    onSuccess: (user) => {
      queryClient.setQueryData(SESSION_KEY, user);
      router.push(HOME);
    },
  });

  return (
    <div className="mt-4 border-t border-line pt-4">
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        loading={enter.isPending}
        onClick={() => enter.mutate()}
      >
        <Sparkles className="size-4 text-accent" /> Continue as the demo user
      </Button>
      <p className="mt-2 text-center text-xs text-faint">
        A seeded account with ten sources, a scored inbox and a live pipeline. Data stays in this
        browser.
      </p>
    </div>
  );
}

export default function LoginPage() {
  const login = useLogin();

  return (
    <AuthForm
      mode="login"
      pending={login.isPending}
      error={login.error}
      onSubmit={(credentials) => login.mutate(credentials)}
      extra={isDemoMode() ? <DemoEntry /> : undefined}
    />
  );
}
