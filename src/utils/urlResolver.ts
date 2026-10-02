/**
 * Resolves protocol-relative (//...) and relative URLs in a DOM tree to fully qualified URLs.
 * Essential for Chrome extension render pages where the base protocol is chrome-extension://
 */

export function toAbsoluteUrl(urlStr: string | null | undefined, baseUrl: string): string | null {
  if (urlStr === null || urlStr === undefined) return null;
  const trimmed = urlStr.trim();
  if (
    !trimmed ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  ) {
    return urlStr;
  }

  // In-page hash anchors (e.g. #cite_note-1) should remain intact for internal navigation
  if (trimmed.startsWith('#')) {
    return trimmed;
  }

  // Protocol-relative URLs (e.g. //upload.wikimedia.org/...)
  if (trimmed.startsWith('//')) {
    const proto = baseUrl.startsWith('http:') ? 'http:' : 'https:';
    return `${proto}${trimmed}`;
  }

  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return trimmed;
  }
}

export function resolveSrcset(srcset: string, baseUrl: string): string {
  if (!srcset || !srcset.trim()) return srcset;
  return srcset
    .split(',')
    .map((entry) => {
      const parts = entry.trim().split(/\s+/);
      if (parts.length > 0 && parts[0]) {
        const abs = toAbsoluteUrl(parts[0], baseUrl);
        return abs ? [abs, ...parts.slice(1)].join(' ') : entry;
      }
      return entry;
    })
    .join(', ');
}

export function resolveAllUrlsToAbsolute(container: ParentNode, baseUrl: string): void {
  if (!baseUrl) return;

  // 1. Resolve img src and srcset
  container.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src) {
      const absSrc = toAbsoluteUrl(src, baseUrl);
      if (absSrc && absSrc !== src) {
        img.setAttribute('src', absSrc);
      }
    }

    const srcset = img.getAttribute('srcset');
    if (srcset) {
      const absSrcset = resolveSrcset(srcset, baseUrl);
      if (absSrcset !== srcset) {
        img.setAttribute('srcset', absSrcset);
      }
    }

    // Lazy load data attributes
    ['data-src', 'data-original', 'data-lazy-src', 'data-actualsrc', 'data-orig-src'].forEach((attr) => {
      const val = img.getAttribute(attr);
      if (val) {
        const absVal = toAbsoluteUrl(val, baseUrl);
        if (absVal) img.setAttribute(attr, absVal);
      }
    });

    const dataSrcset = img.getAttribute('data-srcset') || img.getAttribute('data-lazy-srcset');
    if (dataSrcset) {
      img.setAttribute('data-srcset', resolveSrcset(dataSrcset, baseUrl));
    }
  });

  // 2. Resolve <source> elements inside <picture>
  container.querySelectorAll<HTMLSourceElement>('source').forEach((source) => {
    const srcset = source.getAttribute('srcset');
    if (srcset) {
      source.setAttribute('srcset', resolveSrcset(srcset, baseUrl));
    }
    const src = source.getAttribute('src');
    if (src) {
      const absSrc = toAbsoluteUrl(src, baseUrl);
      if (absSrc) source.setAttribute('src', absSrc);
    }
  });

  // 3. Resolve <a href>
  container.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('#')) {
      const absHref = toAbsoluteUrl(href, baseUrl);
      if (absHref && absHref !== href) {
        link.setAttribute('href', absHref);
      }
    }
  });

  // 4. Resolve video and audio
  container.querySelectorAll('video, audio').forEach((media) => {
    const src = media.getAttribute('src');
    if (src) {
      const absSrc = toAbsoluteUrl(src, baseUrl);
      if (absSrc) media.setAttribute('src', absSrc);
    }
    const poster = media.getAttribute('poster');
    if (poster) {
      const absPoster = toAbsoluteUrl(poster, baseUrl);
      if (absPoster) media.setAttribute('poster', absPoster);
    }
  });
}
