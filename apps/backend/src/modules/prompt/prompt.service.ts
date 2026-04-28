import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { DB_KEY } from '../db/db.module';
import type { Database } from '../db/db.module';
import { prompts as promptsTable, evaluations, evaluationScores, subscriptions, unlocks } from '@superprompt/db';
import { eq, desc, asc, sql, and } from 'drizzle-orm';

@Injectable()
export class PromptService {
  private readonly promptsBasePath = join(process.cwd(), 'src/prompts');

  constructor(
    @Inject(DB_KEY)
    private readonly db: Database,
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
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const start = (page - 1) * limit;

    let allPrompts: any[] = [];
    let orderByClause: ReturnType<typeof desc> | ReturnType<typeof asc> = desc(promptsTable.createdAt);

    if (options?.date === 'oldest') {
      orderByClause = asc(promptsTable.createdAt);
    }
    
    if (options?.search && options.search.trim()) {
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
      
        const searchResults = await this.db.select()
          .from(promptsTable)
          .where(
            and(
              eq(promptsTable.status, 'approved'),
              sql`to_tsvector('english', coalesce(${promptsTable.title}, '') || ' ' || coalesce(${promptsTable.category}, '')) @@ to_tsquery('english', ${fuzzyTsQuery})`
            )
          )
          .orderBy(
            desc(sql`ts_rank_cd(to_tsvector('english', coalesce(${promptsTable.title}, '') || ' ' || coalesce(${promptsTable.category}, '')), to_tsquery('english', ${fuzzyTsQuery}))`),
            orderByClause
          );

        allPrompts = searchResults;
      }
    } else {
      const normalResults = await this.db.select()
        .from(promptsTable)
        .where(eq(promptsTable.status, 'approved'))
        .orderBy(orderByClause);
      
      allPrompts = normalResults;
    }
    
    if (options?.category && options.category !== 'All') {
      allPrompts = allPrompts.filter(p => p.category === options.category);
    }

    let tierMap: Map<string, { level: string; score: string }> = new Map();
    if (options?.tier && options.tier !== 'All') {
      tierMap = await this.getEvaluationsWithTiers();
    }

    if (options?.tier && options.tier !== 'All') {
      allPrompts = allPrompts.filter(p => {
        const evalTier = tierMap.get(p.id.toString())?.level;
        return evalTier === options.tier;
      });
    }

    const total = allPrompts.length;
    const paginated = allPrompts.slice(start, start + limit);

    const finalTierMap = await this.getEvaluationsWithTiers();

    const promptsWithPreview = await Promise.all(
      paginated.map(async (p) => ({
        ...p,
        preview: await this.getPreview(p.basePath, p.currentVersion, p.isMultiVersion),
        tier: finalTierMap.get(p.id.toString())?.level || null,
        primaryTag: p.primaryTag,
        isViral: p.isViral,
        isNano: p.isNano,
        views: p.views,
      }))
    );

    return {
      prompts: promptsWithPreview,
      total,
      page,
      limit,
    };
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
      preview: await this.getPreview(prompt.basePath, prompt.currentVersion, prompt.isMultiVersion),
    };

    if (includeContent) {
      response.content = await this.getFullContent(prompt.basePath, prompt.currentVersion, prompt.isMultiVersion);
    }

    return response;
  }

  async getFullContent(basePath: string, version: number, isMultiVersion: boolean): Promise<Record<string, string>> {
    const content: Record<string, string> = {};
    if (isMultiVersion) {
      for (const level of ['starter', 'builder', 'pro', 'super']) {
        try {
          content[level] = await this.getContentByPath(basePath, level, version);
        } catch {
          content[level] = '';
        }
      }
    } else {
      // Single version: read content.md
      try {
        content.content = await this.getContentByPath(basePath, 'content', version);
      } catch {
        content.content = '';
      }
    }
    return content;
  }

  async getPreview(basePath: string, version?: number, isMultiVersion?: boolean): Promise<string> {
    const ver = version || 1;
    const cleanPath = basePath.replace(/^prompts\//, '');
    
    // Try content.md first (single version), then starter.md (multi version)
    let filePath = join(this.promptsBasePath, cleanPath, `v${ver}`, 'content.md');
    if (!existsSync(filePath) && !isMultiVersion) {
      // Single version fallback - check if there's any content
      const dirPath = join(this.promptsBasePath, cleanPath, `v${ver}`);
      if (existsSync(dirPath)) {
        const fs = require('fs');
        const files = fs.readdirSync(dirPath);
        if (files.length > 0) {
          filePath = join(this.promptsBasePath, cleanPath, `v${ver}`, files[0]);
        }
      }
    }
    
    if (!existsSync(filePath)) {
      filePath = join(this.promptsBasePath, cleanPath, `v${ver}`, 'starter.md');
    }
    
    if (!existsSync(filePath)) {
      return '';
    }
    return this.readFileWithPreview(filePath);
  }

  private readFileWithPreview(filePath: string): string {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const totalLines = lines.length;
    const previewLineCount = Math.max(10, Math.ceil(totalLines * 0.35));
    return lines.slice(0, previewLineCount).join('\n');
  }

  async getContentByPath(basePath: string, level: string, version?: number): Promise<string> {
    const ver = version || 1;
    const cleanPath = basePath.replace(/^prompts\//, '');
    const filePath = join(this.promptsBasePath, cleanPath, `v${ver}`, `${level}.md`);
    
    if (!existsSync(filePath)) {
      throw new NotFoundException('Prompt content not found');
    }
    return readFileSync(filePath, 'utf-8');
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
    
    await this.savePromptFiles(basePath, data.content, 1, isMulti);
    
    return created;
  }

  private async savePromptFiles(basePath: string, content: Record<string, string>, version: number, isMultiVersion: boolean): Promise<void> {
    const cleanPath = basePath.replace(/^prompts\//, '');
    const versionDir = join(this.promptsBasePath, cleanPath, `v${version}`);
    const fs = require('fs');
    
    if (!existsSync(versionDir)) {
      fs.mkdirSync(versionDir, { recursive: true });
    }
    
    if (isMultiVersion) {
      // Save multiple tier files
      for (const [level, text] of Object.entries(content)) {
        if (text.trim() && level !== 'content') {
          const filePath = join(versionDir, `${level}.md`);
          fs.writeFileSync(filePath, text);
        }
      }
    } else {
      // Single version: save as content.md
      const singleContent = content.content || Object.values(content)[0] || '';
      if (singleContent.trim()) {
        fs.writeFileSync(join(versionDir, 'content.md'), singleContent);
      }
    }
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

  async update(id: string, data: { content: Record<string, string> }) {
    const [updated] = await this.db.update(promptsTable)
      .set({
        currentVersion: 1,
        isMultiVersion: Object.keys(data.content).length > 1,
      })
      .where(eq(promptsTable.id, id))
      .returning();
    return updated;
  }

  async updateWithUser(id: string, data: { content: Record<string, string>; isMultiVersion?: boolean }) {
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

  async checkEntitlement(userId: string, promptId: string): Promise<{ hasAccess: boolean; hasSubscription: boolean; hasUnlock: boolean }> {
    const [sub] = await this.db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);
    
    const hasSubscription = sub && sub.status === 'active' && !!sub.expiresAt && new Date(sub.expiresAt) > new Date();

    const [unlock] = await this.db.select().from(unlocks)
      .where(and(
        eq(unlocks.userId, userId),
        eq(unlocks.promptId, promptId)
      ))
      .limit(1);
    
    const hasUnlock = !!unlock;

    return { hasAccess: hasSubscription || hasUnlock, hasSubscription, hasUnlock };
  }

  async getEvaluation(promptId: string) {
    const [evaluation] = await this.db.select()
      .from(evaluations)
      .where(eq(evaluations.promptId, promptId))
      .limit(1);

    if (!evaluation) {
      return null;
    }

    const scores = await this.db.select()
      .from(evaluationScores)
      .where(eq(evaluationScores.evaluationId, evaluation.id));

    return {
      ...evaluation,
      scores,
    };
  }

  async getEvaluationsWithTiers() {
    const allEvaluations = await this.db.select()
      .from(evaluations)
      .where(eq(evaluations.status, 'completed'));

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