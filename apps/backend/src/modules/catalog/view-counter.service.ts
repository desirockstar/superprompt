import { Injectable, Inject, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { prompts as promptsTable } from '@superprompt/db';
import { eq, sql } from 'drizzle-orm';
import { CacheService } from '../cache/cache.service';

const FLUSH_INTERVAL_MS = 60_000; // 60 seconds

@Injectable()
export class ViewCounterService {
  private readonly logger = new Logger(ViewCounterService.name);
  private readonly viewBuffer = new Map<string, number>();

  constructor(
    @Inject(DB_KEY)
    private readonly db: Database,
    private readonly cache: CacheService,
  ) {}

  increment(promptSlug: string): void {
    this.viewBuffer.set(promptSlug, (this.viewBuffer.get(promptSlug) ?? 0) + 1);
  }

  @Interval(FLUSH_INTERVAL_MS)
  async flush(): Promise<void> {
    if (this.viewBuffer.size === 0) return;

    const entries = [...this.viewBuffer.entries()];
    this.viewBuffer.clear();

    for (const [promptSlug, count] of entries) {
      try {
        await this.db.update(promptsTable)
          .set({ views: sql`coalesce(${promptsTable.views}, 0) + ${count}` })
          .where(eq(promptsTable.slug, promptSlug));
      } catch (err) {
        this.logger.error(`Failed to flush view count for prompt ${promptSlug}`, err);
      }
    }

    this.cache.deleteByPrefix('prompts:list');
    this.logger.debug(`Flushed view counts for ${entries.length} prompts`);
  }
}
