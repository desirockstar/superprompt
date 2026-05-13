import { pgTable, text, uuid, timestamp, boolean, integer, pgEnum, uniqueIndex, index } from 'drizzle-orm/pg-core';

export const promptStatusEnum = pgEnum('prompt_status', ['pending', 'approved', 'rejected']);
export const promptLevelEnum = pgEnum('prompt_level', ['starter', 'builder', 'pro', 'super']);
export const unlockMethodEnum = pgEnum('unlock_method', ['ad', 'subscription']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'canceled', 'past_due']);

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

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
  categoryIds: uuid('category_ids').notNull().array(),
  tagIds: uuid('tag_ids').notNull().array(),
  primaryTag: text('primary_tag'),
  secondaryTags: text('secondary_tags'),
  isViral: boolean('is_viral').default(false),
  isNano: boolean('is_nano').default(false),
  status: promptStatusEnum('status').default('pending').notNull(),
  basePath: text('base_path').notNull(),
  currentVersion: integer('current_version').default(1).notNull(),
  views: integer('views').default(0).notNull(),
  preview: text('preview'),
  isMultiVersion: boolean('is_multi_version').default(false).notNull(),
  searchVector: text('search_vector'),
  complexityScore: text('complexity_score'),
  complexityTier: text('complexity_tier'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  categoryIdsIdx: index('idx_prompts_category_ids').on(table.categoryIds),
  tagIdsIdx: index('idx_prompts_tag_ids').on(table.tagIds),
  statusIdx: index('idx_prompts_status').on(table.status),
  userIdIdx: index('idx_prompts_user_id').on(table.userId),
  primaryTagIdx: index('idx_prompts_primary_tag').on(table.primaryTag),
  complexityTierIdx: index('idx_prompts_complexity_tier').on(table.complexityTier),
}));

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

export type User = typeof users.$inferSelect;
export type Prompt = typeof prompts.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type Unlock = typeof unlocks.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;