export const INGEST_QUEUE = 'ingest';
export const INGEST_ALL_JOB = 'ingest-all';
export const INGEST_SOURCE_JOB = 'ingest-source';
export const INGEST_CRON = '0 */6 * * *';
export const INGEST_SCHEDULER_ID = 'ingest-every-6h';

export const INGEST_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 10_000 },
  removeOnComplete: 50,
  removeOnFail: 100,
} as const;

export function ingestStamp(now: Date = new Date()): string {
  return now.toISOString().slice(0, 16).replace(/[-:T]/g, '');
}
