import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { unlocks as unlocksTable } from '@superprompt/db';
import { eq, and } from 'drizzle-orm';
import { DOMAIN_EVENTS, UnlockGrantedEvent } from '../shared/events/domain-events';

@Injectable()
export class UnlockService {
  constructor(
    @Inject(DB_KEY)
    private readonly db: Database,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async unlockViaAd(userId: string, promptId: string) {
    const existing = await this.db.select().from(unlocksTable)
      .where(and(
        eq(unlocksTable.userId, userId),
        eq(unlocksTable.promptId, promptId),
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

    this.eventEmitter.emit(
      DOMAIN_EVENTS.UNLOCK_GRANTED,
      new UnlockGrantedEvent(userId, promptId),
    );

    return created;
  }

  async unlockViaSubscription(userId: string, promptId: string) {
    const existing = await this.db.select().from(unlocksTable)
      .where(and(
        eq(unlocksTable.userId, userId),
        eq(unlocksTable.promptId, promptId),
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

    this.eventEmitter.emit(
      DOMAIN_EVENTS.UNLOCK_GRANTED,
      new UnlockGrantedEvent(userId, promptId),
    );

    return created;
  }

  async getUnlocks(userId: string) {
    return this.db.select().from(unlocksTable).where(eq(unlocksTable.userId, userId));
  }
}
