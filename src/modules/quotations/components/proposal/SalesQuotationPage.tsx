/**
 * EGEN System - Sales Quotation Page
 * Página principal para criação e edição de propostas comerciais
 */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Save, 
  Send, 
  Eye, 
  EyeOff, 
  Plus,
  ArrowLeft,
  History,
  Copy,
  Printer,
  Download,
  ChevronDown,
  AlertCircle,
  Loader2,
  RefreshCw,
  Split,
  Maximize2,
  Minimize2
} from 'lucide-react';

import { useQuotationStore } from '../../stores';
import { quotationService } from '../../services';
import QuotationForm from './QuotationForm';
import QuotationPreview from './QuotationPreview';
import type { DocumentTipo, DocumentStatus } from '../../types/proposal';
import { useNotification } from '../../../../hooks/useNotification';
import Notification from '../../../../components/Notification';

// ============================================
// TYPES
// ============================================

interface SalesQuotationPageProps {
  // Props are optional now - we use router params
}

type ViewMode = 'form' | 'preview' | 'split';

// ============================================
// COMPONENT
// ============================================

export default function SalesQuotationPage(_props: SalesQuotationPageProps) {
  const { id: quotationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isSaving, setIsSaving] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { notification, showSuccess, showError, showInfo, hideNotification } = useNotification();

  // Store
  const {
    current,
    isDirty,
    isLoading,
    error,
    createNew,
    loadQuotation,
    clearCurrent,
    setPreviewMode,
  } = useQuotationStore();

  // Load quotation if editing
  useEffect(() => {
    if (quotationId) {
      setIsInitialLoading(true);
      loadExistingQuotation(quotationId);
    } else {
      setIsInitialLoading(false);
      createNew('proposta');
    }
    
    return () => {
      clearCurrent();
    };
  }, [quotationId]);

  // Load existing quotation
  const loadExistingQuotation = async (id: string) => {
    try {
      const quotation = await quotationService.getById(id);
      if (quotation) {
        loadQuotation(quotation);
        setIsInitialLoading(false);
      } else {
        showError('Proposta não encontrada');
        setIsInitialLoading(false);
        navigate('/propostas');
      }
    } catch (err) {
      console.error('Error loading quotation:', err);
      showError('Erro ao carregar proposta');
      setIsInitialLoading(false);
    }
  };

  // Save quotation
  const handleSave = async () => {
    if (!current) return;
    
    setIsSaving(true);
    try {
      if (current.id && quotationId) {
        // Update existing
        await quotationService.update(current);
        showSuccess('Sucesso', 'Proposta salva com sucesso!');
      } else {
        // Create new
        const created = await quotationService.create(current);
        loadQuotation(created);
        showSuccess('Sucesso', 'Proposta criada com sucesso!');
      }
    } catch (err) {
      console.error('Error saving:', err);
      showError('Erro', 'Erro ao salvar proposta');
    } finally {
      setIsSaving(false);
    }
  };

  // Update status
  const handleStatusChange = async (newStatus: DocumentStatus) => {
    if (!current?.id) {
      showError('Ação não permitida', 'Salve a proposta antes de alterar o status');
      return;
    }
    
    try {
      await quotationService.updateStatus(current.id, newStatus);
      loadQuotation({ ...current, status: newStatus });
      showSuccess('Status atualizado', `Status alterado para ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      showError('Erro', 'Erro ao alterar status');
    }
    setShowStatusMenu(false);
  };

  // Duplicate quotation
  const handleDuplicate = async () => {
    if (!current?.id) return;
    
    try {
      const duplicate = await quotationService.duplicate(current.id);
      loadQuotation(duplicate);
      showSuccess('Proposta duplicada', 'Editando nova versão.');
    } catch (err) {
      console.error('Error duplicating:', err);
      showError('Erro', 'Erro ao duplicar proposta');
    }
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  // Status badge color
  const getStatusColor = (status: DocumentStatus) => {
    const colors: Record<DocumentStatus, string> = {
      draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      negotiating: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
      price_survey: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
      lost: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
      cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
      closed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    };
    return colors[status] || colors.draft;
  };

  const getStatusLabel = (status: DocumentStatus) => {
    const labels: Record<DocumentStatus, string> = {
      draft: 'Rascunho',
      negotiating: 'Em negociação',
      price_survey: 'Tomada de preço',
      lost: 'Proposta Perdida',
      cancelled: 'Proposta Cancelada',
      closed: 'Proposta Fechada',
    };
    return labels[status] || status;
  };

  // ============================================
  // RENDER
  // ============================================

  if (isLoading || isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0D2A59] dark:text-[#F3B229] animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (!current && !isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Erro ao carregar proposta</p>
          <button
            onClick={() => createNew('proposta')}
            className="mt-4 px-4 py-2 bg-[#0D2A59] text-white rounded-lg hover:bg-[#0D2A59]/90"
          >
            Criar Nova Proposta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 print:bg-white print:min-h-0">
      {/* ========== HEADER (hidden on print) ========== */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 min-h-16 py-2">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90 rounded-lg transition-all duration-150"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#0D2A59]/10 dark:bg-[#F3B229]/10 rounded-lg">
                <FileText className="w-5 h-5 text-[#0D2A59] dark:text-[#F3B229]" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {current.documentId || 'Nova Proposta'}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {current.cliente.nome || 'Cliente não selecionado'}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 active:scale-[0.97] ${getStatusColor(current.status)}`}
              >
                {getStatusLabel(current.status)}
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {showStatusMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                  >
                    {(['draft', 'negotiating', 'price_survey', 'lost', 'closed', 'cancelled'] as DocumentStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors duration-150 ${
                          current.status === status ? 'bg-gray-100 dark:bg-gray-700' : ''
                        }`}
                      >
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getStatusColor(status).split(' ')[0].replace('100', '500')}`} />
                        {getStatusLabel(status)}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Dirty indicator */}
            {isDirty && (
              <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                Não salvo
              </span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('form')}
                className={`p-2 rounded-md transition-all duration-150 active:scale-90 ${
                  viewMode === 'form' 
                    ? 'bg-white dark:bg-gray-600 shadow-sm' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Apenas formulário"
              >
                <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`p-2 rounded-md transition-all duration-150 active:scale-90 ${
                  viewMode === 'split' 
                    ? 'bg-white dark:bg-gray-600 shadow-sm' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Dividido"
              >
                <Split className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`p-2 rounded-md transition-all duration-150 active:scale-90 ${
                  viewMode === 'preview' 
                    ? 'bg-white dark:bg-gray-600 shadow-sm' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Apenas preview"
              >
                <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="hidden sm:block w-px h-8 bg-gray-200 dark:bg-gray-700" />

            {/* Quick Actions */}
            <button
              onClick={handlePrint}
              className="hidden sm:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90 rounded-lg transition-all duration-150"
              title="Imprimir"
            >
              <Printer className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <button
              onClick={handleDuplicate}
              disabled={!current.id}
              className="hidden sm:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-90 rounded-lg transition-all duration-150 disabled:opacity-50"
              title="Duplicar"
            >
              <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            <div className="hidden sm:block w-px h-8 bg-gray-200 dark:bg-gray-700" />

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-[#0D2A59] text-white rounded-lg hover:bg-[#0D2A59]/90 active:bg-[#0D2A59]/80 active:scale-[0.97] transition-all duration-150 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">Salvar</span>
            </button>

            {/* Send Button */}
            <button
              onClick={() => handleStatusChange('negotiating')}
              disabled={!current.id || current.status === 'closed' || current.status === 'cancelled'}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-[#F3B229] text-[#0D2A59] rounded-lg hover:bg-[#F3B229]/90 active:bg-[#F3B229]/80 active:scale-[0.97] transition-all duration-150 disabled:opacity-50 font-medium"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========== MAIN CONTENT ========== */}
      <main className="print:p-0">
        <div className={`
          flex gap-0 
          ${viewMode === 'split' ? 'flex-row' : ''} 
          ${viewMode === 'form' ? 'flex-row' : ''} 
          ${viewMode === 'preview' ? 'flex-row' : ''}
        `}>
          {/* Form Panel */}
          <AnimatePresence mode="wait">
            {(viewMode === 'form' || viewMode === 'split') && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`
                  bg-white dark:bg-gray-800 overflow-y-auto print:hidden
                  ${viewMode === 'split' ? 'w-1/2 border-r border-gray-200 dark:border-gray-700' : 'w-full'}
                `}
                style={{ height: 'calc(100vh - 72px)' }}
              >
                <QuotationForm />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview Panel */}
          <AnimatePresence mode="wait">
            {(viewMode === 'preview' || viewMode === 'split') && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`
                  bg-gray-100 dark:bg-gray-900 overflow-y-auto
                  ${viewMode === 'split' ? 'w-1/2' : 'w-full'}
                  print:w-full print:bg-white print:overflow-visible
                `}
                style={{ height: viewMode !== 'split' ? 'calc(100vh - 64px)' : 'calc(100vh - 64px)' }}
              >
                <QuotationPreview />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ========== TOAST NOTIFICATION ========== */}
      <Notification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      {/* ========== ERROR BANNER ========== */}
      {error && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white px-4 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button 
            onClick={() => useQuotationStore.getState().setError(null)}
            className="text-white/80 hover:text-white"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
