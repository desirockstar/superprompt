// Identity Domain Schema — users, sessions, ratings
import { pgTable, text, uuid, timestamp, boolean, integer, uniqueIndex } from 'drizzle-orm/pg-core';

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

export const ratings = pgTable('ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  promptId: uuid('prompt_id').notNull(),
  rating: integer('rating').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userPromptIdx: uniqueIndex('idx_ratings_user_prompt').on(table.userId, table.promptId),
}));

export type User = typeof users.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
