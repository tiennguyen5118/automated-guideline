import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';
import { GenerationError, ValidationError } from '@/lib/errors';

const MAX_CHARS = 25_000;

const ResponseSchema = z.object({
  kind: z.enum(['flowchart', 'infographic']),
  mermaid: z.string().min(1),
});

const SYSTEM_PROMPT = `You convert policy, procedure, or announcement text into a Mermaid diagram.

Rules:
1. Classify the input:
   - "procedural": contains ordered steps, actions, or decision points.
   - "declarative": states policies, principles, or facts with no inherent order.
2. Return one Mermaid source string:
   - For "procedural": use \`flowchart TD\`. Model decisions as diamond nodes with yes/no branches.
   - For "declarative": use \`mindmap\`.
3. Keep node labels concise (≤ 8 words). Escape quotes. Use stable ids (A, B, C…).
4. Output ONLY a single JSON object, no prose, no code fences:
{"kind":"flowchart"|"infographic","mermaid":"<mermaid source>"}`;

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export type GenerateVisualizationResult = {
  kind: 'flowchart' | 'infographic';
  mermaidSource: string;
};

function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

function parseJsonResponse(raw: string): GenerateVisualizationResult {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
  let json: unknown;
  try {
    json = JSON.parse(trimmed);
  } catch {
    throw new GenerationError('MODEL_BAD_JSON', 'Model returned non-JSON output');
  }
  const parsed = ResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new GenerationError('MODEL_BAD_SHAPE', 'Model response did not match schema');
  }
  return { kind: parsed.data.kind, mermaidSource: parsed.data.mermaid };
}

async function callModel(sourceText: string): Promise<GenerateVisualizationResult> {
  const message = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: sourceText }],
  });
  return parseJsonResponse(extractText(message));
}

export async function generateVisualization(
  sourceText: string,
): Promise<GenerateVisualizationResult> {
  if (!sourceText.trim()) throw new ValidationError('EMPTY', 'Guideline text is empty');
  if (sourceText.length > MAX_CHARS) {
    throw new ValidationError(
      'TOO_LONG',
      `Guideline exceeds maximum length of ${MAX_CHARS} characters — please shorten or split`,
    );
  }

  const started = Date.now();
  try {
    const result = await callModel(sourceText);
    logger.info({ event: 'ai.generate', kind: result.kind, latency_ms: Date.now() - started });
    return result;
  } catch (err) {
    if (err instanceof ValidationError || err instanceof GenerationError) throw err;
    logger.warn({ event: 'ai.generate.retry', err });
    await new Promise((r) => setTimeout(r, 500));
    try {
      const result = await callModel(sourceText);
      logger.info({
        event: 'ai.generate',
        kind: result.kind,
        latency_ms: Date.now() - started,
        retried: true,
      });
      return result;
    } catch (err2) {
      logger.error({ event: 'ai.generate.failed', err: err2 });
      throw new GenerationError('MODEL_ERROR', 'Upstream model error');
    }
  }
}
