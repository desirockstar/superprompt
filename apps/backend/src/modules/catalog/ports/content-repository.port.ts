// Port: Content Repository — Catalog BC
// Abstracts file storage for prompt content (filesystem now, S3 later)

export interface ContentRepository {
  getPreview(basePath: string, version: number, isMultiVersion: boolean): Promise<string>;
  getFullContent(basePath: string, version: number, isMultiVersion: boolean): Promise<Record<string, string>>;
  getContentByLevel(basePath: string, level: string, version: number, isMultiVersion: boolean): Promise<string>;
  store(basePath: string, version: number, level: string, content: string): Promise<void>;
  storeMultiple(basePath: string, version: number, content: Record<string, string>, isMultiVersion: boolean): Promise<void>;
}

export const CONTENT_REPOSITORY = 'CONTENT_REPOSITORY';
