import { z } from 'zod';

export const GUIDELINE_MAX_CHARS = 25_000;

export const GuidelineInputSchema = z.object({
  sourceText: z
    .string()
    .min(1, 'Please paste guideline text')
    .max(GUIDELINE_MAX_CHARS, `Guideline exceeds maximum length of ${GUIDELINE_MAX_CHARS} characters`),
});

export type GuidelineInput = z.infer<typeof GuidelineInputSchema>;

export const RegenerateInputSchema = z.object({
  guidelineId: z.string().uuid(),
  sourceText: z
    .string()
    .min(1, 'Please paste guideline text')
    .max(GUIDELINE_MAX_CHARS),
});

export const PublishInputSchema = z.object({
  guidelineId: z.string().uuid(),
});
