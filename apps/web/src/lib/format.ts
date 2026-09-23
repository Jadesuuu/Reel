import { nowMs } from './clock';

const DAY_MS = 24 * 60 * 60 * 1000;

export function daysSince(iso: string): number {
  const ms = nowMs() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / DAY_MS));
}

export function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - nowMs();
  return Math.ceil(ms / DAY_MS);
}

export function relativeDays(iso: string): string {
  const days = daysSince(iso);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? 'last week' : `${weeks} weeks ago`;
  }
  return shortDate(iso);
}

export function relativeTime(iso: string): string {
  const diff = nowMs() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (Math.abs(minutes) < 1) return 'just now';
  if (Math.abs(minutes) < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return `${hours} h ago`;
  return relativeDays(iso);
}

export function dueLabel(iso: string): string {
  const days = daysUntil(iso);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'due today';
  if (days === 1) return 'due tomorrow';
  return `in ${days} days`;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDateInputValue(value: string): string | null {
  if (!value) return null;
  const date = new Date(`${value}T09:00:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function hostOf(url: string): string | null {
  try {
    const host = new URL(url).host.replace(/^www\./, '');
    return /^[a-z0-9.-]+\.[a-z]{2,}(?::\d+)?$/i.test(host) ? host : null;
  } catch {
    return null;
  }
}

export function percent(value: number | null): string {
  if (value === null) return '—';
  return `${Math.round(value * 100)}%`;
}

export function compact(value: number): string {
  return new Intl.NumberFormat(undefined, { notation: 'compact' }).format(value);
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

export function initials(text: string): string {
  const words = text
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

export function remoteLabel(remote: string): string {
  switch (remote) {
    case 'REMOTE':
      return 'Remote';
    case 'HYBRID':
      return 'Hybrid';
    case 'ONSITE':
      return 'On-site';
    default:
      return 'Unspecified';
  }
}
