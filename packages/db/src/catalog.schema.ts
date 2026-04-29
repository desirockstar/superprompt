// Catalog Domain Schema — prompts, promptVersions, promptVersionFiles
import { pgTable, text, uuid, timestamp, boolean, integer, pgEnum, index } from 'drizzle-orm/pg-core';
import { users } from './identity.schema';

export const promptStatusEnum = pgEnum('prompt_status', ['pending', 'approved', 'rejected']);
export const promptLevelEnum = pgEnum('prompt_level', ['starter', 'builder', 'pro', 'super']);

export const prompts = pgTable('prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  category: text('category').notNull(),
  primaryTag: text('primary_tag'),
  secondaryTags: text('secondary_tags'),
  isViral: boolean('is_viral'),
  isNano: boolean('is_nano'),
  status: promptStatusEnum('status').default('pending').notNull(),
  basePath: text('base_path').notNull(),
  currentVersion: integer('current_version').default(1).notNull(),
  isMultiVersion: boolean('is_multi_version').default(false).notNull(),
  views: integer('views').default(0).notNull(),
  preview: text('preview'),
  searchVector: text('search_vector'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('idx_prompts_category').on(table.category),
  statusIdx: index('idx_prompts_status').on(table.status),
  userIdIdx: index('idx_prompts_user_id').on(table.userId),
  primaryTagIdx: index('idx_prompts_primary_tag').on(table.primaryTag),
}));

export const promptVersions = pgTable('prompt_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptId: uuid('prompt_id').notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
  level: promptLevelEnum('level'),
  needsGrading: boolean('needs_grading').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const promptVersionFiles = pgTable('prompt_version_files', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptVersionId: uuid('prompt_version_id').notNull().references(() => promptVersions.id, { onDelete: 'cascade' }),
  level: promptLevelEnum('level').notNull(),
  fileName: text('file_name').notNull(),
});

export type Prompt = typeof prompts.$inferSelect;
export type PromptVersion = typeof promptVersions.$inferSelect;
export type PromptVersionFile = typeof promptVersionFiles.$inferSelect;
