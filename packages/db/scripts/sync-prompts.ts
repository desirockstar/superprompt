import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import pg from 'pg';
const { Pool } = pg;

const SOURCE_DIR = '../../apps/backend/src/prompts-tmp';
const DEST_DIR = '../../apps/backend/src/prompts';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/superprompt';
const pool = new Pool({ connectionString });

interface PromptFrontmatter {
  title?: string;
  slug?: string;
  Revised_Title?: string;
  Revised_Slug?: string;
  Primary?: string;
  Output_Type?: string;
  Output_Format?: string;
  Recommended_AI?: string;
  Domain?: string;
  Complexity_Score?: string;
  Complexity?: string;
  Language?: string;
  Audience?: string;
  Tone?: string;
  Tags?: string;
  category?: string;
  status?: string;
  isViral?: boolean;
  isNano?: boolean;
  version?: number;
  [key: string]: unknown;
}

interface PromptData {
  frontmatter: PromptFrontmatter;
  raw: string;
  sourceFile: string;
}

function sanitizeSlug(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/\.md$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function scanSourceFiles(): Promise<Map<string, PromptData>> {
  const prompts = new Map<string, PromptData>();

  if (!fs.existsSync(SOURCE_DIR)) {
    console.log(`[WARN] Source directory not found: ${SOURCE_DIR}`);
    return prompts;
  }

  const entries = fs.readdirSync(SOURCE_DIR, { withFileTypes: true });
  console.log(`[INFO] Processing ${entries.length} prompt files`);

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      const raw = fs.readFileSync(path.join(SOURCE_DIR, entry.name), 'utf-8');
      const allDashes = [...raw.matchAll(/^---$/gm)];
      let frontmatterRaw = '';
      let bodyRaw = raw;

      if (allDashes.length >= 2) {
        const secondDash = allDashes[1];
        const fmEnd = raw.indexOf('\n', secondDash.index) + 1;
        frontmatterRaw = raw.substring(4, secondDash.index);
        bodyRaw = raw.substring(fmEnd);
      } else {
        const match = raw.match(/^---\n([\s\S]*?)\n---([\s\S]*)$/);
        if (match) {
          frontmatterRaw = match[1];
          bodyRaw = match[2];
        }
      }

      const sanitized = frontmatterRaw.replace(/\*\*([\w_]+):\*\*/g, '$1:').replace(/\t/g, '  ');
      const frontmatter = yaml.load(sanitized) as PromptFrontmatter;

      const effectiveSlug = frontmatter.Revised_Slug || frontmatter.slug || sanitizeSlug(entry.name);
      prompts.set(effectiveSlug, { frontmatter, raw, sourceFile: entry.name });
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

  const entries = Array.from(prompts.entries());
  const count = entries.length;

  console.log(`[INFO] Copying ${count} prompts to ${DEST_DIR}...`);

  for (let i = 0; i < count; i++) {
    const [slug, { frontmatter, raw }] = entries[i];
    const dir = await ensureDestDir(slug);
    const promptPath = path.join(dir, 'prompt.md');
    const metaPath = path.join(dir, 'metadata.yaml');

    const title = frontmatter.Revised_Title || frontmatter.title || slug.replace(/-/g, ' ');

    let body = '';
    let howToUse = '';

    const allDashes = [...raw.matchAll(/^---$/gm)];
    if (allDashes.length >= 2) {
      const secondDash = allDashes[1];
      const fmEnd = raw.indexOf('\n', secondDash.index) + 1;
      body = raw.substring(fmEnd);
    }

    const howToMatch = body.match(/(?:\r\n|\n)##\s+How to use the prompt[\s\S]*?(?=(?:\r\n|\n)##[^#])/i);
    if (howToMatch) {
      howToUse = howToMatch[0].replace(/[\s\S]*?\n##\s+How to use the prompt\s*/i, '').replace(/\n+$/, '').replace(/^\n+/, '').trim();
      const howToIdx = howToMatch.index!;
      body = body.substring(0, howToIdx).trim();
    } else {
      body = body.trim();
    }

    const meta = {
      title,
      slug,
      category: frontmatter.Primary || frontmatter.category || 'uncategorized',
      domain: frontmatter.Domain || '',
      tags: frontmatter.Tags || '',
      output_type: frontmatter.Output_Type || '',
      output_format: frontmatter.Output_Format || '',
      recommended_ai: frontmatter.Recommended_AI || '',
      complexity_score: frontmatter.Complexity_Score || '',
      complexity: frontmatter.Complexity || '',
      language: frontmatter.Language || '',
      audience: frontmatter.Audience || '',
      tone: frontmatter.Tone || '',
      status: frontmatter.status || 'approved',
      isViral: frontmatter.isViral ?? false,
      isNano: frontmatter.isNano ?? false,
      version: frontmatter.version || 1,
      how_to_use: howToUse,
    };

    const existed = fs.existsSync(promptPath);
    fs.writeFileSync(promptPath, body, 'utf-8');
    fs.writeFileSync(metaPath, yaml.dump(meta, { lineWidth: -1 }), 'utf-8');
    movedCount++;

    if (existed) {
      updatedCount++;
    } else {
      newCount++;
    }

    if ((i + 1) % 10 === 0) {
      console.log(`[PROGRESS] ${i + 1}/${count} prompts processed`);
    }
  }

  console.log(`[INFO] Copy complete: ${newCount} new, ${updatedCount} updated, ${movedCount} moved`);
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
    const deletedCount = await hardDeleteMissing(new Set(sourcePrompts.keys()), dbSlugs);
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