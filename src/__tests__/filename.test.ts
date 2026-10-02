import { describe, it, expect } from 'vitest';
import { generateFilename } from '../utils/filename';

describe('generateFilename', () => {
  it('generates filename from title', () => {
    const filename = generateFilename('My Test Page');
    expect(filename).toMatch(/^my-test-page-\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it('removes special characters', () => {
    const filename = generateFilename('Hello! @World# $Test%');
    expect(filename).toMatch(/^hello-world-test-\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it('handles empty title', () => {
    const filename = generateFilename('');
    expect(filename).toMatch(/^untitled-page-\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it('handles whitespace-only title', () => {
    const filename = generateFilename('   ');
    expect(filename).toMatch(/^untitled-page-\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it('truncates long titles to 100 chars', () => {
    const longTitle = 'a'.repeat(200);
    const filename = generateFilename(longTitle);
    // Should be 100 chars base + hyphen + date + .pdf
    const parts = filename.split('-');
    const basePart = parts.slice(0, -3).join('-'); // Everything before YYYY-MM-DD
    expect(basePart.length).toBeLessThanOrEqual(100);
  });

  it('uses custom extension', () => {
    const filename = generateFilename('Test', '.txt');
    expect(filename).toMatch(/\.txt$/);
  });

  it('adds dot prefix to extension if missing', () => {
    const filename = generateFilename('Test', 'txt');
    expect(filename).toMatch(/\.txt$/);
  });

  it('converts to lowercase', () => {
    const filename = generateFilename('UPPERCASE Title');
    expect(filename).toMatch(/^uppercase-title-/);
  });

  it('replaces multiple spaces with single hyphen', () => {
    const filename = generateFilename('word1   word2    word3');
    expect(filename).toMatch(/^word1-word2-word3-/);
  });

  it('preserves hyphens and underscores', () => {
    const filename = generateFilename('my-page_title');
    expect(filename).toMatch(/^my-page_title-/);
  });
});
