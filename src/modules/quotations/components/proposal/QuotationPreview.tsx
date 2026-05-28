/**
 * EGEN System - Quotation Preview Component
 * Componente de preview A4 para propostas comerciais
 */
import React, { useRef, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Printer, Download, ZoomIn, ZoomOut, Maximize2, Loader2 } from 'lucide-react';
import { useQuotationStore, selectCurrent } from '../../stores/quotationStore';
import ProposalPrintDocument from './ProposalPrintDocument';
import { useAuth } from '../../../../hooks/useAuth';
import { DepartmentLabels } from '../../../../types';
import './ProposalPreview.css';

// ============================================
// TYPES
// ============================================

interface QuotationPreviewProps {
  scale?: number;
  showControls?: boolean;
  className?: string;
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.6;
const ZOOM_STEP = 0.1;

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));

  if (images.length === 0) {
    return;
  }

  await Promise.all(
    images.map((img) => {
      if (img.complete) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        const done = () => {
          img.removeEventListener('load', done);
          img.removeEventListener('error', done);
          resolve();
        };

        img.addEventListener('load', done);
        img.addEventListener('error', done);
      });
    })
  );
}

/**
 * Resolves a single CSS object-position axis token to an absolute pixel
 * offset within (containerPx - imagePx). Handles keywords and percentages.
 */
function resolveObjectPositionAxis(token: string, containerPx: number, imagePx: number): number {
  const keywordPct: Record<string, number> = {
    left: 0, top: 0, center: 50, right: 100, bottom: 100,
  };
  const t = token.trim().toLowerCase();
  const pct = t in keywordPct ? keywordPct[t] : (t.endsWith('%') ? parseFloat(t) : NaN);
  if (!isNaN(pct)) return (pct / 100) * (containerPx - imagePx);
  if (t.endsWith('px')) return parseFloat(t);
  return (containerPx - imagePx) / 2; // fallback: center
}

/**
 * Replaces every <img> whose computed style has a non-"fill" object-fit with
 * an inline <canvas> that draws the image respecting object-fit + object-position.
 * html2canvas ignores these CSS properties, causing distortion; canvases are
 * rendered faithfully.
 */
function fixObjectFitImages(container: HTMLElement, exportScale: number): void {
  const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];

  for (const img of imgs) {
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) continue;

    const cs = window.getComputedStyle(img);
    const fit = cs.objectFit;
    if (!fit || fit === 'fill') continue;

    const boxW = img.offsetWidth;
    const boxH = img.offsetHeight;
    if (!boxW || !boxH) continue;

    // Create a canvas that matches the CSS box at exportScale resolution
    const cvs = document.createElement('canvas');
    cvs.width  = Math.round(boxW * exportScale);
    cvs.height = Math.round(boxH * exportScale);
    // Preserve layout: copy inline styles + class so position/size CSS still applies
    cvs.style.cssText = img.style.cssText;
    cvs.style.width   = `${boxW}px`;
    cvs.style.height  = `${boxH}px`;
    cvs.className     = img.className;

    const ctx = cvs.getContext('2d')!;
    const nW  = img.naturalWidth;
    const nH  = img.naturalHeight;
    const cW  = cvs.width;
    const cH  = cvs.height;

    let dw: number;
    let dh: number;

    if (fit === 'contain') {
      const scale = Math.min(cW / nW, cH / nH);
      dw = nW * scale;
      dh = nH * scale;
    } else if (fit === 'cover') {
      const scale = Math.max(cW / nW, cH / nH);
      dw = nW * scale;
      dh = nH * scale;
    } else {
      // 'scale-down' — same as contain but not larger than natural size
      const scale = Math.min(1, Math.min(cW / nW, cH / nH));
      dw = nW * scale;
      dh = nH * scale;
    }

    // object-position (computed value may be keywords or percentages)
    const posParts = (cs.objectPosition || '50% 50%').trim().split(/\s+/);
    const dx = resolveObjectPositionAxis(posParts[0] ?? '50%', cW, dw);
    const dy = resolveObjectPositionAxis(posParts[1] ?? posParts[0] ?? '50%', cH, dh);

    ctx.drawImage(img, dx, dy, dw, dh);
    img.parentNode?.replaceChild(cvs, img);
  }
}

// ============================================
// COMPONENT
// ============================================

export function QuotationPreview({
  scale: initialScale = 0.6,
  showControls = true,
  className = '',
}: QuotationPreviewProps) {
  const current = useQuotationStore(selectCurrent);
  const { user, userProfile } = useAuth();
  const documentRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(initialScale);
  const [isDownloading, setIsDownloading] = useState(false);

  const seller = useMemo(() => {
    const metadataPhone = typeof user?.user_metadata?.phone === 'string'
      ? user.user_metadata.phone
      : '';

    return {
      name: userProfile?.name || '',
      email: userProfile?.email || user?.email || '',
      phone: userProfile?.phone || metadataPhone || '',
      roleLabel: userProfile?.department
        ? DepartmentLabels[userProfile.department]
        : 'Comercial',
    };
  }, [user, userProfile]);

  const documentContent = useMemo(() => {
    if (!current) {
      return <div className="empty-preview">Nenhum documento selecionado</div>;
    }

    return <ProposalPrintDocument quotation={current} seller={seller} />;
  }, [current, seller]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
  }, []);

  // Print function
  const handlePrint = useCallback(() => {
    if (!current || !documentRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((node) => node.outerHTML)
      .join('\n');

    // Clone and strip zoom/transform so the print window renders at 100%
    const exportNode = documentRef.current.cloneNode(true) as HTMLDivElement;
    exportNode.style.removeProperty('zoom');
    exportNode.style.removeProperty('transform');

    const printHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${current.documentId}</title>
        ${styles}
      </head>
      <body>
        ${exportNode.innerHTML}
      </body>
      </html>
    `;

    printWindow.document.write(printHtml);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }, [current]);

  // Download as PDF
  const handleDownload = useCallback(async () => {
    if (!current || !documentRef.current) return;

    setIsDownloading(true);
    let sandbox: HTMLDivElement | null = null;

    try {
      // Load both libraries in parallel
      const [html2canvasMod, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const html2canvas = (html2canvasMod as any).default ?? html2canvasMod;

      // Clone the rendered document and strip the preview zoom
      const exportNode = documentRef.current.cloneNode(true) as HTMLDivElement;
      exportNode.style.removeProperty('zoom');
      exportNode.style.removeProperty('transform');

      // Mount in an off-screen but layout-active sandbox so html2canvas
      // can compute real dimensions (position:fixed keeps it out of view)
      sandbox = document.createElement('div');
      sandbox.style.cssText =
        'position:fixed;top:0;left:-9999px;width:210mm;background:white;z-index:-9999;';
      sandbox.appendChild(exportNode);
      document.body.appendChild(sandbox);

      await waitForImages(sandbox);

      // Replace <img> elements that use object-fit/object-position with inline
      // <canvas> equivalents. html2canvas ignores object-fit, causing distortion;
      // drawing the image manually into a canvas gives pixel-perfect output.
      const EXPORT_SCALE = 2;
      fixObjectFitImages(sandbox, EXPORT_SCALE);

      // Each .a4-page is exactly 210mm × 297mm — capture them individually
      const pages = Array.from(
        exportNode.querySelectorAll('.a4-page'),
      ) as HTMLElement[];

      if (pages.length === 0) throw new Error('Nenhuma página encontrada no documento.');

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const A4_W_MM = 210;
      const A4_H_MM = 297;

      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i], {
          scale: EXPORT_SCALE,  // must match what fixObjectFitImages uses
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff',
          // Lock dimensions to the exact A4 element to prevent any scaling
          width: pages[i].offsetWidth,
          height: pages[i].offsetHeight,
          windowWidth: pages[i].offsetWidth,
          windowHeight: pages[i].offsetHeight,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.97);

        if (i > 0) pdf.addPage();
        // Fill the PDF page precisely — no margins, no letterboxing
        pdf.addImage(imgData, 'JPEG', 0, 0, A4_W_MM, A4_H_MM);
      }

      pdf.save(`${current.documentId}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      // Fallback: offer an HTML download the user can print from the browser
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((node) => node.outerHTML)
        .join('\n');

      const fullHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${current.documentId}</title>
  ${styles}
</head>
<body>
  ${documentRef.current.innerHTML}
</body>
</html>`;

      const blob = new Blob([fullHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${current.documentId}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      if (sandbox?.parentNode) sandbox.parentNode.removeChild(sandbox);
      setIsDownloading(false);
    }
  }, [current]);

  return (
    <div className={`quotation-preview-root flex flex-col h-full ${className}`}>
      {/* Controls Bar */}
      {showControls && (
        <div className="preview-toolbar sticky top-0 z-20 flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Preview
            </span>
            {current && (
              <span className="text-xs px-2 py-0.5 bg-egen-navy/10 dark:bg-egen-yellow/20 text-egen-navy dark:text-egen-yellow rounded">
                {current.documentId}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={handleZoomOut}
                className="flex items-center gap-1 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Diminuir zoom"
              >
                <ZoomOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-300">Zoom Out</span>
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="flex items-center gap-1 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-300">Zoom In</span>
              </button>
              <button
                onClick={handleZoomReset}
                className="flex items-center gap-1 p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Tamanho real (100%)"
              >
                <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-xs text-gray-600 dark:text-gray-300">100%</span>
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handlePrint}
              disabled={!current}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-egen-navy text-white rounded hover:bg-egen-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={handleDownload}
              disabled={!current || isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isDownloading ? 'Gerando...' : 'Exportar PDF'}
            </button>
          </div>
        </div>
      )}

      {/* Preview Area */}
      <div className="document-preview-container flex-1">
        <div className="document-preview-stage">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              ref={documentRef}
              className="proposal-document-wrapper"
              style={{ zoom: zoomLevel }}
            >
              {documentContent}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default QuotationPreview;
