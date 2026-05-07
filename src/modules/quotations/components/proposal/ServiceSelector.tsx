/**
 * EGEN System - Spot Item Selector (Itens Spot / Sob Demanda)
 * Gerencia itens Spot: Frete, Instalação, Manutenção Pontual e Personalizado
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Truck, Wrench, PackageOpen, Calculator } from 'lucide-react';
import { useQuotationStore, selectItensSpot } from '../../stores/quotationStore';
import type { ProposalItemSpot, ItemTipoSpot } from '../../types/proposal';
import { ItemTipoSpotLabels } from '../../types/proposal';

// ============================================
// HELPERS
// ============================================

const TIPO_ICONS: Record<ItemTipoSpot, React.ReactNode> = {
  frete: <Truck className="w-4 h-4" />,
  instalacao: <PackageOpen className="w-4 h-4" />,
  manutencao_pontual: <Wrench className="w-4 h-4" />,
  personalizado: <Plus className="w-4 h-4" />,
};

const QUICK_ADD_TYPES: ItemTipoSpot[] = ['frete', 'instalacao', 'manutencao_pontual', 'personalizado'];

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
  const itensSpot = useQuotationStore(selectItensSpot);
  const { addItemSpot, updateItemSpot, removeItemSpot, recalculateTotals } = useQuotationStore();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleAddItem = (tipo: ItemTipoSpot = 'personalizado') => {
    addItemSpot({
      tipo,
      descricao: tipo === 'personalizado' ? '' : ItemTipoSpotLabels[tipo],
    });
  };

  const handleFieldUpdate = (id: string, field: keyof ProposalItemSpot, value: any) => {
    updateItemSpot(id, { [field]: value });
    recalculateTotals();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Truck className="w-5 h-5 text-blue-500" />
          Itens Spot (Sob Demanda)
        </h3>
        <button
          onClick={() => handleAddItem('personalizado')}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-egen-navy text-white rounded-lg hover:bg-egen-navy/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      {/* Quick-add */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ADD_TYPES.map((tipo) => (
          <button
            key={tipo}
            onClick={() => handleAddItem(tipo)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Plus className="w-3 h-3" />
            {ItemTipoSpotLabels[tipo]}
          </button>
        ))}
      </div>

      {/* Items List */}
      <AnimatePresence mode="popLayout">
        {itensSpot.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum item spot adicionado</p>
            <button
              onClick={() => handleAddItem('frete')}
              className="mt-2 text-sm text-egen-navy dark:text-egen-yellow hover:underline"
            >
              Adicionar item
            </button>
          </motion.div>
        ) : (
          itensSpot.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                {/* Tipo */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Tipo
                  </label>
                  <select
                    value={item.tipo}
                    onChange={(e) => handleFieldUpdate(item.id, 'tipo', e.target.value as ItemTipoSpot)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                  >
                    {QUICK_ADD_TYPES.map((t) => (
                      <option key={t} value={t}>{ItemTipoSpotLabels[t]}</option>
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
                    value={item.descricao}
                    onChange={(e) => handleFieldUpdate(item.id, 'descricao', e.target.value)}
                    placeholder={ItemTipoSpotLabels[item.tipo]}
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
                    value={item.quantidade}
                    onChange={(e) => handleFieldUpdate(item.id, 'quantidade', parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                  />
                </div>

                {/* Valor Unit. */}
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
              </div>

              {/* Second row: observações + total + delete */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Observações
                  </label>
                  <input
                    type="text"
                    value={item.observacoes}
                    onChange={(e) => handleFieldUpdate(item.id, 'observacoes', e.target.value)}
                    placeholder="Campo livre..."
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30"
                  />
                </div>

                {/* Total */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Total</label>
                  <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    {formatCurrency(item.valorTotal)}
                  </div>
                </div>

                {/* Delete */}
                <div className="flex justify-end">
                  <button
                    onClick={() => removeItemSpot(item.id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}

export default ServiceSelector;
