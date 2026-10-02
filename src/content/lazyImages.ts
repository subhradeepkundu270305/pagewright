/**
 * Utility to resolve and force-load lazy-loaded images before PDF extraction.
 * Handles data-src, data-srcset, loading="lazy", awaits image decoding,
 * and inlines loaded images as self-contained base64 data URIs.
 */

function tryInlineImage(img: HTMLImageElement): boolean {
  try {
    if (img.complete && img.naturalWidth > 1 && img.naturalHeight > 1) {
      const src = img.getAttribute('src') || '';
      // If already a substantive data URI, no need to redraw
      if (src.startsWith('data:image/') && src.length > 500) {
        return true;
      }

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const isJpeg = (img.currentSrc || src).toLowerCase().includes('.jp');
        const dataUrl = isJpeg
          ? canvas.toDataURL('image/jpeg', 0.90)
          : canvas.toDataURL('image/png');

        if (dataUrl && dataUrl.length > 100 && !dataUrl.startsWith('data:,')) {
          img.setAttribute('src', dataUrl);
          img.removeAttribute('srcset');
          img.removeAttribute('loading');
          return true;
        }
      }
    }
  } catch {
    // Canvas tainted by cross-origin without CORS — keep original resolved URL
  }
  return false;
}

export async function resolveLazyImages(
  doc: Document,
  timeoutMs: number = 1500
): Promise<void> {
  const images = Array.from(doc.querySelectorAll<HTMLImageElement>('img'));
  const pendingDecodes: Promise<void>[] = [];

  for (const img of images) {
    // 1. Convert lazy loading to eager
    if (img.getAttribute('loading') === 'lazy') {
      img.setAttribute('loading', 'eager');
    }

    // 2. If the browser already resolved and rendered currentSrc, prefer it
    if (
      img.currentSrc &&
      !img.currentSrc.startsWith('data:image/gif') &&
      !img.currentSrc.includes('placeholder') &&
      !img.currentSrc.includes('blank.gif')
    ) {
      img.setAttribute('src', img.currentSrc);
    }

    // 3. Resolve dataset image sources (data-src, data-original, etc.)
    const dataSrc =
      img.getAttribute('data-src') ||
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
        img.src = dataSrc;
      }
    }

    // Ensure lazy loaders do not leave opacity: 0 or visibility: hidden
    if (img.style.opacity === '0') {
      img.style.opacity = '1';
    }
    if (img.style.visibility === 'hidden') {
      img.style.visibility = 'visible';
    }

    // 4. Resolve responsive sources
    const dataSrcset =
      img.getAttribute('data-srcset') || img.getAttribute('data-lazy-srcset');
    if (dataSrcset && !img.getAttribute('srcset')) {
      img.srcset = dataSrcset;
    }

    // Also inspect parent <picture> element if present
    const picture = img.closest('picture');
    if (picture) {
      const sources = Array.from(picture.querySelectorAll<HTMLSourceElement>('source'));
      for (const source of sources) {
        const srcData = source.getAttribute('data-srcset') || source.getAttribute('data-src');
        if (srcData && !source.srcset) {
          source.srcset = srcData;
        }
      }
    }

    // 5. Try inlining already-loaded images into base64 data URIs
    const inlined = tryInlineImage(img);

    // 6. If not yet inlined, try decode API if supported
    if (!inlined && img.src && !img.src.startsWith('data:') && typeof img.decode === 'function') {
      pendingDecodes.push(
        img.decode()
          .then(() => {
            // Once decoded, try inlining again
            tryInlineImage(img);
          })
          .catch(() => {
            // Ignore decode failures (404, CORS)
          })
      );
    }
  }

  // 7. Await pending decodes with timeout to guarantee we never block export
  if (pendingDecodes.length > 0) {
    await Promise.race([
      Promise.all(pendingDecodes),
      new Promise((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  }
}
