/**
 * Domain-split schema re-exports.
 * 
 * These files organize the schema by bounded context for better
 * developer orientation. The main `index.ts` remains the canonical
 * import target for all consumers.
 * 
 * Schema files:
 * - identity.schema.ts  → users, sessions, ratings
 * - catalog.schema.ts   → prompts, promptVersions, promptVersionFiles
 * - evaluation.schema.ts → evaluations, evaluationScores, rubrics
 * - access.schema.ts    → unlocks, subscriptions
 */
export * from './identity.schema';
export * from './catalog.schema';
export * from './evaluation.schema';
export * from './access.schema';
