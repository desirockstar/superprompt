import { describe, it, expect } from '@jest/globals';
import { slugify, truncate, getFileExtension, buildFilePath, isValidUuid } from './index';

describe('slugify', () => {
  it('should convert to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('should replace spaces with hyphens', () => {
    expect(slugify('hello world test')).toBe('hello-world-test');
  });

  it('should remove non-alphanumeric characters except hyphens', () => {
    expect(slugify('Hello, World! @2025')).toBe('hello-world-2025');
  });

  it('should collapse multiple hyphens', () => {
    expect(slugify('hello  --- world')).toBe('hello-world');
  });

  it('should trim leading/trailing hyphens', () => {
    expect(slugify('  hello world  ')).toBe('hello-world');
  });

  it('should handle empty string', () => {
    expect(slugify('')).toBe('');
  });
});

describe('truncate', () => {
  it('should return original text if shorter than maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('should truncate with ellipsis if longer than maxLength', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });

  it('should handle exact length (no truncation needed)', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('should handle very short maxLength', () => {
    expect(truncate('hello world', 3)).toBe('...');
  });

  it('should handle empty string', () => {
    expect(truncate('', 10)).toBe('');
  });
});

describe('getFileExtension', () => {
  it('should return extension for simple file', () => {
    expect(getFileExtension('readme.txt')).toBe('txt');
  });

  it('should return extension for nested path', () => {
    expect(getFileExtension('path/to/file.md')).toBe('md');
  });

  it('should return empty string for file with no extension', () => {
    expect(getFileExtension('filename')).toBe('');
  });

  it('should return empty string for dotfile', () => {
    expect(getFileExtension('.gitignore')).toBe('');
  });

  it('should handle multiple dots (last one wins)', () => {
    expect(getFileExtension('file.backup.txt')).toBe('txt');
  });
});

describe('buildFilePath', () => {
  it('should build correct path with version and level', () => {
    expect(buildFilePath('prompts/my-prompt', 1, 'starter')).toBe('prompts/my-prompt/v1/starter.md');
  });

  it('should handle multi-version paths', () => {
    expect(buildFilePath('prompts/test', 3, 'super')).toBe('prompts/test/v3/super.md');
  });

  it('should work with various level names', () => {
    expect(buildFilePath('base', 2, 'builder')).toBe('base/v2/builder.md');
  });
});

describe('isValidUuid', () => {
  it('should return true for valid UUID v4', () => {
    expect(isValidUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
  });

  it('should return true for lowercase UUID', () => {
    expect(isValidUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
  });

  it('should return true for uppercase UUID', () => {
    expect(isValidUuid('123E4567-E89B-12D3-A456-426614174000')).toBe(true);
  });

  it('should return false for invalid format', () => {
    expect(isValidUuid('not-a-uuid')).toBe(false);
  });

  it('should return false for too short', () => {
    expect(isValidUuid('123e4567-e89b-12d3-a456')).toBe(false);
  });

  it('should return false for missing hyphens', () => {
    expect(isValidUuid('123e4567e89b12d3a456426614174000')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(isValidUuid('')).toBe(false);
  });
});