import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { prompts as promptsTable, evaluations } from '@superprompt/db';
import { eq, desc } from 'drizzle-orm';
import { CONTENT_REPOSITORY, ContentRepository } from './ports/content-repository.port';
import { SearchService } from './search.service';
import { EntitlementService } from '../access/entitlement.service';
import { EvaluationRepository } from '../evaluation/evaluation.repository';

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
    const tierMap = await this.getEvaluationsWithTiers();

    const { prompts, total, page, limit } = await this.searchService.search({
      ...options,
      tierMap,
    });

    const promptsWithPreview = await Promise.all(
      prompts.map(async (p) => ({
        ...p,
        preview: await this.contentRepo.getPreview(p.basePath, p.currentVersion, p.isMultiVersion),
        tier: tierMap.get(p.id.toString())?.level || null,
        primaryTag: p.primaryTag,
        isViral: p.isViral,
        isNano: p.isNano,
        views: p.views,
      })),
    );

    return { prompts: promptsWithPreview, total, page, limit };
  }

  async findOne(id: string, includeContent: boolean = false) {
    const result = await this.db.select()
      .from(promptsTable)
      .where(eq(promptsTable.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundException(`Prompt ${id} not found`);
    }

    const prompt = result[0];

    const response: Record<string, any> = {
      ...prompt,
      preview: await this.contentRepo.getPreview(prompt.basePath, prompt.currentVersion, prompt.isMultiVersion),
    };

    if (includeContent) {
      response.content = await this.contentRepo.getFullContent(prompt.basePath, prompt.currentVersion, prompt.isMultiVersion);
    }

    return response;
  }

  async getFullContent(basePath: string, version: number, isMultiVersion: boolean): Promise<Record<string, string>> {
    return this.contentRepo.getFullContent(basePath, version, isMultiVersion);
  }

  async checkEntitlement(userId: string, promptId: string) {
    return this.entitlementService.checkEntitlement(userId, promptId);
  }

  async getEvaluation(promptId: string) {
    return this.evaluationRepo.getEvaluation(promptId);
  }

  async createWithUser(userId: string, data: { title: string; category: string; content: Record<string, string>; isMultiVersion?: boolean }) {
    const basePath = `prompts/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const isMulti = data.isMultiVersion || Object.keys(data.content).some(k => k !== 'content');

    const [created] = await this.db.insert(promptsTable).values({
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
        tier: tierMap.get(p.id.toString())?.level || null,
      })),
    };
  }

  async update(id: string, data: { content: Record<string, string>; isMultiVersion?: boolean }) {
    const isMulti = data.isMultiVersion || Object.keys(data.content).some(k => k !== 'content');
    const [updated] = await this.db.update(promptsTable)
      .set({
        currentVersion: 1,
        isMultiVersion: isMulti,
      })
      .where(eq(promptsTable.id, id))
      .returning();
    return updated;
  }

  private async getEvaluationsWithTiers() {
    const allEvaluations = await this.evaluationRepo.getCompletedEvaluations();

    const tierMap = new Map<string, { level: string; score: string }>();
    for (const evaluation of allEvaluations) {
      const existing = tierMap.get(evaluation.promptId.toString());
      if (!existing || (evaluation.overallScore && parseFloat(evaluation.overallScore) > parseFloat(existing.score))) {
        tierMap.set(evaluation.promptId.toString(), {
          level: evaluation.level,
          score: evaluation.overallScore || '0',
        });
      }
    }

    return tierMap;
  }
}
