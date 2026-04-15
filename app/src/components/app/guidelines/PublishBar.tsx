'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function PublishBar({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2">
      <span className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
        Published
      </span>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex-1 truncate font-mono text-xs text-[var(--color-text)] underline decoration-[var(--color-border)] underline-offset-4 hover:decoration-[var(--color-accent)]"
      >
        {url}
      </a>
      <Button variant="secondary" size="sm" type="button" onClick={copy}>
        {copied ? 'Copied' : 'Copy link'}
      </Button>
    </div>
  );
}
