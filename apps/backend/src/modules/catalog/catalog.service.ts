import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { prompts as promptsTable, evaluations } from '@superprompt/db';
import { eq, desc } from 'drizzle-orm';
import { CONTENT_REPOSITORY, ContentRepository } from './ports/content-repository.port';
import { SearchService } from './search.service';
import { EntitlementService } from '../access/entitlement.service';
import { EvaluationRepository } from '../evaluation/evaluation.repository';
import { CacheService } from '../cache/cache.service';

const TTL_LIST = 5 * 60_000;   // 5 min
const TTL_DETAIL = 10 * 60_000; // 10 min
const TTL_TIERS = 5 * 60_000;   // 5 min

@Injectable()
export class CatalogService {
  constructor(
    @Inject(DB_KEY)
    private readonly db: Database,
    @Inject(CONTENT_REPOSITORY)
    private readonly contentRepo: ContentRepository,
    private readonly searchService: SearchService,
    private readonly entitlementService: EntitlementService,
    private readonly evaluationRepo: EvaluationRepository,
    private readonly cache: CacheService,
  ) {}

  async findAll(options?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    rating?: number;
    date?: string;
    tier?: string;
  }) {
    const cacheKey = `prompts:list:p${options?.page || 1}:l${options?.limit || 10}:c${options?.category || ''}:s${options?.search || ''}:t${options?.tier || ''}:d${options?.date || ''}`;
    const cached = this.cache.get<{ prompts: any[]; total: number; page: number; limit: number }>(cacheKey);
    if (cached) return cached;

    const tierMap = await this.getEvaluationsWithTiers();

    const { prompts, total, page, limit } = await this.searchService.search({
      ...options,
      tierMap,
    });

    const promptsWithPreview = prompts.map((p) => ({
      ...p,
      preview: this.stripFrontmatter(p.preview || ''),
      tier: tierMap.get(p.slug)?.level || null,
      primaryTag: p.primaryTag,
      isViral: p.isViral,
      isNano: p.isNano,
      views: p.views,
    }));

    const result = { prompts: promptsWithPreview, total, page, limit };
    this.cache.set(cacheKey, result, TTL_LIST);
    return result;
  }

  async findOne(slug: string, includeContent: boolean = false) {
    const cacheKey = `prompts:detail:${slug}`;
    const cached = this.cache.get<Record<string, any>>(cacheKey);
    if (cached && !includeContent) return cached;

    const result = await this.db.select()
      .from(promptsTable)
      .where(eq(promptsTable.slug, slug))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException(`Prompt ${slug} not found`);
    }

    const prompt = result[0];

    const rawPreview = prompt.preview || await this.contentRepo.getPreview(prompt.basePath, prompt.currentVersion, prompt.isMultiVersion);
    const response: Record<string, any> = {
      ...prompt,
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
    this.cache.deleteByPrefix('evaluations:tiers');
  }

  async getFullContent(basePath: string, version: number, isMultiVersion: boolean): Promise<Record<string, string>> {
    return this.contentRepo.getFullContent(basePath, version, isMultiVersion);
  }

  async checkEntitlement(userId: string, promptSlug: string) {
    return this.entitlementService.checkEntitlement(userId, promptSlug);
  }

  async getEvaluation(promptSlug: string) {
    return this.evaluationRepo.getEvaluation(promptSlug);
  }

  async getRelatedPrompts(promptSlug: string, limit: number = 3) {
    const tierMap = await this.getEvaluationsWithTiers();
    
    const currentPrompt = await this.findOne(promptSlug, false);
    const categoryParts = currentPrompt.category.split(',').map((c: string) => c.trim());
    const mainCategory = categoryParts[0];

    const relatedPrompts = await this.db.select()
      .from(promptsTable)
      .where(eq(promptsTable.status, 'approved'))
      .limit(limit * 3);

    const filtered = relatedPrompts.filter((p: any) => {
      if (p.slug === promptSlug) return false;
      const promptCategoryParts = p.category.split(',').map((c: string) => c.trim());
      return promptCategoryParts.includes(mainCategory);
    }).slice(0, limit);

    return filtered.map((p: any) => ({
      slug: p.slug,
      title: p.title,
      category: p.category,
      basePath: p.basePath,
      currentVersion: p.currentVersion,
      isMultiVersion: p.isMultiVersion,
      createdAt: p.createdAt,
      preview: this.stripFrontmatter(p.preview || ''),
      tier: tierMap.get(p.slug)?.level || null,
      primaryTag: p.primaryTag,
      isViral: p.isViral,
      isNano: p.isNano,
      views: p.views,
    }));
  }

  async createWithUser(userId: string, data: { title: string; category: string; content: Record<string, string>; isMultiVersion?: boolean }) {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    const basePath = `prompts/${slug}`;
    const isMulti = data.isMultiVersion || Object.keys(data.content).some(k => k !== 'content');

    const [created] = await this.db.insert(promptsTable).values({
      slug,
      userId,
      title: data.title,
      category: data.category,
      status: 'pending',
      basePath,
      currentVersion: 1,
      isMultiVersion: isMulti,
    }).returning();

    await this.contentRepo.storeMultiple(basePath, 1, data.content, isMulti);

    return created;
  }

  async findByUser(userId: string) {
    const tierMap = await this.getEvaluationsWithTiers();

    const results = await this.db.select()
      .from(promptsTable)
      .where(eq(promptsTable.userId, userId))
      .orderBy(desc(promptsTable.createdAt));

    return {
      prompts: results.map(p => ({
        ...p,
        tier: tierMap.get(p.slug)?.level || null,
      })),
    };
  }

  async update(slug: string, data: { content: Record<string, string>; isMultiVersion?: boolean }) {
    const isMulti = data.isMultiVersion || Object.keys(data.content).some(k => k !== 'content');
    const [updated] = await this.db.update(promptsTable)
      .set({
        currentVersion: 1,
        isMultiVersion: isMulti,
      })
      .where(eq(promptsTable.slug, slug))
      .returning();
    return updated;
  }

  private async getEvaluationsWithTiers() {
    const cacheKey = 'evaluations:tiers';
    const cached = this.cache.get<Map<string, { level: string; score: string }>>(cacheKey);
    if (cached) return cached;

    const allEvaluations = await this.evaluationRepo.getCompletedEvaluations();

    const tierMap = new Map<string, { level: string; score: string }>();
    for (const evaluation of allEvaluations) {
      const existing = tierMap.get(evaluation.promptSlug);
      if (!existing || (evaluation.overallScore && parseFloat(evaluation.overallScore) > parseFloat(existing.score))) {
        tierMap.set(evaluation.promptSlug, {
          level: evaluation.level,
          score: evaluation.overallScore || '0',
        });
      }
    }

    this.cache.set(cacheKey, tierMap, TTL_TIERS);
    return tierMap;
  }

  private stripFrontmatter(content: string): string {
    if (!content) return '';
    const lines = content.split('\n');
    let startIndex = 0;
    if (lines.length > 0 && lines[0].trim() === '---') {
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') {
          startIndex = i + 1;
          break;
        }
      }
    }
    return lines.slice(startIndex).join('\n');
  }
}
