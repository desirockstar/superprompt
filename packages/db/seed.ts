import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { prompts, promptVersions, evaluations, evaluationScores } from './src/index';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/superprompt';
const client = postgres(connectionString);
const db = drizzle(client);

const SEED_DATA_DIR = path.join(__dirname, 'seed-data');

interface SeedPrompt {
  title: string;
  slug: string;
  content: string;
  category: string;
  recommendedTools?: string[];
  rating?: {
    scores: Record<string, number>;
    overall: number;
    tier: string;
    feedback: string;
    improvements: string[];
  };
}

async function loadAllJsonFiles(): Promise<SeedPrompt[]> {
  const categoryFiles = [
    'Business.json',
    'Education.json',
    'Coding.json',
    'Productivity.json',
    'Human-Resources.json',
    'E-Commerce.json',
    'Finance.json',
    'Photography.json',
    'Design.json',
    'Customer-Service.json',
    'Art.json',
    'Lawyers.json',
    'Architecture.json',
    'SEO.json',
    'Solopreneurs.json',
    'Real-Estate.json',
    'Writing.json',
    'Marketing.json',
  ];

  const allPrompts: SeedPrompt[] = [];

  for (const filename of categoryFiles) {
    const filepath = path.join(SEED_DATA_DIR, filename);

    if (!fs.existsSync(filepath)) {
      console.log(`⏭️  Skipping ${filename} - file not found`);
      continue;
    }

    try {
      const fileContent = fs.readFileSync(filepath, 'utf-8');
      const categoryPrompts: SeedPrompt[] = JSON.parse(fileContent);
      allPrompts.push(...categoryPrompts);
      console.log(`✅ Loaded ${categoryPrompts.length} prompts from ${filename}`);
    } catch (err) {
      console.error(`❌ Error parsing ${filename}:`, err);
    }
  }

  return allPrompts;
}

async function seed() {
  try {
    console.log('🚀 Starting seed process...\n');

    // Load all JSON files
    console.log('📂 Loading JSON seed files...');
    const allPrompts = await loadAllJsonFiles();
    console.log(`\n✨ Total prompts loaded: ${allPrompts.length}\n`);

    // Prepare prompt data for insertion
    const promptsToInsert = allPrompts.map((p) => ({
      id: uuidv4(),
      title: p.title,
      category: p.category,
      status: 'approved' as const,
      basePath: `prompts/${uuidv4()}`,
      currentVersion: 1,
      isMultiVersion: false,
      views: 0,
      preview: p.content.substring(0, 220),
      createdAt: new Date(),
    }));

    // Insert prompts
    console.log(`💾 Inserting ${promptsToInsert.length} prompts...`);
    const insertedPrompts = await db
      .insert(prompts)
      .values(promptsToInsert)
      .returning();
    console.log(`✅ Inserted ${insertedPrompts.length} prompts\n`);

    // Prepare prompt versions
    const versionsToInsert = insertedPrompts.map((p) => ({
      id: uuidv4(),
      promptId: p.id,
      versionNumber: 1,
      needsGrading: false,
      createdAt: new Date(),
    }));

    console.log(`💾 Inserting ${versionsToInsert.length} prompt versions...`);
    const insertedVersions = await db
      .insert(promptVersions)
      .values(versionsToInsert)
      .returning();
    console.log(`✅ Inserted ${insertedVersions.length} prompt versions\n`);

    // Prepare evaluations from rating data
    const evaluationsToInsert = insertedPrompts
      .map((p, idx) => {
        const originalPrompt = allPrompts[idx];
        const hasRating = originalPrompt.rating !== undefined;

        return {
          id: uuidv4(),
          promptId: p.id,
          category: p.category,
          level: hasRating ? (originalPrompt.rating!.tier || 'builder').toLowerCase() : null,
          overallScore: hasRating ? originalPrompt.rating!.overall.toString() : null,
          overallFeedback: hasRating ? originalPrompt.rating!.feedback : null,
          rubric: hasRating ? JSON.stringify(originalPrompt.rating!.scores) : null,
          status: hasRating ? ('completed' as const) : ('pending' as const),
          createdAt: new Date(),
        };
      });

    if (evaluationsToInsert.length > 0) {
      console.log(`💾 Inserting ${evaluationsToInsert.length} evaluations...`);
      const insertedEvals = await db
        .insert(evaluations)
        .values(evaluationsToInsert)
        .returning();
      console.log(`✅ Inserted ${insertedEvals.length} evaluations`);
      console.log(
        `   └─ ${insertedEvals.filter((e) => e.status === 'completed').length} completed (with ratings)`
      );
      console.log(
        `   └─ ${insertedEvals.filter((e) => e.status === 'pending').length} pending (awaiting manual grading)\n`
      );

      // Prepare and insert evaluation scores (only for completed evaluations)
      const scoresPerEvaluation: Array<{
        evaluationId: string;
        criterionName: string;
        score: string;
      }> = [];

      evaluationsToInsert.forEach((evaluation) => {
        if (evaluation.status === 'completed' && evaluation.rubric) {
          const scores = JSON.parse(evaluation.rubric);
          Object.entries(scores).forEach(([criterionName, score]) => {
            scoresPerEvaluation.push({
              evaluationId: evaluation.id,
              criterionName,
              score: score.toString(),
            });
          });
        }
      });

      if (scoresPerEvaluation.length > 0) {
        console.log(
          `💾 Inserting ${scoresPerEvaluation.length} evaluation score entries...`
        );
        const scoresToInsert = scoresPerEvaluation.map((s) => ({
          id: uuidv4(),
          ...s,
          feedback: null,
        }));
        await db
          .insert(evaluationScores)
          .values(scoresToInsert)
          .onConflictDoNothing();
        console.log(`✅ Inserted ${scoresPerEvaluation.length} evaluation scores\n`);
      }
    }

    console.log('🎉 Seed complete!');
    console.log(`
Summary:
  ✅ Prompts:              ${insertedPrompts.length}
  ✅ Versions:             ${insertedVersions.length}
  ✅ Evaluations:          ${evaluationsToInsert.length}
  ✅ Eval Scores:          ${evaluationsToInsert.filter((e) => e.status === 'completed').length}
  ⏳ Pending Grading:       ${evaluationsToInsert.filter((e) => e.status === 'pending').length}
    `);

    await client.end();
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();