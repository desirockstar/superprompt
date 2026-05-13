import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry {
  value: any;
  expiresAt: number;
  tags?: string[];
}

@Injectable()
export class CacheService {
  private readonly store = new Map<string, CacheEntry>();
  private readonly tagIndex = new Map<string, Set<string>>();
  private readonly logger = new Logger(CacheService.name);

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.removeEntry(key);
      return undefined;
    }
    return entry.value as T;
  }

  set(key: string, value: any, ttlMs: number, tags?: string[]): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs, tags });
    
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(key);
      }
    }
  }

  delete(key: string): void {
    this.removeEntry(key);
  }

  deleteByPrefix(prefix: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      this.removeEntry(key);
    }
    if (keysToDelete.length > 0) {
      this.logger.debug(`Deleted ${keysToDelete.length} cache entries by prefix: ${prefix}`);
    }
  }

  invalidateByTags(tags: string[]): void {
    const keysToDelete: string[] = [];
    
    for (const tag of tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keysToDelete.push(...keys);
      }
    }
    
    const uniqueKeys = [...new Set(keysToDelete)];
    for (const key of uniqueKeys) {
      this.removeEntry(key);
    }
    
    if (uniqueKeys.length > 0) {
      this.logger.debug(`Invalidated ${uniqueKeys.length} cache entries by tags: ${tags.join(', ')}`);
    }
  }

  invalidatePromptsList(): void {
    this.deleteByPrefix('prompts:list');
    this.invalidateByTags(['prompts', 'catalog']);
  }

  invalidatePromptDetail(slug: string): void {
    this.delete(`prompts:detail:${slug}`);
    this.invalidatePromptsList();
  }

  invalidateCategories(): void {
    this.deleteByPrefix('prompts:categories');
    this.invalidateByTags(['categories']);
  }

  invalidateUserState(userId: string): void {
    this.delete(`user:state:${userId}`);
    this.invalidateByTags(['user']);
  }

  clear(): void {
    this.store.clear();
    this.tagIndex.clear();
    this.logger.log('Cache cleared');
  }

  private removeEntry(key: string): void {
    const entry = this.store.get(key);
    if (entry?.tags) {
      for (const tag of entry.tags) {
        const keys = this.tagIndex.get(tag);
        if (keys) {
          keys.delete(key);
          if (keys.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      }
    }
    this.store.delete(key);
  }

  getStats(): { size: number; tags: number; keysByTag: Record<string, number> } {
    const keysByTag: Record<string, number> = {};
    for (const [tag, keys] of this.tagIndex.entries()) {
      keysByTag[tag] = keys.size;
    }
    return {
      size: this.store.size,
      tags: this.tagIndex.size,
      keysByTag,
    };
  }
}
