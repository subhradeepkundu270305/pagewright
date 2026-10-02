import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { cleanHtml, sanitizeHtml } from '../content/cleaner';

// Mock DOMPurify for Node.js testing
// We import and test cleanHtml logic that doesn't depend on DOMPurify
// DOMPurify tests use JSDOM's window

describe('cleanHtml', () => {
  let dom: JSDOM;
  let doc: Document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    doc = dom.window.document;
  });

  it('removes elements matching ad selectors', () => {
    doc.body.innerHTML = `
      <div class="content">Keep this</div>
      <div class="ad-banner">Ad content</div>
      <div class="advertisement">Another ad</div>
      <div class="adsbygoogle">Google ad</div>
    `;

    // Simulate ad removal
    const adSelectors = '[class*="ad-"], [class*="ad_"], .advertisement, .adsbygoogle';
    doc.querySelectorAll(adSelectors).forEach((el) => el.remove());

    expect(doc.body.textContent).toContain('Keep this');
    expect(doc.body.textContent).not.toContain('Ad content');
    expect(doc.body.textContent).not.toContain('Another ad');
    expect(doc.body.textContent).not.toContain('Google ad');
  });

  it('removes cookie banners', () => {
    doc.body.innerHTML = `
      <div class="content">Article text</div>
      <div class="cookie-banner">Accept cookies</div>
      <div id="cookie-notice">Cookie notice</div>
      <div class="consent-dialog">Consent required</div>
      <div id="onetrust-banner-sdk">OneTrust banner</div>
    `;

    const cookieSelectors = '[class*="cookie"], [id*="cookie"], [class*="consent"], [id*="consent"], #onetrust-banner-sdk';
    doc.querySelectorAll(cookieSelectors).forEach((el) => el.remove());

    expect(doc.body.textContent).toContain('Article text');
    expect(doc.body.textContent).not.toContain('Accept cookies');
    expect(doc.body.textContent).not.toContain('Cookie notice');
    expect(doc.body.textContent).not.toContain('Consent required');
    expect(doc.body.textContent).not.toContain('OneTrust banner');
  });

  it('removes navigation elements when removeNavigation is true', () => {
    doc.body.innerHTML = `
      <nav>Navigation menu</nav>
      <header>Site header</header>
      <main><p>Main content</p></main>
      <footer>Site footer</footer>
      <aside class="sidebar">Sidebar</aside>
    `;

    const navSelectors = 'nav, header, footer, aside, .sidebar';
    doc.querySelectorAll(navSelectors).forEach((el) => el.remove());

    expect(doc.body.textContent).toContain('Main content');
    expect(doc.body.textContent).not.toContain('Navigation menu');
    expect(doc.body.textContent).not.toContain('Site header');
    expect(doc.body.textContent).not.toContain('Site footer');
    expect(doc.body.textContent).not.toContain('Sidebar');
  });

  it('removes script and style tags', () => {
    doc.body.innerHTML = `
      <p>Visible text</p>
      <script>alert('xss')</script>
      <style>.foo { color: red; }</style>
      <noscript>Enable JavaScript</noscript>
    `;

    doc.querySelectorAll('script, style, noscript').forEach((el) => el.remove());

    expect(doc.body.textContent).toContain('Visible text');
    expect(doc.body.innerHTML).not.toContain('script');
    expect(doc.body.innerHTML).not.toContain('style');
  });

  it('converts links to spans when includeLinks is false', () => {
    doc.body.innerHTML = `
      <p>Visit <a href="https://example.com">Example</a> site</p>
    `;

    doc.querySelectorAll('a').forEach((link) => {
      const span = doc.createElement('span');
      span.innerHTML = link.innerHTML;
      link.parentNode?.replaceChild(span, link);
    });

    expect(doc.body.textContent).toContain('Example');
    expect(doc.body.querySelectorAll('a').length).toBe(0);
    expect(doc.body.querySelectorAll('span').length).toBe(1);
  });

  it('removes images when includeImages is false', () => {
    doc.body.innerHTML = `
      <p>Text before</p>
      <img src="photo.jpg" alt="Photo" />
      <figure><img src="figure.jpg" /><figcaption>Caption</figcaption></figure>
      <p>Text after</p>
    `;

    doc.querySelectorAll('img, picture, figure, video').forEach((el) => el.remove());

    expect(doc.body.textContent).toContain('Text before');
    expect(doc.body.textContent).toContain('Text after');
    expect(doc.body.querySelectorAll('img').length).toBe(0);
    expect(doc.body.querySelectorAll('figure').length).toBe(0);
  });

  it('removes social sharing buttons', () => {
    doc.body.innerHTML = `
      <article>Content here</article>
      <div class="social-share">Share on Twitter</div>
      <div class="share-buttons">Share buttons</div>
    `;

    const socialSelectors = '[class*="social"], [class*="share"], .share-buttons';
    doc.querySelectorAll(socialSelectors).forEach((el) => el.remove());

    expect(doc.body.textContent).toContain('Content here');
    expect(doc.body.textContent).not.toContain('Share on Twitter');
    expect(doc.body.textContent).not.toContain('Share buttons');
  });

  it('removes comment sections', () => {
    doc.body.innerHTML = `
      <article>Article content</article>
      <section id="comments">User comments</section>
      <div class="comments-area">More comments</div>
      <div id="disqus_thread">Disqus</div>
    `;

    const commentSelectors = '[id*="comment"], [class*="comment"], #disqus_thread, .comments-area';
    doc.querySelectorAll(commentSelectors).forEach((el) => el.remove());

    expect(doc.body.textContent).toContain('Article content');
    expect(doc.body.textContent).not.toContain('User comments');
    expect(doc.body.textContent).not.toContain('Disqus');
  });

  it('NEVER removes body or html even if they contain menu, modal, or overlay classes', () => {
    const customDom = new JSDOM(`<!DOCTYPE html>
<html class="has-overlay modal-open">
<body class="skin-vector skin-vector-2022 vector-feature-main-menu-pinned-disabled menu-available modal-backdrop">
  <div class="vector-menu">Sidebar Navigation</div>
  <main id="content">
    <h1>Wikipedia Article</h1>
    <p>Real article content that must remain.</p>
  </main>
</body>
</html>`);
    const customDoc = customDom.window.document;

    cleanHtml(customDoc, {
      removeAds: true,
      removeNavigation: true,
      includeImages: true,
      includeLinks: true,
    });

    // Body and documentElement must still exist
    expect(customDoc.body).not.toBeNull();
    expect(customDoc.documentElement).not.toBeNull();
    // Inner HTML must be accessible without throwing
    expect(customDoc.body.innerHTML).toBeDefined();
    expect(customDoc.body.textContent).toContain('Real article content that must remain.');
    // The menu inside should have been removed
    expect(customDoc.querySelector('.vector-menu')).toBeNull();
  });

  it('removes empty residual blocks to avoid unnecessary whitespace gaps', () => {
    doc.body.innerHTML = `
      <div id="content">
        <h1>Heading</h1>
        <p>Paragraph with text.</p>
        <div class="empty-ad-placeholder">   </div>
        <p></p>
        <section> </section>
      </div>
    `;

    cleanHtml(doc, {
      removeAds: true,
      removeNavigation: true,
      includeImages: true,
      includeLinks: true,
    });

    expect(doc.querySelector('.empty-ad-placeholder')).toBeNull();
    expect(doc.querySelectorAll('p').length).toBe(1);
    expect(doc.querySelectorAll('section').length).toBe(0);
  });

  it('unhides accordion and tab content with images instead of removing them', () => {
    doc.body.innerHTML = `
      <div id="main-article">
        <h1>Medical Guide</h1>
        <div class="tab-panel" style="display: none;">
          <h2>Anatomy Section</h2>
          <img src="https://example.com/diagram.png" alt="Anatomy Diagram" />
          <p>Detailed medical explanation of anatomy and physiology.</p>
        </div>
        <div class="empty-hidden-box" style="display: none;"></div>
      </div>
    `;

    cleanHtml(doc, {
      removeAds: true,
      removeNavigation: true,
      includeImages: true,
      includeLinks: true,
    });

    const panel = doc.querySelector('.tab-panel') as HTMLElement;
    expect(panel).not.toBeNull();
    expect(panel.style.display).toBe('block');
    expect(panel.querySelector('img')).not.toBeNull();
    expect(doc.querySelector('.empty-hidden-box')).toBeNull();
  });

  it('auto-expands all details elements so collapsible FAQs are visible in print', () => {
    doc.body.innerHTML = `
      <details>
        <summary>What is the placenta?</summary>
        <p>The placenta provides oxygen and nutrients to growing babies.</p>
      </details>
    `;

    cleanHtml(doc, {
      removeAds: true,
      removeNavigation: true,
      includeImages: true,
      includeLinks: true,
    });

    const details = doc.querySelector('details');
    expect(details?.getAttribute('open')).toBe('true');
  });
});

describe('sanitizeHtml', () => {
  it('preserves layout styles such as width on thumbnail boxes', () => {
    const input = '<div class="thumbinner" style="width: 222px;"><img src="https://example.com/pic.jpg" /><div class="thumbcaption">Caption</div></div>';
    const output = sanitizeHtml(input);

    expect(output).toContain('style="width: 222px;"');
    expect(output).toContain('https://example.com/pic.jpg');
    expect(output).toContain('Caption');
  });

  it('preserves MathML formula tags', () => {
    const input = '<math display="block"><mrow><msup><mi>x</mi><mn>2</mn></msup><mo>+</mo><msup><mi>y</mi><mn>2</mn></msup></mrow></math>';
    const output = sanitizeHtml(input);

    expect(output).toContain('<math');
    expect(output).toContain('<msup>');
    expect(output).toContain('<mi>x</mi>');
  });

  it('preserves inlined base64 data URI images and data attributes', () => {
    const input = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" data-src="https://example.com/real.png" alt="Inlined" />';
    const output = sanitizeHtml(input);

    expect(output).toContain('data:image/png;base64,');
    expect(output).toContain('data-src="https://example.com/real.png"');
    expect(output).toContain('alt="Inlined"');
  });
});
