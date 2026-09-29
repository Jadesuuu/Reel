export type RemoteType = 'REMOTE' | 'HYBRID' | 'ONSITE' | 'UNKNOWN';

export type Stage = 'SAVED' | 'APPLIED' | 'INTERVIEWING' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';

export type Source =
  | 'HN'
  | 'REMOTIVE'
  | 'REMOTEOK'
  | 'ARBEITNOW'
  | 'HIMALAYAS'
  | 'JOBICY'
  | 'WEWORKREMOTELY'
  | 'GREENHOUSE'
  | 'LEVER'
  | 'ASHBY'
  | 'WORKINGNOMADS'
  | 'LANDINGJOBS'
  | 'THEMUSE'
  | 'JOBSPRESSO'
  | 'WORKABLE'
  | 'SMARTRECRUITERS'
  | 'HIRINGCAFE'
  | 'WELLFOUND'
  | 'JOBSTREET'
  | 'KALIBRR';

export type BrowserSource = 'HIRINGCAFE' | 'WELLFOUND';

export type BoardProvider = 'GREENHOUSE' | 'LEVER' | 'ASHBY' | 'WORKABLE' | 'SMARTRECRUITERS';

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
  regionKeywords: string[];
  nearbyKeywords: string[];
  levels: Level[];
  minSalaryUsd: number | null;
};

export const LEVELS = ['intern', 'junior', 'mid', 'senior', 'lead'] as const;
export type Level = (typeof LEVELS)[number];

export type PostingSummary = {
  id: string;
  source: Source;
  url: string | null;
  company: string | null;
  role: string | null;
  location: string | null;
  remote: RemoteType;
  salaryText: string | null;
  salaryMinUsd: number | null;
  salaryMaxUsd: number | null;
  stackKeywords: string[];
  regionTerms: string[];
  level: Level | null;
  applyUrl: string | null;
  headline: string;
  postedAt: string;
};

export type TrackedApplication = { id: string; stage: Stage };

export type Tracked<T> = T & { application: TrackedApplication | null };

export type Posting = PostingSummary & {
  externalId: string;
  boardId: string;
  author: string;
  fingerprint: string;
  createdAt: string;
  updatedAt: string;
  rawText?: string;
};

export type PostingStats = {
  total: number;
  bySource: Array<{ source: Source; count: number; latestPostedAt: string | null }>;
  byRemote: Array<{ remote: RemoteType; count: number }>;
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
  application: TrackedApplication | null;
};

export type EventKind = 'STAGE_CHANGE' | 'NOTE';

export type StageEvent = {
  id: string;
  applicationId: string;
  fromStage: Stage | null;
  toStage: Stage;
  kind: EventKind;
  note: string | null;
  createdAt: string;
};

export type ReminderKind = 'STALE_APPLICATION' | 'FOLLOW_UP';

export type Reminder = {
  id: string;
  applicationId: string;
  kind: ReminderKind;
  dueAt: string;
  sentAt: string | null;
  cancelledAt: string | null;
  jobId: string;
  createdAt: string;
};

export type ReminderSummary = Pick<Reminder, 'id' | 'kind' | 'dueAt'>;

export type Application = {
  id: string;
  userId: string;
  postingId: string | null;
  company: string;
  role: string;
  url: string | null;
  stage: Stage;
  notes: string | null;
  location: string | null;
  salaryText: string | null;
  via: string | null;
  appliedAt: string | null;
  nextStepAt: string | null;
  contactName: string | null;
  contactEmail: string | null;
  stageChangedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationListItem = Application & {
  reminders: ReminderSummary[];
  posting: { source: Source } | null;
};

export type ApplicationDetail = Application & {
  events: StageEvent[];
  posting: PostingSummary | null;
  reminders: Reminder[];
};

export type UpcomingItem = {
  applicationId: string;
  company: string;
  role: string;
  stage: Stage;
  at: string;
  kind: 'REMINDER' | 'NEXT_STEP';
};

export type WeeklyBucket = {
  weekStart: string;
  applied: number;
  interviewing: number;
  offer: number;
  rejected: number;
};

export type ApplicationStats = {
  total: number;
  active: number;
  byStage: Record<Stage, number>;
  appliedThisWeek: number;
  responseRate: number | null;
  medianDaysToResponse: number | null;
  upcoming: UpcomingItem[];
  weekly: WeeklyBucket[];
};

export type RunStatus = 'WAITING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export type IngestRun = {
  id: string;
  source: Source;
  boardId: string;
  status: RunStatus;
  startedAt: string;
  finishedAt: string | null;
  itemsSeen: number;
  postingsCreated: number;
  postingsUpdated: number;
  error: string | null;
};

export type SourceKind = 'feed' | 'board' | 'browser';

export type SourceInfo = {
  source: Source;
  label: string;
  kind: SourceKind;
  homepage: string;
  attribution: string | null;
  defaultBoardId: string | null;
  enabled: boolean;
  postings: number;
  lastRun: IngestRun | null;
};

export type BrowserStatus = {
  linked: boolean;
  connected: boolean;
  createdAt: string | null;
  lastSeenAt: string | null;
  userAgent: string | null;
};

export type BrowserToken = { token: string; createdAt: string };

export type WatchedBoard = {
  id: string;
  provider: BoardProvider;
  slug: string;
  company: string;
  createdAt: string;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type CreateApplicationInput = {
  postingId?: string;
  company?: string;
  role?: string;
  url?: string;
  notes?: string;
  location?: string;
  salaryText?: string;
  via?: string;
  nextStepAt?: string;
  contactName?: string;
  contactEmail?: string;
};

export type UpdateApplicationInput = Partial<{
  company: string;
  role: string;
  url: string | null;
  notes: string;
  location: string | null;
  salaryText: string | null;
  via: string | null;
  appliedAt: string | null;
  nextStepAt: string | null;
  contactName: string | null;
  contactEmail: string | null;
}>;
