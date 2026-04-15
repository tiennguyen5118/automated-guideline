import { cn } from '@/lib/cn';

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span role="status" aria-label={label} className="inline-flex items-center">
      <span
        aria-hidden="true"
        className={cn(
          'inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]',
          className,
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
