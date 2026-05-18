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
        ${documentRef.current.innerHTML}
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
      // Dynamically import html2pdf to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;

      // Export from a detached clone of the rendered node to avoid zoom transforms.
      const exportNode = documentRef.current.cloneNode(true) as HTMLDivElement;
      sandbox = document.createElement('div');
      sandbox.className = 'pdf-export-sandbox';

      const exportRoot = document.createElement('div');
      exportRoot.className = 'pdf-export-root';
      exportRoot.appendChild(exportNode);
      sandbox.appendChild(exportRoot);
      document.body.appendChild(sandbox);

      await waitForImages(exportRoot);

      // PDF options (print-first: each rendered page is already a physical A4)
      const opt = {
        margin: 0,
        filename: 'proposta.pdf',
        image: { type: 'jpeg' as const, quality: 1 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
        },
        jsPDF: {
          unit: 'mm' as const,
          format: 'a4',
          orientation: 'portrait' as const,
        },
      };

      // Generate PDF
      await html2pdf().set(opt).from(exportRoot).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to HTML download if PDF fails
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((node) => node.outerHTML)
        .join('\n');

      const fullHtml = `
        <!DOCTYPE html>
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
        </html>
      `;

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
      if (sandbox && sandbox.parentNode) {
        sandbox.parentNode.removeChild(sandbox);
      }
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
