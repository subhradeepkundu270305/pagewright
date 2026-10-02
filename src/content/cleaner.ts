import DOMPurify from 'dompurify';
import { resolveAllUrlsToAbsolute } from '../utils/urlResolver';

export interface CleanOptions {
  removeAds: boolean;
  removeNavigation: boolean;
  includeImages: boolean;
  includeLinks: boolean;
}

function isProtectedElement(el: Element, doc: Document): boolean {
  if (el === doc.body || el === doc.documentElement || el === doc.head) return true;
  const tag = el.tagName ? el.tagName.toUpperCase() : '';
  return tag === 'BODY' || tag === 'HTML' || tag === 'HEAD';
}

export function cleanHtml(doc: Document, options: CleanOptions): void {
  const { removeAds, removeNavigation, includeImages, includeLinks } = options;
  const elementsToRemove = new Set<Element>();
  const markForRemoval = (el: Element) => {
    if (!isProtectedElement(el, doc)) {
      elementsToRemove.add(el);
    }
  };

  // 1. Remove elements marked as fixed, sticky, or hidden by live-DOM inspection
  doc.querySelectorAll('[data-pw-remove="true"]').forEach((el) => {
    markForRemoval(el);
  });

  // 2. Remove ads, tracking banners, and cookie consent modals
  if (removeAds) {
    const adAndConsentSelectors = [
      // Standard advertisement patterns (anchored to avoid matching legitimate words like lead-, download-, etc.)
      '[class^="ad-"]', '[class*="-ad-"]', '[class$="-ad"]',
      '[class^="ad_"]', '[class*="_ad_"]', '[class$="_ad"]',
      '[id^="ad-"]', '[id*="-ad-"]', '[id$="-ad"]',
      '[id^="ad_"]', '[id*="_ad_"]', '[id$="_ad"]',
      '.ad', '.ads', '.advert', '.advertisement', '.adsbygoogle',
      'iframe[src*="doubleclick"]', 'iframe[src*="googlesyndication"]',
      '[class*="sponsor"]', '[id*="sponsor"]', '.taboola', '.outbrain',
      // Cookie banners & CMPs (OneTrust, Cookiebot, Didomi, Quantcast, Sourcepoint, etc.)
      '[class*="cookie"]', '[id*="cookie"]', '[class*="consent"]', '[id*="consent"]', '[class*="gdpr"]',
      '.cc-banner', '.cc-window', '#onetrust-banner-sdk', '#onetrust-consent-sdk', '.ot-cookie-banner',
      '[id*="didomi"]', '[class*="didomi"]', '[id*="usercentrics"]', '.qc-cmp2-container', '.sp_message_container',
      '[class*="cmp-"]', '[id*="cmp-"]', '.cookie-notice', '.cookie-policy',
      // Social & reaction widgets
      '[class*="social"]', '[class*="share"]', '.share-buttons', '.share-bar', '.social-links',
      '.clap-button', '.reactions-bar',
      // Comments & newsletters
      '[id*="comment"]', '[class*="comment"]', '#disqus_thread', '.comments-area',
      '[class*="newsletter"]', '[class*="subscribe"]', '[class*="popup"]', '[class*="modal"]',
      // Overlays and backdrops
      '.modal-backdrop', '.fade.show', '[class*="backdrop"]', '[class*="overlay"]'
    ];

    try {
      doc.querySelectorAll(adAndConsentSelectors.join(', ')).forEach((el) => {
        if (includeImages) {
          const isPureAd = el.matches('.ad, .ads, .advert, .advertisement, .adsbygoogle, [class*="sponsor"], iframe[src*="doubleclick"], iframe[src*="googlesyndication"]');
          const hasImage = el.querySelector('img, picture, figure');
          if (hasImage && !isPureAd) {
            return; // Protect article images with classes like "image-modal" or "media-overlay"
          }
        }
        markForRemoval(el);
      });
    } catch {
      // Fallback in case of invalid selector in complex environments
    }
  }

  // 3. Remove navigation and site chrome
  if (removeNavigation) {
    const navSelectors = [
      'nav', 'header', 'footer', '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
      '.sidebar', 'aside', '[class*="sidebar"]', '.menu', '[class^="menu-"]', '[class$="-menu"]',
      '[id*="menu"]', '[class*="breadcrumb"]',
      // Wikipedia-specific navigation, edit links, and notices
      '.mw-editsection', '.navbox', '.vertical-navbox', '.catlinks', '#mw-navigation',
      '.vector-menu', '.mw-jump-link', '.noprint', '.hatnote'
    ];

    try {
      doc.querySelectorAll(navSelectors.join(', ')).forEach((el) => {
        markForRemoval(el);
      });
    } catch {
      // Ignore selector errors
    }
  }

  // 4. Remove elements with inline fixed/sticky styling
  doc.querySelectorAll('*').forEach((el) => {
    if (isProtectedElement(el, doc)) return;
    const htmlEl = el as HTMLElement;
    if (htmlEl.style) {
      const pos = htmlEl.style.position;
      if (pos === 'fixed' || pos === 'sticky') {
        markForRemoval(el);
      }
      if (htmlEl.style.display === 'none' || htmlEl.style.visibility === 'hidden') {
        const hasContent = el.querySelector('img, svg, picture, p, h1, h2, h3, h4, h5, h6, table, ul, ol') || (el.textContent && el.textContent.trim().length > 25);
        if (hasContent) {
          htmlEl.style.display = 'block';
          htmlEl.style.visibility = 'visible';
        } else {
          markForRemoval(el);
        }
      }
    }
    if (el.getAttribute('aria-hidden') === 'true' && !el.querySelector('article, main, img, table, p, h1, h2, h3')) {
      markForRemoval(el);
    }
  });

  // Auto-expand all <details> elements so FAQs, accordions, and clinical notes are visible in PDF
  doc.querySelectorAll('details').forEach((d) => {
    d.setAttribute('open', 'true');
  });

  // 4b. Neutralize viewport-constraining CSS on containers for clean PDF rendering
  doc.querySelectorAll('div, section, article, main, body, html').forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.style) {
      // Clear height constraints that cause blank PDF pages
      if (htmlEl.style.height) htmlEl.style.height = 'auto';
      if (htmlEl.style.maxHeight) htmlEl.style.maxHeight = 'none';
      if (htmlEl.style.minHeight) htmlEl.style.minHeight = '0';
      // Clear overflow hidden that traps content
      if (htmlEl.style.overflow === 'hidden' || htmlEl.style.overflow === 'auto') {
        htmlEl.style.overflow = 'visible';
      }
      if (htmlEl.style.overflowY === 'hidden' || htmlEl.style.overflowY === 'auto') {
        htmlEl.style.overflowY = 'visible';
      }
      if (htmlEl.style.overflowX === 'hidden') {
        htmlEl.style.overflowX = 'visible';
      }
    }
  });

  // 5. Remove scripts, styles (cleaner rendering), noscript
  doc.querySelectorAll('script, noscript').forEach((el) => markForRemoval(el));

  // 6. Remove non-video iframes
  doc.querySelectorAll('iframe').forEach((iframe) => {
    const src = (iframe.src || '').toLowerCase();
    if (!src.includes('youtube.com') && !src.includes('vimeo.com')) {
      markForRemoval(iframe);
    }
  });

  // 7. Resolve lazy-loaded images before potential removal
  doc.querySelectorAll('img').forEach((img) => {
    const dataSrc = img.getAttribute('data-src') ||
                    img.getAttribute('data-original') ||
                    img.getAttribute('data-lazy-src') ||
                    img.getAttribute('data-actualsrc') ||
                    img.getAttribute('data-orig-src');
    if (dataSrc) {
      const currentSrc = img.getAttribute('src') || '';
      const isPlaceholder =
        !currentSrc ||
        (currentSrc.startsWith('data:') && currentSrc.length < 500) ||
        currentSrc.includes('placeholder') ||
        currentSrc.includes('blank.gif') ||
        currentSrc.includes('spacer');
      if (isPlaceholder) {
        img.setAttribute('src', dataSrc);
      }
    }
    const dataSrcset = img.getAttribute('data-srcset') || img.getAttribute('data-lazy-srcset');
    if (dataSrcset && !img.getAttribute('srcset')) {
      img.setAttribute('srcset', dataSrcset);
    }
  });

  // 8. If images excluded, remove all media
  if (!includeImages) {
    doc.querySelectorAll('img, picture, figure, video, canvas, svg').forEach((el) => {
      markForRemoval(el);
    });
  }

  // 9. Clean up empty residual blocks that cause excessive white space
  doc.querySelectorAll('div, p, section, article, aside').forEach((el) => {
    if (isProtectedElement(el, doc)) return;
    if (el.children.length === 0 && (!el.textContent || el.textContent.trim() === '')) {
      markForRemoval(el);
    }
  });

  // 10. Execute all removals
  elementsToRemove.forEach((el) => {
    if (!isProtectedElement(el, doc) && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  // 11. If links excluded, replace <a> with <span>
  if (!includeLinks) {
    doc.querySelectorAll('a').forEach((link) => {
      const span = doc.createElement('span');
      span.innerHTML = link.innerHTML;
      if (link.parentNode) {
        link.parentNode.replaceChild(span, link);
      }
    });
  }

  // 12. Resolve relative URLs to absolute
  if (doc.baseURI) {
    resolveAllUrlsToAbsolute(doc, doc.baseURI);
  }
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span', 'a', 'img', 'ul', 'ol', 'li',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'blockquote', 'pre', 'code',
      'em', 'strong', 'b', 'i', 'u', 's', 'del', 'kbd', 'br', 'hr', 'figure', 'figcaption',
      'picture', 'source', 'details', 'summary', 'dl', 'dt', 'dd', 'sup', 'sub', 'mark',
      'abbr', 'cite', 'q', 'time', 'article', 'section', 'main', 'header', 'footer',
      // Checkbox support (for GitHub markdown task lists)
      'input',
      // Vector math & icon support
      'svg', 'path', 'g', 'circle', 'rect', 'line', 'polygon', 'polyline', 'text', 'symbol', 'use',
      // MathML support
      'math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'msubsup', 'mfrac', 'msqrt', 'mroot', 'mtext', 'annotation', 'semantics'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'width', 'height', 'colspan', 'rowspan', 'class', 'id',
      'srcset', 'sizes', 'loading', 'type', 'checked', 'disabled', 'style',
      // SVG & MathML attributes
      'viewBox', 'xmlns', 'd', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
      'aria-label', 'role', 'display'
    ],
    ALLOW_DATA_ATTR: true,
    FORBID_ATTR: ['on*'], // Strictly strip event handlers
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|blob|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}
