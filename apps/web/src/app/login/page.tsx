'use client';

import { AuthForm } from '../../components/auth-form';
import { useLogin } from '../../lib/session';

export default function LoginPage() {
  const login = useLogin();

  return (
    <AuthForm
      mode="login"
      pending={login.isPending}
      error={login.error}
      onSubmit={(credentials) => login.mutate(credentials)}
    />
  );
}
