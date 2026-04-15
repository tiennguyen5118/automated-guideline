import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          Automated Visual Guidelines
        </span>
        <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-[var(--color-text)]">
          Turn policies, procedures, and announcements into clear visual guidelines.
        </h1>
        <p className="max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">
          Paste source text. The system classifies the content and generates a flowchart or
          infographic you can preview, refine, and publish behind a shareable URL — typically in
          minutes.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/guidelines/new">
          <Button variant="primary" size="lg">
            New guideline
          </Button>
        </Link>
      </div>
    </main>
  );
}
