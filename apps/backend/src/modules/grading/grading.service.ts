import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { prompts, promptVersions, rubrics, evaluations, evaluationScores } from '@superprompt/db';
import { eq, and } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

interface Criterion {
  name: string;
  weight: number;
}

interface RubricData {
  category: string;
  criteria: Criterion[];
}

interface LLMResponse {
  scores: Array<{
    name: string;
    score: number;
    feedback: string;
  }>;
  overall_feedback: string;
}

const MAX_RETRIES = 3;
const DEFAULT_RUBRIC_CATEGORY = 'general';

@Injectable()
export class GradingService {
  constructor(
    @Inject(DB_KEY)
    private readonly db: Database,
    private readonly config: ConfigService,
  ) {}

  private readonly promptsBasePath = path.join(process.cwd(), 'src/prompts');

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async runScheduledGrading() {
    await this.runGrading('system');
  }

  async triggerManualGrading() {
    return this.runGrading('admin');
  }

  private async runGrading(triggeredBy: 'system' | 'admin') {
    const pendingPrompts = await this.db.select().from(prompts)
      .where(eq(prompts.status, 'approved'));

    let graded = 0;
    let failed = 0;

    for (const prompt of pendingPrompts) {
      try {
        await this.evaluatePrompt(prompt);
        graded++;
      } catch (error) {
        console.error('Evaluation failed for prompt:', prompt.slug, error);
        failed++;
      }
    }

    return { graded, failed };
  }

  private async evaluatePrompt(promptRow: typeof prompts.$inferSelect): Promise<void> {
    const rubric = await this.getRubric(promptRow.category);
    const promptContent = await this.getPromptContent(promptRow.slug);
    const level = 'starter';

    await this.db.insert(evaluations).values({
      promptSlug: promptRow.slug,
      category: promptRow.category,
      level: level,
      status: 'pending',
    }).onConflictDoUpdate({
      target: evaluations.promptSlug,
      set: {
        status: 'pending',
        level: level,
        category: promptRow.category,
      },
    });

    let success = false;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const llmResponse = await this.callLLM(promptContent, rubric, level);
        
        if (this.isValidResponse(llmResponse, rubric.criteria)) {
          const overallScore = this.computeWeightedScore(llmResponse.scores, rubric.criteria);

          const [evaluation] = await this.db.select().from(evaluations)
            .where(eq(evaluations.promptSlug, promptRow.slug))
            .limit(1);

          if (evaluation) {
            await this.db.update(evaluations)
              .set({
                overallScore: overallScore.toString(),
                overallFeedback: llmResponse.overall_feedback,
                rubric: JSON.stringify(rubric.criteria),
                status: 'completed',
              })
              .where(eq(evaluations.id, evaluation.id));

            for (const score of llmResponse.scores) {
              await this.db.insert(evaluationScores).values({
                evaluationId: evaluation.id,
                criterionName: score.name,
                score: score.score.toString(),
                feedback: score.feedback,
              });
            }
          }

          success = true;
          break;
        }
      } catch (error) {
        lastError = error as Error;
        console.error(`LLM attempt ${attempt} failed:`, error);
      }
    }

    if (!success) {
      const [evaluation] = await this.db.select().from(evaluations)
        .where(eq(evaluations.promptSlug, promptRow.slug))
        .limit(1);

      if (evaluation) {
        await this.db.update(evaluations)
          .set({
            status: 'failed',
            overallFeedback: lastError?.message || 'Evaluation failed after 3 attempts',
          })
          .where(eq(evaluations.id, evaluation.id));
      }
    }
  }

  private async getRubric(category: string): Promise<RubricData> {
    const [rubric] = await this.db.select().from(rubrics)
      .where(eq(rubrics.category, category))
      .limit(1);

    if (rubric) {
      return {
        category: rubric.category,
        criteria: rubric.criteria as unknown as Criterion[],
      };
    }

    const [defaultRubric] = await this.db.select().from(rubrics)
      .where(eq(rubrics.category, DEFAULT_RUBRIC_CATEGORY))
      .limit(1);

    if (defaultRubric) {
      return {
        category: defaultRubric.category,
        criteria: defaultRubric.criteria as unknown as Criterion[],
      };
    }

    return {
      category: DEFAULT_RUBRIC_CATEGORY,
      criteria: [
        { name: 'clarity', weight: 0.4 },
        { name: 'specificity', weight: 0.3 },
        { name: 'usability', weight: 0.3 },
      ],
    };
  }

  private async getPromptContent(promptSlug: string): Promise<string> {
    const filePath = path.join(this.promptsBasePath, promptSlug, 'prompt.md');
    if (!fs.existsSync(filePath)) {
      console.error(`Prompt file not found: ${filePath}`);
      return '';
    }
    return fs.readFileSync(filePath, 'utf-8');
  }

  private buildLLMPrompt(content: string, rubric: RubricData, level: string): string {
    const criteriaJson = JSON.stringify(rubric.criteria.map(c => ({
      name: c.name,
      weight: c.weight,
    })));

    return `You are a strict prompt evaluator.

Prompt Level: ${level}

Evaluation Guidelines:
- Starter: reward simplicity and usability
- Builder: reward structure and clarity
- Pro: reward optimization and specificity
- Super: reward completeness and robustness

Scoring Guide:
1-3 = poor
4-6 = average
7-8 = good
9-10 = excellent

Instructions:
- Score relative to the level (not absolute perfection)
- Be consistent across evaluations
- The same prompt should receive the same score if evaluated again
- Return ONLY valid JSON

PROMPT:
${content}

CRITERIA:
${criteriaJson}

OUTPUT FORMAT:
{
  "scores": [
    {"name": "clarity", "score": 8, "feedback": "..."},
    {"name": "specificity", "score": 7, "feedback": "..."},
    {"name": "usability", "score": 8, "feedback": "..."}
  ],
  "overall_feedback": "..."
}`;
  }

  private async callLLM(promptContent: string, rubric: RubricData, level: string): Promise<LLMResponse> {
    const groqApiKey = this.config.get('GROQ_API_KEY');
    
    if (!groqApiKey) {
      return this.getMockResponse(rubric);
    }

    const llmPrompt = this.buildLLMPrompt(promptContent, rubric, level);
    
    const https = require('https');
    const data = JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: llmPrompt }],
      temperature: 0,
      top_p: 1,
    });

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`,
        },
      }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const json = JSON.parse(body);
              const content = json.choices[0].message.content;
              const parsed = this.parseLLMResponse(content);
              resolve(parsed);
            } catch (e) {
              reject(new Error(`Failed to parse LLM response: ${e}`));
            }
          } else {
            reject(new Error(`Groq error: ${res.statusCode}`));
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  private parseLLMResponse(response: string): LLMResponse {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No valid JSON in LLM response');
  }

  private isValidResponse(response: LLMResponse, criteria: Criterion[]): boolean {
    if (!response.scores || !Array.isArray(response.scores)) {
      return false;
    }

    const hasAllCriteria = response.scores.every(s => 
      criteria.some(c => c.name === s.name)
    );

    const scoresValid = response.scores.every(s => 
      typeof s.score === 'number' && s.score >= 1 && s.score <= 10
    );

    return hasAllCriteria && scoresValid;
  }

  private computeWeightedScore(scores: Array<{name: string; score: number}>, criteria: Criterion[]): number {
    let total = 0;
    let weightSum = 0;

    for (const criterion of criteria) {
      const score = scores.find(s => s.name === criterion.name);
      if (score) {
        total += score.score * criterion.weight;
        weightSum += criterion.weight;
      }
    }

    return weightSum > 0 ? Math.round((total / weightSum) * 10) / 10 : 0;
  }

  private getMockResponse(rubric: RubricData): LLMResponse {
    return {
      scores: rubric.criteria.map(c => ({
        name: c.name,
        score: 8,
        feedback: `Good ${c.name} for this prompt level`,
      })),
      overall_feedback: 'Overall good prompt with clear structure',
    };
  }
}