// Tier Calculator — Pure function, zero dependencies
// Deterministically maps an overall score to a prompt tier level

import { PromptLevel } from './ports/llm-evaluator.port';
import { Criterion } from './ports/llm-evaluator.port';

export interface WeightedScoreInput {
  name: string;
  score: number;
}

/**
 * Computes the weighted overall score from individual criterion scores.
 * Pure function — no side effects.
 */
export function computeWeightedScore(scores: WeightedScoreInput[], criteria: Criterion[]): number {
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

/**
 * Maps an overall score to a tier level.
 * Score → Tier Mapping (from AGENTS.md):
 *   overall > 8.5  → SUPER
 *   overall > 7.0  → PRO
 *   overall > 5.0  → BUILDER
 *   else           → STARTER
 */
export function computeTier(overallScore: number): PromptLevel {
  if (overallScore > 8.5) return 'super';
  if (overallScore > 7.0) return 'pro';
  if (overallScore > 5.0) return 'builder';
  return 'starter';
}

/**
 * Validates that an LLM response contains valid scores for all criteria.
 */
export function isValidEvaluationResponse(
  scores: Array<{ name: string; score: number }> | undefined,
  criteria: Criterion[],
): boolean {
  if (!scores || !Array.isArray(scores)) {
    return false;
  }

  const hasAllCriteria = scores.every(s =>
    criteria.some(c => c.name === s.name),
  );

  const scoresValid = scores.every(s =>
    typeof s.score === 'number' && s.score >= 1 && s.score <= 10,
  );

  return hasAllCriteria && scoresValid;
}
