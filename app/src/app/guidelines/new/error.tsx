'use client';

import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-6 py-8">
      <Alert
        variant="error"
        title="Something went wrong"
        action={
          <Button type="button" variant="secondary" size="sm" onClick={reset}>
            Try again
          </Button>
        }
      >
        {error.message || 'The editor failed to load.'}
      </Alert>
    </main>
  );
}
