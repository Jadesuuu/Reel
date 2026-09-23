let offsetMs = 0;

export function now(): Date {
  return new Date(Date.now() + offsetMs);
}

export function nowMs(): number {
  return Date.now() + offsetMs;
}

export function setClockOffset(ms: number): void {
  offsetMs = ms;
}

export function getClockOffset(): number {
  return offsetMs;
}
