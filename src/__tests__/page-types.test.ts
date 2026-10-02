import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { cleanHtml, sanitizeHtml } from '../content/cleaner';
import { Readability } from '@mozilla/readability';

describe('Page Type Conversion Pipeline Tests', () => {
  const defaultCleanOptions = {
    removeAds: true,
    removeNavigation: true,
    includeImages: true,
    includeLinks: true,
  };

  describe('1. News Article (NYTimes/BBC/Guardian style)', () => {
    let doc: Document;

    beforeEach(() => {
      const html = `<!DOCTYPE html>
<html>
<head><title>Global Climate Summit Concludes With Landmark Agreement - Daily News</title></head>
<body>
  <header class="site-header">
    <nav class="main-nav"><ul><li><a href="/">Home</a></li><li><a href="/world">World</a></li></ul></nav>
  </header>
  <div class="ad-banner top-leaderboard">
    <iframe src="https://googlesyndication.com/ad"></iframe>
  </div>
  <main id="main-content">
    <article class="news-article">
      <h1 class="headline">Global Climate Summit Concludes With Landmark Agreement</h1>
      <div class="byline-section">
        <span class="author">By Sarah Jenkins</span>
        <time datetime="2026-10-01">October 1, 2026</time>
      </div>
      <div class="social-share share-buttons">
        <button class="twitter-share">Share</button>
      </div>
      <p class="lead-paragraph">Delegates from 195 nations reached an ambitious accord today following marathon negotiations.</p>
      <figure class="article-hero">
        <img data-src="https://example.com/summit-hero.jpg" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="Summit hall" />
        <figcaption>Delegates celebrate after consensus was declared.</figcaption>
      </figure>
      <p>Key resolutions include a transition timeline away from fossil fuels and financing mechanisms for developing regions.</p>
      <div class="sponsored-content outbrain-widget">Sponsored Stories</div>
    </article>
    <div id="comments" class="comments-area">
      <h3>Reader Comments</h3>
      <p>Great news!</p>
    </div>
  </main>
  <footer class="site-footer">Copyright 2026 Daily News</footer>
</body>
</html>`;
      const dom = new JSDOM(html);
      doc = dom.window.document;
    });

    it('strips top ad banners, sponsored widgets, and reader comments', () => {
      cleanHtml(doc, defaultCleanOptions);

      expect(doc.querySelector('.ad-banner')).toBeNull();
      expect(doc.querySelector('.sponsored-content')).toBeNull();
      expect(doc.querySelector('.comments-area')).toBeNull();
      expect(doc.querySelector('.site-header')).toBeNull();
      expect(doc.querySelector('.site-footer')).toBeNull();
      expect(doc.querySelector('.social-share')).toBeNull();
    });

    it('resolves lazy-loaded images from data-src to src', () => {
      cleanHtml(doc, defaultCleanOptions);

      const img = doc.querySelector('img');
      expect(img).not.toBeNull();
      expect(img?.getAttribute('src')).toBe('https://example.com/summit-hero.jpg');
    });

    it('extracts readable content via Readability', () => {
      cleanHtml(doc, defaultCleanOptions);
      const article = new Readability(doc).parse();

      expect(article).not.toBeNull();
      expect(article?.title).toContain('Global Climate Summit');
      expect(article?.content).toContain('Delegates from 195 nations');
      expect(article?.content).toContain('summit-hero.jpg');
    });
  });

  describe('2. Wikipedia Page', () => {
    let doc: Document;

    beforeEach(() => {
      const html = `<!DOCTYPE html>
<html>
<head><title>James Webb Space Telescope - Wikipedia</title></head>
<body>
  <div id="mw-navigation" class="vector-header">
    <div class="vector-menu">Wikipedia Navigation</div>
  </div>
  <div id="content" class="mw-body">
    <h1 id="firstHeading" class="firstHeading mw-first-heading">James Webb Space Telescope</h1>
    <div id="bodyContent" class="vector-body">
      <div id="toc" class="toc">Table of contents</div>
      <p>The <b>James Webb Space Telescope</b> (JWST) is a space telescope designed primarily to conduct infrared astronomy.</p>
      <h2>Mission goals<span class="mw-editsection"><span class="mw-editsection-bracket">[</span><a href="#">edit</a><span class="mw-editsection-bracket">]</span></span></h2>
      <p>JWST aims to enable a broad range of investigations across the fields of astronomy and cosmology.</p>
      <table class="wikitable">
        <thead><tr><th>Instrument</th><th>Type</th></tr></thead>
        <tbody><tr><td>NIRCam</td><td>Infrared camera</td></tr></tbody>
      </table>
      <div class="catlinks">Categories: Space telescopes | NASA</div>
    </div>
  </div>
  <div class="navbox">Navigation box with 200 links</div>
</body>
</html>`;
      const dom = new JSDOM(html);
      doc = dom.window.document;
    });

    it('removes Wikipedia navigation, edit links ([edit]), catlinks, and navboxes', () => {
      cleanHtml(doc, defaultCleanOptions);

      expect(doc.querySelector('#mw-navigation')).toBeNull();
      expect(doc.querySelector('.mw-editsection')).toBeNull();
      expect(doc.querySelector('.navbox')).toBeNull();
      expect(doc.querySelector('.catlinks')).toBeNull();
    });

    it('preserves the main article text and wikitables', () => {
      cleanHtml(doc, defaultCleanOptions);

      expect(doc.body.textContent).toContain('conduct infrared astronomy');
      const table = doc.querySelector('table.wikitable');
      expect(table).not.toBeNull();
      expect(table?.textContent).toContain('NIRCam');
    });
  });

  describe('3. GitHub README', () => {
    let doc: Document;

    beforeEach(() => {
      const html = `<!DOCTYPE html>
<html>
<head><title>facebook/react: The library for web and native user interfaces - GitHub</title></head>
<body>
  <header class="Header-old">GitHub Navbar</header>
  <div class="repository-content">
    <nav class="UnderlineNav">Code | Issues | Pull Requests</nav>
    <div class="file-navigation">Branch: main</div>
    <div id="readme" class="Box Box--responsive">
      <article class="markdown-body entry-content" itemprop="text">
        <h1>React</h1>
        <p>React is a JavaScript library for building user interfaces.</p>
        <h2>Installation</h2>
        <div class="highlight"><pre><code>npm install react react-dom</code></pre></div>
        <h2>Checklist</h2>
        <ul class="contains-task-list">
          <li class="task-list-item"><input type="checkbox" checked disabled> Declarative</li>
          <li class="task-list-item"><input type="checkbox" disabled> Component-Based</li>
        </ul>
        <p>Shortcuts: Press <kbd>Shift</kbd> + <kbd>P</kbd></p>
        <p>Deprecated: <del>legacy API</del></p>
      </article>
    </div>
  </div>
  <footer class="footer">GitHub footer</footer>
</body>
</html>`;
      const dom = new JSDOM(html);
      doc = dom.window.document;
    });

    it('preserves README article while stripping repository chrome', () => {
      cleanHtml(doc, defaultCleanOptions);

      expect(doc.querySelector('header')).toBeNull();
      expect(doc.querySelector('footer')).toBeNull();
      expect(doc.querySelector('nav')).toBeNull();

      const article = doc.querySelector('article.markdown-body');
      expect(article).not.toBeNull();
      expect(article?.textContent).toContain('npm install react');
    });

    it('sanitizes while preserving checkboxes, code blocks, kbd, and del elements', () => {
      cleanHtml(doc, defaultCleanOptions);
      const sanitized = sanitizeHtml(doc.querySelector('article.markdown-body')!.innerHTML);

      expect(sanitized).toContain('<pre><code>');
      expect(sanitized).toContain('input');
      expect(sanitized).toContain('type="checkbox"');
      expect(sanitized).toContain('<kbd>Shift</kbd>');
      expect(sanitized).toContain('<del>legacy API</del>');
    });
  });

  describe('4. Medium-Style Blog Post', () => {
    let doc: Document;

    beforeEach(() => {
      const html = `<!DOCTYPE html>
<html>
<head><title>Deep Dive into React Server Components - Medium</title></head>
<body>
  <nav class="metabar">Medium logo | Sign In</nav>
  <div class="clap-button floating-clap">Clap 2.4k</div>
  <div class="reactions-bar">Bookmark | Share</div>
  <article>
    <h1>Deep Dive into React Server Components</h1>
    <div class="author-card">By Dan Abramov · 8 min read</div>
    <p>Server components allow developers to build applications that span the server and client.</p>
    <blockquote>The key insight is zero client-side JavaScript for server-only components.</blockquote>
    <figure>
      <img src="https://miro.medium.com/v2/resize:fit:1400/rsc-diagram.png" alt="RSC architecture" />
      <figcaption>Server vs Client tree</figcaption>
    </figure>
    <div class="newsletter-signup modal-box">Subscribe to my newsletter</div>
  </article>
  <div class="sidebar">More from Medium</div>
</body>
</html>`;
      const dom = new JSDOM(html);
      doc = dom.window.document;
    });

    it('removes clap buttons, reaction bars, and newsletter popups', () => {
      cleanHtml(doc, defaultCleanOptions);

      expect(doc.querySelector('.clap-button')).toBeNull();
      expect(doc.querySelector('.reactions-bar')).toBeNull();
      expect(doc.querySelector('.newsletter-signup')).toBeNull();
      expect(doc.querySelector('.sidebar')).toBeNull();
      expect(doc.querySelector('nav')).toBeNull();
    });

    it('preserves quotes, article content, and diagrams', () => {
      cleanHtml(doc, defaultCleanOptions);

      expect(doc.body.textContent).toContain('Server components allow developers');
      expect(doc.querySelector('blockquote')).not.toBeNull();
      expect(doc.querySelector('blockquote')?.textContent).toContain('zero client-side JavaScript');
      expect(doc.querySelector('img')?.getAttribute('src')).toBe('https://miro.medium.com/v2/resize:fit:1400/rsc-diagram.png');
    });
  });

  describe('5. Page with Cookie Banners and Sticky Overlays', () => {
    let doc: Document;

    beforeEach(() => {
      const html = `<!DOCTYPE html>
<html>
<head><title>Financial Times Article</title></head>
<body>
  <div id="onetrust-consent-sdk">
    <div class="onetrust-pc-dark-filter modal-backdrop"></div>
    <div id="onetrust-banner-sdk" class="ot-cookie-banner">
      <div class="ot-banner-content">We and our partners use cookies to store and access personal data.</div>
      <button class="accept-btn">Accept Cookies</button>
    </div>
  </div>
  <div class="cc-window cc-banner" style="position: fixed; bottom: 0;">Cookie Notice</div>
  <div class="qc-cmp2-container" aria-label="Privacy Consent">Consent Dialog</div>
  <div data-pw-remove="true" class="live-sticky-overlay">Live Tagged Sticky Header</div>
  <article>
    <h1>Global Markets Rally</h1>
    <p>Stock indices surged across major European and American exchanges.</p>
  </article>
</body>
</html>`;
      const dom = new JSDOM(html);
      doc = dom.window.document;
    });

    it('removes OneTrust, Cookiebot, Quantcast, and live-tagged sticky overlays', () => {
      cleanHtml(doc, defaultCleanOptions);

      expect(doc.querySelector('#onetrust-consent-sdk')).toBeNull();
      expect(doc.querySelector('#onetrust-banner-sdk')).toBeNull();
      expect(doc.querySelector('.cc-window')).toBeNull();
      expect(doc.querySelector('.qc-cmp2-container')).toBeNull();
      expect(doc.querySelector('.live-sticky-overlay')).toBeNull();
      expect(doc.querySelector('.modal-backdrop')).toBeNull();
    });

    it('keeps article content clean and intact', () => {
      cleanHtml(doc, defaultCleanOptions);

      expect(doc.body.textContent).toContain('Global Markets Rally');
      expect(doc.body.textContent).toContain('Stock indices surged');
    });
  });
});
