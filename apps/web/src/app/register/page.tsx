'use client';

import { AuthForm } from '../../components/auth-form';
import { useRegister } from '../../lib/session';

export default function RegisterPage() {
  const register = useRegister();

  return (
    <AuthForm
      mode="register"
      pending={register.isPending}
      error={register.error}
      onSubmit={(credentials) => register.mutate(credentials)}
    />
  );
}
