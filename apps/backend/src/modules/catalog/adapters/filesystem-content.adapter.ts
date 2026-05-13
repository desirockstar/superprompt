import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ContentRepository } from '../ports/content-repository.port';

@Injectable()
export class FilesystemContentAdapter implements ContentRepository {
  private readonly promptsBasePath = join(process.cwd(), 'src/prompts');
  private readonly logger = new Logger(FilesystemContentAdapter.name);

  /**
   * Ensure directory exists and create if needed
   */
  private ensureDir(dirPath: string): void {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Resolve file path based on isMultiVersion flag
   * Single-version: /prompts/{id}/v{n}/prompt.md
   * Multi-version: /prompts/{id}/v{n}/content/{tier}.md
   */
  private resolveFilePath(basePath: string, level: string, version: number, isMultiVersion: boolean): string {
    const cleanPath = basePath.replace(/^prompts\//, '');
    const versionPath = join(this.promptsBasePath, cleanPath, `v${version}`);

    if (isMultiVersion) {
      return join(versionPath, 'content', `${level}.md`);
    } else {
      return join(versionPath, 'prompt.md');
    }
  }

  async getPreview(basePath: string, version: number, isMultiVersion: boolean): Promise<string> {
    const ver = version || 1;

    try {
      let filePath: string;

      if (isMultiVersion) {
        filePath = this.resolveFilePath(basePath, 'starter', ver, true);
      } else {
        filePath = this.resolveFilePath(basePath, '', ver, false);
      }

      if (!existsSync(filePath)) {
        return '';
      }

      return this.readFileWithPreview(filePath);
    } catch (error) {
      this.logger.error(`Error reading preview for ${basePath} v${ver}:`, error);
      return '';
    }
  }

  async getFullContent(basePath: string, version: number, isMultiVersion: boolean): Promise<Record<string, string>> {
    const content: Record<string, string> = {};

    try {
      if (isMultiVersion) {
        for (const level of ['starter', 'builder', 'pro', 'super']) {
          try {
            content[level] = await this.getContentByLevel(basePath, level, version, isMultiVersion);
          } catch (error) {
            this.logger.debug(`Tier ${level} not found for ${basePath} v${version}`);
            content[level] = '';
          }
        }
      } else {
        try {
          content.content = await this.getContentByLevel(basePath, '', version, false);
        } catch (error) {
          this.logger.debug(`Content not found for ${basePath} v${version}`);
          content.content = '';
        }
      }
    } catch (error) {
      this.logger.error(`Error reading full content for ${basePath} v${version}:`, error);
    }

    return content;
  }

  async getContentByLevel(basePath: string, level: string, version: number, isMultiVersion: boolean): Promise<string> {
    const filePath = this.resolveFilePath(basePath, level, version, isMultiVersion);

    if (!existsSync(filePath)) {
      throw new NotFoundException(`Prompt content not found: ${filePath}`);
    }

    return readFileSync(filePath, 'utf-8');
  }

  async store(basePath: string, version: number, level: string, content: string): Promise<void> {
    const cleanPath = basePath.replace(/^prompts\//, '');
    const versionPath = join(this.promptsBasePath, cleanPath, `v${version}`);

    this.ensureDir(versionPath);

    // Single-version: store as prompt.md
    const filePath = join(versionPath, 'prompt.md');
    writeFileSync(filePath, content);

    this.logger.debug(`Stored single-version prompt for ${basePath} v${version}`);
  }

  async storeMultiple(basePath: string, version: number, content: Record<string, string>, isMultiVersion: boolean): Promise<void> {
    const cleanPath = basePath.replace(/^prompts\//, '');
    const versionPath = join(this.promptsBasePath, cleanPath, `v${version}`);

    if (isMultiVersion) {
      // Multi-version: store in content/ subdirectory
      const contentDir = join(versionPath, 'content');
      this.ensureDir(contentDir);

      for (const [level, text] of Object.entries(content)) {
        if (text.trim() && ['starter', 'builder', 'pro', 'super'].includes(level)) {
          const filePath = join(contentDir, `${level}.md`);
          writeFileSync(filePath, text);
        }
      }

      this.logger.debug(`Stored multi-version prompt for ${basePath} v${version}`);
    } else {
      // Single-version: store as prompt.md
      this.ensureDir(versionPath);

      const singleContent = content.content || Object.values(content)[0] || '';
      if (singleContent.trim()) {
        const filePath = join(versionPath, 'prompt.md');
        writeFileSync(filePath, singleContent);
      }

      this.logger.debug(`Stored single-version prompt for ${basePath} v${version}`);
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
