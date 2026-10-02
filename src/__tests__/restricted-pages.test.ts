import { describe, it, expect } from 'vitest';
import { isRestrictedPage, getRestrictedPageMessage } from '../utils/restricted-pages';

describe('isRestrictedPage', () => {
  it('detects chrome:// pages', () => {
    expect(isRestrictedPage('chrome://settings')).toBe(true);
    expect(isRestrictedPage('chrome://extensions')).toBe(true);
    expect(isRestrictedPage('chrome://newtab')).toBe(true);
  });

  it('detects chrome-extension:// pages', () => {
    expect(isRestrictedPage('chrome-extension://abc123/popup.html')).toBe(true);
  });

  it('detects edge:// pages', () => {
    expect(isRestrictedPage('edge://settings')).toBe(true);
  });

  it('detects about: pages', () => {
    expect(isRestrictedPage('about:blank')).toBe(true);
  });

  it('detects data: URIs', () => {
    expect(isRestrictedPage('data:text/html,hello')).toBe(true);
  });

  it('detects Chrome Web Store', () => {
    expect(isRestrictedPage('https://chrome.google.com/webstore/detail/xyz')).toBe(true);
    expect(isRestrictedPage('https://chromewebstore.google.com/detail/xyz')).toBe(true);
  });

  it('allows regular HTTP pages', () => {
    expect(isRestrictedPage('https://example.com')).toBe(false);
    expect(isRestrictedPage('http://localhost:3000')).toBe(false);
    expect(isRestrictedPage('https://en.wikipedia.org/wiki/Main_Page')).toBe(false);
  });

  it('treats empty URL as restricted', () => {
    expect(isRestrictedPage('')).toBe(true);
  });
});

describe('getRestrictedPageMessage', () => {
  it('returns browser system message for chrome://', () => {
    expect(getRestrictedPageMessage('chrome://settings')).toContain('system');
  });

  it('returns extension message for chrome-extension://', () => {
    expect(getRestrictedPageMessage('chrome-extension://abc')).toContain('extension');
  });

  it('returns web store message for Chrome Web Store', () => {
    expect(getRestrictedPageMessage('https://chrome.google.com/webstore')).toContain('web store');
  });

  it('returns data URL message', () => {
    expect(getRestrictedPageMessage('data:text/html,hello')).toContain('Data');
  });

  it('returns generic message for empty URL', () => {
    expect(getRestrictedPageMessage('')).toContain('empty');
  });
});
