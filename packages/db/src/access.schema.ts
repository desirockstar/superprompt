// Access Domain Schema — unlocks, subscriptions
import { pgTable, text, uuid, timestamp, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './identity.schema';
import { prompts } from './catalog.schema';

export const unlockMethodEnum = pgEnum('unlock_method', ['ad', 'subscription']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'canceled', 'past_due']);

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

export type Unlock = typeof unlocks.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
