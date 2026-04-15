import { notFound } from 'next/navigation';
import { GuidelineEditor } from '@/components/app/guidelines/GuidelineEditor';
import { getGuidelineById } from '@/services/guidelines';
import { getDraftByGuidelineId } from '@/services/visualizations';

type VisualizationKind = 'flowchart' | 'infographic';

export default async function EditGuidelinePage({
  params,
}: {
  params: Promise<{ guidelineId: string }>;
}) {
  const { guidelineId } = await params;
  const guideline = await getGuidelineById(guidelineId);
  if (!guideline) notFound();
  const draft = await getDraftByGuidelineId(guidelineId);

  const initial = draft
    ? {
        guidelineId,
        sourceText: guideline.sourceText,
        kind: draft.kind as VisualizationKind,
        mermaidSource: draft.mermaidSource,
      }
    : undefined;

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-[var(--color-text)]">
          {guideline.title}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Edit the source and regenerate, or publish the current preview.
        </p>
      </header>
      <GuidelineEditor initial={initial} />
    </main>
  );
}
