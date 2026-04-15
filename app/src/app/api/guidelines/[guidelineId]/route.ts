import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getGuidelineById } from '@/services/guidelines';
import { getDraftByGuidelineId } from '@/services/visualizations';

const ParamsSchema = z.object({ guidelineId: z.string().uuid() });

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guidelineId: string }> },
) {
  const parsed = ParamsSchema.safeParse(await params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID', message: 'Invalid guideline id' } },
      { status: 400 },
    );
  }

  const guideline = await getGuidelineById(parsed.data.guidelineId);
  if (!guideline) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Guideline not found' } },
      { status: 404 },
    );
  }
  const draft = await getDraftByGuidelineId(parsed.data.guidelineId);

  return NextResponse.json({
    guideline: {
      id: guideline.id,
      title: guideline.title,
      sourceText: guideline.sourceText,
      createdAt: guideline.createdAt,
      updatedAt: guideline.updatedAt,
    },
    visualization: draft
      ? {
          kind: draft.kind,
          mermaidSource: draft.mermaidSource,
          updatedAt: draft.updatedAt,
        }
      : null,
  });
}
