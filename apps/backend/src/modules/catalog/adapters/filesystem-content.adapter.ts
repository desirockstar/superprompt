import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, readFileSync, mkdirSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { ContentRepository } from '../ports/content-repository.port';

@Injectable()
export class FilesystemContentAdapter implements ContentRepository {
  private readonly promptsBasePath = join(process.cwd(), 'src/prompts');

  async getPreview(basePath: string, version: number, isMultiVersion: boolean): Promise<string> {
    const ver = version || 1;
    const cleanPath = basePath.replace(/^prompts\//, '');

    // Try content.md first (single version), then starter.md (multi version)
    let filePath = join(this.promptsBasePath, cleanPath, `v${ver}`, 'content.md');
    if (!existsSync(filePath) && !isMultiVersion) {
      const dirPath = join(this.promptsBasePath, cleanPath, `v${ver}`);
      if (existsSync(dirPath)) {
        const files = readdirSync(dirPath);
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

  async getFullContent(basePath: string, version: number, isMultiVersion: boolean): Promise<Record<string, string>> {
    const content: Record<string, string> = {};

    if (isMultiVersion) {
      for (const level of ['starter', 'builder', 'pro', 'super']) {
        try {
          content[level] = await this.getContentByLevel(basePath, level, version);
        } catch {
          content[level] = '';
        }
      }
    } else {
      try {
        content.content = await this.getContentByLevel(basePath, 'content', version);
      } catch {
        content.content = '';
      }
    }
    return content;
  }

  async getContentByLevel(basePath: string, level: string, version: number): Promise<string> {
    const ver = version || 1;
    const cleanPath = basePath.replace(/^prompts\//, '');
    const filePath = join(this.promptsBasePath, cleanPath, `v${ver}`, `${level}.md`);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Prompt content not found');
    }
    return readFileSync(filePath, 'utf-8');
  }

  async store(basePath: string, version: number, level: string, content: string): Promise<void> {
    const cleanPath = basePath.replace(/^prompts\//, '');
    const versionDir = join(this.promptsBasePath, cleanPath, `v${version}`);

    if (!existsSync(versionDir)) {
      mkdirSync(versionDir, { recursive: true });
    }

    const filePath = join(versionDir, `${level}.md`);
    writeFileSync(filePath, content);
  }

  async storeMultiple(basePath: string, version: number, content: Record<string, string>, isMultiVersion: boolean): Promise<void> {
    const cleanPath = basePath.replace(/^prompts\//, '');
    const versionDir = join(this.promptsBasePath, cleanPath, `v${version}`);

    if (!existsSync(versionDir)) {
      mkdirSync(versionDir, { recursive: true });
    }

    if (isMultiVersion) {
      for (const [level, text] of Object.entries(content)) {
        if (text.trim() && level !== 'content') {
          writeFileSync(join(versionDir, `${level}.md`), text);
        }
      }
    } else {
      const singleContent = content.content || Object.values(content)[0] || '';
      if (singleContent.trim()) {
        writeFileSync(join(versionDir, 'content.md'), singleContent);
      }
    }
  }

  private readFileWithPreview(filePath: string): string {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const totalLines = lines.length;
    const previewLineCount = Math.max(10, Math.ceil(totalLines * 0.35));
    return lines.slice(0, previewLineCount).join('\n');
  }
}
