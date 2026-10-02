/**
 * Interactive Element Picker using isolated Shadow DOM overlay.
 * Allows user to hover elements with highlight overlay, click to select subtree, Esc to cancel.
 */

let activePickerCleanup: (() => void) | null = null;

export function startElementPicker(): Promise<HTMLElement | null> {
  // If a picker is already active, clean it up first
  if (activePickerCleanup) {
    activePickerCleanup();
  }

  return new Promise<HTMLElement | null>((resolve) => {
    // 1. Create host element attached to document root
    const host = document.createElement('div');
    host.id = 'pagewright-picker-host';
    host.style.position = 'fixed';
    host.style.top = '0';
    host.style.left = '0';
    host.style.width = '100vw';
    host.style.height = '100vh';
    host.style.pointerEvents = 'none';
    host.style.zIndex = '2147483647'; // Max 32-bit int

    const shadow = host.attachShadow({ mode: 'open' });

    // 2. Encapsulated styles within Shadow DOM
    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial;
      }
      .pw-overlay-box {
        position: fixed;
        border: 2px solid #3b82f6;
        background-color: rgba(59, 130, 246, 0.12);
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.6), 0 4px 12px rgba(59, 130, 246, 0.25);
        pointer-events: none;
        border-radius: 3px;
        transition: top 0.05s ease-out, left 0.05s ease-out, width 0.05s ease-out, height 0.05s ease-out;
        z-index: 2147483646;
        display: none;
      }
      .pw-badge {
        position: fixed;
        background: #1e293b;
        color: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 11px;
        font-weight: 600;
        line-height: 1;
        padding: 4px 8px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        pointer-events: none;
        z-index: 2147483647;
        display: none;
        white-space: nowrap;
      }
      .pw-badge-dim {
        color: #94a3b8;
        font-weight: 400;
        margin-left: 6px;
      }
      .pw-banner {
        position: fixed;
        top: 16px;
        left: 50%;
        transform: translateX(-50%);
        background: #0f172a;
        color: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13px;
        font-weight: 500;
        padding: 8px 18px;
        border-radius: 9999px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
        pointer-events: auto;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: default;
        animation: pw-slide-down 0.2s ease-out;
      }
      .pw-banner-btn {
        background: rgba(255, 255, 255, 0.15);
        border: none;
        color: #ffffff;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .pw-banner-btn:hover {
        background: rgba(255, 255, 255, 0.3);
      }
      @keyframes pw-slide-down {
        from { transform: translate(-50%, -20px); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
    `;

    // 3. Elements inside shadow root
    const overlay = document.createElement('div');
    overlay.className = 'pw-overlay-box';

    const badge = document.createElement('div');
    badge.className = 'pw-badge';

    const banner = document.createElement('div');
    banner.className = 'pw-banner';
    banner.innerHTML = `
      <span>🎯 <strong>Select Content:</strong> Click any element to convert • <kbd style="background: rgba(255,255,255,0.2); padding: 1px 4px; border-radius: 3px;">Esc</kbd> to cancel</span>
      <button class="pw-banner-btn" id="pw-cancel-btn">Cancel</button>
    `;

    shadow.appendChild(style);
    shadow.appendChild(overlay);
    shadow.appendChild(badge);
    shadow.appendChild(banner);

    document.documentElement.appendChild(host);

    let currentTarget: HTMLElement | null = null;

    // 4. Update overlay position
    function updateOverlay(el: HTMLElement) {
      currentTarget = el;
      const rect = el.getBoundingClientRect();

      overlay.style.display = 'block';
      overlay.style.top = `${rect.top}px`;
      overlay.style.left = `${rect.left}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;

      // Badge tag description
      const tagName = el.tagName.toLowerCase();
      const idStr = el.id ? `#${el.id}` : '';
      const classStr = el.classList.length > 0 ? `.${Array.from(el.classList).slice(0, 2).join('.')}` : '';
      const dims = `${Math.round(rect.width)}×${Math.round(rect.height)}`;

      badge.innerHTML = `&lt;${tagName}${idStr}${classStr}&gt;<span class="pw-badge-dim">${dims}</span>`;
      badge.style.display = 'block';

      // Position badge directly above top-left of target, or inside if near top edge
      const badgeTop = rect.top > 30 ? rect.top - 26 : rect.top + 6;
      const badgeLeft = Math.max(8, rect.left);
      badge.style.top = `${badgeTop}px`;
      badge.style.left = `${badgeLeft}px`;
    }

    // 5. Mousemove / pointermove handler
    function handlePointerMove(e: MouseEvent) {
      // Find element beneath cursor
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;

      // Ignore host or child of host
      if (!el || el === host || host.contains(el)) return;

      // Don't highlight html or body if there is a child element
      if (el === document.documentElement || el === document.body) return;

      updateOverlay(el);
    }

    // 6. Click handler — selects the element
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      // If clicking cancel button inside banner
      if (host.contains(target)) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const selected = currentTarget;
      cleanup();
      resolve(selected);
    }

    // 7. Keydown handler — Escape to cancel
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        cleanup();
        resolve(null);
      }
    }

    // 8. Cancel button inside banner
    const cancelBtn = banner.querySelector('#pw-cancel-btn');
    cancelBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      cleanup();
      resolve(null);
    });

    // 9. Cleanup function
    function cleanup() {
      window.removeEventListener('pointermove', handlePointerMove, true);
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      if (host.parentNode) {
        host.parentNode.removeChild(host);
      }
      activePickerCleanup = null;
    }

    activePickerCleanup = cleanup;

    // Attach listeners with capturing phase so page event handlers can't swallow them
    window.addEventListener('pointermove', handlePointerMove, { capture: true, passive: true });
    window.addEventListener('click', handleClick, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });
  });
}
