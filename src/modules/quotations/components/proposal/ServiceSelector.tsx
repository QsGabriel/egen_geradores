/**
 * EGEN System - Service Selector
 * Componente para seleção de serviços com integração à tabela de preços
 */
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Briefcase, Calculator } from 'lucide-react';
import { useQuotationStore, selectServicos } from '../../stores/quotationStore';
import { usePricing } from '../../../pricing';
import type { ProposalServico } from '../../types/proposal';

// ============================================
// TYPES
// ============================================

interface ServiceSelectorProps {
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function ServiceSelector({ className = '' }: ServiceSelectorProps) {
  const servicos = useQuotationStore(selectServicos);
  const { addServico, updateServico, removeServico, recalculateTotals,current } = useQuotationStore();
  const { accessories, formatCurrency, loading: pricingLoading } = usePricing();

  // Get period from current quotation for price lookup
  const currentPeriod = current?.equipamentos[0]?.periodoLocacao || 'mensal';

  // Available services from pricing table
  const availableServices = useMemo(() => {
    return accessories.filter(a => a.category === 'servico' || a.category === 'deslocamento');
  }, [accessories]);

  // Handle adding new service
  const handleAddServico = (presetCode?: string) => {
    if (presetCode) {
      const serviceData = accessories.find(a => a.itemCode === presetCode);
      if (serviceData) {
        const periodPriceMap: Record<string, number | null> = {
          mensal: serviceData.priceMonthly,
          quinzenal: serviceData.priceBiweekly,
          semanal: serviceData.priceWeekly,
        };
        addServico({
          codigo: serviceData.itemCode,
          descricao: serviceData.itemName,
          valorUnitario: periodPriceMap[currentPeriod] ?? 0,
        });
      }
    } else {
      addServico();
    }
    recalculateTotals();
  };

  // Handle field update
  const handleFieldUpdate = (id: string, field: keyof ProposalServico, value: any) => {
    updateServico(id, { [field]: value });
    recalculateTotals();
  };

  // Handle service selection from dropdown
  const handleServiceSelect = (id: string, codigo: string) => {
    const serviceData = accessories.find(a => a.itemCode === codigo);
    if (serviceData) {
      const periodPriceMap: Record<string, number | null> = {
        mensal: serviceData.priceMonthly,
        quinzenal: serviceData.priceBiweekly,
        semanal: serviceData.priceWeekly,
      };
      updateServico(id, {
        codigo: serviceData.itemCode,
        descricao: serviceData.itemName,
        valorUnitario: periodPriceMap[currentPeriod] ?? 0,
      });
      recalculateTotals();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-egen-blue" />
          Serviços
        </h3>
        <button
          onClick={() => handleAddServico()}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-egen-navy text-white rounded-lg hover:bg-egen-navy/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      {/* Quick Add Buttons */}
      <div className="flex flex-wrap gap-2">
        {availableServices.slice(0, 6).map((service, idx) => (
          <button
            key={`quick-${service.itemCode}-${idx}`}
            onClick={() => handleAddServico(service.itemCode)}
            className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            + {service.itemName}
          </button>
        ))}
      </div>

      {/* Service List */}
      <AnimatePresence mode="popLayout">
        {servicos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum serviço adicionado</p>
            <button
              onClick={() => handleAddServico()}
              className="mt-2 text-sm text-egen-navy dark:text-egen-yellow hover:underline"
            >
              Adicionar serviço
            </button>
          </motion.div>
        ) : (
          servicos.map((serv, index) => (
            <motion.div
              key={serv.id}
              layout
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-start gap-4">
                {/* Service Info */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Código/Tipo */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Tipo
                    </label>
                    <select
                      value={serv.codigo}
                      onChange={(e) => handleServiceSelect(serv.id, e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                    >
                      <option value="">Personalizado</option>
                      {availableServices.map((s, idx) => (
                        <option key={`opt-${s.itemCode}-${idx}`} value={s.itemCode}>
                          {s.itemName}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Descrição */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={serv.descricao}
                      onChange={(e) => handleFieldUpdate(serv.id, 'descricao', e.target.value)}
                      placeholder="Descrição do serviço"
                      className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                    />
                  </div>

                  {/* Quantidade */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Qtd
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={serv.quantidade}
                      onChange={(e) => handleFieldUpdate(serv.id, 'quantidade', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                    />
                  </div>
                </div>

                {/* Price and Actions */}
                <div className="flex items-center gap-3">
                  {/* Valor Unitário */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Valor Unit.
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={serv.valorUnitario}
                        onChange={(e) => handleFieldUpdate(serv.id, 'valorUnitario', parseFloat(e.target.value) || 0)}
                        className="w-28 pl-10 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                      />
                    </div>
                  </div>

                  {/* Valor Total */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Total
                    </label>
                    <div className="px-3 py-2 bg-egen-navy/10 dark:bg-egen-yellow/10 rounded-lg text-sm font-semibold text-egen-navy dark:text-egen-yellow flex items-center gap-2 min-w-[100px]">
                      <Calculator className="w-4 h-4" />
                      {formatCurrency(serv.valorTotal)}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeServico(serv.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors mt-5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Observações */}
              {serv.observacoes && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <input
                    type="text"
                    value={serv.observacoes}
                    onChange={(e) => handleFieldUpdate(serv.id, 'observacoes', e.target.value)}
                    placeholder="Observações..."
                    className="w-full px-3 py-2 text-sm text-gray-500 bg-transparent border-none focus:outline-none"
                  />
                </div>
              )}
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}

export default ServiceSelector;
