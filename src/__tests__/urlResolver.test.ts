import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { toAbsoluteUrl, resolveSrcset, resolveAllUrlsToAbsolute } from '../utils/urlResolver';

describe('URL Resolver Utility', () => {
  const baseUrl = 'https://en.wikipedia.org/wiki/DNA';

  describe('toAbsoluteUrl', () => {
    it('converts protocol-relative URLs (//) to https', () => {
      const result = toAbsoluteUrl('//upload.wikimedia.org/wikipedia/commons/thumb/d/d7/DNA.png', baseUrl);
      expect(result).toBe('https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/DNA.png');
    });

    it('resolves root-relative paths against baseUrl', () => {
      const result = toAbsoluteUrl('/wiki/Nucleic_acid', baseUrl);
      expect(result).toBe('https://en.wikipedia.org/wiki/Nucleic_acid');
    });

    it('resolves relative paths with ../', () => {
      const result = toAbsoluteUrl('../static/images/logo.png', baseUrl);
      expect(result).toBe('https://en.wikipedia.org/static/images/logo.png');
    });

    it('preserves hash-only anchors for in-page navigation', () => {
      expect(toAbsoluteUrl('#cite_note-1', baseUrl)).toBe('#cite_note-1');
      expect(toAbsoluteUrl('#Structure', baseUrl)).toBe('#Structure');
    });

    it('preserves data: and blob: URLs', () => {
      const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      expect(toAbsoluteUrl(dataUri, baseUrl)).toBe(dataUri);
      expect(toAbsoluteUrl('blob:https://example.com/123-456', baseUrl)).toBe('blob:https://example.com/123-456');
    });

    it('handles null and empty input gracefully', () => {
      expect(toAbsoluteUrl('', baseUrl)).toBe('');
      expect(toAbsoluteUrl(null, baseUrl)).toBeNull();
      expect(toAbsoluteUrl(undefined, baseUrl)).toBeNull();
    });
  });

  describe('resolveSrcset', () => {
    it('resolves multi-descriptor protocol-relative srcset values', () => {
      const srcset = '//upload.wikimedia.org/1.png 1.5x, //upload.wikimedia.org/2.png 2x';
      const resolved = resolveSrcset(srcset, baseUrl);
      expect(resolved).toBe('https://upload.wikimedia.org/1.png 1.5x, https://upload.wikimedia.org/2.png 2x');
    });

    it('resolves width descriptors (w)', () => {
      const srcset = '/images/small.jpg 300w, /images/large.jpg 1000w';
      const resolved = resolveSrcset(srcset, baseUrl);
      expect(resolved).toBe('https://en.wikipedia.org/images/small.jpg 300w, https://en.wikipedia.org/images/large.jpg 1000w');
    });
  });

  describe('resolveAllUrlsToAbsolute', () => {
    let doc: Document;

    beforeEach(() => {
      const dom = new JSDOM(`<!DOCTYPE html>
<html>
<body>
  <div id="content">
    <a id="link1" href="/wiki/Polymer">Polymer</a>
    <a id="link2" href="#cite-1">Footnote</a>
    <img id="img1" src="//upload.wikimedia.org/test.png" srcset="//upload.wikimedia.org/test-2x.png 2x" />
    <picture>
      <source id="source1" srcset="//upload.wikimedia.org/source.webp" />
      <img id="img2" src="/static/fallback.jpg" />
    </picture>
    <video id="video1" src="/media/clip.mp4" poster="//upload.wikimedia.org/poster.jpg"></video>
  </div>
</body>
</html>`);
      doc = dom.window.document;
    });

    it('converts all element attributes in the container to absolute URLs', () => {
      resolveAllUrlsToAbsolute(doc.body, baseUrl);

      expect(doc.querySelector('#link1')?.getAttribute('href')).toBe('https://en.wikipedia.org/wiki/Polymer');
      expect(doc.querySelector('#link2')?.getAttribute('href')).toBe('#cite-1');
      expect(doc.querySelector('#img1')?.getAttribute('src')).toBe('https://upload.wikimedia.org/test.png');
      expect(doc.querySelector('#img1')?.getAttribute('srcset')).toBe('https://upload.wikimedia.org/test-2x.png 2x');
      expect(doc.querySelector('#source1')?.getAttribute('srcset')).toBe('https://upload.wikimedia.org/source.webp');
      expect(doc.querySelector('#img2')?.getAttribute('src')).toBe('https://en.wikipedia.org/static/fallback.jpg');
      expect(doc.querySelector('#video1')?.getAttribute('src')).toBe('https://en.wikipedia.org/media/clip.mp4');
      expect(doc.querySelector('#video1')?.getAttribute('poster')).toBe('https://upload.wikimedia.org/poster.jpg');
    });
  });
});
