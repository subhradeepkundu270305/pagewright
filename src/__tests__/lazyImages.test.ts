import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { resolveLazyImages } from '../content/lazyImages';

describe('resolveLazyImages', () => {
  let doc: Document;

  beforeEach(() => {
    const html = `<!DOCTYPE html>
<html>
<body>
  <img id="img-lazy" loading="lazy" src="https://example.com/normal.jpg" />
  <img id="img-data-src" data-src="https://example.com/real.jpg" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
  <img id="img-data-original" data-original="https://example.com/orig.jpg" src="placeholder.png" />
  <img id="img-responsive" data-srcset="https://example.com/hi-res.jpg 2x" src="low-res.jpg" />
  <picture id="picture-elem">
    <source data-srcset="https://example.com/webp.webp" type="image/webp" />
    <img id="img-in-picture" src="fallback.jpg" />
  </picture>
</body>
</html>`;
    const dom = new JSDOM(html);
    doc = dom.window.document;
  });

  it('converts loading="lazy" to loading="eager"', async () => {
    const img = doc.querySelector<HTMLImageElement>('#img-lazy')!;
    expect(img.getAttribute('loading')).toBe('lazy');

    await resolveLazyImages(doc, 50);

    expect(img.getAttribute('loading')).toBe('eager');
  });

  it('promotes data-src to src when src is placeholder or data URI', async () => {
    const img = doc.querySelector<HTMLImageElement>('#img-data-src')!;
    expect(img.src).toContain('data:image');

    await resolveLazyImages(doc, 50);

    expect(img.src).toBe('https://example.com/real.jpg');
  });

  it('promotes data-original to src', async () => {
    const img = doc.querySelector<HTMLImageElement>('#img-data-original')!;
    expect(img.getAttribute('src')).toBe('placeholder.png');

    await resolveLazyImages(doc, 50);

    expect(img.getAttribute('src')).toBe('https://example.com/orig.jpg');
  });

  it('promotes data-srcset to srcset on img and picture source elements', async () => {
    const img = doc.querySelector<HTMLImageElement>('#img-responsive')!;
    const source = doc.querySelector<HTMLSourceElement>('#picture-elem source')!;

    await resolveLazyImages(doc, 50);

    expect(img.srcset).toBe('https://example.com/hi-res.jpg 2x');
    expect(source.srcset).toBe('https://example.com/webp.webp');
  });
});
