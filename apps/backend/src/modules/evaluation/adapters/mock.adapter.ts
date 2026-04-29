import { Injectable } from '@nestjs/common';
import { LLMEvaluator, Criterion, EvaluationResult, PromptLevel } from '../ports/llm-evaluator.port';

/**
 * Mock adapter for testing — returns deterministic scores.
 * Use this when GROQ_API_KEY is not available or in test environments.
 */
@Injectable()
export class MockLLMAdapter implements LLMEvaluator {
  async evaluate(content: string, criteria: Criterion[], level: PromptLevel): Promise<EvaluationResult> {
    // Deterministic scoring based on content length and level
    const baseScore = this.computeBaseScore(content, level);

    return {
      scores: criteria.map(c => ({
        name: c.name,
        score: Math.min(10, Math.max(1, baseScore + this.criterionVariance(c.name))),
        feedback: `Good ${c.name} for this prompt level (mock evaluation)`,
      })),
      overall_feedback: 'Mock evaluation completed - prompt shows adequate structure for its level',
    };
  }

  private computeBaseScore(content: string, level: PromptLevel): number {
    const lengthFactor = Math.min(content.length / 500, 1);
    const levelBase = { starter: 6, builder: 7, pro: 7.5, super: 8 };
    return Math.round(levelBase[level] + lengthFactor * 2);
  }

  private criterionVariance(name: string): number {
    // Deterministic variance per criterion name
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return (hash % 3) - 1; // -1, 0, or 1
  }
}
