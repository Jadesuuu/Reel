'use client';

import { AuthForm } from '../../components/auth-form';
import { useRegister } from '../../lib/session';

export default function RegisterPage() {
  const register = useRegister();

  return (
    <AuthForm
      title="Create your account"
      submitLabel="Create account"
      pending={register.isPending}
      error={register.error}
      footer={{
        prompt: 'Already have one?',
        href: '/login',
        label: 'Sign in',
      }}
      onSubmit={(credentials) => register.mutate(credentials)}
    />
  );
}
