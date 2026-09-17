'use client';

import { AuthForm } from '../../components/auth-form';
import { useLogin } from '../../lib/session';

export default function LoginPage() {
  const login = useLogin();

  return (
    <AuthForm
      title="Sign in"
      submitLabel="Sign in"
      pending={login.isPending}
      error={login.error}
      footer={{
        prompt: 'No account?',
        href: '/register',
        label: 'Create one',
      }}
      onSubmit={(credentials) => login.mutate(credentials)}
    />
  );
}
