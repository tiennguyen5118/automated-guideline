import 'server-only';
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  ANTHROPIC_MODEL: z.string().min(1).default('claude-sonnet-4-6'),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  SESSION_COOKIE_NAME: z.string().min(1).default('ag_author'),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);
