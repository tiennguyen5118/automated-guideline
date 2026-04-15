import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { PublishedView } from '@/components/app/published/PublishedView';
import { getPublishedBySlug } from '@/services/visualizations';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const row = await getPublishedBySlug(slug);
  if (!row) return { title: 'Not found' };
  return {
    title: `${row.title} · Visual guideline`,
    openGraph: { title: row.title },
  };
}

export default async function PublishedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const row = await getPublishedBySlug(slug);
  if (!row) notFound();

  const publishedAt = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(row.publishedAt);

  return (
    <main className="mx-auto flex w-full max-w-[1024px] flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
          {row.kind} · published {publishedAt}
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
          {row.title}
        </h1>
      </header>
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Visualization</h2>
        </CardHeader>
        <CardBody>
          <PublishedView title={row.title} mermaidSource={row.mermaidSource} />
        </CardBody>
      </Card>
    </main>
  );
}
