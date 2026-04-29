import { Injectable, Inject } from '@nestjs/common';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { subscriptions, unlocks } from '@superprompt/db';
import { eq, and } from 'drizzle-orm';

export interface EntitlementResult {
  hasAccess: boolean;
  hasSubscription: boolean;
  hasUnlock: boolean;
}

/**
 * EntitlementService — Single authoritative source for access decisions.
 * Implements the rule: canAccess(user, prompt) = hasActiveSubscription(user) || hasUnlock(user, prompt)
 */
@Injectable()
export class EntitlementService {
  constructor(
    @Inject(DB_KEY)
    private readonly db: Database,
  ) {}

  async canAccess(userId: string, promptId: string): Promise<boolean> {
    const result = await this.checkEntitlement(userId, promptId);
    return result.hasAccess;
  }

  async checkEntitlement(userId: string, promptId: string): Promise<EntitlementResult> {
    const hasSubscription = await this.hasActiveSubscription(userId);
    const hasUnlock = await this.hasUnlock(userId, promptId);

    return {
      hasAccess: hasSubscription || hasUnlock,
      hasSubscription,
      hasUnlock,
    };
  }

  async hasActiveSubscription(userId: string): Promise<boolean> {
    const [sub] = await this.db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (!sub) return false;
    return sub.status === 'active' && !!sub.expiresAt && new Date(sub.expiresAt) > new Date();
  }

  async hasUnlock(userId: string, promptId: string): Promise<boolean> {
    const [unlock] = await this.db.select().from(unlocks)
      .where(and(
        eq(unlocks.userId, userId),
        eq(unlocks.promptId, promptId),
      ))
      .limit(1);
    return !!unlock;
  }
}
