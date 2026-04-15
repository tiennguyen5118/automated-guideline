import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

const alertVariants = cva(
  'flex items-start gap-3 rounded-md border px-4 py-3 text-sm',
  {
    variants: {
      variant: {
        info: 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]',
        error:
          'border-[var(--color-danger)]/40 bg-[var(--color-danger-surface)] text-[var(--color-danger)]',
      },
    },
    defaultVariants: { variant: 'info' },
  },
);

export type AlertProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants> & {
    title?: string;
    action?: ReactNode;
  };

export function Alert({ className, variant, title, action, children, ...props }: AlertProps) {
  return (
    <div role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      <div className="flex-1 space-y-1">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className="text-sm leading-5">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
