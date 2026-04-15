'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Alert } from '@/components/ui/Alert';

let initialized = false;

function initMermaid() {
  if (initialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'strict',
    fontFamily: 'var(--font-sans)',
  });
  initialized = true;
}

export type MermaidPreviewProps = {
  source: string;
  ariaLabel?: string;
};

export default function MermaidPreview({ source, ariaLabel }: MermaidPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initMermaid();
    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';
    const id = `mermaid-${Math.random().toString(36).slice(2)}`;
    mermaid
      .render(id, source)
      .then(({ svg }) => {
        if (cancelled || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
      });
    return () => {
      cancelled = true;
    };
  }, [source]);

  if (error) {
    return (
      <Alert variant="error" title="Diagram render error">
        {error}
      </Alert>
    );
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel ?? 'Generated visualization'}
      className="flex min-h-[240px] w-full items-center justify-center overflow-auto p-4 [&_svg]:max-w-full [&_svg]:h-auto"
    />
  );
}
