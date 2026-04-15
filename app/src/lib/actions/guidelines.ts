'use server';

import { revalidatePath } from 'next/cache';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { getOrCreateAuthorId } from '@/lib/session';
import { ValidationError, GenerationError, NotFoundError } from '@/lib/errors';
import {
  GuidelineInputSchema,
  RegenerateInputSchema,
  PublishInputSchema,
} from '@/lib/schemas/guideline.schema';
import { generateVisualization } from '@/services/ai';
import { createGuideline, updateGuidelineSource } from '@/services/guidelines';
import {
  upsertDraftVisualization,
  publishVisualization,
} from '@/services/visualizations';
import { recordJob } from '@/services/generation-jobs';

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

function toError(err: unknown): { code: string; message: string } {
  if (err instanceof ValidationError || err instanceof GenerationError) {
    return { code: err.code, message: err.message };
  }
  if (err instanceof NotFoundError) return { code: 'NOT_FOUND', message: err.message };
  logger.error({ event: 'action.error', err });
  return { code: 'INTERNAL', message: 'Something went wrong. Please try again.' };
}

export async function generateAction(
  input: unknown,
): Promise<
  ActionResult<{
    guidelineId: string;
    kind: 'flowchart' | 'infographic';
    mermaidSource: string;
  }>
> {
  const parsed = GuidelineInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: { code: 'INVALID', message: first?.message ?? 'Invalid input' } };
  }
  const authorId = await getOrCreateAuthorId();

  let guidelineId: string | null = null;
  const started = Date.now();
  try {
    const guideline = await createGuideline({
      authorId,
      sourceText: parsed.data.sourceText,
    });
    guidelineId = guideline.id;
    const result = await generateVisualization(parsed.data.sourceText);
    await upsertDraftVisualization({
      guidelineId: guideline.id,
      kind: result.kind,
      mermaidSource: result.mermaidSource,
    });
    await recordJob({
      guidelineId: guideline.id,
      status: 'succeeded',
      latencyMs: Date.now() - started,
    });
    return {
      ok: true,
      data: {
        guidelineId: guideline.id,
        kind: result.kind,
        mermaidSource: result.mermaidSource,
      },
    };
  } catch (err) {
    const e = toError(err);
    if (guidelineId) {
      await recordJob({
        guidelineId,
        status: 'failed',
        error: e.code,
        latencyMs: Date.now() - started,
      }).catch(() => undefined);
    }
    return { ok: false, error: e };
  }
}

export async function regenerateAction(
  input: unknown,
): Promise<
  ActionResult<{
    guidelineId: string;
    kind: 'flowchart' | 'infographic';
    mermaidSource: string;
  }>
> {
  const parsed = RegenerateInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: { code: 'INVALID', message: first?.message ?? 'Invalid input' } };
  }

  const started = Date.now();
  try {
    await updateGuidelineSource({
      id: parsed.data.guidelineId,
      sourceText: parsed.data.sourceText,
    });
    const result = await generateVisualization(parsed.data.sourceText);
    await upsertDraftVisualization({
      guidelineId: parsed.data.guidelineId,
      kind: result.kind,
      mermaidSource: result.mermaidSource,
    });
    await recordJob({
      guidelineId: parsed.data.guidelineId,
      status: 'succeeded',
      latencyMs: Date.now() - started,
    });
    return {
      ok: true,
      data: {
        guidelineId: parsed.data.guidelineId,
        kind: result.kind,
        mermaidSource: result.mermaidSource,
      },
    };
  } catch (err) {
    const e = toError(err);
    await recordJob({
      guidelineId: parsed.data.guidelineId,
      status: 'failed',
      error: e.code,
      latencyMs: Date.now() - started,
    }).catch(() => undefined);
    return { ok: false, error: e };
  }
}

export async function publishAction(
  input: unknown,
): Promise<ActionResult<{ slug: string; url: string }>> {
  const parsed = PublishInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: 'INVALID', message: 'Invalid input' } };
  }
  try {
    const published = await publishVisualization({
      guidelineId: parsed.data.guidelineId,
    });
    const url = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/published/${published.slug}`;
    revalidatePath(`/published/${published.slug}`);
    return { ok: true, data: { slug: published.slug, url } };
  } catch (err) {
    return { ok: false, error: toError(err) };
  }
}
