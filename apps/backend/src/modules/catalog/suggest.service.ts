import { Injectable, Inject } from '@nestjs/common';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { categories, tags } from '@superprompt/db';
import { ilike, or } from 'drizzle-orm';
import { CacheService } from '../cache/cache.service';

export interface SuggestResult {
  name: string;
  slug: string;
}

export interface Suggester<T extends SuggestResult> {
  key: string;
  search(query: string): Promise<T[]>;
}

class CategorySuggester implements Suggester<SuggestResult> {
  key = 'categories' as const;
  constructor(@Inject(DB_KEY) private readonly db: Database) {}
  async search(q: string): Promise<SuggestResult[]> {
    const pattern = `%${q}%`;
    return this.db
      .select({ name: categories.name, slug: categories.slug })
      .from(categories)
      .where(
        or(
          ilike(categories.name, pattern),
          ilike(categories.slug, pattern),
        )
      )
      .limit(10);
  }
}

class TagSuggester implements Suggester<SuggestResult> {
  key = 'tags' as const;
  constructor(@Inject(DB_KEY) private readonly db: Database) {}
  async search(q: string): Promise<SuggestResult[]> {
    const pattern = `%${q}%`;
    return this.db
      .select({ name: tags.name, slug: tags.slug })
      .from(tags)
      .where(
        or(
          ilike(tags.name, pattern),
          ilike(tags.slug, pattern),
        )
      )
      .limit(10);
  }
}

@Injectable()
export class SuggestService {
  private readonly suggesters: Suggester<SuggestResult>[];

  constructor(
    @Inject(DB_KEY)
    private readonly db: Database,
    private readonly cache: CacheService,
  ) {
    this.suggesters = [
      new CategorySuggester(this.db),
      new TagSuggester(this.db),
    ];
  }

  async suggest(
    query: string,
    types?: string[],
    limit = 10,
  ): Promise<Record<string, SuggestResult[]>> {
    if (!query || query.trim().length < 1) return {};

    const typesKey = types?.join(',') ?? 'all';
    const cacheKey = `suggest:${query}:${typesKey}`;
    const cached = this.cache.get<Record<string, SuggestResult[]>>(cacheKey);
    if (cached) return cached;

    const active = types?.length
      ? this.suggesters.filter(s => types.includes(s.key))
      : this.suggesters;

    const entries = await Promise.all(
      active.map(async (s) => {
        const results = await s.search(query);
        return [s.key, results.slice(0, limit)] as [string, SuggestResult[]];
      }),
    );

    const result = Object.fromEntries(entries);
    this.cache.set(cacheKey, result, 60_000);
    return result;
  }

  registerSuggester<T extends SuggestResult>(suggester: Suggester<T>): void {
    this.suggesters.push(suggester);
  }
}