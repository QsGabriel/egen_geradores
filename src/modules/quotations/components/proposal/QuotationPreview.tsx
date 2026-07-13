/**
 * EGEN System - Quotation Preview Component
 * Componente de preview A4 para propostas comerciais
 */
import React, { useRef, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, ZoomIn, ZoomOut, Maximize2, Loader2, FileCheck2 } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { useQuotationStore, selectCurrent } from '../../stores/quotationStore';
import { convertToContract } from '../../services/quotationService';
import ProposalPrintDocument from './ProposalPrintDocument';
import { useAuth } from '../../../../hooks/useAuth';
import type { ProposalCoverConfig } from '../../../../hooks/useAppSettings';
import './ProposalPreview.css';

// ============================================
// TYPES
// ============================================

interface QuotationPreviewProps {
  scale?: number;
  showControls?: boolean;
  className?: string;
  coverConfig?: ProposalCoverConfig | null;
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.6;
const ZOOM_STEP = 0.1;

// ============================================
// COMPONENT
// ============================================

export function QuotationPreview({
  scale: initialScale = 0.6,
  showControls = true,
  className = '',
  coverConfig,
}: QuotationPreviewProps) {
  const current = useQuotationStore(selectCurrent);
  const { user, userProfile } = useAuth();
  const documentRef = useRef<HTMLDivElement>(null);
  const printContentRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(initialScale);
  const [isConverting, setIsConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);

  const seller = useMemo(() => {
    const metadataPhone = typeof user?.user_metadata?.phone === 'string'
      ? user.user_metadata.phone
      : '';

    return {
      name: userProfile?.name || '',
      email: userProfile?.email || user?.email || '',
      phone: userProfile?.phone || metadataPhone || '',
      roleLabel: userProfile?.department || 'Comercial',
    };
  }, [user, userProfile]);

  const documentContent = useMemo(() => {
    if (!current) {
      return <div className="empty-preview">Nenhum documento selecionado</div>;
    }

    return <ProposalPrintDocument quotation={current} seller={seller} coverConfig={coverConfig} />;
  }, [current, seller, coverConfig]);

  // Convert proposal to contract
  const handleConvert = useCallback(async () => {
    if (!current || current.tipo === 'contrato' || current.isAnnex) return;
    setConvertError(null);
    setIsConverting(true);
    try {
      const created = await convertToContract(current.id, user?.id);
      window.location.href = `/propostas/${created.id}`;
    } catch (err) {
      setConvertError(err instanceof Error ? err.message : 'Erro ao converter proposta.');
      setIsConverting(false);
    }
  }, [current, user?.id]);

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

  // Browser-native print (also used for PDF export via "Save as PDF")
  const handlePrintToPdf = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: current?.documentId || 'Proposta',
    pageStyle: `
      @page { size: A4; margin: 0; }
    `,
    onBeforePrint: async () => {
      if (!printContentRef.current) return;
      const images = printContentRef.current.querySelectorAll('img');
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.addEventListener('load', () => resolve(), { once: true });
                img.addEventListener('error', () => resolve(), { once: true });
              }
            }),
        ),
      );
    },
  });

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
            {/* Convert to Contract — only when current doc is a proposal/quotation not yet converted */}
            {current && current.tipo !== 'contrato' && !current.isAnnex && (
              <button
                onClick={handleConvert}
                disabled={isConverting}
                title="Gerar contrato a partir desta proposta"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg hover:from-emerald-700 hover:to-emerald-600 active:from-emerald-800 active:to-emerald-700 active:scale-[0.97] shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
              >
                {isConverting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileCheck2 className="w-4 h-4" />
                )}
                {isConverting ? 'Convertendo...' : 'Converter em contrato'}
              </button>
            )}
            {convertError && (
              <span className="text-xs text-red-500 max-w-[180px] truncate" title={convertError}>
                {convertError}
              </span>
            )}
            <button
              onClick={handlePrintToPdf}
              disabled={!current}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 active:scale-[0.97] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              <Download className="w-4 h-4" />
              Exportar PDF
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
              <div ref={printContentRef}>
                {documentContent}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default QuotationPreview;
