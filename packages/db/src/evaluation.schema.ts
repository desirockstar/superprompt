// Evaluation Domain Schema — evaluations, evaluationScores, rubrics
import { pgTable, text, uuid, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const evaluationStatusEnum = pgEnum('evaluation_status', ['pending', 'completed', 'failed']);

export const rubrics = pgTable('rubrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  category: text('category').notNull().unique(),
  criteria: text('criteria').notNull(), // JSON stored as text
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const evaluations = pgTable('evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  promptId: uuid('prompt_id').notNull().unique(),
  category: text('category').notNull(),
  level: text('level').notNull(), // Tier level (starter/builder/pro/super)
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

export type Rubric = typeof rubrics.$inferSelect;
export type Evaluation = typeof evaluations.$inferSelect;
export type EvaluationScore = typeof evaluationScores.$inferSelect;
