import type { PdfEngine, PdfOptions } from './PdfEngine';

/**
 * Fallback PDF engine that opens a print dialog.
 * Used when chrome.debugger is unavailable.
 * Note: This doesn't return PDF data - it triggers the browser's print dialog.
 */
export class PrintFallbackEngine implements PdfEngine {
  readonly name = 'print-dialog';

  async generatePdf(tabId: number, _options: PdfOptions): Promise<string> {
    // Send a message to the render tab to trigger window.print()
    try {
      await chrome.tabs.sendMessage(tabId, { type: 'TRIGGER_PRINT' });
    } catch (error) {
      // Try scripting API as fallback
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => window.print(),
      });
    }
    
    // Return empty string since we can't capture the PDF data from print dialog
    return '';
  }
}
