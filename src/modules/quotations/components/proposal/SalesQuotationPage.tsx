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
  CheckCircle,
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
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

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
      loadExistingQuotation(quotationId);
    } else {
      createNew('proposta');
    }
    
    return () => {
      // Cleanup on unmount
      clearCurrent();
    };
  }, [quotationId]);

  // Load existing quotation
  const loadExistingQuotation = async (id: string) => {
    try {
      const quotation = await quotationService.getById(id);
      if (quotation) {
        loadQuotation(quotation);
      } else {
        showNotification('error', 'Proposta não encontrada');
        navigate('/propostas');
      }
    } catch (err) {
      console.error('Error loading quotation:', err);
      showNotification('error', 'Erro ao carregar proposta');
    }
  };

  // Show notification
  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Save quotation
  const handleSave = async () => {
    if (!current) return;
    
    setIsSaving(true);
    try {
      if (current.id && quotationId) {
        // Update existing
        await quotationService.update(current);
        showNotification('success', 'Proposta salva com sucesso!');
      } else {
        // Create new
        const created = await quotationService.create(current);
        loadQuotation(created);
        showNotification('success', 'Proposta criada com sucesso!');
      }
    } catch (err) {
      console.error('Error saving:', err);
      showNotification('error', 'Erro ao salvar proposta');
    } finally {
      setIsSaving(false);
    }
  };

  // Update status
  const handleStatusChange = async (newStatus: DocumentStatus) => {
    if (!current?.id) {
      showNotification('error', 'Salve a proposta antes de alterar o status');
      return;
    }
    
    try {
      await quotationService.updateStatus(current.id, newStatus);
      loadQuotation({ ...current, status: newStatus });
      showNotification('success', `Status alterado para ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      showNotification('error', 'Erro ao alterar status');
    }
    setShowStatusMenu(false);
  };

  // Duplicate quotation
  const handleDuplicate = async () => {
    if (!current?.id) return;
    
    try {
      const duplicate = await quotationService.duplicate(current.id);
      loadQuotation(duplicate);
      showNotification('success', 'Proposta duplicada! Editando nova versão.');
    } catch (err) {
      console.error('Error duplicating:', err);
      showNotification('error', 'Erro ao duplicar proposta');
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
      pending_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
      pending_approval: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
      sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
      sent_to_client: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
      approved: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
      accepted: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
      expired: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
      cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
      converted_to_contract: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
    };
    return colors[status] || colors.draft;
  };

  const getStatusLabel = (status: DocumentStatus) => {
    const labels: Record<DocumentStatus, string> = {
      draft: 'Rascunho',
      pending_review: 'Em Revisão',
      pending_approval: 'Aguardando Aprovação',
      sent: 'Enviada',
      sent_to_client: 'Enviada ao Cliente',
      approved: 'Aprovada',
      accepted: 'Aceita',
      rejected: 'Rejeitada',
      expired: 'Expirada',
      cancelled: 'Cancelada',
      converted_to_contract: 'Convertida em Contrato',
    };
    return labels[status] || status;
  };

  // ============================================
  // RENDER
  // ============================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#0D2A59] dark:text-[#F3B229] animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (!current) {
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
        <div className="flex items-center justify-between px-4 h-16">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
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
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${getStatusColor(current.status)}`}
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
                    {(['draft', 'pending_review', 'pending_approval', 'approved', 'sent_to_client'] as DocumentStatus[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
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
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('form')}
                className={`p-2 rounded-md transition-colors ${
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
                className={`p-2 rounded-md transition-colors ${
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
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'preview' 
                    ? 'bg-white dark:bg-gray-600 shadow-sm' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Apenas preview"
              >
                <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />

            {/* Quick Actions */}
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Imprimir"
            >
              <Printer className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            
            <button
              onClick={handleDuplicate}
              disabled={!current.id}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Duplicar"
            >
              <Copy className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-[#0D2A59] text-white rounded-lg hover:bg-[#0D2A59]/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar
            </button>

            {/* Send Button */}
            <button
              onClick={() => handleStatusChange('sent_to_client')}
              disabled={!current.id || current.status === 'sent_to_client'}
              className="flex items-center gap-2 px-4 py-2 bg-[#F3B229] text-[#0D2A59] rounded-lg hover:bg-[#F3B229]/90 transition-colors disabled:opacity-50 font-medium"
            >
              <Send className="w-4 h-4" />
              Enviar
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
                style={{ height: 'calc(100vh - 64px)' }}
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

      {/* ========== NOTIFICATIONS ========== */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`
              fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50
              ${notification.type === 'success' ? 'bg-green-600 text-white' : ''}
              ${notification.type === 'error' ? 'bg-red-600 text-white' : ''}
              ${notification.type === 'info' ? 'bg-blue-600 text-white' : ''}
            `}
          >
            {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
            {notification.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {notification.type === 'info' && <AlertCircle className="w-5 h-5" />}
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

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
