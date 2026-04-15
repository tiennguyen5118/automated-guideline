import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  visualizations,
  type Visualization,
} from '@/db/schema/visualizations';
import {
  publishedVisualizations,
  type PublishedVisualization,
} from '@/db/schema/published-visualizations';
import { guidelines } from '@/db/schema/guidelines';
import { NotFoundError } from '@/lib/errors';
import { generateSlug } from '@/lib/slug';

export type VisualizationKind = 'flowchart' | 'infographic';

export async function upsertDraftVisualization(input: {
  guidelineId: string;
  kind: VisualizationKind;
  mermaidSource: string;
}): Promise<Visualization> {
  const [row] = await db
    .insert(visualizations)
    .values({
      guidelineId: input.guidelineId,
      kind: input.kind,
      mermaidSource: input.mermaidSource,
    })
    .onConflictDoUpdate({
      target: visualizations.guidelineId,
      set: {
        kind: input.kind,
        mermaidSource: input.mermaidSource,
        updatedAt: new Date(),
      },
    })
    .returning();
  if (!row) throw new Error('Failed to upsert visualization');
  return row;
}

export async function getDraftByGuidelineId(
  guidelineId: string,
): Promise<Visualization | null> {
  const [row] = await db
    .select()
    .from(visualizations)
    .where(eq(visualizations.guidelineId, guidelineId))
    .limit(1);
  return row ?? null;
}

export async function publishVisualization(input: {
  guidelineId: string;
}): Promise<PublishedVisualization> {
  return db.transaction(async (tx) => {
    const [draft] = await tx
      .select()
      .from(visualizations)
      .where(eq(visualizations.guidelineId, input.guidelineId))
      .limit(1);
    if (!draft) throw new NotFoundError('No draft visualization to publish');
    const [guideline] = await tx
      .select()
      .from(guidelines)
      .where(eq(guidelines.id, input.guidelineId))
      .limit(1);
    if (!guideline) throw new NotFoundError('Guideline not found');

    const slug = generateSlug();
    const [row] = await tx
      .insert(publishedVisualizations)
      .values({
        guidelineId: input.guidelineId,
        slug,
        kind: draft.kind,
        mermaidSource: draft.mermaidSource,
        title: guideline.title,
      })
      .returning();
    if (!row) throw new Error('Failed to publish');
    return row;
  });
}

export async function getPublishedBySlug(
  slug: string,
): Promise<PublishedVisualization | null> {
  const [row] = await db
    .select()
    .from(publishedVisualizations)
    .where(eq(publishedVisualizations.slug, slug))
    .limit(1);
  return row ?? null;
}
