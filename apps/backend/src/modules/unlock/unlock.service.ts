import { Injectable, Inject } from '@nestjs/common';
import { DB_KEY } from '../db/db.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import { unlocks as unlocksTable } from '@superprompt/db';
import { eq, and } from 'drizzle-orm';
import * as schema from '@superprompt/db';

@Injectable()
export class UnlockService {
  constructor(
    @Inject(DB_KEY)
    private readonly db: ReturnType<typeof drizzle<typeof schema>>,
  ) {}

  async unlockViaAd(userId: string, promptId: string) {
    const existing = await this.db.select().from(unlocksTable)
      .where(and(
        eq(unlocksTable.userId, userId),
        eq(unlocksTable.promptId, promptId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const [created] = await this.db.insert(unlocksTable).values({
      userId,
      promptId,
      unlockedVia: 'ad',
    }).returning();

    return created;
  }

  async unlockViaSubscription(userId: string, promptId: string) {
    const existing = await this.db.select().from(unlocksTable)
      .where(and(
        eq(unlocksTable.userId, userId),
        eq(unlocksTable.promptId, promptId)
      ))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const [created] = await this.db.insert(unlocksTable).values({
      userId,
      promptId,
      unlockedVia: 'subscription',
    }).returning();

    return created;
  }

  async getUnlocks(userId: string) {
    return this.db.select().from(unlocksTable).where(eq(unlocksTable.userId, userId));
  }

  async hasUnlock(userId: string, promptId: string): Promise<boolean> {
    const result = await this.db.select().from(unlocksTable)
      .where(and(
        eq(unlocksTable.userId, userId),
        eq(unlocksTable.promptId, promptId)
      ))
      .limit(1);
    return result.length > 0;
  }
}