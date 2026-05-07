/**
 * EGEN System - Quotation Form
 * Formulário principal para criação/edição de propostas
 */
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  User,
  Zap,
  Briefcase,
  Clock,
  Settings,
  ChevronDown,
  ChevronUp,
  Save,
  Send,
  AlertCircle,
  Calculator,
  Percent,
  AlignLeft,
  LayoutList,
} from 'lucide-react';
import { useQuotationStore } from '../../stores/quotationStore';
import { ClientSelector } from './ClientSelector';
import { EquipmentSelector } from './EquipmentSelector';
import { ServiceSelector } from './ServiceSelector';
import { ConditionsEditor } from './ConditionsEditor';
import { DocumentTipoLabels, DocumentStatusLabels } from '../../types/proposal';
import type { DocumentTipo, DocumentStatus } from '../../types/proposal';

// ============================================
// TYPES
// ============================================

interface QuotationFormProps {
  onSave?: () => void;
  onSend?: () => void;
  className?: string;
}

interface AccordionSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  badge?: React.ReactNode;
}

// ============================================
// ACCORDION SECTION COMPONENT
// ============================================

function AccordionSection({
  id,
  title,
  icon,
  isOpen,
  onToggle,
  children,
  badge,
}: AccordionSectionProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className={`
          w-full flex items-center justify-between px-4 py-3 
          bg-white dark:bg-gray-800 
          hover:bg-gray-50 dark:hover:bg-gray-750 
          transition-colors
          ${isOpen ? 'border-b border-gray-200 dark:border-gray-700' : ''}
        `}
      >
        <div className="flex items-center gap-3">
          <span className="text-egen-navy dark:text-egen-yellow">{icon}</span>
          <span className="font-medium text-gray-900 dark:text-white">{title}</span>
          {badge}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function QuotationForm({ onSave, onSend, className = '' }: QuotationFormProps) {
  // Get state and actions from store separately to avoid infinite loops
  const current = useQuotationStore((state) => state.current);
  const isDirty = useQuotationStore((state) => state.isDirty);
  
  // Get individual totals to avoid object reference issues
  const totalPeriodicos = useQuotationStore((state) => state.current?.totalPeriodicos ?? 0);
  const totalSpot = useQuotationStore((state) => state.current?.totalSpot ?? 0);
  const totalGeral = useQuotationStore((state) => state.current?.totalGeral ?? 0);
  const descontoValor = useQuotationStore((state) => state.current?.descontoValor ?? 0);
  const totalComDesconto = useQuotationStore((state) => state.current?.totalComDesconto ?? 0);
  const itensPeriodicos = useQuotationStore((state) => state.current?.itensPeriodicos ?? []);
  const itensSpot = useQuotationStore((state) => state.current?.itensSpot ?? []);
  
  // Memoize totals object
  const totals = useMemo(() => ({
    periodicos: totalPeriodicos,
    spot: totalSpot,
    geral: totalGeral,
    desconto: descontoValor,
    final: totalComDesconto,
  }), [totalPeriodicos, totalSpot, totalGeral, descontoValor, totalComDesconto]);
  
  const {
    createNew,
    setTipo,
    setDataEmissao,
    setValidade,
    setDescontoPercent,
    setNotasInternas,
    setObservacoesGerais,
    setExibirTotaisPorTabela,
    saveDraft,
    updateCliente,
  } = useQuotationStore();

  // Accordion state
  const [openSections, setOpenSections] = useState<string[]>([
    'identificacao',
    'cliente',
    'equipamentos',
  ]);

  // Toggle section
  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((s) => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Initialize new quotation if none exists
  useEffect(() => {
    if (!current) {
      createNew('proposta');
    }
  }, [current, createNew]);

  // Handle save
  const handleSave = () => {
    saveDraft();
    onSave?.();
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (!current) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-egen-navy dark:text-egen-yellow" />
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {DocumentTipoLabels[current.tipo]}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {current.documentId}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-xs text-orange-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Não salvo
            </span>
          )}
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
          <button
            onClick={onSend}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-egen-navy text-white rounded-lg hover:bg-egen-navy/90 transition-colors"
          >
            <Send className="w-4 h-4" />
            Enviar
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Identificação */}
        <AccordionSection
          id="identificacao"
          title="Identificação"
          icon={<FileText className="w-5 h-5" />}
          isOpen={openSections.includes('identificacao')}
          onToggle={() => toggleSection('identificacao')}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Tipo de Documento */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Tipo de Documento
              </label>
              <select
                value={current.tipo}
                onChange={(e) => setTipo(e.target.value as DocumentTipo)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
              >
                {Object.entries(DocumentTipoLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Data de Emissão */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Data de Emissão
              </label>
              <input
                type="date"
                value={current.dataEmissao}
                onChange={(e) => setDataEmissao(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
              />
            </div>

            {/* Validade */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Válido até
              </label>
              <input
                type="date"
                value={current.validade}
                onChange={(e) => setValidade(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
              />
            </div>

            {/* Status Badge */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Status
              </label>
              <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                {DocumentStatusLabels[current.status]}
              </div>
            </div>
          </div>
        </AccordionSection>

        {/* Cliente */}
        <AccordionSection
          id="cliente"
          title="Cliente"
          icon={<User className="w-5 h-5" />}
          isOpen={openSections.includes('cliente')}
          onToggle={() => toggleSection('cliente')}
          badge={
            current.cliente.nome ? (
              <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                Selecionado
              </span>
            ) : null
          }
        >
          <div className="space-y-4">
            <ClientSelector />
            
            {/* Manual Client Fields */}
            {current.cliente.nome && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Razão Social / Nome
                  </label>
                  <input
                    type="text"
                    value={current.cliente.nome}
                    onChange={(e) => updateCliente('nome', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    CNPJ/CPF
                  </label>
                  <input
                    type="text"
                    value={current.cliente.documento}
                    onChange={(e) => updateCliente('documento', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Responsável
                  </label>
                  <input
                    type="text"
                    value={current.cliente.responsavel}
                    onChange={(e) => updateCliente('responsavel', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={current.cliente.telefone}
                    onChange={(e) => updateCliente('telefone', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={current.cliente.email}
                    onChange={(e) => updateCliente('email', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Cidade/UF
                  </label>
                  <input
                    type="text"
                    value={current.cliente.cidadeUf}
                    onChange={(e) => updateCliente('cidadeUf', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={current.cliente.endereco}
                    onChange={(e) => updateCliente('endereco', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                  />
                </div>
              </div>
            )}
          </div>
        </AccordionSection>

        {/* Itens Periódicos */}
        <AccordionSection
          id="equipamentos"
          title="Itens Periódicos"
          icon={<Zap className="w-5 h-5" />}
          isOpen={openSections.includes('equipamentos')}
          onToggle={() => toggleSection('equipamentos')}
          badge={
            itensPeriodicos.length > 0 ? (
              <span className="text-xs px-2 py-0.5 bg-egen-navy/10 dark:bg-egen-yellow/20 text-egen-navy dark:text-egen-yellow rounded">
                {itensPeriodicos.length} item(s)
              </span>
            ) : null
          }
        >
          <EquipmentSelector />
        </AccordionSection>

        {/* Itens Spot */}
        <AccordionSection
          id="servicos"
          title="Itens Spot (Sob Demanda)"
          icon={<Briefcase className="w-5 h-5" />}
          isOpen={openSections.includes('servicos')}
          onToggle={() => toggleSection('servicos')}
          badge={
            itensSpot.length > 0 ? (
              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                {itensSpot.length} item(s)
              </span>
            ) : null
          }
        >
          <ServiceSelector />
        </AccordionSection>

        {/* Condições Comerciais */}
        <AccordionSection
          id="condicoes"
          title="Condições Comerciais"
          icon={<Settings className="w-5 h-5" />}
          isOpen={openSections.includes('condicoes')}
          onToggle={() => toggleSection('condicoes')}
        >
          <ConditionsEditor />
        </AccordionSection>

        {/* Observações Gerais */}
        <AccordionSection
          id="observacoes"
          title="Observações Gerais"
          icon={<AlignLeft className="w-5 h-5" />}
          isOpen={openSections.includes('observacoes')}
          onToggle={() => toggleSection('observacoes')}
        >
          <textarea
            value={current.observacoesGerais}
            onChange={(e) => setObservacoesGerais(e.target.value)}
            placeholder="Observações gerais que aparecerão na proposta final..."
            rows={5}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
          />
        </AccordionSection>

        {/* Notas Internas */}
        <AccordionSection
          id="notas"
          title="Notas Internas"
          icon={<FileText className="w-5 h-5" />}
          isOpen={openSections.includes('notas')}
          onToggle={() => toggleSection('notas')}
        >
          <textarea
            value={current.notasInternas}
            onChange={(e) => setNotasInternas(e.target.value)}
            placeholder="Notas internas (não aparecem no documento final)..."
            rows={4}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
          />
        </AccordionSection>
      </div>

      {/* Footer with Totals */}
      <div className="px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {/* Discount */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-gray-400" />
              <label className="text-sm text-gray-600 dark:text-gray-400">Desconto:</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={current.descontoPercent}
                onChange={(e) => setDescontoPercent(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-egen-navy/30"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
            {totals.desconto > 0 && (
              <span className="text-sm text-green-600 dark:text-green-400">
                - {formatCurrency(totals.desconto)}
              </span>
            )}
          </div>

          {/* Totals */}
          <div className="flex items-center gap-4">
            {/* Totais por tabela toggle */}
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 dark:text-gray-400">
              <LayoutList className="w-4 h-4" />
              <span>Totais por tabela</span>
              <input
                type="checkbox"
                checked={current.exibirTotaisPorTabela}
                onChange={(e) => setExibirTotaisPorTabela(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-egen-navy focus:ring-egen-navy"
              />
            </label>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Periódicos</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatCurrency(totals.periodicos)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Spot</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {formatCurrency(totals.spot)}
              </p>
            </div>
            <div className="text-right pl-4 border-l border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-lg font-bold text-egen-navy dark:text-egen-yellow flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                {formatCurrency(totals.final)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuotationForm;
