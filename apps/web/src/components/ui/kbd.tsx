import { cn } from '../../lib/cn';

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-6 min-w-6 items-center justify-center rounded-sm border border-line bg-surface-2 px-1.5 font-mono text-stamp text-faint',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
