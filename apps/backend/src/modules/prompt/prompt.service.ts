import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { DB_KEY } from '../db/db.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import { prompts as promptsTable } from '@superprompt/db';
import { eq, desc } from 'drizzle-orm';
import * as schema from '@superprompt/db';

@Injectable()
export class PromptService {
  private readonly promptsBasePath = join(process.cwd(), 'src/prompts');

  constructor(
    @Inject(DB_KEY)
    private readonly db: ReturnType<typeof drizzle<typeof schema>>,
  ) {}

  async findAll(options?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    rating?: number;
    date?: string;
  }) {
    let query = this.db.select({
      id: promptsTable.id,
      title: promptsTable.title,
      category: promptsTable.category,
      status: promptsTable.status,
      basePath: promptsTable.basePath,
      currentVersion: promptsTable.currentVersion,
      isMultiVersion: promptsTable.isMultiVersion,
      createdAt: promptsTable.createdAt,
    })
    .from(promptsTable)
    .where(eq(promptsTable.status, 'approved'))
    .orderBy(desc(promptsTable.createdAt));

    const allPrompts = await query;
    
    let filtered = allPrompts;
    if (options?.category && options.category !== 'All') {
      filtered = filtered.filter(p => p.category === options.category);
    }

    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    const promptsWithPreview = await Promise.all(
      paginated.map(async (p) => ({
        ...p,
        preview: await this.getPreview(p.id.toString()),
      }))
    );

    return {
      prompts: promptsWithPreview,
      total: filtered.length,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const result = await this.db.select({
      id: promptsTable.id,
      title: promptsTable.title,
      category: promptsTable.category,
      status: promptsTable.status,
      basePath: promptsTable.basePath,
      currentVersion: promptsTable.currentVersion,
      isMultiVersion: promptsTable.isMultiVersion,
      createdAt: promptsTable.createdAt,
    })
    .from(promptsTable)
    .where(eq(promptsTable.id, id))
    .limit(1);

    if (result.length === 0) {
      throw new NotFoundException(`Prompt ${id} not found`);
    }

    const prompt = result[0];
    return {
      ...prompt,
      preview: await this.getPreview(prompt.id.toString()),
    };
  }

  async getPreview(id: string, version?: number): Promise<string> {
    const ver = version || 1;
    const filePath = join(this.promptsBasePath, id, `v${ver}`, 'starter.md');
    if (!existsSync(filePath)) {
      return 'Click to view prompt...';
    }
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').slice(0, 3);
    return lines.join('\n');
  }

  async getContent(id: string, level: string, version?: number): Promise<string> {
    const ver = version || 1;
    const filePath = join(this.promptsBasePath, id, `v${ver}`, `${level}.md`);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Prompt content not found');
    }
    return readFileSync(filePath, 'utf-8');
  }

  async create(data: { title: string; category: string; content: Record<string, string> }) {
    const [created] = await this.db.insert(promptsTable).values({
      title: data.title,
      category: data.category,
      status: 'pending',
      basePath: `prompts/${Date.now()}`,
      currentVersion: 1,
      isMultiVersion: Object.keys(data.content).length > 1,
    }).returning();
    return created;
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

  async checkEntitlement(userId: string, promptId: string): Promise<boolean> {
    const { subscriptions, unlocks } = schema;
    const [sub] = await this.db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);
    
    if (sub && sub.status === 'active' && !!sub.expiresAt && new Date(sub.expiresAt) > new Date()) {
      return true;
    }

    const [unlock] = await this.db.select().from(unlocks)
      .where(eq(unlocks.userId, userId))
      .limit(1);
    
    return unlock?.promptId === promptId;
  }
}