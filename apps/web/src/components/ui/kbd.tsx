import { cn } from '../../lib/cn';

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-line bg-surface-2 px-1 font-mono text-[10.5px] text-faint',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
