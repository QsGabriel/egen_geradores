/**
 * EGEN System - Equipment Selector (Itens Periódicos)
 * Gerencia itens periódicos: Gerador, Cabos, QTA, Tanque, Telemetria, Manutenção
 */
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Zap, Cable, Wrench, Server, Fuel, Radio,
  Calculator, AlertTriangle,
} from 'lucide-react';
import { useQuotationStore, selectItensPeriodicos } from '../../stores/quotationStore';
import { usePricing } from '../../../pricing';
import type { ProposalItemPeriodico, FranquiaHoras, PeriodoLocacao, ItemTipoPeriodico } from '../../types/proposal';
import { FranquiaHorasLabels, PeriodoLocacaoLabels, ItemTipoPeriodicoLabels } from '../../types/proposal';

// ============================================
// HELPERS
// ============================================

const TIPO_ICONS: Record<ItemTipoPeriodico, React.ReactNode> = {
  gerador: <Zap className="w-4 h-4" />,
  cabo_380v: <Cable className="w-4 h-4" />,
  cabo_220v: <Cable className="w-4 h-4" />,
  qta: <Server className="w-4 h-4" />,
  tanque: <Fuel className="w-4 h-4" />,
  telemetria_item: <Radio className="w-4 h-4" />,
  manutencao_recorrente: <Wrench className="w-4 h-4" />,
};

const QUICK_ADD_TYPES: ItemTipoPeriodico[] = [
  'gerador', 'cabo_380v', 'cabo_220v', 'qta', 'tanque', 'telemetria_item', 'manutencao_recorrente',
];

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
  const itensPeriodicos = useQuotationStore(selectItensPeriodicos);
  const { addItemPeriodico, updateItemPeriodico, removeItemPeriodico, recalculateTotals } = useQuotationStore();
  
  const {
    generators,
    getGeneratorPrice,
    getAvailablePowers,
    formatCurrency,
    loading: pricingLoading,
  } = usePricing();

  const availablePowers = useMemo(() => getAvailablePowers('gerador'), [getAvailablePowers]);

  // Add a new periodic item
  const handleAddItem = (tipo: ItemTipoPeriodico = 'gerador') => {
    addItemPeriodico({ tipo, descricao: tipo === 'gerador' ? '' : ItemTipoPeriodicoLabels[tipo] });
  };

  // Generic field update with price auto-fill for generators
  const handleFieldUpdate = (
    id: string,
    field: keyof ProposalItemPeriodico,
    value: any,
  ) => {
    const current = itensPeriodicos.find(e => e.id === id);
    if (!current) return;

    if (
      current.tipo === 'gerador' &&
      (field === 'potenciaKva' || field === 'periodoLocacao' || field === 'franquiaHoras')
    ) {
      const newPotencia = field === 'potenciaKva' ? value : current.potenciaKva;
      const newPeriodo = field === 'periodoLocacao' ? value : current.periodoLocacao;
      const newFranquia = field === 'franquiaHoras' ? value : current.franquiaHoras;

      const periodMap: Record<PeriodoLocacao, 'mensal' | 'quinzenal' | 'semanal'> = {
        mensal: 'mensal',
        quinzenal: 'quinzenal',
        semanal: 'semanal',
      };

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
          franquiaMap[newFranquia],
        );
        updateItemPeriodico(id, {
          [field]: value,
          valorUnitario: price ?? 0,
          descricao: `Gerador ${newPotencia}`,
        });
      } else {
        updateItemPeriodico(id, { [field]: value });
      }
    } else {
      updateItemPeriodico(id, { [field]: value });
    }

    recalculateTotals();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-egen-yellow" />
          Itens Periódicos
        </h3>
        <button
          onClick={() => handleAddItem('gerador')}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-egen-navy text-white rounded-lg hover:bg-egen-navy/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      {/* Quick-add buttons */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ADD_TYPES.map((tipo) => (
          <button
            key={tipo}
            onClick={() => handleAddItem(tipo)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Plus className="w-3 h-3" />
            {ItemTipoPeriodicoLabels[tipo]}
          </button>
        ))}
      </div>

      {/* Items List */}
      <AnimatePresence mode="popLayout">
        {itensPeriodicos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum item periódico adicionado</p>
            <button
              onClick={() => handleAddItem('gerador')}
              className="mt-2 text-sm text-egen-navy dark:text-egen-yellow hover:underline"
            >
              Adicionar gerador
            </button>
          </motion.div>
        ) : (
          itensPeriodicos.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
            >
              {/* Item Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span className="text-egen-navy dark:text-egen-yellow">
                    {TIPO_ICONS[item.tipo]}
                  </span>
                  <span>#{index + 1} — {ItemTipoPeriodicoLabels[item.tipo]}</span>
                </div>
                <button
                  onClick={() => removeItemPeriodico(item.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={item.descricao}
                  onChange={(e) => handleFieldUpdate(item.id, 'descricao', e.target.value)}
                  placeholder={item.tipo === 'gerador' ? 'Ex: Gerador 150 kVA' : ItemTipoPeriodicoLabels[item.tipo]}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                />
              </div>

              {/* Main Fields */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Potência — only for generators */}
                {item.tipo === 'gerador' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Potência
                    </label>
                    <select
                      value={item.potenciaKva ?? ''}
                      onChange={(e) => handleFieldUpdate(item.id, 'potenciaKva', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                    >
                      <option value="">Selecione...</option>
                      {availablePowers.map(power => (
                        <option key={power} value={power}>{power}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Quantidade */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantidade}
                    onChange={(e) => handleFieldUpdate(item.id, 'quantidade', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                  />
                </div>

                {/* Franquia */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Franquia
                  </label>
                  <select
                    value={item.franquiaHoras}
                    onChange={(e) => handleFieldUpdate(item.id, 'franquiaHoras', e.target.value as FranquiaHoras)}
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
                    value={item.periodoLocacao}
                    onChange={(e) => handleFieldUpdate(item.id, 'periodoLocacao', e.target.value as PeriodoLocacao)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                  >
                    {Object.entries(PeriodoLocacaoLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                      value={item.valorUnitario}
                      onChange={(e) => handleFieldUpdate(item.id, 'valorUnitario', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                    />
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Observações
                  </label>
                  <input
                    type="text"
                    value={item.observacoes}
                    onChange={(e) => handleFieldUpdate(item.id, 'observacoes', e.target.value)}
                    placeholder="Ex: backup para área de TI"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                  />
                </div>

                {/* Valor Total */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Total
                  </label>
                  <div className="px-3 py-2 bg-egen-navy/10 dark:bg-egen-yellow/10 rounded-lg text-sm font-semibold text-egen-navy dark:text-egen-yellow flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    {formatCurrency(item.valorTotal)}
                  </div>
                </div>
              </div>

              {/* Price warning for generators */}
              {item.tipo === 'gerador' && item.valorUnitario === 0 && item.potenciaKva && (
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
