/**
 * Seed all prompts from the source directory into the database.
 * Uses descriptive filenames as basePath (no UUIDs, no "playwright").
 *
 * Usage (inside devcontainer):
 *   PROMPTS_DIR=/path/to/source/prompts pnpm seed:playwright
 *
 * Example source: C:\X\ARSENAL\_DEV_SPACE\@PROJECTS\PLAYWRIGHT\out\prompts
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { prompts, promptVersions } from './src/index';
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'fs';
import { join, basename } from 'path';
import { randomUUID } from 'crypto';

// ─── Config ───────────────────────────────────────────────────────────────────

const PROMPTS_DIR = process.env.PROMPTS_DIR || 'C:\\X\\ARSENAL\\_DEV_SPACE\\@PROJECTS\\PLAYWRIGHT\\out\\prompts';
const CONTENT_DIR = join(process.cwd(), '../../apps/backend/src/prompts');
const PREVIEW_MAX_CHARS = 220;
const CLEANUP_SOURCE = process.env.CLEANUP_SOURCE === 'true';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/superprompt';
const client = postgres(connectionString);
const db = drizzle(client);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip emoji and leading/trailing whitespace from a title string */
function cleanTitle(raw: string): string {
  // Remove common emoji ranges and variation selectors
  return raw
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .trim();
}

/** Parse YAML-style frontmatter between --- delimiters */
function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const result: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
    result[key] = value;
  }
  return result;
}

/** Extract the content body — between frontmatter and the "## How to use" section */
function extractBody(content: string): string {
  // Remove frontmatter block
  const withoutFrontmatter = content.replace(/^---[\s\S]*?---\r?\n/, '').trim();

  // Stop at "## How to use", "## Categories", or "## Recommended"
  const stopMatch = withoutFrontmatter.search(/\n##\s+(How to use|Categories|Recommended)/i);
  const body = stopMatch > 0 ? withoutFrontmatter.slice(0, stopMatch).trim() : withoutFrontmatter.trim();

  return body;
}

/** Build a ~220 char preview from the body — trim at word boundary */
function buildPreview(body: string): string {
  const flat = body.replace(/\r?\n+/g, ' ').replace(/\s+/g, ' ').trim();
  if (flat.length <= PREVIEW_MAX_CHARS) return flat;
  const truncated = flat.slice(0, PREVIEW_MAX_CHARS);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > PREVIEW_MAX_CHARS * 0.7 ? truncated.slice(0, lastSpace) : truncated) + '…';
}

/** Parse ## Categories section — returns [primaryCategory, secondaryTagsString] */
function parseCategories(content: string): [string, string] {
  const match = content.match(/##\s+Categories?\r?\n([\s\S]*?)(?:\n##|$)/i);
  if (!match) return ['General', ''];
  const cats = match[1]
    .split(/[,\n]/)
    .map(s => s.replace(/^[-*\s]+/, '').trim())
    .filter(Boolean);
  const primary = cats[0] || 'General';
  const secondary = cats.slice(1).join(', ');
  return [primary, secondary];
}

/** Parse ## Recommended tools — returns first tool as primaryTag */
function parseRecommendedTools(content: string): string {
  const match = content.match(/##\s+Recommended tools?\r?\n([\s\S]*?)(?:\n##|$)/i);
  if (!match) return '';
  const tools = match[1]
    .split(/[,\n]/)
    .map(s => s.replace(/^[-*\s]+/, '').trim())
    .filter(Boolean);
  return tools[0] || '';
}

// ─── Main ─────────────────────────────────────────────────────────────────────

/** Generate a slug from filename */
function generateSlug(filename: string): string {
  return basename(filename, '.md')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function seed() {
  if (!existsSync(PROMPTS_DIR)) {
    console.error(`❌ PROMPTS_DIR not found: ${PROMPTS_DIR}`);
    console.error('   Set PROMPTS_DIR environment variable to the source prompts directory');
    process.exit(1);
  }

  const allFiles = readdirSync(PROMPTS_DIR).filter(f => f.endsWith('.md'));
  console.log(`📂 Found ${allFiles.length} prompt files in ${PROMPTS_DIR}`);

  let inserted = 0;
  let skipped = 0;
  const slugToId = new Map<string, string>();

  for (const filename of allFiles) {
    const filepath = join(PROMPTS_DIR, filename);
    let raw: string;
    try {
      raw = readFileSync(filepath, 'utf-8');
    } catch {
      console.warn(`  ⚠️  Could not read ${filename}, skipping`);
      skipped++;
      continue;
    }

    const frontmatter = parseFrontmatter(raw);
    const rawTitle = frontmatter.title || basename(filename, '.md').replace(/-/g, ' ');
    const title = cleanTitle(rawTitle);
    if (!title) { skipped++; continue; }

    const body = extractBody(raw);
    const preview = buildPreview(body);
    const [category, secondaryTags] = parseCategories(raw);
    const primaryTag = parseRecommendedTools(raw);

    const slug = generateSlug(filename);
    if (!slug) { skipped++; continue; }

    // Handle duplicate slugs by appending counter
    let finalSlug = slug;
    let counter = 1;
    while (slugToId.has(finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const id = randomUUID();
    slugToId.set(finalSlug, id);
    const basePath = `prompts/${finalSlug}`;
    const versionId = randomUUID();

    // Write content file to filesystem
    const contentDir = join(CONTENT_DIR, finalSlug, 'v1');
    mkdirSync(contentDir, { recursive: true });
    writeFileSync(join(contentDir, 'prompt.md'), raw, 'utf-8');

    // Insert into DB
    try {
      await db.insert(prompts).values({
        id,
        title,
        category,
        secondaryTags: secondaryTags || null,
        primaryTag: primaryTag || null,
        status: 'approved',
        basePath,
        currentVersion: 1,
        isMultiVersion: false,
        views: 0,
        preview,
      }).onConflictDoNothing();

      await db.insert(promptVersions).values({
        id: versionId,
        promptId: id,
        versionNumber: 1,
        needsGrading: true,
      }).onConflictDoNothing();

      inserted++;
      if (inserted % 100 === 0) {
        console.log(`  ✅ ${inserted} / ${allFiles.length} inserted...`);
      }
    } catch (err) {
      console.warn(`  ⚠️  Failed to insert "${title}": ${err}`);
      skipped++;
    }
  }

  console.log(`\n✅ Done — ${inserted} prompts inserted, ${skipped} skipped`);

  // Cleanup source files if requested
  if (CLEANUP_SOURCE && existsSync(PROMPTS_DIR)) {
    try {
      rmSync(PROMPTS_DIR, { recursive: true, force: true });
      console.log(`🗑️  Cleaned up source directory: ${PROMPTS_DIR}`);
    } catch (err) {
      console.warn(`⚠️  Failed to cleanup source directory: ${err}`);
    }
  }

  await client.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
