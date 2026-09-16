export type RemoteType = 'REMOTE' | 'HYBRID' | 'ONSITE' | 'UNKNOWN';

export type Stage = 'SAVED' | 'APPLIED' | 'INTERVIEWING' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';

export type User = {
  id: string;
  email: string;
  timezone?: string;
  createdAt?: string;
};

export type Criteria = {
  id: string | null;
  userId: string;
  remoteOnly: boolean;
  roleKeywords: string[];
  includeKeywords: string[];
  excludeKeywords: string[];
  minSalaryUsd: number | null;
};

export type PostingSummary = {
  id: string;
  company: string | null;
  role: string | null;
  location: string | null;
  remote: RemoteType;
  salaryText: string | null;
  salaryMinUsd: number | null;
  salaryMaxUsd: number | null;
  stackKeywords: string[];
  applyUrl: string | null;
  headline: string;
  postedAt: string;
};

export type Posting = PostingSummary & {
  source: string;
  externalId: string;
  threadId: string;
  author: string;
  fingerprint: string;
  createdAt: string;
  updatedAt: string;
  rawText?: string;
};

export type Match = {
  id: string;
  userId: string;
  postingId: string;
  score: number;
  reasons: string[];
  dismissed: boolean;
  createdAt: string;
  posting: PostingSummary;
};

export type StageEvent = {
  id: string;
  applicationId: string;
  fromStage: Stage | null;
  toStage: Stage;
  note: string | null;
  createdAt: string;
};

export type Reminder = {
  id: string;
  applicationId: string;
  kind: 'STALE_APPLICATION';
  dueAt: string;
  sentAt: string | null;
  cancelledAt: string | null;
  jobId: string;
  createdAt: string;
};

export type Application = {
  id: string;
  userId: string;
  postingId: string | null;
  company: string;
  role: string;
  url: string | null;
  stage: Stage;
  notes: string | null;
  stageChangedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationDetail = Application & {
  events: StageEvent[];
  posting: PostingSummary | null;
  reminders: Reminder[];
};

export type IngestRun = {
  id: string;
  source: string;
  externalThreadId: string;
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  startedAt: string;
  finishedAt: string | null;
  commentsSeen: number;
  postingsCreated: number;
  postingsUpdated: number;
  error: string | null;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};
