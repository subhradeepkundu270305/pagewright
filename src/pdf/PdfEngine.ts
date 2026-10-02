import type { ConversionSettings } from '../utils/types';
import { PAPER_DIMENSIONS, MARGIN_VALUES } from '../utils/types';

export interface PdfOptions {
  paperWidth: number;
  paperHeight: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  scale: number;
  landscape: boolean;
  printBackground: boolean;
  displayHeaderFooter: boolean;
  headerTemplate: string;
  footerTemplate: string;
}

export interface PdfEngine {
  generatePdf(tabId: number, options: PdfOptions): Promise<string>; // returns base64
  readonly name: string;
}

export function buildPdfOptions(settings: ConversionSettings, title: string, url: string): PdfOptions {
  const paper = PAPER_DIMENSIONS[settings.paperSize];
  const margins = MARGIN_VALUES[settings.margins];
  const landscape = settings.orientation === 'landscape';
  
  // If landscape, swap width/height
  const paperWidth = landscape ? paper.height : paper.width;
  const paperHeight = landscape ? paper.width : paper.height;

  const headerTemplate = settings.showHeader
    ? `<div style="font-size:9px;width:100%;text-align:center;color:#666;font-family:system-ui,sans-serif;">
        <span>${escapeHtml(title)}</span>
       </div>`
    : '<div></div>';

  const footerTemplate = settings.showFooter || settings.pageNumbers
    ? `<div style="font-size:8px;width:100%;display:flex;justify-content:space-between;padding:0 16px;color:#888;font-family:system-ui,sans-serif;">
        <span>${settings.showFooter ? escapeHtml(url) : ''}</span>
        <span>${settings.pageNumbers ? 'Page <span class="pageNumber"></span> of <span class="totalPages"></span>' : ''}</span>
       </div>`
    : '<div></div>';

  return {
    paperWidth,
    paperHeight,
    marginTop: margins.top,
    marginRight: margins.right,
    marginBottom: margins.bottom,
    marginLeft: margins.left,
    scale: settings.scale,
    landscape: false, // we already swapped dimensions
    printBackground: true,
    displayHeaderFooter: settings.showHeader || settings.showFooter || settings.pageNumbers,
    headerTemplate,
    footerTemplate,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
