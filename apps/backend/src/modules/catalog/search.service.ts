import { Injectable, Inject } from '@nestjs/common';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { prompts as promptsTable } from '@superprompt/db';
import { eq, desc, asc, sql, and } from 'drizzle-orm';

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

    let allPrompts: any[] = [];
    let orderByClause: ReturnType<typeof desc> | ReturnType<typeof asc> = desc(promptsTable.createdAt);

    if (options.date === 'oldest') {
      orderByClause = asc(promptsTable.createdAt);
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

      if (!fuzzyTsQuery) {
        allPrompts = [];
      } else {
        allPrompts = await this.db.select()
          .from(promptsTable)
          .where(
            and(
              eq(promptsTable.status, 'approved'),
              sql`to_tsvector('english', coalesce(${promptsTable.title}, '') || ' ' || coalesce(${promptsTable.category}, '')) @@ to_tsquery('english', ${fuzzyTsQuery})`,
            ),
          )
          .orderBy(
            desc(sql`ts_rank_cd(to_tsvector('english', coalesce(${promptsTable.title}, '') || ' ' || coalesce(${promptsTable.category}, '')), to_tsquery('english', ${fuzzyTsQuery}))`),
            orderByClause,
          );
      }
    } else {
      allPrompts = await this.db.select()
        .from(promptsTable)
        .where(eq(promptsTable.status, 'approved'))
        .orderBy(orderByClause);
    }

    if (options.category && options.category !== 'All') {
      allPrompts = allPrompts.filter(p => p.category === options.category);
    }

    if (options.tier && options.tier !== 'All' && options.tierMap) {
      allPrompts = allPrompts.filter(p => {
        const evalTier = options.tierMap!.get(p.id.toString())?.level;
        return evalTier?.toLowerCase() === options.tier.toLowerCase();
      });
    }

    const total = allPrompts.length;
    const paginated = allPrompts.slice(start, start + limit);

    return { prompts: paginated, total, page, limit };
  }
}
