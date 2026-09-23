'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';
import { Tip } from './ui/tooltip';

export function ThemeToggle({ size = 'icon-sm' }: { size?: 'icon' | 'icon-sm' }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme !== 'light' : true;
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <Tip content={label} side="bottom">
      <Button
        variant="ghost"
        size={size}
        aria-label={label}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
      >
        <span className="relative block size-4">
          <Sun
            className={`absolute inset-0 size-4 transition-[transform,opacity] duration-200 ease-out ${
              isDark ? 'scale-50 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
            }`}
          />
          <Moon
            className={`absolute inset-0 size-4 transition-[transform,opacity] duration-200 ease-out ${
              isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0'
            }`}
          />
        </span>
      </Button>
    </Tip>
  );
}
