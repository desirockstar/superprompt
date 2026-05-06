import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, text, uuid, timestamp, boolean, integer, pgEnum, uniqueIndex, index } from 'drizzle-orm/pg-core';

const db = drizzle(process.env.DATABASE_URL!);
export { db };

export const promptStatusEnum = pgEnum('prompt_status', ['pending', 'approved', 'rejected']);
export const promptLevelEnum = pgEnum('prompt_level', ['starter', 'builder', 'pro', 'super']);
export const unlockMethodEnum = pgEnum('unlock_method', ['ad', 'subscription']);
export const gradingTriggerEnum = pgEnum('grading_trigger', ['system', 'admin']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'canceled', 'past_due']);
export const evaluationStatusEnum = pgEnum('evaluation_status', ['pending', 'completed', 'failed']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  isAdmin: boolean('is_admin').default(false).notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
});

export const prompts = pgTable('prompts', {
  slug: text('slug').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  category: text('category').notNull().default('uncategorized'),
  primaryTag: text('primary_tag'),
  secondaryTags: text('secondary_tags'),
  isViral: boolean('is_viral').default(false),
  isNano: boolean('is_nano').default(false),
  status: promptStatusEnum('status').default('pending').notNull(),
  basePath: text('base_path').notNull(),
  currentVersion: integer('current_version').default(1).notNull(),
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
  promptSlug: text('prompt_slug').notNull().references(() => prompts.slug, { onDelete: 'cascade' }),
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

export const ratings = pgTable('ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  promptSlug: text('prompt_slug').notNull().references(() => prompts.slug, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userPromptIdx: uniqueIndex('idx_ratings_user_prompt').on(table.userId, table.promptSlug),
}));

export const unlocks = pgTable('unlocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  promptSlug: text('prompt_slug').notNull().references(() => prompts.slug, { onDelete: 'cascade' }),
  unlockedVia: unlockMethodEnum('unlocked_via').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userPromptIdx: uniqueIndex('idx_unlocks_user_prompt').on(table.userId, table.promptSlug),
}));

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: subscriptionStatusEnum('status').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rubrics = pgTable('rubrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  category: text('category').notNull().unique(),
  criteria: text('criteria').notNull(), // JSON stored as text
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const evaluations = pgTable('evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptSlug: text('prompt_slug').notNull().unique(),
  category: text('category').notNull(),
  level: text('level').notNull(),
  overallScore: text('overall_score'),
  overallFeedback: text('overall_feedback'),
  rubric: text('rubric'),
  status: evaluationStatusEnum('status').default('completed').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const evaluationScores = pgTable('evaluation_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  evaluationId: uuid('evaluation_id').notNull().references(() => evaluations.id, { onDelete: 'cascade' }),
  criterionName: text('criterion_name').notNull(),
  score: text('score').notNull(),
  feedback: text('feedback'),
});

export type User = typeof users.$inferSelect;
export type Prompt = typeof prompts.$inferSelect;
export type PromptVersion = typeof promptVersions.$inferSelect;
export type PromptVersionFile = typeof promptVersionFiles.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type Unlock = typeof unlocks.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Rubric = typeof rubrics.$inferSelect;
export type Evaluation = typeof evaluations.$inferSelect;
export type EvaluationScore = typeof evaluationScores.$inferSelect;