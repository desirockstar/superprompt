import { Injectable, Inject } from '@nestjs/common';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { unlocks as unlocksTable } from '@superprompt/db';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class UnlockService {
  constructor(
    @Inject(DB_KEY)
    private readonly db: Database,
  ) {}

  async unlockViaAd(userId: string, promptSlug: string) {
    const existing = await this.db.select().from(unlocksTable)
      .where(and(
        eq(unlocksTable.userId, userId),
        eq(unlocksTable.promptSlug, promptSlug)
      ))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const [created] = await this.db.insert(unlocksTable).values({
      userId,
      promptSlug,
      unlockedVia: 'ad',
    }).returning();

    return created;
  }

  async unlockViaSubscription(userId: string, promptSlug: string) {
    const existing = await this.db.select().from(unlocksTable)
      .where(and(
        eq(unlocksTable.userId, userId),
        eq(unlocksTable.promptSlug, promptSlug)
      ))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    const [created] = await this.db.insert(unlocksTable).values({
      userId,
      promptSlug,
      unlockedVia: 'subscription',
    }).returning();

    return created;
  }

  async getUnlocks(userId: string) {
    return this.db.select().from(unlocksTable).where(eq(unlocksTable.userId, userId));
  }

  async hasUnlock(userId: string, promptSlug: string): Promise<boolean> {
    const result = await this.db.select().from(unlocksTable)
      .where(and(
        eq(unlocksTable.userId, userId),
        eq(unlocksTable.promptSlug, promptSlug)
      ))
      .limit(1);
    return result.length > 0;
  }
}