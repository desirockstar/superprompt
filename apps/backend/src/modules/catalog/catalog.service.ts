import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { prompts as promptsTable, categories, tags } from '@superprompt/db';
import { eq, desc, sql } from 'drizzle-orm';
import { CONTENT_REPOSITORY, ContentRepository } from './ports/content-repository.port';
import { SearchService } from './search.service';
import { CacheService } from '../cache/cache.service';

const TTL_LIST = 5 * 60_000;
const TTL_DETAIL = 10 * 60_000;

@Injectable()
export class CatalogService {
  constructor(
    @Inject(DB_KEY)
    private readonly db: Database,
    @Inject(CONTENT_REPOSITORY)
    private readonly contentRepo: ContentRepository,
    private readonly searchService: SearchService,
    private readonly cache: CacheService,
  ) {}

  async findAll(options?: {
    category?: string;
    tag?: string;
    search?: string;
    page?: number;
    limit?: number;
    rating?: number;
    date?: string;
    tier?: string;
    fields?: string[];
    sort?: string;
  }) {
    const { fields, sort, ...searchOptions } = options || {};
    const cacheKey = `prompts:list:p${searchOptions?.page || 1}:l${searchOptions?.limit || 10}:c${searchOptions?.category || ''}:g${searchOptions?.tag || ''}:s${searchOptions?.search || ''}:t${searchOptions?.tier || ''}:d${searchOptions?.date || ''}:f${(fields || []).join(',')}:so${sort || ''}`;
    const cached = this.cache.get<{ prompts: any[]; total: number; page: number; limit: number }>(cacheKey);
    if (cached) return cached;

    const [allCategories, allTags, promptsResult] = await Promise.all([
      this.getDistinctCategories(),
      this.getDistinctTags(),
      this.searchService.search({ ...searchOptions }),
    ]);

    const categoryNameMap = new Map(allCategories.map(c => [c.id, c.name]));
    const tagNameMap = new Map(allTags.map(t => [t.id, t.name]));

    let promptsWithPreview: any[] = promptsResult.prompts.map((p) => {
      const catNames = (p.categoryIds || [])
        .map((id: string) => categoryNameMap.get(id) || id)
        .filter(Boolean);
      const tagNames = (p.tagIds || [])
        .map((id: string) => tagNameMap.get(id) || id)
        .filter(Boolean);
      return {
        ...p,
        categoryNames: catNames,
        tagNames: tagNames,
        preview: this.stripFrontmatter(p.preview || ''),
        tier: p.complexityTier || null,
        isViral: p.isViral,
        isNano: p.isNano,
        views: p.views,
      };
    });

    // Apply field filtering
    if (fields && fields.length > 0) {
      promptsWithPreview = promptsWithPreview.map(p => this.filterFields(p, fields));
    }

    // Apply sorting
    if (sort) {
      promptsWithPreview = this.applySorting(promptsWithPreview, sort);
    }

    const result = { prompts: promptsWithPreview, total: promptsResult.total, page: promptsResult.page, limit: promptsResult.limit };
    this.cache.set(cacheKey, result, TTL_LIST);
    return result;
  }

  private filterFields(obj: Record<string, any>, fields: string[]): Record<string, any> {
    const allowedFields = new Set(fields.map(f => f.toLowerCase()));
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (allowedFields.has(key.toLowerCase())) {
        result[key] = value;
      }
    }
    return result;
  }

  private applySorting(prompts: any[], sort: string): any[] {
    const [field, direction] = sort.split(':');
    const dir = direction?.toLowerCase() === 'asc' ? 1 : -1;
    
    return [...prompts].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      return aVal < bVal ? -1 * dir : 1 * dir;
    });
  }

  async findOne(slug: string, includeContent: boolean = false) {
    const cacheKey = `prompts:detail:${slug}`;
    const cached = this.cache.get<Record<string, any>>(cacheKey);
    if (cached && !includeContent) return cached;

    const [allCategories, allTags, result] = await Promise.all([
      this.getDistinctCategories(),
      this.getDistinctTags(),
      this.db.select().from(promptsTable).where(eq(promptsTable.slug, slug)).limit(1),
    ]);

    if (result.length === 0) {
      throw new NotFoundException(`Prompt ${slug} not found`);
    }

    const prompt = result[0];
    const categoryNameMap = new Map(allCategories.map(c => [c.id, c.name]));
    const tagNameMap = new Map(allTags.map(t => [t.id, t.name]));
    const catNames = (prompt.categoryIds || [])
      .map((id: string) => categoryNameMap.get(id) || id)
      .filter(Boolean);
    const tagNames = (prompt.tagIds || [])
      .map((id: string) => tagNameMap.get(id) || id)
      .filter(Boolean);

    const rawPreview = prompt.preview || await this.contentRepo.getPreview(prompt.basePath, prompt.currentVersion, prompt.isMultiVersion);
    const response: Record<string, any> = {
      ...prompt,
      categoryNames: catNames,
      tagNames: tagNames,
      tier: prompt.complexityTier || null,
      preview: this.stripFrontmatter(rawPreview),
    };

    if (includeContent) {
      response.content = await this.contentRepo.getFullContent(prompt.basePath, prompt.currentVersion, prompt.isMultiVersion);
    } else {
      this.cache.set(cacheKey, response, TTL_DETAIL);
    }

    return response;
  }

  invalidatePrompt(slug: string): void {
    this.cache.delete(`prompts:detail:${slug}`);
    this.cache.deleteByPrefix('prompts:list');
  }

  invalidateListings(): void {
    this.cache.deleteByPrefix('prompts:list');
    this.cache.delete('prompts:categories');
    this.cache.delete('prompts:tags');
  }

  async getFullContent(basePath: string, version: number, isMultiVersion: boolean): Promise<Record<string, string>> {
    return this.contentRepo.getFullContent(basePath, version, isMultiVersion);
  }

  async getDistinctCategories(): Promise<{ id: string; name: string; slug: string }[]> {
    const cacheKey = 'prompts:categories';
    const cached = this.cache.get<{ id: string; name: string; slug: string }[]>(cacheKey);
    if (cached) return cached;

    const result = await this.db.select().from(categories).orderBy(categories.name);
    const data = result.map(c => ({ id: c.id, name: c.name, slug: c.slug }));
    this.cache.set(cacheKey, data, TTL_LIST);
    return data;
  }

  async getDistinctTags(): Promise<{ id: string; name: string; slug: string }[]> {
    const cacheKey = 'prompts:tags';
    const cached = this.cache.get<{ id: string; name: string; slug: string }[]>(cacheKey);
    if (cached) return cached;

    const result = await this.db.select().from(tags).orderBy(tags.name);
    const data = result.map(t => ({ id: t.id, name: t.name, slug: t.slug }));
    this.cache.set(cacheKey, data, TTL_LIST);
    return data;
  }

  async getRelatedPrompts(promptSlug: string, limit: number = 3) {
    const [allCategories, allTags, currentPromptArr] = await Promise.all([
      this.getDistinctCategories(),
      this.getDistinctTags(),
      this.db.select().from(promptsTable).where(eq(promptsTable.slug, promptSlug)).limit(1),
    ]);

    if (!currentPromptArr.length) return [];

    const currentPrompt = currentPromptArr[0];
    const categoryNameMap = new Map(allCategories.map(c => [c.id, c.name]));
    const tagNameMap = new Map(allTags.map(t => [t.id, t.name]));
    const currentCatNames = (currentPrompt.categoryIds || [])
      .map((id: string) => categoryNameMap.get(id) || id);

    const relatedPrompts = await this.db.select()
      .from(promptsTable)
      .where(eq(promptsTable.status, 'approved'))
      .limit(limit * 3);

    const filtered = relatedPrompts.filter((p: any) => {
      if (p.slug === promptSlug) return false;
      const promptCatIds: string[] = p.categoryIds || [];
      return promptCatIds.some((id: string) => currentCatNames.includes(categoryNameMap.get(id) || ''));
    }).slice(0, limit);

    return filtered.map((p: any) => {
      const catNames = (p.categoryIds || [])
        .map((id: string) => categoryNameMap.get(id) || id);
      const tagNames = (p.tagIds || [])
        .map((id: string) => tagNameMap.get(id) || id);
      return {
        slug: p.slug,
        title: p.title,
        categoryNames: catNames,
        tagNames: tagNames,
        basePath: p.basePath,
        currentVersion: p.currentVersion,
        isMultiVersion: p.isMultiVersion,
        createdAt: p.createdAt,
        preview: this.stripFrontmatter(p.preview || ''),
        tier: p.complexityTier || null,
        isViral: p.isViral,
        isNano: p.isNano,
        views: p.views,
      };
    });
  }

  async createWithUser(userId: string, data: { title: string; categoryId?: string; categoryIds?: string[]; tagIds?: string[]; content: Record<string, string>; isMultiVersion?: boolean }) {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    const basePath = `prompts/${slug}`;

    let resolvedCategoryIds: string[] = [];
    if (data.categoryIds && data.categoryIds.length > 0) {
      resolvedCategoryIds = data.categoryIds;
    } else if (data.categoryId) {
      resolvedCategoryIds = [data.categoryId];
    }

    const resolvedTagIds = data.tagIds || [];

    const [created] = await this.db.insert(promptsTable).values({
      slug,
      userId,
      title: data.title,
      categoryIds: resolvedCategoryIds,
      tagIds: resolvedTagIds,
      status: 'pending',
      basePath,
      currentVersion: 1,
    }).returning();

    await this.contentRepo.storeMultiple(basePath, 1, data.content, data.isMultiVersion || false);

    return created;
  }

  async findByUser(userId: string) {
    const results = await this.db.select()
      .from(promptsTable)
      .where(eq(promptsTable.userId, userId))
      .orderBy(desc(promptsTable.createdAt));

    return {
      prompts: results.map(p => ({
        ...p,
        tier: p.complexityTier || null,
      })),
    };
  }

  async update(slug: string, data: { content: Record<string, string>; isMultiVersion?: boolean }) {
    const isMulti = data.isMultiVersion || Object.keys(data.content).some(k => k !== 'content');
    await this.contentRepo.storeMultiple(slug, 1, data.content, isMulti);

    const [updated] = await this.db.update(promptsTable)
      .set({
        currentVersion: 1,
      })
      .where(eq(promptsTable.slug, slug))
      .returning();
    return updated;
  }

  private stripFrontmatter(content: string): string {
    return content || '';
  }
}