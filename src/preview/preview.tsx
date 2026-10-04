import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../popup/styles.css';

interface PreviewData {
  base64: string;
  filename: string;
  title: string;
}

function b64toBlob(b64Data: string, contentType = 'application/pdf'): Blob {
  const cleanB64 = b64Data.replace(/^data:application\/pdf;base64,/, '').replace(/\s/g, '');
  const byteCharacters = atob(cleanB64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}

export const PreviewApp: React.FC = () => {
  const [data, setData] = useState<PreviewData | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load pending preview from storage
    chrome.storage.local.get('pendingPreview').then((res) => {
      const preview = res.pendingPreview as PreviewData | undefined;
      if (preview && preview.base64) {
        setData(preview);
        const blob = b64toBlob(preview.base64);
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
      } else {
        setError('No preview data found.');
      }
    }).catch((err) => {
      setError(err instanceof Error ? err.message : String(err));
    });

    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = async () => {
    if (!data || !pdfBlobUrl) return;

    try {
      if (chrome.downloads && chrome.downloads.download) {
        await chrome.downloads.download({
          url: pdfBlobUrl,
          filename: data.filename,
          saveAs: true,
        });
      } else {
        // Fallback anchor download
        const a = document.createElement('a');
        a.href = pdfBlobUrl;
        a.download = data.filename;
        a.click();
      }
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (e) {
      console.error('Download error:', e);
      // Fallback anchor
      const a = document.createElement('a');
      a.href = pdfBlobUrl;
      a.download = data.filename;
      a.click();
      setDownloaded(true);
    }
  };

  const handleClose = () => {
    window.close();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0B1020] text-slate-100 p-6">
        <div className="midnight-card p-8 rounded-2xl max-w-md text-center border-red-500/30">
          <p className="text-rose-400 font-bold text-base mb-2">⚠️ Error loading PDF preview</p>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">{error}</p>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close Tab
          </button>
        </div>
      </div>
    );
  }

  if (!pdfBlobUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0B1020] text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 tracking-wide font-medium">Preparing Midnight Ink preview…</span>
        </div>
      </div>
    );
  }

  // Calculate size in KB
  const sizeKb = data ? Math.round((data.base64.length * 0.75) / 1024) : 0;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0B1020] text-slate-100 select-none">
      {/* Top action toolbar styled with Midnight Ink */}
      <header className="bg-[#0B1020]/90 backdrop-blur-md border-b border-white/[0.08] px-6 py-3 flex items-center justify-between text-white z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/icons/icon-48.png"
            alt="Pagewright"
            className="w-8 h-8 rounded-xl shadow-sm shrink-0 object-contain"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold truncate leading-tight text-white">
                {data?.title || 'Document Preview'}
              </h1>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PREVIEW
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {data?.filename} • <span className="text-cyan-400 font-mono text-[11px] font-medium">{sizeKb} KB</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              if (pdfBlobUrl) window.open(pdfBlobUrl, '_blank');
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Open PDF directly in a new browser tab"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>Open in Tab</span>
          </button>

          <button
            onClick={handleDownload}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              downloaded
                ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                : 'btn-convert-gradient'
            }`}
          >
            {downloaded ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Save to PDF</span>
              </>
            )}
          </button>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
            title="Close Preview"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Embedded PDF Viewer */}
      <main className="flex-1 bg-[#121629] w-full h-full relative">
        <iframe
          src={`${pdfBlobUrl}#view=FitH&toolbar=1`}
          title="PDF Preview"
          className="w-full h-full border-0 absolute inset-0"
        />
      </main>
    </div>
  );
};

const root = document.getElementById('preview-root');
if (root) {
  createRoot(root).render(<PreviewApp />);
}
