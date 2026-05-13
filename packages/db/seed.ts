import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { prompts, categories, tags } from './src/index';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/superprompt';
const pool = new Pool({ connectionString });
const db = drizzle(pool);

const PROMPTS_DIR = path.join(__dirname, '../../apps/backend/src/prompts');

interface PromptFrontmatter {
  title?: string;
  slug?: string;
  category?: string;
  domain?: string;
  tags?: string;
  complexity_score?: string;
  complexity?: string;
  status?: string;
  isViral?: boolean;
  isNano?: boolean;
  version?: number;
  how_to_use?: string;
  Tag?: string;
  Tag2?: string;
}

interface PromptRecord extends PromptFrontmatter {
  slug: string;
  body: string;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function ensureCategoryExists(name: string): Promise<string> {
  const catSlug = slugify(name.trim());
  const result = await db
    .insert(categories)
    .values({ name: name.trim(), slug: catSlug })
    .onConflictDoNothing()
    .returning();
  if (result.length > 0) return result[0].id;
  const [existing] = await db.select().from(categories).where(eq(categories.name, name.trim())).limit(1);
  return existing.id;
}

async function resolveCategoryIds(categoryStr: string): Promise<string[]> {
  if (!categoryStr) return [];
  const names = categoryStr.split(',').map(n => n.trim()).filter(Boolean);
  if (names.length === 0) return [];
  return Promise.all(names.map(ensureCategoryExists));
}

async function ensureTagExists(tagNameRaw: string): Promise<string> {
  const tagName = tagNameRaw.startsWith('#') ? tagNameRaw : `#${tagNameRaw}`;
  const tagSlug = slugify(tagNameRaw);

  const [existing] = await db.select().from(tags).where(eq(tags.slug, tagSlug)).limit(1);
  if (existing) return existing.id;

  const result = await db.insert(tags).values({ name: tagName, slug: tagSlug }).returning();
  return result[0].id;
}

async function resolveTagIds(tagStr: string): Promise<string[]> {
  if (!tagStr) return [];
  const names = tagStr.split(/[#,]/)
    .map(n => n.trim())
    .filter(Boolean);
  if (names.length === 0) return [];
  return Promise.all(names.map(ensureTagExists));
}

async function scanPrompts(): Promise<PromptRecord[]> {
  const results: PromptRecord[] = [];

  if (!fs.existsSync(PROMPTS_DIR)) {
    console.log(`⏭️  Prompts directory not found: ${PROMPTS_DIR}`);
    return results;
  }

  const entries = fs.readdirSync(PROMPTS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const slug = entry.name;
    const metaPath = path.join(PROMPTS_DIR, slug, 'metadata.yaml');
    const promptPath = path.join(PROMPTS_DIR, slug, 'prompt.md');

    if (!fs.existsSync(metaPath)) {
      console.log(`⏭️  Skipping ${slug} - metadata.yaml not found`);
      continue;
    }

    try {
      const meta = yaml.load(fs.readFileSync(metaPath, 'utf-8')) as PromptFrontmatter;
      const body = fs.existsSync(promptPath) ? fs.readFileSync(promptPath, 'utf-8') : '';
      results.push({ ...meta, slug, body });
    } catch (err) {
      console.error(`❌ Error parsing ${slug}:`, err);
    }
  }

  return results;
}

async function seed() {
  try {
    console.log('🚀 Starting seed process...\n');

    console.log(`📂 Scanning: ${PROMPTS_DIR}`);
    const allPrompts = await scanPrompts();
    console.log(`   Found ${allPrompts.length} prompt files\n`);

    if (allPrompts.length === 0) {
      console.log('⚠️  No prompts found to seed.\n');
      await pool.end();
      return;
    }

    console.log('🔧 Resolving category IDs...');
    const promptsWithCategoryIds = await Promise.all(
      allPrompts.map(async (p) => ({
        ...p,
        categoryIds: await resolveCategoryIds(p.category || ''),
        tagIds: await resolveTagIds(p.tags || ''),
      }))
    );
    console.log(`   Categories resolved for ${promptsWithCategoryIds.length} prompts\n`);

    const promptsToInsert = promptsWithCategoryIds.map((p) => ({
      slug: p.slug,
      title: p.title || p.slug.replace(/-/g, ' '),
      categoryIds: p.categoryIds.length > 0 ? p.categoryIds : [],
      tagIds: p.tagIds.length > 0 ? p.tagIds : [],
      status: (p.status as 'pending' | 'approved' | 'rejected') || 'approved',
      basePath: `prompts/${p.slug}`,
      currentVersion: p.version || 1,
      views: 0,
      preview: p.body.substring(0, 220),
      primaryTag: p.domain || null,
      secondaryTags: p.tags || null,
      isViral: p.isViral ?? false,
      isNano: p.isNano ?? false,
      complexityScore: p.complexity_score || null,
      complexityTier: p.complexity || null,
      createdAt: new Date(),
    }));

    console.log(`💾 Inserting/updating prompts...`);
    const result = await db
      .insert(prompts)
      .values(promptsToInsert)
      .onConflictDoUpdate({
        target: prompts.slug,
        set: {
          title: prompts.title,
          categoryIds: prompts.categoryIds,
          tagIds: prompts.tagIds,
          status: prompts.status,
          basePath: prompts.basePath,
          currentVersion: prompts.currentVersion,
          preview: prompts.preview,
          primaryTag: prompts.primaryTag,
          secondaryTags: prompts.secondaryTags,
          isViral: prompts.isViral,
          isNano: prompts.isNano,
          complexityScore: prompts.complexityScore,
          complexityTier: prompts.complexityTier,
        },
      })
      .returning();

    console.log(`✅ Upserted: ${result.length}\n`);

    console.log('🎉 Seed complete!');
    console.log(`
Summary:
  📄 Total files scanned:  ${allPrompts.length}
  ✅ Upserted:             ${result.length}
    `);

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    await pool.end();
    process.exit(1);
  }
}

seed();