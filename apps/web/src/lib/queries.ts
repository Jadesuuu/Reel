'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiFetch, apiPatch, apiPost, apiPut } from './api';
import type {
  Application,
  ApplicationDetail,
  ApplicationListItem,
  ApplicationStats,
  BoardProvider,
  BrowserStatus,
  BrowserToken,
  CreateApplicationInput,
  Criteria,
  IngestRun,
  Match,
  Paginated,
  Posting,
  PostingStats,
  Reminder,
  Source,
  SourceInfo,
  Stage,
  StageEvent,
  UpdateApplicationInput,
  WatchedBoard,
  Tracked,
} from './types';

export function query(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  }
  const text = search.toString();
  return text.length > 0 ? `?${text}` : '';
}

export type MatchFilters = {
  dismissed: boolean;
  page: number;
  source?: Source | '';
  minScore?: number;
  pageSize?: number;
};

export function useMatches(filters: MatchFilters) {
  return useQuery({
    queryKey: ['matches', filters],
    queryFn: () =>
      apiFetch<Paginated<Match>>(
        `/matches${query({
          dismissed: filters.dismissed,
          page: filters.page,
          pageSize: filters.pageSize ?? 25,
          source: filters.source,
          minScore: filters.minScore,
        })}`,
      ),
    placeholderData: (previous) => previous,
  });
}

export function usePrefetchMatches(filters: MatchFilters, enabled: boolean) {
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    void queryClient.prefetchQuery({
      queryKey: ['matches', filters],
      queryFn: () =>
        apiFetch<Paginated<Match>>(
          `/matches${query({
            dismissed: filters.dismissed,
            page: filters.page,
            pageSize: filters.pageSize ?? 25,
            source: filters.source,
            minScore: filters.minScore,
          })}`,
        ),
      staleTime: 30_000,
    });
  }, [
    queryClient,
    enabled,
    filters.dismissed,
    filters.page,
    filters.source,
    filters.minScore,
    filters.pageSize,
  ]);
}

export function useDismissMatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<Match>(`/matches/${id}/dismiss`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['matches'] });
      const snapshots = queryClient.getQueriesData<Paginated<Match>>({ queryKey: ['matches'] });
      for (const [key, data] of snapshots) {
        if (!data) continue;
        queryClient.setQueryData<Paginated<Match>>(key, {
          ...data,
          items: data.items.filter((match) => match.id !== id),
          total: Math.max(0, data.total - 1),
        });
      }
      return { snapshots };
    },
    onError: (_error, _id, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['matches'] }),
  });
}

export function useRescore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<{ rescored: number }>('/matches/rescore'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['matches'] }),
  });
}

export type PostingFilters = {
  q: string;
  remote: string;
  source: Source | '';
  stack: string;
  open: boolean;
  page: number;
};

export function usePostings(filters: PostingFilters) {
  return useQuery({
    queryKey: ['postings', filters],
    queryFn: () =>
      apiFetch<Paginated<Tracked<Posting>>>(
        `/postings${query({
          q: filters.q,
          remote: filters.remote,
          source: filters.source,
          stack: filters.stack,
          open: filters.open ? 'true' : undefined,
          page: filters.page,
          pageSize: 25,
        })}`,
      ),
    placeholderData: (previous) => previous,
  });
}

export function usePosting(id: string | null) {
  return useQuery({
    queryKey: ['posting', id],
    queryFn: () => apiFetch<Tracked<Posting>>(`/postings/${id!}`),
    enabled: id !== null,
  });
}

export function usePostingStats() {
  return useQuery({
    queryKey: ['postings', 'stats'],
    queryFn: () => apiFetch<PostingStats>('/postings/stats'),
    staleTime: 60_000,
  });
}

export function useApplications(options: { stage?: Stage; q?: string } = {}) {
  return useQuery({
    queryKey: ['applications', 'list', options],
    queryFn: () =>
      apiFetch<Paginated<ApplicationListItem>>(
        `/applications${query({ stage: options.stage, q: options.q, pageSize: 100 })}`,
      ),
    placeholderData: (previous) => previous,
  });
}

export function useApplication(id: string | null) {
  return useQuery({
    queryKey: ['application', id],
    queryFn: () => apiFetch<ApplicationDetail>(`/applications/${id!}`),
    enabled: id !== null,
  });
}

export function useApplicationStats() {
  return useQuery({
    queryKey: ['applications', 'stats'],
    queryFn: () => apiFetch<ApplicationStats>('/applications/stats'),
  });
}

function invalidateApplications(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  const tasks = [
    queryClient.invalidateQueries({ queryKey: ['applications'] }),
    queryClient.invalidateQueries({ queryKey: ['matches'] }),
    queryClient.invalidateQueries({ queryKey: ['postings'] }),
    queryClient.invalidateQueries({ queryKey: ['posting'] }),
  ];
  if (id) tasks.push(queryClient.invalidateQueries({ queryKey: ['application', id] }));
  return Promise.all(tasks);
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateApplicationInput) =>
      apiPost<Application & { events: StageEvent[] }>('/applications', payload),
    onSuccess: () => invalidateApplications(queryClient),
  });
}

export function useUpdateApplication(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateApplicationInput) =>
      apiPatch<Application>(`/applications/${id}`, payload),
    onSuccess: () => invalidateApplications(queryClient, id),
  });
}

export function useChangeStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; to: Stage; note?: string }) =>
      apiPost<Application>(`/applications/${input.id}/stage`, {
        to: input.to,
        ...(input.note ? { note: input.note } : {}),
      }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['applications', 'list'] });
      const snapshots = queryClient.getQueriesData<Paginated<ApplicationListItem>>({
        queryKey: ['applications', 'list'],
      });
      const nowIso = new Date().toISOString();
      for (const [key, data] of snapshots) {
        if (!data) continue;
        queryClient.setQueryData<Paginated<ApplicationListItem>>(key, {
          ...data,
          items: data.items.map((item) =>
            item.id === input.id ? { ...item, stage: input.to, stageChangedAt: nowIso } : item,
          ),
        });
      }
      return { snapshots };
    },
    onError: (_error, _input, context) => {
      for (const [key, data] of context?.snapshots ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: (_data, _error, input) => invalidateApplications(queryClient, input.id),
  });
}

export function useAddNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (note: string) => apiPost<StageEvent>(`/applications/${id}/notes`, { note }),
    onSuccess: () => invalidateApplications(queryClient, id),
  });
}

export function useScheduleReminder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dueAt: string) => apiPost<Reminder>(`/applications/${id}/reminders`, { dueAt }),
    onSuccess: () => invalidateApplications(queryClient, id),
  });
}

export function useCancelReminder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reminderId: string) =>
      apiDelete<void>(`/applications/${id}/reminders/${reminderId}`),
    onSuccess: () => invalidateApplications(queryClient, id),
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/applications/${id}`),
    onSuccess: () => invalidateApplications(queryClient),
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
      regionKeywords: string[];
      minSalaryUsd?: number | null;
    }) => apiPut<Criteria>('/criteria', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['criteria'] }),
  });
}

export function useSources() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: () => apiFetch<{ items: SourceInfo[] }>('/sources'),
    refetchInterval: 15_000,
  });
}

export function useToggleSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { source: Source; enabled: boolean }) =>
      apiPatch<SourceInfo>(`/sources/${input.source}`, { enabled: input.enabled }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: ['sources'] });
      const previous = queryClient.getQueryData<{ items: SourceInfo[] }>(['sources']);
      if (previous) {
        queryClient.setQueryData<{ items: SourceInfo[] }>(['sources'], {
          items: previous.items.map((item) =>
            item.source === input.source ? { ...item, enabled: input.enabled } : item,
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(['sources'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['sources'] }),
  });
}

export function useBoards() {
  return useQuery({
    queryKey: ['sources', 'boards'],
    queryFn: () => apiFetch<{ items: WatchedBoard[] }>('/sources/boards'),
  });
}

export function useAddBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { provider: BoardProvider; slug: string }) =>
      apiPost<WatchedBoard>('/sources/boards', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sources'] }),
  });
}

export function useRemoveBoard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete<void>(`/sources/boards/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sources'] }),
  });
}

export function useBrowserStatus() {
  return useQuery({
    queryKey: ['browser'],
    queryFn: () => apiFetch<BrowserStatus>('/browser'),
    refetchInterval: 15_000,
  });
}

export function useCreateBrowserToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<BrowserToken>('/browser/token'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['browser'] }),
  });
}

export function useRevokeBrowserToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiDelete<void>('/browser/token'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['browser'] }),
  });
}

export function useIngestRuns(options: { source?: Source | ''; page?: number } = {}) {
  return useQuery({
    queryKey: ['ingest-runs', options],
    queryFn: () =>
      apiFetch<Paginated<IngestRun>>(
        `/ingest/runs${query({ source: options.source, page: options.page ?? 1, pageSize: 20 })}`,
      ),
    refetchInterval: 8_000,
    placeholderData: (previous) => previous,
  });
}

export function useRunIngest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { source?: Source; boardId?: string } = {}) =>
      apiPost<{ jobId: string }>('/ingest/run', input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ingest-runs'] });
      void queryClient.invalidateQueries({ queryKey: ['sources'] });
    },
  });
}
