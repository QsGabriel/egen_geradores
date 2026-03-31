/**
 * EGEN System - Equipment Selector
 * Componente para seleção de equipamentos com integração à tabela de preços
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, ChevronDown, Zap, Cable, Wrench, 
  Calculator, AlertTriangle 
} from 'lucide-react';
import { useQuotationStore, selectEquipamentos } from '../../stores/quotationStore';
import { usePricing } from '../../../pricing';
import type { ProposalEquipamento, FranquiaHoras, PeriodoLocacao } from '../../types/proposal';
import { FranquiaHorasLabels, PeriodoLocacaoLabels } from '../../types/proposal';

// ============================================
// TYPES
// ============================================

interface EquipmentSelectorProps {
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function EquipmentSelector({ className = '' }: EquipmentSelectorProps) {
  const equipamentos = useQuotationStore(selectEquipamentos);
  const { addEquipamento, updateEquipamento, removeEquipamento, recalculateTotals } = useQuotationStore();
  
  const { 
    generators, 
    getGeneratorPrice, 
    getExtraHourPrice,
    getAvailablePowers, 
    formatCurrency,
    loading: pricingLoading 
  } = usePricing();

  const availablePowers = useMemo(() => getAvailablePowers('gerador'), [getAvailablePowers]);

  // Handle adding new equipment
  const handleAddEquipamento = () => {
    addEquipamento();
  };

  // Handle equipment field update with price auto-fill
  const handleFieldUpdate = (
    id: string, 
    field: keyof ProposalEquipamento, 
    value: any
  ) => {
    const current = equipamentos.find(e => e.id === id);
    if (!current) return;

    // If changing power or period or franquia, auto-fill price
    if (field === 'potenciaKva' || field === 'periodoLocacao' || field === 'franquiaHoras') {
      const newPotencia = field === 'potenciaKva' ? value : current.potenciaKva;
      const newPeriodo = field === 'periodoLocacao' ? value : current.periodoLocacao;
      const newFranquia = field === 'franquiaHoras' ? value : current.franquiaHoras;

      // Map PeriodoLocacao to RentalPeriod
      const periodMap: Record<PeriodoLocacao, 'mensal' | 'quinzenal' | 'semanal'> = {
        mensal: 'mensal',
        quinzenal: 'quinzenal',
        semanal: 'semanal',
      };

      // Map FranquiaHoras to HoursPackage
      const franquiaMap: Record<FranquiaHoras, 'standby' | '120h' | '240h' | '360h' | 'continuous'> = {
        standby: 'standby',
        '120h': '120h',
        '240h': '240h',
        '360h': '360h',
        continuo: 'continuous',
      };

      if (newPotencia && newPeriodo && newFranquia) {
        const price = getGeneratorPrice(
          newPotencia,
          periodMap[newPeriodo],
          franquiaMap[newFranquia]
        );

        const extraHourPrice = getExtraHourPrice(newPotencia, periodMap[newPeriodo]);

        // Find cable and maintenance prices
        const genData = generators.find(
          g => g.powerKva === newPotencia && g.rentalPeriod === periodMap[newPeriodo]
        );

        updateEquipamento(id, {
          [field]: value,
          valorUnitario: price ?? 0,
          descricao: `Gerador ${newPotencia}`,
          valorCabo380v: genData?.priceCableKit380v ?? 0,
          valorCabo220v: genData?.priceCableKit220v ?? 0,
          valorManutencao: genData?.pricePreventiveMaintenance ?? 0,
        });
      } else {
        updateEquipamento(id, { [field]: value });
      }
    } else {
      updateEquipamento(id, { [field]: value });
    }

    // Always recalculate totals
    recalculateTotals();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-egen-yellow" />
          Equipamentos
        </h3>
        <button
          onClick={handleAddEquipamento}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-egen-navy text-white rounded-lg hover:bg-egen-navy/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      {/* Equipment List */}
      <AnimatePresence mode="popLayout">
        {equipamentos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum equipamento adicionado</p>
            <button
              onClick={handleAddEquipamento}
              className="mt-2 text-sm text-egen-navy dark:text-egen-yellow hover:underline"
            >
              Adicionar equipamento
            </button>
          </motion.div>
        ) : (
          equipamentos.map((eq, index) => (
            <motion.div
              key={eq.id}
              layout
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
            >
              {/* Equipment Header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Equipamento #{index + 1}
                </span>
                <button
                  onClick={() => removeEquipamento(eq.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Main Fields Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Potência */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Potência
                  </label>
                  <select
                    value={eq.potenciaKva}
                    onChange={(e) => handleFieldUpdate(eq.id, 'potenciaKva', e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                  >
                    <option value="">Selecione...</option>
                    {availablePowers.map(power => (
                      <option key={power} value={power}>{power}</option>
                    ))}
                  </select>
                </div>

                {/* Quantidade */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={eq.quantidade}
                    onChange={(e) => handleFieldUpdate(eq.id, 'quantidade', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                  />
                </div>

                {/* Franquia */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Franquia
                  </label>
                  <select
                    value={eq.franquiaHoras}
                    onChange={(e) => handleFieldUpdate(eq.id, 'franquiaHoras', e.target.value as FranquiaHoras)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                  >
                    {Object.entries(FranquiaHorasLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Período */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Período
                  </label>
                  <select
                    value={eq.periodoLocacao}
                    onChange={(e) => handleFieldUpdate(eq.id, 'periodoLocacao', e.target.value as PeriodoLocacao)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                  >
                    {Object.entries(PeriodoLocacaoLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price and Extras Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                      value={eq.valorUnitario}
                      onChange={(e) => handleFieldUpdate(eq.id, 'valorUnitario', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                    />
                  </div>
                </div>

                {/* Extras Checkboxes */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Extras
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={eq.incluiCabo380v}
                        onChange={(e) => handleFieldUpdate(eq.id, 'incluiCabo380v', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-egen-navy focus:ring-egen-navy"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Cable className="w-3 h-3" />
                        Cabo 380V ({formatCurrency(eq.valorCabo380v)})
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={eq.incluiCabo220v}
                        onChange={(e) => handleFieldUpdate(eq.id, 'incluiCabo220v', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-egen-navy focus:ring-egen-navy"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Cable className="w-3 h-3" />
                        Cabo 220V ({formatCurrency(eq.valorCabo220v)})
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={eq.incluiManutencao}
                        onChange={(e) => handleFieldUpdate(eq.id, 'incluiManutencao', e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-egen-navy focus:ring-egen-navy"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Wrench className="w-3 h-3" />
                        Manutenção ({formatCurrency(eq.valorManutencao)})
                      </span>
                    </label>
                  </div>
                </div>

                {/* Valor Total */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Total
                  </label>
                  <div className="px-3 py-2 bg-egen-navy/10 dark:bg-egen-yellow/10 rounded-lg text-sm font-semibold text-egen-navy dark:text-egen-yellow flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    {formatCurrency(eq.valorTotal)}
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Observações
                </label>
                <input
                  type="text"
                  value={eq.observacoes}
                  onChange={(e) => handleFieldUpdate(eq.id, 'observacoes', e.target.value)}
                  placeholder="Ex: Gerador de backup para área de TI"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                />
              </div>

              {/* Price Warning */}
              {eq.valorUnitario === 0 && eq.potenciaKva && (
                <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Preço não encontrado para esta configuração. Verifique a tabela de preços.
                </div>
              )}
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}

export default EquipmentSelector;
