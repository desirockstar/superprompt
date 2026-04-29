import { Injectable, Inject } from '@nestjs/common';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { rubrics } from '@superprompt/db';
import { eq } from 'drizzle-orm';
import { Criterion } from './ports/llm-evaluator.port';

export interface RubricData {
  category: string;
  criteria: Criterion[];
}

const DEFAULT_RUBRIC_CATEGORY = 'general';

const DEFAULT_CRITERIA: Criterion[] = [
  { name: 'clarity', weight: 0.4 },
  { name: 'specificity', weight: 0.3 },
  { name: 'usability', weight: 0.3 },
];

@Injectable()
export class RubricService {
  constructor(
    @Inject(DB_KEY)
    private readonly db: Database,
  ) {}

  async getRubric(category: string): Promise<RubricData> {
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
      criteria: DEFAULT_CRITERIA,
    };
  }
}
