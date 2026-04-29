// Port: LLM Evaluator — Evaluation BC
// Abstracts the AI provider for prompt evaluation

export interface Criterion {
  name: string;
  weight: number;
}

export interface EvaluationScoreResult {
  name: string;
  score: number;
  feedback: string;
}

export interface EvaluationResult {
  scores: EvaluationScoreResult[];
  overall_feedback: string;
}

export type PromptLevel = 'starter' | 'builder' | 'pro' | 'super';

export interface LLMEvaluator {
  evaluate(content: string, criteria: Criterion[], level: PromptLevel): Promise<EvaluationResult>;
}

export const LLM_EVALUATOR = 'LLM_EVALUATOR';
