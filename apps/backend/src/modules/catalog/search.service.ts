import { Injectable, Inject } from '@nestjs/common';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { prompts as promptsTable, categories, tags } from '@superprompt/db';
import { eq, desc, asc, sql, and, count } from 'drizzle-orm';

@Injectable()
export class SearchService {
  constructor(
    @Inject(DB_KEY)
    private readonly db: Database,
  ) {}

  private async resolveCategoryId(categoryName: string): Promise<string | null> {
    const [cat] = await this.db.select().from(categories).where(eq(categories.name, categoryName)).limit(1);
    return cat?.id || null;
  }

  private async resolveTagId(tagName: string): Promise<string | null> {
    const [tag] = await this.db.select().from(tags).where(eq(tags.name, tagName)).limit(1);
    return tag?.id || null;
  }

  async search(options: {
    search?: string;
    category?: string;
    tag?: string;
    date?: string;
    tier?: string;
    page?: number;
    limit?: number;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const start = (page - 1) * limit;

    let orderByClause: ReturnType<typeof desc> | ReturnType<typeof asc> = desc(promptsTable.createdAt);

    if (options.date === 'oldest') {
      orderByClause = asc(promptsTable.createdAt);
    }

    let baseCondition: ReturnType<typeof eq> | undefined = eq(promptsTable.status, 'approved');
    
    if (options.category && options.category !== 'All') {
      const categoryId = await this.resolveCategoryId(options.category);
      if (categoryId) {
        baseCondition = and(baseCondition, sql`${categoryId} = ANY(${promptsTable.categoryIds})`);
      }
    }

    if (options.tag && options.tag !== 'All') {
      const tagId = await this.resolveTagId(options.tag);
      if (tagId) {
        baseCondition = and(baseCondition, sql`${tagId} = ANY(${promptsTable.tagIds})`);
      }
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
          sql`to_tsvector('english', coalesce(${promptsTable.title}, '')) @@ to_tsquery('english', ${fuzzyTsQuery})`,
        );
      }
    }

    const totalResult = await this.db.select({ count: count() })
      .from(promptsTable)
      .where(baseCondition);
    const total = totalResult[0]?.count || 0;

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
          desc(sql`ts_rank_cd(to_tsvector('english', coalesce(${promptsTable.title}, '')), to_tsquery('english', ${fuzzyTsQuery}))`),
          orderByClause,
        ];
      }
    } else {
      orderByExpressions = [orderByClause];
    }

    const paginatedPrompts = await this.db.select()
      .from(promptsTable)
      .where(baseCondition)
      .orderBy(...orderByExpressions)
      .limit(limit)
      .offset(start);

    return { prompts: paginatedPrompts, total, page, limit };
  }
}