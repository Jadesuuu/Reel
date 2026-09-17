'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiFetch, apiPost } from './api';
import type { User } from './types';

export const SESSION_KEY = ['auth', 'me'] as const;

export function useSession() {
  return useQuery({
    queryKey: SESSION_KEY,
    queryFn: () => apiFetch<User>('/auth/me'),
    retry: false,
  });
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      apiPost<User>('/auth/login', credentials),
    onSuccess: (user) => {
      queryClient.setQueryData(SESSION_KEY, user);
      router.push('/inbox');
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      apiPost<User>('/auth/register', credentials),
    onSuccess: (user) => {
      queryClient.setQueryData(SESSION_KEY, user);
      router.push('/inbox');
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost<void>('/auth/logout'),
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
    },
  });
}
