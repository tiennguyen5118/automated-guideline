import 'server-only';
import { db } from '@/db';
import { generationJobs, type GenerationJob } from '@/db/schema/generation-jobs';

export type JobStatus = 'succeeded' | 'failed';

export async function recordJob(input: {
  guidelineId: string;
  status: JobStatus;
  error?: string | null;
  latencyMs: number;
}): Promise<GenerationJob> {
  const [row] = await db
    .insert(generationJobs)
    .values({
      guidelineId: input.guidelineId,
      status: input.status,
      error: input.error ?? null,
      latencyMs: input.latencyMs,
    })
    .returning();
  if (!row) throw new Error('Failed to record generation job');
  return row;
}
