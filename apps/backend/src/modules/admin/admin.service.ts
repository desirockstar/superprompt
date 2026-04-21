import { Injectable, Inject } from '@nestjs/common';
import { DB_KEY } from '../db/db.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import { prompts as promptsTable } from '@superprompt/db';
import { eq } from 'drizzle-orm';
import * as schema from '@superprompt/db';

@Injectable()
export class AdminService {
  constructor(
    @Inject(DB_KEY)
    private readonly db: ReturnType<typeof drizzle<typeof schema>>,
  ) {}

  async getPendingPrompts() {
    return this.db.select().from(promptsTable).where(eq(promptsTable.status, 'pending'));
  }

  async approvePrompt(id: string) {
    const [updated] = await this.db.update(promptsTable)
      .set({ status: 'approved' })
      .where(eq(promptsTable.id, id))
      .returning();
    return updated;
  }

  async rejectPrompt(id: string) {
    const [updated] = await this.db.update(promptsTable)
      .set({ status: 'rejected' })
      .where(eq(promptsTable.id, id))
      .returning();
    return updated;
  }

  async getAllPrompts(status?: string) {
    let query = this.db.select().from(promptsTable);
    if (status) {
      return query.where(eq(promptsTable.status, status as any));
    }
    return query;
  }
}