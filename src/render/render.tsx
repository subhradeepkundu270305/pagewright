import type { Theme, AIEnhancementData, ConversionMode } from '../utils/types';

// Import theme stylesheets
import './themes/original.css';
import './themes/clean.css';
import './themes/minimal.css';

interface RenderPayload {
  html: string;
  title: string;
  url: string;
  theme: Theme;
  mode: ConversionMode;
  includeImages: boolean;
  byline?: string;
  siteName?: string;
  ai?: AIEnhancementData;
}

// Listen for render requests from the service worker
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'RENDER_CONTENT') {
    renderContent(message.payload as RenderPayload)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: (error as Error).message }));
    return true; // Keep channel open for async response
  }
  if (message.type === 'TRIGGER_PRINT') {
    window.print();
    sendResponse({ success: true });
    return true;
  }
  return false;
});

function buildTableOfContentsHtml(
  items: Array<{ title: string; level?: number; id?: string }>,
  docTitle: string
): string {
  if (!items || items.length === 0) return '';

  const rows = items
    .map((item, index) => {
      const level = item.level || 2;
      const num = String(index + 1).padStart(2, '0');
      const slug = item.id || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const isMajor = level <= 2;
      const indentPx = Math.max(0, (level - 1) * 14);
      const typeLabel = level === 1 ? 'Primary' : level === 2 ? 'Section' : 'Detail';

      return `
        <tr class="pagewright-index-row level-${level} ${isMajor ? 'major-row' : 'sub-row'}">
          <td class="pagewright-col-num">
            <span class="pagewright-num-badge ${isMajor ? 'badge-major' : 'badge-sub'}">${num}</span>
          </td>
          <td class="pagewright-col-title" style="padding-left: ${indentPx + 6}px;">
            <a href="#${slug}" class="pagewright-index-link">
              <span class="pagewright-link-text">${escapeHtml(item.title)}</span>
            </a>
          </td>
          <td class="pagewright-col-dots">
            <span class="pagewright-dots-filler"></span>
          </td>
          <td class="pagewright-col-tag">
            <span class="pagewright-level-pill level-${level}">${typeLabel}</span>
          </td>
        </tr>
      `;
    })
    .join('');

  const hasPageBreak = items.length >= 4;

  return `
    <section class="pagewright-index-container ${hasPageBreak ? 'has-page-break' : 'compact-index'}">
      <div class="pagewright-index-header">
        <div class="pagewright-index-eyebrow">
          <span>DOCUMENT DIRECTORY & NAVIGATION</span>
          <span class="pagewright-count-badge">${items.length} Sections</span>
        </div>
        <div class="pagewright-index-title-row">
          <h2 class="pagewright-index-title">Table of Contents</h2>
          <span class="pagewright-index-doc-title">${escapeHtml(docTitle)}</span>
        </div>
        <div class="pagewright-index-divider"></div>
      </div>

      <table class="pagewright-index-table">
        <thead>
          <tr>
            <th class="pagewright-th-num">#</th>
            <th class="pagewright-th-title">SECTION / TOPIC</th>
            <th class="pagewright-th-dots"></th>
            <th class="pagewright-th-tag">LEVEL</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  `;
}

async function renderContent(payload: RenderPayload): Promise<void> {
  const root = document.getElementById('pagewright-render-root');
  if (!root) throw new Error('Render root not found');

  // Inject or update <base href="..."> in head to fix any remaining relative resource paths
  if (payload.url) {
    let baseEl = document.querySelector('base');
    if (!baseEl) {
      baseEl = document.createElement('base');
      document.head.prepend(baseEl);
    }
    baseEl.setAttribute('href', payload.url);
  }

  // Set the theme class on body
  document.body.className = '';
  document.body.classList.add(`theme-${payload.theme}`);

  // Effective title (prefer AI smart title if present)
  const displayTitle = payload.ai?.smartTitle || payload.title;
  document.title = displayTitle;

  // Check if html already starts with an h1 that contains or matches the title
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = payload.html;
  const firstH1 = tempDiv.querySelector('h1');
  const normalizedTitle = displayTitle.trim().toLowerCase();
  const h1Text = firstH1?.textContent?.trim().toLowerCase() || '';

  // Determine if we should show the standalone header title
  const shouldRenderTitle = !firstH1 || (h1Text !== normalizedTitle && !normalizedTitle.includes(h1Text));

  // Build metadata line (byline / siteName)
  const metaItems: string[] = [];
  if (payload.byline) {
    metaItems.push(`<span class="pagewright-byline">${escapeHtml(payload.byline)}</span>`);
  }
  if (payload.siteName) {
    metaItems.push(`<span class="pagewright-site">${escapeHtml(payload.siteName)}</span>`);
  }
  const metaHtml = metaItems.length > 0
    ? `<div class="pagewright-meta">${metaItems.join(' • ')}</div>`
    : '';

  // Build AI Summary Card if present
  let summaryHtml = '';
  if (payload.ai?.summary) {
    const paragraphs = payload.ai.summary
      .split('\n\n')
      .filter((p) => p.trim())
      .map((p) => `<p>${escapeHtml(p.trim())}</p>`)
      .join('');

    summaryHtml = `
      <section class="pagewright-card pagewright-summary-card">
        <div class="pagewright-card-header">
          <span class="pagewright-card-badge">✨ Executive Summary</span>
        </div>
        <div class="pagewright-card-content">${paragraphs}</div>
      </section>
    `;
  }

  // Build AI Table of Contents if present
  let tocHtml = '';
  if (payload.ai?.tableOfContents && payload.ai.tableOfContents.length > 0) {
    tocHtml = buildTableOfContentsHtml(payload.ai.tableOfContents, displayTitle);
  }

  // Build Study Notes Section if in study-notes mode
  let studyNotesHtml = '';
  if (payload.mode === 'study-notes' && payload.ai?.studyNotes) {
    const notes = payload.ai.studyNotes;

    const conceptsHtml = notes.keyConcepts.length > 0
      ? `<div class="pagewright-notes-box">
          <h3 class="pagewright-notes-subtitle">🔑 Key Concepts & Definitions</h3>
          <ul class="pagewright-notes-list">${notes.keyConcepts.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
        </div>`
      : '';

    const takeawaysHtml = notes.bulletPoints.length > 0
      ? `<div class="pagewright-notes-box">
          <h3 class="pagewright-notes-subtitle">📌 Core Takeaways</h3>
          <ul class="pagewright-notes-list">${notes.bulletPoints.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
        </div>`
      : '';

    const questionsHtml = notes.reviewQuestions.length > 0
      ? `<div class="pagewright-notes-box">
          <h3 class="pagewright-notes-subtitle">❓ Comprehension & Review Questions</h3>
          <ol class="pagewright-notes-list">${notes.reviewQuestions.map((q) => `<li>${escapeHtml(q)}</li>`).join('')}</ol>
        </div>`
      : '';

    studyNotesHtml = `
      <section class="pagewright-study-notes-block">
        <div class="pagewright-study-header">
          <span class="pagewright-card-badge">📚 Comprehensive Study Guide</span>
        </div>
        ${notes.summary ? `<div class="pagewright-notes-overview"><p>${escapeHtml(notes.summary)}</p></div>` : ''}
        ${conceptsHtml}
        ${takeawaysHtml}
        ${questionsHtml}
        <hr class="pagewright-notes-divider" />
        <h3 class="pagewright-notes-subtitle">📄 Original Source Reference</h3>
      </section>
    `;
  } else if (payload.mode === 'study-notes') {
    const errorDetail = payload.ai?.error || 'AI provider could not generate study notes (please check your API key, rate limits, or connection in Settings).';
    studyNotesHtml = `
      <section class="pagewright-card" style="border: 1px solid #fde68a; border-left: 4px solid #f59e0b; background: #fffbeb; padding: 14px 18px; margin-bottom: 24px; border-radius: 6px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="font-weight: 700; font-size: 13px; color: #b45309;">⚠️ AI Study Notes Notice</span>
        </div>
        <p style="margin: 0 0 6px 0; font-size: 12px; color: #78350f; line-height: 1.5;">${escapeHtml(errorDetail)}</p>
        <p style="margin: 0; font-size: 11px; color: #92400e;">The complete original article has been cleanly converted and preserved below.</p>
      </section>
    `;
  }

  // Build the complete article container
  root.innerHTML = `
    <article class="pagewright-content">
      ${shouldRenderTitle ? `<h1 class="pagewright-title">${escapeHtml(displayTitle)}</h1>` : ''}
      ${metaHtml}
      ${summaryHtml}
      ${tocHtml}
      ${studyNotesHtml}
      <div class="pagewright-body">${payload.html}</div>
    </article>
  `;

  // Add anchor IDs to all headings in .pagewright-body
  const bodyEl = root.querySelector('.pagewright-body');
  const headings = bodyEl ? Array.from(bodyEl.querySelectorAll('h1, h2, h3, h4, h5, h6')) : [];
  headings.forEach((heading) => {
    if (!heading.id && heading.textContent) {
      heading.id = heading.textContent.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
  });

  // Fallback: generate TOC from HTML headings if AI TOC was empty
  if (!tocHtml && headings.length > 0 && payload.ai) {
    const headingItems = headings.map((h) => ({
      title: h.textContent || '',
      level: parseInt(h.tagName.substring(1), 10) || 2,
      id: h.id,
    }));

    const fallbackTocHtml = buildTableOfContentsHtml(headingItems, displayTitle);
    const contentEl = root.querySelector('.pagewright-content');
    if (contentEl && bodyEl && fallbackTocHtml) {
      const tempWrapper = document.createElement('div');
      tempWrapper.innerHTML = fallbackTocHtml;
      if (tempWrapper.firstElementChild) {
        contentEl.insertBefore(tempWrapper.firstElementChild, bodyEl);
      }
    }
  }

  // Promote any remaining data-src, data-original, or lazy images to active src
  root.querySelectorAll('img').forEach((img) => {
    const dataSrc =
      img.getAttribute('data-src') ||
      img.getAttribute('data-original') ||
      img.getAttribute('data-lazy-src') ||
      img.getAttribute('data-highres');
    if (dataSrc && (!img.src || img.src.startsWith('data:') || img.src.includes('blank'))) {
      img.src = dataSrc;
    }
  });

  if (payload.mode === 'full-page') {
    neutralizeLayoutConstraints(root);
  }

  // Explicitly canonicalize any remaining protocol-relative image URLs and set referrerpolicy
  root.querySelectorAll('img').forEach((img) => {
    img.setAttribute('referrerpolicy', 'no-referrer');
    img.setAttribute('crossorigin', 'anonymous');

    if (payload.url) {
      const proto = payload.url.startsWith('http:') ? 'http:' : 'https:';
      const src = img.getAttribute('src');
      if (src && src.startsWith('//')) {
        img.setAttribute('src', `${proto}${src}`);
      }
      const srcset = img.getAttribute('srcset');
      if (srcset && srcset.includes('//')) {
        img.setAttribute('srcset', srcset.replace(/(^|,\s*)\/\//g, `$1${proto}//`));
      }
    }
  });

  // If images should not be included, remove them
  if (!payload.includeImages) {
    root.querySelectorAll('img, picture, figure, video, svg, canvas').forEach((el) => el.remove());
  }

  // Apply page break rules
  applyPageBreaks(root);

  // Await image loading and font decodes before returning ready
  if (payload.includeImages) {
    await waitForAssetsToLoad(root, 7000);
  } else if (document.fonts) {
    await document.fonts.ready.catch(() => {});
  }
}

async function waitForAssetsToLoad(container: HTMLElement, timeoutMs = 7000): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));

  const imagePromises = images.map((img) => {
    // If image is already complete and has natural dimensions
    if (img.complete && img.naturalWidth > 0) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      let resolved = false;
      const done = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });

      // Try decode API if available
      if (img.src && typeof img.decode === 'function') {
        img.decode().then(done).catch(() => {
          // Decode error will fire error event or timeout
        });
      }
    });
  });

  const fontsPromise = document.fonts ? document.fonts.ready.catch(() => {}) : Promise.resolve();

  await Promise.race([
    Promise.all([...imagePromises, fontsPromise]),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

function neutralizeLayoutConstraints(root: HTMLElement): void {
  const containers = root.querySelectorAll('div, section, article, main, aside, [role="main"]');
  containers.forEach((el) => {
    const htmlEl = el as HTMLElement;
    // Reset height constraints
    htmlEl.style.height = 'auto';
    htmlEl.style.maxHeight = 'none';
    htmlEl.style.minHeight = '0';
    // Reset overflow
    htmlEl.style.overflow = 'visible';
    htmlEl.style.overflowX = 'visible';
    htmlEl.style.overflowY = 'visible';
    // Reset position if fixed/sticky/absolute
    const pos = htmlEl.style.position;
    if (pos === 'fixed' || pos === 'sticky' || pos === 'absolute') {
      htmlEl.style.position = 'relative';
    }
    // Remove transforms that create stacking contexts
    if (htmlEl.style.transform) {
      htmlEl.style.transform = 'none';
    }
  });

  // Also inject a style block to override CSS-class-based constraints and format all images
  const overrideStyle = document.createElement('style');
  overrideStyle.textContent = `
    .pagewright-body div,
    .pagewright-body section,
    .pagewright-body article,
    .pagewright-body main,
    .pagewright-body aside,
    .pagewright-body [role="main"] {
      max-height: none !important;
      overflow: visible !important;
    }
    .pagewright-body > div,
    .pagewright-body > section,
    .pagewright-body > article,
    .pagewright-body > main {
      height: auto !important;
      min-height: 0 !important;
      position: relative !important;
      transform: none !important;
    }
    .pagewright-body img {
      max-width: 100% !important;
      height: auto !important;
      object-fit: contain;
      break-inside: avoid;
      page-break-inside: avoid;
      display: inline-block;
    }
    .pagewright-body picture {
      display: inline-block;
      max-width: 100%;
    }
  `;
  document.head.appendChild(overrideStyle);
}

function applyPageBreaks(root: HTMLElement): void {
  // Avoid breaking inside cards, code blocks, figures, blockquotes, and headings
  const noBreakSelectors =
    'pre, code, figure, blockquote, h1, h2, h3, h4, h5, h6, .pagewright-meta, .pagewright-card, .pagewright-notes-box, .thumb';
  root.querySelectorAll(noBreakSelectors).forEach((el) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.breakInside = 'avoid';
    (htmlEl.style as unknown as { pageBreakInside: string }).pageBreakInside = 'avoid';
  });

  // Keep headings attached to subsequent content
  root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((el) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.breakAfter = 'avoid';
    (htmlEl.style as unknown as { pageBreakAfter: string }).pageBreakAfter = 'avoid';
  });

  // Images should avoid breaking inside
  root.querySelectorAll('img').forEach((el) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.breakInside = 'avoid';
    (htmlEl.style as unknown as { pageBreakInside: string }).pageBreakInside = 'avoid';
  });

  // Tables should break naturally between rows across page boundaries, NOT push the whole table!
  root.querySelectorAll('table').forEach((el) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.breakInside = 'auto';
    (htmlEl.style as unknown as { pageBreakInside: string }).pageBreakInside = 'auto';
  });

  // Table rows should never break across page boundaries
  root.querySelectorAll('tr').forEach((el) => {
    const htmlEl = el as HTMLElement;
    htmlEl.style.breakInside = 'avoid';
    (htmlEl.style as unknown as { pageBreakInside: string }).pageBreakInside = 'avoid';
  });
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Notify service worker that render page is loaded and ready
chrome.runtime.sendMessage({ type: 'RENDER_READY' });
