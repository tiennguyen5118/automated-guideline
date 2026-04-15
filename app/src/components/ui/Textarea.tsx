import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
  maxChars?: number;
  currentChars?: number;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, label, error, hint, maxChars, currentChars, id, ...props },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedById = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={fieldId} className="text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
        {typeof maxChars === 'number' && (
          <span
            className={cn(
              'font-mono text-xs tabular-nums',
              (currentChars ?? 0) > maxChars
                ? 'text-[var(--color-danger)]'
                : 'text-[var(--color-text-muted)]',
            )}
          >
            {currentChars ?? 0} / {maxChars}
          </span>
        )}
      </div>
      <textarea
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedById}
        className={cn(
          'flex-1 min-h-[240px] w-full resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm leading-6 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors focus-visible:border-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]',
          error && 'border-[var(--color-danger)]',
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${fieldId}-error`} className="text-xs text-[var(--color-danger)]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="text-xs text-[var(--color-text-muted)]">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
