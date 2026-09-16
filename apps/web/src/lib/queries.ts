'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiFetch, apiPatch, apiPost, apiPut } from './api';
import type {
  Application,
  ApplicationDetail,
  Criteria,
  IngestRun,
  Match,
  Paginated,
  Posting,
  Stage,
} from './types';

function query(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const text = search.toString();
  return text.length > 0 ? `?${text}` : '';
}

export function useMatches(options: { dismissed: boolean; page: number }) {
  return useQuery({
    queryKey: ['matches', options],
    queryFn: () =>
      apiFetch<Paginated<Match>>(
        `/matches${query({ dismissed: options.dismissed, page: options.page, pageSize: 25 })}`,
      ),
  });
}

export function useDismissMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<Match>(`/matches/${id}/dismiss`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matches'] }),
  });
}

export function useRescore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<{ rescored: number }>('/matches/rescore'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matches'] }),
  });
}

export function usePostings(options: { q: string; remote: string; page: number }) {
  return useQuery({
    queryKey: ['postings', options],
    queryFn: () =>
      apiFetch<Paginated<Posting>>(
        `/postings${query({ q: options.q, remote: options.remote, page: options.page, pageSize: 25 })}`,
      ),
  });
}

export function usePosting(id: string | null) {
  return useQuery({
    queryKey: ['posting', id],
    queryFn: () => apiFetch<Posting>(`/postings/${id!}`),
    enabled: id !== null,
  });
}

export function useApplications(stage?: Stage) {
  return useQuery({
    queryKey: ['applications', stage ?? 'all'],
    queryFn: () =>
      apiFetch<Paginated<Application>>(`/applications${query({ stage, pageSize: 100 })}`),
  });
}

export function useApplication(id: string | null) {
  return useQuery({
    queryKey: ['application', id],
    queryFn: () => apiFetch<ApplicationDetail>(`/applications/${id!}`),
    enabled: id !== null,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      postingId?: string;
      company?: string;
      role?: string;
      url?: string;
      notes?: string;
    }) => apiPost<Application>('/applications', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  });
}

export function useUpdateApplication(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { company?: string; role?: string; url?: string; notes?: string }) =>
      apiPatch<Application>(`/applications/${id}`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      await queryClient.invalidateQueries({ queryKey: ['application', id] });
    },
  });
}

export function useChangeStage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { to: Stage; note?: string }) =>
      apiPost<Application>(`/applications/${id}/stage`, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['applications'] });
      await queryClient.invalidateQueries({ queryKey: ['application', id] });
    },
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/applications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  });
}

export function useCriteria() {
  return useQuery({
    queryKey: ['criteria'],
    queryFn: () => apiFetch<Criteria>('/criteria'),
  });
}

export function useSaveCriteria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      remoteOnly: boolean;
      roleKeywords: string[];
      includeKeywords: string[];
      excludeKeywords: string[];
      minSalaryUsd?: number | null;
    }) => apiPut<Criteria>('/criteria', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['criteria'] }),
  });
}

export function useIngestRuns() {
  return useQuery({
    queryKey: ['ingest-runs'],
    queryFn: () => apiFetch<Paginated<IngestRun>>('/ingest/runs?page=1&pageSize=10'),
    refetchInterval: 10_000,
  });
}

export function useRunIngest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<{ jobId: string }>('/ingest/run', {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ingest-runs'] }),
  });
}
