import { pgTable, uuid, text, timestamp, integer, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { guidelines } from './guidelines';

export const generationJobs = pgTable(
  'generation_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guidelineId: uuid('guideline_id')
      .notNull()
      .references(() => guidelines.id, { onDelete: 'cascade' }),
    status: text('status').notNull(),
    error: text('error'),
    latencyMs: integer('latency_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [check('generation_jobs_status_check', sql`${table.status} IN ('succeeded','failed')`)],
);

export type GenerationJob = typeof generationJobs.$inferSelect;
export type NewGenerationJob = typeof generationJobs.$inferInsert;
