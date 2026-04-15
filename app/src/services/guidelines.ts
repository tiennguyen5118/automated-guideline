import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { guidelines, type Guideline } from '@/db/schema/guidelines';

function deriveTitle(sourceText: string): string {
  const firstLine = sourceText.split(/\r?\n/).find((l) => l.trim().length > 0) ?? sourceText;
  const trimmed = firstLine.trim().replace(/^#+\s*/, '');
  return trimmed.length > 80 ? trimmed.slice(0, 77) + '…' : trimmed || 'Untitled guideline';
}

export async function createGuideline(input: {
  authorId: string;
  sourceText: string;
}): Promise<Guideline> {
  const [row] = await db
    .insert(guidelines)
    .values({
      authorId: input.authorId,
      sourceText: input.sourceText,
      title: deriveTitle(input.sourceText),
    })
    .returning();
  if (!row) throw new Error('Failed to insert guideline');
  return row;
}

export async function getGuidelineById(id: string): Promise<Guideline | null> {
  const [row] = await db.select().from(guidelines).where(eq(guidelines.id, id)).limit(1);
  return row ?? null;
}

export async function updateGuidelineSource(input: {
  id: string;
  sourceText: string;
}): Promise<Guideline> {
  const [row] = await db
    .update(guidelines)
    .set({
      sourceText: input.sourceText,
      title: deriveTitle(input.sourceText),
      updatedAt: new Date(),
    })
    .where(eq(guidelines.id, input.id))
    .returning();
  if (!row) throw new Error('Guideline not found');
  return row;
}
