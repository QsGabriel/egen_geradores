/**
 * EGEN System - Quotation Preview Component
 * Componente de preview A4 para propostas comerciais
 */
import React, { useRef, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Printer, Download, ZoomIn, ZoomOut, Maximize2, Loader2 } from 'lucide-react';
import { useQuotationStore, selectCurrent } from '../../stores/quotationStore';
import { RenderEngine } from '../../engine';
import './ProposalPreview.css';

// ============================================
// TYPES
// ============================================

interface QuotationPreviewProps {
  scale?: number;
  showControls?: boolean;
  className?: string;
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
  const previewRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(initialScale);
  const [isDownloading, setIsDownloading] = useState(false);

  // Render document HTML
  const renderedHtml = useMemo(() => {
    if (!current) {
      return '<div class="empty-preview">Nenhum documento selecionado</div>';
    }
    return RenderEngine.render(current);
  }, [current]);

  // Zoom controls
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.3));
  const handleZoomReset = () => setScale(initialScale);

  // Print function
  const handlePrint = () => {
    if (!current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const fullHtml = RenderEngine.render(current, { includeStyles: true, printMode: true });
    printWindow.document.write(fullHtml);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.print();
    };
  };

  // Download as PDF
  const handleDownload = useCallback(async () => {
    if (!current) return;

    setIsDownloading(true);
    
    try {
      // Dynamically import html2pdf to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Create a temporary container with the full document
      const container = document.createElement('div');
      container.innerHTML = RenderEngine.render(current, { includeStyles: true, printMode: true });
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      document.body.appendChild(container);

      // PDF options
      const opt = {
        margin: 0,
        filename: `${current.documentId}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
        },
        jsPDF: { 
          unit: 'mm' as const, 
          format: 'a4', 
          orientation: 'portrait' as const
        },
        pagebreak: { mode: 'css', before: '.page', avoid: '.item-row' }
      };

      // Generate PDF
      await html2pdf().set(opt).from(container).save();
      
      // Cleanup
      document.body.removeChild(container);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to HTML download if PDF fails
      const fullHtml = RenderEngine.render(current, { includeStyles: true });
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
      setIsDownloading(false);
    }
  }, [current]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Controls Bar */}
      {showControls && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Diminuir zoom"
              >
                <ZoomOut className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Aumentar zoom"
              >
                <ZoomIn className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={handleZoomReset}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Resetar zoom"
              >
                <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
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
              {isDownloading ? 'Gerando...' : 'Baixar PDF'}
            </button>
          </div>
        </div>
      )}

      {/* Preview Area */}
      <div 
        ref={previewRef}
        className="document-preview-container flex-1 overflow-auto"
      >
        <motion.div 
          className="document-preview-wrapper"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div 
            className="proposal-document-wrapper"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        </motion.div>
      </div>
    </div>
  );
}

export default QuotationPreview;
