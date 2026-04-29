import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { prompts, promptVersions } from '@superprompt/db';
import { eq, and } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { LLM_EVALUATOR, LLMEvaluator, PromptLevel } from './ports/llm-evaluator.port';
import { RubricService } from './rubric.service';
import { EvaluationRepository } from './evaluation.repository';
import { computeWeightedScore, computeTier, isValidEvaluationResponse } from './tier-calculator';
import { DOMAIN_EVENTS, EvaluationCompletedEvent, EvaluationFailedEvent } from '../shared/events/domain-events';

const MAX_RETRIES = 3;

@Injectable()
export class GradingOrchestrator {
  private readonly promptsBasePath = path.join(process.cwd(), 'src/prompts');

  constructor(
    @Inject(LLM_EVALUATOR)
    private readonly llmEvaluator: LLMEvaluator,
    @Inject(DB_KEY)
    private readonly db: Database,
    private readonly rubricService: RubricService,
    private readonly evaluationRepo: EvaluationRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async runGrading(triggeredBy: 'system' | 'admin') {
    // Fix: Only grade prompt versions where needsGrading = true
    const pendingVersions = await this.db.select().from(promptVersions)
      .where(eq(promptVersions.needsGrading, true));

    // Get the parent prompts for pending versions
    const promptIds = [...new Set(pendingVersions.map(v => v.promptId))];

    let graded = 0;
    let failed = 0;

    for (const promptId of promptIds) {
      const [promptRow] = await this.db.select().from(prompts)
        .where(and(eq(prompts.id, promptId), eq(prompts.status, 'approved')));

      if (!promptRow) continue;

      try {
        await this.evaluatePrompt(promptRow);
        
        // Mark versions as graded
        await this.db.update(promptVersions)
          .set({ needsGrading: false })
          .where(and(
            eq(promptVersions.promptId, promptId),
            eq(promptVersions.needsGrading, true),
          ));

        graded++;
      } catch (error) {
        console.error('Evaluation failed for prompt:', promptId, error);
        this.eventEmitter.emit(
          DOMAIN_EVENTS.EVALUATION_FAILED,
          new EvaluationFailedEvent(promptId, (error as Error).message),
        );
        failed++;
      }
    }

    return { graded, failed, triggeredBy };
  }

  private async evaluatePrompt(promptRow: typeof prompts.$inferSelect): Promise<void> {
    const rubric = await this.rubricService.getRubric(promptRow.category);
    const promptContent = await this.getPromptContent(promptRow.id.toString());
    const level: PromptLevel = promptRow.isMultiVersion ? 'pro' : 'starter';

    await this.evaluationRepo.upsertPending(promptRow.id, promptRow.category, level);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const llmResponse = await this.llmEvaluator.evaluate(promptContent, rubric.criteria, level);

        if (isValidEvaluationResponse(llmResponse.scores, rubric.criteria)) {
          const overallScore = computeWeightedScore(llmResponse.scores, rubric.criteria);
          const tier = computeTier(overallScore);

          await this.evaluationRepo.markCompleted(
            promptRow.id,
            overallScore,
            llmResponse.overall_feedback,
            rubric.criteria,
            tier,
            llmResponse.scores,
          );

          this.eventEmitter.emit(
            DOMAIN_EVENTS.EVALUATION_COMPLETED,
            new EvaluationCompletedEvent(promptRow.id, tier, overallScore),
          );

          return;
        }
      } catch (error) {
        lastError = error as Error;
        console.error(`LLM attempt ${attempt} failed:`, error);
      }
    }

    // All retries failed
    await this.evaluationRepo.markFailed(
      promptRow.id,
      lastError?.message || 'Evaluation failed after max retries',
    );

    this.eventEmitter.emit(
      DOMAIN_EVENTS.EVALUATION_FAILED,
      new EvaluationFailedEvent(promptRow.id, lastError?.message || 'Max retries exceeded'),
    );
  }

  private async getPromptContent(promptId: string): Promise<string> {
    const filePath = path.join(this.promptsBasePath, promptId, 'v1', 'super.md');
    if (!fs.existsSync(filePath)) {
      // Try other levels if super.md not found
      for (const level of ['pro', 'builder', 'starter', 'content']) {
        const altPath = path.join(this.promptsBasePath, promptId, 'v1', `${level}.md`);
        if (fs.existsSync(altPath)) {
          return fs.readFileSync(altPath, 'utf-8');
        }
      }
      return '';
    }
    return fs.readFileSync(filePath, 'utf-8');
  }
}
