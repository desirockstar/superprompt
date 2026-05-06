import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import pg from 'pg';
const { Pool } = pg;

const SOURCE_DIR = '../../apps/backend/src/prompts/temp';
const DEST_DIR = '../../apps/backend/src/prompts';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/superprompt';
const pool = new Pool({ connectionString });

interface PromptFrontmatter {
  title?: string;
  slug?: string;
  category?: string;
  status?: string;
  isViral?: boolean;
  isNano?: boolean;
  version?: number;
  [key: string]: unknown;
}

interface PromptData {
  frontmatter: PromptFrontmatter;
  body: string;
  sourceFile: string;
}

function sanitizeSlug(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/\.md$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

async function scanSourceFiles(): Promise<Map<string, PromptData>> {
  const prompts = new Map<string, PromptData>();
  
  const entries = fs.readdirSync(SOURCE_DIR, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const slug = sanitizeSlug(entry.name);
      const content = fs.readFileSync(path.join(SOURCE_DIR, entry.name), 'utf-8');
      const { frontmatter, body } = parseFrontmatter(content);
      
      prompts.set(slug, { frontmatter, body, sourceFile: entry.name });
    }
  }
  
  return prompts;
}

async function ensureDestDir(slug: string): Promise<string> {
  const dir = path.join(DEST_DIR, slug);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

async function copyPrompts(prompts: Map<string, PromptData>) {
  let newCount = 0;
  let updatedCount = 0;
  let movedCount = 0;
  
  for (const [slug, { frontmatter, body, sourceFile }] of prompts) {
    const dir = await ensureDestDir(slug);
    const destPath = path.join(dir, 'prompt.md');
    
    const title = frontmatter.title || slug.replace(/-/g, ' ');
    const category = frontmatter.category || 'uncategorized';
    const version = frontmatter.version || 1;
    const status = frontmatter.status || 'approved';
    const isViral = frontmatter.isViral || false;
    const isNano = frontmatter.isNano || false;
    
    const newContent = `---
title: "${title}"
slug: "${slug}"
category: "${category}"
status: "${status}"
isViral: ${isViral}
isNano: ${isNano}
version: ${version}
---

${body}
`;
    
    const existed = fs.existsSync(destPath);
    fs.writeFileSync(destPath, newContent, 'utf-8');
    
    // Move file from temp (rename), fallback to copy+delete if cross-volume
    const sourcePath = path.join(SOURCE_DIR, sourceFile);
    try {
      fs.renameSync(sourcePath, path.join(dir, sourceFile));
    } catch {
      // Cross-volume move failed, delete the temp file
      fs.unlinkSync(sourcePath);
    }
    movedCount++;
    
    if (existed) {
      updatedCount++;
    } else {
      newCount++;
    }
  }
  
  return { newCount, updatedCount, movedCount };
}

async function getDbSlugs(): Promise<Set<string>> {
  const result = await pool.query('SELECT slug FROM prompts');
  return new Set(result.rows.map((r: { slug: string }) => r.slug));
}

async function hardDeleteMissing(sourceSlugs: Set<string>, dbSlugs: Set<string>) {
  let deletedCount = 0;
  
  for (const slug of dbSlugs) {
    if (!sourceSlugs.has(slug)) {
      await pool.query('DELETE FROM prompts WHERE slug = $1', [slug]);
      deletedCount++;
    }
  }
  
  return deletedCount;
}

async function sync() {
  try {
    console.log('🔄 Starting prompt sync...\n');
    
    console.log(`📂 Scanning source: ${SOURCE_DIR}`);
    const sourcePrompts = await scanSourceFiles();
    console.log(`   Found ${sourcePrompts.size} prompt files\n`);
    
    console.log(`📁 Copying to: ${DEST_DIR}`);
    const { newCount, updatedCount, movedCount } = await copyPrompts(sourcePrompts);
    console.log(`   New: ${newCount}, Updated: ${updatedCount}, Moved: ${movedCount}\n`);
    
    console.log('🗄️  Checking DB for missing prompts...');
    const dbSlugs = await getDbSlugs();
    const deletedCount = await hardDeleteMissing(sourcePrompts.keys(), dbSlugs);
    if (deletedCount > 0) {
      console.log(`   Deleted: ${deletedCount} prompts not in source\n`);
    } else {
      console.log(`   No deletions needed\n`);
    }
    
    console.log('✅ Sync complete!');
    console.log(`
Summary:
  📄 New files:        ${newCount}
  🔄 Updated files:   ${updatedCount}
  📦 Moved from temp:  ${movedCount}
  🗑️  Deleted from DB: ${deletedCount}
  📊 Total in source:  ${sourcePrompts.size}
    `);
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Sync failed:', err);
    await pool.end();
    process.exit(1);
  }
}

sync();