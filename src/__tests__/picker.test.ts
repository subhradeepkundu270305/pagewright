import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { startElementPicker } from '../content/picker';

describe('startElementPicker', () => {
  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body><div id="target-box">Target Content</div></body></html>', {
      url: 'https://example.com',
    });
    // Set up global browser environment for the test
    vi.stubGlobal('window', dom.window);
    vi.stubGlobal('document', dom.window.document);
    vi.stubGlobal('HTMLElement', dom.window.HTMLElement);
  });

  it('attaches Shadow DOM host to document root and handles Escape cancellation', async () => {
    const pickerPromise = startElementPicker();

    // Verify host element exists
    const host = dom.window.document.getElementById('pagewright-picker-host');
    expect(host).not.toBeNull();
    expect(host?.shadowRoot).not.toBeNull();

    // Simulate Escape key press
    const escEvent = new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    dom.window.dispatchEvent(escEvent);

    const result = await pickerPromise;
    expect(result).toBeNull();

    // Host should be cleaned up
    expect(dom.window.document.getElementById('pagewright-picker-host')).toBeNull();
  });
});
