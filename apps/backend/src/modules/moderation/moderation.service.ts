import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { prompts as promptsTable } from '@superprompt/db';
import { eq } from 'drizzle-orm';
import { DOMAIN_EVENTS, PromptApprovedEvent } from '../shared/events/domain-events';

@Injectable()
export class ModerationService {
  constructor(
    @Inject(DB_KEY)
    private readonly db: Database,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getPendingPrompts() {
    return this.db.select().from(promptsTable).where(eq(promptsTable.status, 'pending'));
  }

  async approvePrompt(id: string) {
    const [updated] = await this.db.update(promptsTable)
      .set({ status: 'approved' })
      .where(eq(promptsTable.id, id))
      .returning();

    if (updated) {
      this.eventEmitter.emit(
        DOMAIN_EVENTS.PROMPT_APPROVED,
        new PromptApprovedEvent(updated.id, updated.category, updated.currentVersion),
      );
    }

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
    if (status) {
      return this.db.select().from(promptsTable).where(eq(promptsTable.status, status as any));
    }
    return this.db.select().from(promptsTable);
  }
}
