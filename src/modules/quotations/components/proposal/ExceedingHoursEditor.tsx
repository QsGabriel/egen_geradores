/**
 * EGEN System - Exceeding Hours Editor
 * Editor para valores de horas excedentes, com auto-sugestão baseada nos geradores selecionados.
 */
import React, { useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Clock, Zap } from 'lucide-react';
import { useQuotationStore, selectItensPeriodicos, selectHorasExcedentes } from '../../stores/quotationStore';
import { Select } from './Select';

// ============================================
// TABELA DE REFERÊNCIA — HORAS EXCEDENTES
// ============================================

interface ExceedingHourRef {
  minKva: number;
  maxKva: number;
  label: string;
  valorUnitario: number;
}

const EXCEEDING_HOURS_TABLE: ExceedingHourRef[] = [
  { minKva: 20,  maxKva: 20,  label: '20KVA',              valorUnitario: 17.50 },
  { minKva: 40,  maxKva: 40,  label: '40KVA',              valorUnitario: 21.34 },
  { minKva: 53,  maxKva: 63,  label: '53KVA à 63KVA',      valorUnitario: 25.40 },
  { minKva: 75,  maxKva: 83,  label: '75KVA à 83KVA',      valorUnitario: 27.95 },
  { minKva: 110, maxKva: 125, label: '110KVA à 125KVA',    valorUnitario: 28.49 },
  { minKva: 140, maxKva: 140, label: '140KVA',              valorUnitario: 29.49 },
  { minKva: 170, maxKva: 207, label: '170KVA à 207KVA',    valorUnitario: 37.50 },
  { minKva: 251, maxKva: 251, label: '251KVA',              valorUnitario: 54.72 },
  { minKva: 300, maxKva: 300, label: '300KVA',              valorUnitario: 56.26 },
  { minKva: 350, maxKva: 400, label: '350KVA à 400KVA',    valorUnitario: 69.18 },
  { minKva: 500, maxKva: 563, label: '500KVA à 563KVA',    valorUnitario: 97.21 },
  { minKva: 640, maxKva: 640, label: '640KVA',              valorUnitario: 105.00 },
  { minKva: 700, maxKva: 700, label: '700KVA',              valorUnitario: 133.04 },
  { minKva: 750, maxKva: 750, label: '750KVA',              valorUnitario: 150.04 },
];

function extractMinKva(powerString: string): number {
  const match = powerString.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function findExceedingHourRef(potenciaKva: string): ExceedingHourRef | null {
  const minKva = extractMinKva(potenciaKva);
  return EXCEEDING_HOURS_TABLE.find(
    (e) => minKva >= e.minKva && minKva <= e.maxKva,
  ) ?? null;
}

// ============================================
// COMPONENT
// ============================================

export function ExceedingHoursEditor() {
  const itensPeriodicos = useQuotationStore(selectItensPeriodicos);
  const horasExcedentes = useQuotationStore(selectHorasExcedentes);
  const { addHoraExcedente, updateHoraExcedente, removeHoraExcedente } = useQuotationStore();

  // Dropdown options: exactly the 14 potências from HORAS_EXCEDENTES.md
  const powerOptions = useMemo(() => EXCEEDING_HOURS_TABLE.map((e) => e.label), []);

  // Unique generator powers selected in periodicos
  const generatorPowers = useMemo(() => {
    const powers = itensPeriodicos
      .filter((item) => item.tipo === 'gerador' && item.potenciaKva)
      .map((item) => item.potenciaKva!);
    return [...new Set(powers)];
  }, [itensPeriodicos]);

  const existingPowers = useMemo(
    () => new Set(horasExcedentes.map((h) => h.potenciaKva).filter(Boolean)),
    [horasExcedentes],
  );

  const missingPowers = useMemo(
    () => generatorPowers.filter((p) => !existingPowers.has(p)),
    [generatorPowers, existingPowers],
  );

  // Auto-suggest: add all missing powers with default prices
  const handleAutoSuggest = useCallback(() => {
    missingPowers.forEach((power) => {
      const ref = findExceedingHourRef(power);
      addHoraExcedente({
        potenciaKva: power,
        descricao: ref ? `Hora excedente ${ref.label}` : `Hora excedente ${power}`,
        valorUnitario: ref?.valorUnitario ?? 0,
        observacoes: 'por equipamento',
      });
    });
  }, [missingPowers, addHoraExcedente]);

  // When user selects a power in the dropdown, auto-fill description + value
  const handlePowerChange = useCallback(
    (id: string, power: string) => {
      const ref = findExceedingHourRef(power);
      updateHoraExcedente(id, {
        potenciaKva: power,
        descricao: ref ? `Hora excedente ${ref.label}` : `Hora excedente ${power}`,
        valorUnitario: ref?.valorUnitario ?? 0,
      });
    },
    [updateHoraExcedente],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          Horas Excedentes
        </h3>
        <div className="flex items-center gap-2">
          {missingPowers.length > 0 && (
            <button
              type="button"
              onClick={handleAutoSuggest}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-200 dark:hover:bg-amber-900/50 active:scale-[0.97] transition-all duration-150"
            >
              <Zap className="w-4 h-4" />
              Sugerir valores ({missingPowers.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => addHoraExcedente()}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-egen-navy text-white rounded-lg hover:bg-egen-navy/90 active:scale-[0.97] transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Valores de referência para horas excedentes. Não são somados ao total do orçamento.
      </p>

      {/* Items List */}
      <AnimatePresence mode="popLayout">
        {horasExcedentes.length === 0 && missingPowers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma hora excedente configurada</p>
            <p className="text-xs mt-1">
              Selecione geradores em "Periódico" para receber sugestões automáticas.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {horasExcedentes.map((hora) => (
              <motion.div
                key={hora.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-end">
                  {/* Descrição */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={hora.descricao}
                      onChange={(e) => updateHoraExcedente(hora.id, { descricao: e.target.value })}
                      placeholder="Ex: Hora excedente 140KVA"
                      className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>

                  {/* Potência — Select dropdown */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Potência
                    </label>
                    <Select
                      value={hora.potenciaKva}
                      onChange={(value) => handlePowerChange(hora.id, value)}
                    >
                      <option value="">Selecione...</option>
                      {powerOptions.map((power) => (
                        <option key={power} value={power}>{power}</option>
                      ))}
                    </Select>
                  </div>

                  {/* Valor Unitário */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Valor Unitário
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-gray-500">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={hora.valorUnitario}
                        onChange={(e) => updateHoraExcedente(hora.id, { valorUnitario: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-10 pr-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Observações + Delete */}
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Observações
                      </label>
                      <input
                        type="text"
                        value={hora.observacoes}
                        onChange={(e) => updateHoraExcedente(hora.id, { observacoes: e.target.value })}
                        placeholder="por equipamento"
                        className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-egen-navy/30 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeHoraExcedente(hora.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg active:scale-90 transition-all duration-150 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {missingPowers.length > 0 && horasExcedentes.length > 0 && (
              <div className="text-center py-3">
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                  {missingPowers.length} potência{missingPowers.length !== 1 ? 's' : ''} sem valor de hora excedente
                </p>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ExceedingHoursEditor;
