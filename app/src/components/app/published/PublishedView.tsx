'use client';

import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/Spinner';

const MermaidPreview = dynamic(
  () => import('@/components/app/guidelines/MermaidPreview'),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spinner label="Loading diagram" />
      </div>
    ),
  },
);

export function PublishedView({
  title,
  mermaidSource,
}: {
  title: string;
  mermaidSource: string;
}) {
  return <MermaidPreview source={mermaidSource} ariaLabel={title} />;
}
