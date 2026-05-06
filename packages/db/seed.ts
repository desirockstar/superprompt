import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { prompts } from './src/index';
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
  status?: string;
  isViral?: boolean;
  isNano?: boolean;
  version?: number;
}

function parseFrontmatter(content: string): { frontmatter: PromptFrontmatter; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---([\s\S]*)$/);
  
  if (match) {
    const frontmatter = yaml.load(match[1]) as PromptFrontmatter;
    const body = match[2].trim();
    return { frontmatter, body };
  }
  
  return {
    frontmatter: {},
    body: content.trim()
  };
}

async function scanPrompts(): Promise<Array<{ slug: string; title: string; category: string; content: string; version: number }>> {
  const results: Array<{ slug: string; title: string; category: string; content: string; version: number }> = [];
  
  if (!fs.existsSync(PROMPTS_DIR)) {
    console.log(`⏭️  Prompts directory not found: ${PROMPTS_DIR}`);
    return results;
  }
  
  const entries = fs.readdirSync(PROMPTS_DIR, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    
    const slug = entry.name;
    const promptPath = path.join(PROMPTS_DIR, slug, 'prompt.md');
    
    if (!fs.existsSync(promptPath)) {
      console.log(`⏭️  Skipping ${slug} - prompt.md not found`);
      continue;
    }
    
    try {
      const content = fs.readFileSync(promptPath, 'utf-8');
      const { frontmatter, body } = parseFrontmatter(content);
      
      results.push({
        slug,
        title: frontmatter.title || slug.replace(/-/g, ' '),
        category: frontmatter.category || 'uncategorized',
        content: body,
        version: frontmatter.version || 1
      });
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
    
    const promptsToInsert = allPrompts.map((p) => ({
      slug: p.slug,
      title: p.title,
      category: p.category,
      status: 'approved' as const,
      basePath: `prompts/${p.slug}`,
      currentVersion: p.version,
      views: 0,
      preview: p.content.substring(0, 220),
      createdAt: new Date(),
    }));
    
    console.log(`💾 Inserting/updating prompts...`);
    const result = await db
      .insert(prompts)
      .values(promptsToInsert)
      .onConflictDoNothing()
      .returning();
    
    const skipped = promptsToInsert.length - result.length;
    console.log(`✅ Inserted: ${result.length}, Skipped (existing): ${skipped}\n`);
    
    console.log('🎉 Seed complete!');
    console.log(`
Summary:
  📄 Total files scanned:  ${allPrompts.length}
  ✅ Newly inserted:      ${result.length}
  ⏭️  Skipped (existing): ${skipped}
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