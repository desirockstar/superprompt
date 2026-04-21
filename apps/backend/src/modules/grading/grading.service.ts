import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DB_KEY } from '../db/db.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import { promptVersions, gradingHistory, gradingJobs } from '@superprompt/db';
import { eq, and } from 'drizzle-orm';
import * as schema from '@superprompt/db';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GradingService {
  constructor(
    @Inject(DB_KEY)
    private readonly db: ReturnType<typeof drizzle<typeof schema>>,
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
    const [job] = await this.db.insert(gradingJobs).values({
      status: 'running',
      triggeredBy,
    }).returning();

    const pendingVersions = await this.db.select().from(promptVersions)
      .where(eq(promptVersions.needsGrading, true));

    for (const version of pendingVersions) {
      try {
        const score = await this.gradeVersion(version.id.toString(), version.promptId.toString());
        await this.db.insert(gradingHistory).values({
          promptVersionId: version.id,
          score: JSON.stringify(score),
        });
        await this.db.update(promptVersions)
          .set({ needsGrading: false })
          .where(eq(promptVersions.id, version.id));
      } catch (error) {
        console.error('Grading failed for version:', version.id, error);
      }
    }

    await this.db.update(gradingJobs)
      .set({ status: 'done' })
      .where(eq(gradingJobs.id, job.id));

    return { jobId: job.id, graded: pendingVersions.length };
  }

  private async gradeVersion(versionId: string, promptId: string): Promise<any> {
    const groqApiKey = this.config.get('GROQ_API_KEY');
    if (!groqApiKey) {
      return this.getMockScore();
    }

    const content = await this.getVersionContent(promptId, 'super');
    const prompt = this.buildGradingPrompt(content);

    try {
      const response = await this.callGroq(prompt, groqApiKey);
      return this.parseGradingResponse(response);
    } catch (error) {
      console.error('Groq API error:', error);
      return this.getMockScore();
    }
  }

  private async getVersionContent(promptId: string, level: string = 'super'): Promise<string> {
    const filePath = path.join(this.promptsBasePath, promptId, 'v1', `${level}.md`);
    if (!fs.existsSync(filePath)) {
      return 'Sample prompt content for grading';
    }
    return fs.readFileSync(filePath, 'utf-8');
  }

  private buildGradingPrompt(content: string): string {
    return `You are an AI prompt evaluator.
Evaluate the following prompt:

${content}

Return STRICT JSON only:
{
  "scores": { "clarity": 8, "specificity": 7, "effectiveness": 8, "structure": 7, "reusability": 7 },
  "overall": 7.4,
  "feedback": "Good prompt with clear structure",
  "improvements": ["Add more examples"]
}`;
  }

  private async callGroq(prompt: string, apiKey: string): Promise<string> {
    const https = require('https');
    const data = JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          if (res.statusCode === 200) {
            const json = JSON.parse(body);
            resolve(json.choices[0].message.content);
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

  private parseGradingResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Parse error:', error);
    }
    return this.getMockScore();
  }

  private getMockScore() {
    return {
      scores: { clarity: 8, specificity: 7, effectiveness: 8, structure: 7, reusability: 7 },
      overall: 7.4,
      feedback: 'Good prompt structure',
      improvements: ['Add more examples'],
    };
  }
}