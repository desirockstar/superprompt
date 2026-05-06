import { Injectable, Inject } from '@nestjs/common';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { prompts as promptsTable } from '@superprompt/db';
import { eq, desc, asc, sql, and, count } from 'drizzle-orm';

@Injectable()
export class SearchService {
  constructor(
    @Inject(DB_KEY)
    private readonly db: Database,
  ) {}

  async search(options: {
    search?: string;
    category?: string;
    date?: string;
    tier?: string;
    page?: number;
    limit?: number;
    tierMap?: Map<string, { level: string; score: string }>;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const start = (page - 1) * limit;

    let orderByClause: ReturnType<typeof desc> | ReturnType<typeof asc> = desc(promptsTable.createdAt);

    if (options.date === 'oldest') {
      orderByClause = asc(promptsTable.createdAt);
    }

    // Build where clause
    let baseCondition = eq(promptsTable.status, 'approved');
    
    // Add category filter to SQL if possible
    if (options.category && options.category !== 'All') {
      baseCondition = and(baseCondition, eq(promptsTable.category, options.category));
    }

    if (options.search && options.search.trim()) {
      const searchTerm = options.search.trim();
      const fuzzyTsQuery = searchTerm
        .toLowerCase()
        .split(/\s+/)
        .map((token) => token.replace(/[^a-z0-9]/g, ''))
        .filter(Boolean)
        .map((token) => `${token}:*`)
        .join(' & ');

      if (fuzzyTsQuery) {
        baseCondition = and(
          baseCondition,
          sql`to_tsvector('english', coalesce(${promptsTable.title}, '') || ' ' || coalesce(${promptsTable.category}, '')) @@ to_tsquery('english', ${fuzzyTsQuery})`,
        );
      }
    }

    // Get total count for pagination info
    const totalResult = await this.db.select({ count: count() })
      .from(promptsTable)
      .where(baseCondition);
    const total = totalResult[0]?.count || 0;

    // Build order by expressions
    let orderByExpressions: any[] = [];
    if (options.search && options.search.trim()) {
      const searchTerm = options.search.trim();
      const fuzzyTsQuery = searchTerm
        .toLowerCase()
        .split(/\s+/)
        .map((token) => token.replace(/[^a-z0-9]/g, ''))
        .filter(Boolean)
        .map((token) => `${token}:*`)
        .join(' & ');
      
      if (fuzzyTsQuery) {
        orderByExpressions = [
          desc(sql`ts_rank_cd(to_tsvector('english', coalesce(${promptsTable.title}, '') || ' ' || coalesce(${promptsTable.category}, '')), to_tsquery('english', ${fuzzyTsQuery}))`),
          orderByClause,
        ];
      }
    } else {
      orderByExpressions = [orderByClause];
    }

    // Get paginated results with proper ordering - fetch extra to handle tier filter
    const fetchLimit = options.tier ? limit * 3 : limit;
    const paginatedPrompts = await this.db.select()
      .from(promptsTable)
      .where(baseCondition)
      .orderBy(...orderByExpressions)
      .limit(fetchLimit)
      .offset(start);

    // Apply tier filter in memory (only tier, since category is now in SQL)
    let filteredPrompts = paginatedPrompts;
    if (options.tier && options.tier !== 'All' && options.tierMap) {
      filteredPrompts = paginatedPrompts.filter(p => {
        const evalTier = options.tierMap!.get(p.slug)?.level;
        return evalTier?.toLowerCase() === options.tier.toLowerCase();
      });
    }

    // Ensure we return exactly 'limit' items if possible by fetching more if needed
    if (filteredPrompts.length < limit && fetchLimit > limit) {
      const morePrompts = await this.db.select()
        .from(promptsTable)
        .where(baseCondition)
        .orderBy(...orderByExpressions)
        .limit(limit - filteredPrompts.length)
        .offset(start + paginatedPrompts.length);
      
      filteredPrompts = [...filteredPrompts, ...morePrompts];
    }

    return { prompts: filteredPrompts.slice(0, limit), total, page, limit };
  }
}
