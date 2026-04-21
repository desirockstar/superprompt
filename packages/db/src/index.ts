import { pgTable, text, uuid, timestamp, boolean, integer, pgEnum, uniqueIndex, index } from 'drizzle-orm/pg-core';

export const promptStatusEnum = pgEnum('prompt_status', ['pending', 'approved', 'rejected']);
export const promptLevelEnum = pgEnum('prompt_level', ['starter', 'builder', 'pro', 'super']);
export const unlockMethodEnum = pgEnum('unlock_method', ['ad', 'subscription']);
export const gradingTriggerEnum = pgEnum('grading_trigger', ['system', 'admin']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'canceled', 'past_due']);
export const gradingJobStatusEnum = pgEnum('grading_job_status', ['pending', 'running', 'done', 'failed']);

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
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  status: promptStatusEnum('status').default('pending').notNull(),
  basePath: text('base_path').notNull(),
  currentVersion: integer('current_version').default(1).notNull(),
  isMultiVersion: boolean('is_multi_version').default(false).notNull(),
  searchVector: text('search_vector'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('idx_prompts_category').on(table.category),
  statusIdx: index('idx_prompts_status').on(table.status),
}));

export const promptVersions = pgTable('prompt_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptId: uuid('prompt_id').notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  versionNumber: integer('version_number').notNull(),
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
  promptId: uuid('prompt_id').notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userPromptIdx: uniqueIndex('idx_ratings_user_prompt').on(table.userId, table.promptId),
}));

export const unlocks = pgTable('unlocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  promptId: uuid('prompt_id').notNull().references(() => prompts.id, { onDelete: 'cascade' }),
  unlockedVia: unlockMethodEnum('unlocked_via').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userPromptIdx: uniqueIndex('idx_unlocks_user_prompt').on(table.userId, table.promptId),
}));

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: subscriptionStatusEnum('status').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const gradingJobs = pgTable('grading_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: gradingJobStatusEnum('status').default('pending').notNull(),
  triggeredBy: gradingTriggerEnum('triggered_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const gradingHistory = pgTable('grading_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptVersionId: uuid('prompt_version_id').notNull().references(() => promptVersions.id, { onDelete: 'cascade' }),
  score: text('score').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type Prompt = typeof prompts.$inferSelect;
export type PromptVersion = typeof promptVersions.$inferSelect;
export type PromptVersionFile = typeof promptVersionFiles.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type Unlock = typeof unlocks.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type GradingJob = typeof gradingJobs.$inferSelect;
export type GradingHistory = typeof gradingHistory.$inferSelect;