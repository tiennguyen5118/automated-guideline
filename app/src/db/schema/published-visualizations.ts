import { pgTable, uuid, text, timestamp, uniqueIndex, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { guidelines } from './guidelines';

export const publishedVisualizations = pgTable(
  'published_visualizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    guidelineId: uuid('guideline_id')
      .notNull()
      .references(() => guidelines.id),
    slug: text('slug').notNull(),
    kind: text('kind').notNull(),
    mermaidSource: text('mermaid_source').notNull(),
    title: text('title').notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('published_visualizations_slug_unique').on(table.slug),
    check('published_visualizations_kind_check', sql`${table.kind} IN ('flowchart','infographic')`),
  ],
);

export type PublishedVisualization = typeof publishedVisualizations.$inferSelect;
export type NewPublishedVisualization = typeof publishedVisualizations.$inferInsert;
