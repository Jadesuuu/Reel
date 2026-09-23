'use client';

import { useEffect } from 'react';

type Handler = (event: KeyboardEvent) => void;

export type Hotkey = {
  key: string;
  meta?: boolean;
  shift?: boolean;
  allowInInput?: boolean;
  handler: Handler;
};

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable ||
    target.closest('[cmdk-root]') !== null ||
    target.closest('[role="dialog"]') !== null
  );
}

export function useHotkeys(hotkeys: Hotkey[], enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      for (const hotkey of hotkeys) {
        const wantsMeta = hotkey.meta === true;
        const hasMeta = event.metaKey || event.ctrlKey;
        if (wantsMeta !== hasMeta) continue;
        if ((hotkey.shift ?? false) !== event.shiftKey) continue;
        if (event.key.toLowerCase() !== hotkey.key.toLowerCase()) continue;
        if (!hotkey.allowInInput && isEditable(event.target)) continue;
        event.preventDefault();
        hotkey.handler(event);
        return;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hotkeys, enabled]);
}

export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad/.test(navigator.platform);
}

export function modKey(): string {
  return isMac() ? '⌘' : 'Ctrl';
}
