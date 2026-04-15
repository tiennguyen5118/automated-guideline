import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const guidelines = pgTable('guidelines', {
  id: uuid('id').primaryKey().defaultRandom(),
  authorId: text('author_id').notNull(),
  title: text('title').notNull(),
  sourceText: text('source_text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Guideline = typeof guidelines.$inferSelect;
export type NewGuideline = typeof guidelines.$inferInsert;
