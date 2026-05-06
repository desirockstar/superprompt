import { Inject, NotFoundException } from '@nestjs/common';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { ratings } from '@superprompt/db';
import { eq, and, sql } from 'drizzle-orm';

export class RatingService {
  constructor(
    @Inject(DB_KEY)
    private readonly db: Database,
  ) {}

  async submitRating(userId: string, promptSlug: string, rating: number) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const existing = await this.db.select()
      .from(ratings)
      .where(and(
        eq(ratings.userId, userId),
        eq(ratings.promptSlug, promptSlug)
      ))
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await this.db.update(ratings)
        .set({ rating, createdAt: new Date() })
        .where(eq(ratings.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await this.db.insert(ratings).values({
      userId,
      promptSlug,
      rating,
    }).returning();
    return created;
  }

  async getRating(promptSlug: string) {
    const result = await this.db.select()
      .from(ratings)
      .where(eq(ratings.promptSlug, promptSlug));

    if (result.length === 0) {
      return { average: null, count: 0 };
    }

    const sum = result.reduce((acc, r) => acc + r.rating, 0);
    const average = sum / result.length;

    return {
      average: Math.round(average * 10) / 10,
      count: result.length,
    };
  }
}