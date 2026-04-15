import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="font-mono text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
        404
      </p>
      <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
        Visualization not found
      </h1>
      <p className="text-sm text-[var(--color-text-muted)]">
        This link may have been removed or was never published.
      </p>
      <Link href="/">
        <Button variant="secondary">Back to home</Button>
      </Link>
    </main>
  );
}
