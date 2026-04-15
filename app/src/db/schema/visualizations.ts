import { pgTable, uuid, text, timestamp, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { guidelines } from './guidelines';

export const visualizations = pgTable(
  'visualizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guidelineId: uuid('guideline_id')
      .notNull()
      .references(() => guidelines.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    mermaidSource: text('mermaid_source').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('visualizations_guideline_id_unique').on(table.guidelineId),
    check('visualizations_kind_check', sql`${table.kind} IN ('flowchart','infographic')`),
  ],
);

export type Visualization = typeof visualizations.$inferSelect;
export type NewVisualization = typeof visualizations.$inferInsert;
