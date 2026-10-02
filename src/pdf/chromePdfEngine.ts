import type { PdfEngine, PdfOptions } from './PdfEngine';

export class ChromePdfEngine implements PdfEngine {
  readonly name = 'chrome-debugger';

  async generatePdf(tabId: number, options: PdfOptions): Promise<string> {
    // Attach debugger
    await this.attach(tabId);
    
    try {
      // Emulate print media so CSS print rules and page-break properties apply
      try {
        await this.sendCommand(tabId, 'Emulation.setEmulatedMedia', { media: 'print' });
      } catch (e) {
        console.warn('Emulated media print warning:', e);
      }

      // Wait a moment for print media layout to recalculate
      await this.sleep(300);
      
      // Send Page.printToPDF command
      const result = await this.sendCommand(tabId, 'Page.printToPDF', {
        landscape: options.landscape,
        displayHeaderFooter: options.displayHeaderFooter,
        headerTemplate: options.headerTemplate,
        footerTemplate: options.footerTemplate,
        printBackground: options.printBackground,
        scale: options.scale,
        paperWidth: options.paperWidth,
        paperHeight: options.paperHeight,
        marginTop: options.marginTop,
        marginBottom: options.marginBottom,
        marginLeft: options.marginLeft,
        marginRight: options.marginRight,
        preferCSSPageSize: false,
        transferMode: 'ReturnAsBase64',
      });

      return (result as { data: string }).data;
    } finally {
      // Always detach debugger
      await this.detach(tabId);
    }
  }

  private async attach(tabId: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      chrome.debugger.attach({ tabId }, '1.3', () => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Failed to attach debugger: ${chrome.runtime.lastError.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  private async detach(tabId: number): Promise<void> {
    return new Promise<void>((resolve) => {
      chrome.debugger.detach({ tabId }, () => {
        // Ignore errors on detach (tab might be closed)
        if (chrome.runtime.lastError) {
          console.warn('Debugger detach warning:', chrome.runtime.lastError.message);
        }
        resolve();
      });
    });
  }

  private async sendCommand(tabId: number, method: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      chrome.debugger.sendCommand({ tabId }, method, params, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Debugger command failed: ${chrome.runtime.lastError.message}`));
        } else {
          resolve(result);
        }
      });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
