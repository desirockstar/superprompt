import { Injectable, Inject } from '@nestjs/common';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { evaluations, evaluationScores } from '@superprompt/db';
import { eq } from 'drizzle-orm';
import { Criterion, EvaluationResult } from './ports/llm-evaluator.port';

@Injectable()
export class EvaluationRepository {
  constructor(
    @Inject(DB_KEY)
    private readonly db: Database,
  ) {}

  async upsertPending(promptSlug: string, category: string, level: string) {
    await this.db.insert(evaluations).values({
      promptSlug,
      category,
      level,
      status: 'pending',
    }).onConflictDoUpdate({
      target: evaluations.promptSlug,
      set: {
        status: 'pending',
        level,
        category,
      },
    });
  }

  async markCompleted(
    promptSlug: string,
    overallScore: number,
    overallFeedback: string,
    rubricSnapshot: Criterion[],
    level: string,
    scores: EvaluationResult['scores'],
  ) {
    const [evaluation] = await this.db.select().from(evaluations)
      .where(eq(evaluations.promptSlug, promptSlug))
      .limit(1);

    if (!evaluation) return;

    await this.db.update(evaluations)
      .set({
        overallScore: overallScore.toString(),
        overallFeedback,
        rubric: JSON.stringify(rubricSnapshot),
        status: 'completed',
        level,
      })
      .where(eq(evaluations.id, evaluation.id));

    for (const score of scores) {
      await this.db.insert(evaluationScores).values({
        evaluationId: evaluation.id,
        criterionName: score.name,
        score: score.score.toString(),
        feedback: score.feedback,
      });
    }
  }

  async markFailed(promptSlug: string, reason: string) {
    const [evaluation] = await this.db.select().from(evaluations)
      .where(eq(evaluations.promptSlug, promptSlug))
      .limit(1);

    if (!evaluation) return;

    await this.db.update(evaluations)
      .set({
        status: 'failed',
        overallFeedback: reason,
      })
      .where(eq(evaluations.id, evaluation.id));
  }

  async getEvaluation(promptSlug: string) {
    const [evaluation] = await this.db.select()
      .from(evaluations)
      .where(eq(evaluations.promptSlug, promptSlug))
      .limit(1);

    if (!evaluation) return null;

    const scores = await this.db.select()
      .from(evaluationScores)
      .where(eq(evaluationScores.evaluationId, evaluation.id));

    return { ...evaluation, scores };
  }

  async getCompletedEvaluations() {
    return this.db.select()
      .from(evaluations)
      .where(eq(evaluations.status, 'completed'));
  }
}
