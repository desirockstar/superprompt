import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LLMEvaluator, Criterion, EvaluationResult, PromptLevel } from '../ports/llm-evaluator.port';

@Injectable()
export class GroqAdapter implements LLMEvaluator {
  constructor(private readonly config: ConfigService) {}

  async evaluate(content: string, criteria: Criterion[], level: PromptLevel): Promise<EvaluationResult> {
    const groqApiKey = this.config.get('GROQ_API_KEY');

    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const llmPrompt = this.buildPrompt(content, criteria, level);

    const https = await import('https');
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
        res.on('data', (c: Buffer) => body += c);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const json = JSON.parse(body);
              const responseContent = json.choices[0].message.content;
              const parsed = this.parseResponse(responseContent);
              resolve(parsed);
            } catch (e) {
              reject(new Error(`Failed to parse LLM response: ${e}`));
            }
          } else {
            reject(new Error(`Groq error: ${res.statusCode} - ${body}`));
          }
        });
      });
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  private buildPrompt(content: string, criteria: Criterion[], level: string): string {
    const criteriaJson = JSON.stringify(criteria.map(c => ({
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

  private parseResponse(response: string): EvaluationResult {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No valid JSON in LLM response');
  }
}
