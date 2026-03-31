/**
 * EGEN System - Conditions Editor
 * Componente para edição das condições comerciais
 */
import React from 'react';
import { Settings, FileText, Truck, Wrench, Shield, Clock } from 'lucide-react';
import { useQuotationStore, selectCondicoes } from '../../stores/quotationStore';
import type { CondicoesComerciais } from '../../types/proposal';

// ============================================
// TYPES
// ============================================

interface ConditionsEditorProps {
  className?: string;
}

interface ConditionFieldProps {
  label: string;
  field: keyof CondicoesComerciais;
  value: string;
  onChange: (field: keyof CondicoesComerciais, value: string) => void;
  type?: 'text' | 'select' | 'textarea';
  options?: string[];
  placeholder?: string;
}

// ============================================
// CONDITION FIELD COMPONENT
// ============================================

function ConditionField({
  label,
  field,
  value,
  onChange,
  type = 'text',
  options = [],
  placeholder,
}: ConditionFieldProps) {
  const baseInputClass = `
    w-full px-3 py-2 text-sm 
    bg-gray-50 dark:bg-gray-900 
    border border-gray-200 dark:border-gray-700 
    rounded-lg focus:outline-none 
    focus:ring-2 focus:ring-egen-navy/30 dark:focus:ring-egen-yellow/30
    transition-colors
  `;

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
        {label}
      </label>
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          className={baseInputClass}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder}
          rows={2}
          className={baseInputClass}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          placeholder={placeholder}
          className={baseInputClass}
        />
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ConditionsEditor({ className = '' }: ConditionsEditorProps) {
  const condicoes = useQuotationStore(selectCondicoes);
  const { updateCondicoes } = useQuotationStore();

  if (!condicoes) return null;

  const handleChange = (field: keyof CondicoesComerciais, value: string) => {
    updateCondicoes(field, value);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-egen-navy dark:text-egen-yellow" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Condições Comerciais
        </h3>
      </div>

      {/* Section: Geral */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Informações Gerais
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ConditionField
            label="Local de Utilização"
            field="localUtilizacao"
            value={condicoes.localUtilizacao}
            onChange={handleChange}
            placeholder="Ex: Obra em São Paulo/SP"
          />
          <ConditionField
            label="Forma de Pagamento"
            field="formaPagamento"
            value={condicoes.formaPagamento}
            onChange={handleChange}
            type="select"
            options={[
              'Boleto - 15 dias',
              'Boleto - 30 dias',
              'Boleto - 28/35/42 dias',
              'Pix',
              'Cartão de Crédito',
              'Depósito Bancário',
            ]}
          />
          <ConditionField
            label="Faturamento"
            field="faturamento"
            value={condicoes.faturamento}
            onChange={handleChange}
            type="select"
            options={[
              'Data da saída do pátio',
              'Data de início de utilização',
              'No ato da entrega',
              'Pós-fixado mensal',
            ]}
          />
          <ConditionField
            label="Prazo de Entrega"
            field="prazoEntrega"
            value={condicoes.prazoEntrega}
            onChange={handleChange}
            placeholder="Ex: 3 dias úteis"
          />
          <ConditionField
            label="Validade da Proposta"
            field="validadeProposta"
            value={condicoes.validadeProposta}
            onChange={handleChange}
            type="select"
            options={['7 dias', '10 dias', '15 dias', '30 dias']}
          />
          <ConditionField
            label="Tensão"
            field="tensao"
            value={condicoes.tensao}
            onChange={handleChange}
            type="select"
            options={['380/220V', '440/254V', '220/127V', 'A definir']}
          />
        </div>
      </div>

      {/* Section: Período e Cobrança */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Período e Cobrança
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ConditionField
            label="Início da Cobrança"
            field="inicioCobranca"
            value={condicoes.inicioCobranca}
            onChange={handleChange}
            type="select"
            options={[
              'Data da saída dos equipamentos',
              'Data de início de utilização',
              'Data de entrega',
            ]}
          />
          <ConditionField
            label="Término da Cobrança"
            field="finalCobranca"
            value={condicoes.finalCobranca}
            onChange={handleChange}
            type="select"
            options={[
              'Data do retorno',
              'Data de desmobilização',
              'Data de desligamento',
            ]}
          />
          <ConditionField
            label="Período Mínimo"
            field="periodoMinimo"
            value={condicoes.periodoMinimo}
            onChange={handleChange}
            type="select"
            options={['7 dias', '15 dias', '30 dias', 'Sem mínimo']}
          />
          <ConditionField
            label="Período Orçado"
            field="periodoOrcado"
            value={condicoes.periodoOrcado}
            onChange={handleChange}
            type="select"
            options={['Semanal', 'Quinzenal', 'Mensal', 'Trimestral']}
          />
        </div>
      </div>

      {/* Section: Transporte e Instalação */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <Truck className="w-4 h-4" />
          Transporte e Instalação
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ConditionField
            label="Transporte (Envio)"
            field="transporteEnvio"
            value={condicoes.transporteEnvio}
            onChange={handleChange}
            type="select"
            options={['Orçado', 'Incluso', 'Por conta do cliente', 'CIF', 'FOB']}
          />
          <ConditionField
            label="Transporte (Retirada)"
            field="transporteRetirada"
            value={condicoes.transporteRetirada}
            onChange={handleChange}
            type="select"
            options={['Orçado', 'Incluso', 'Por conta do cliente', 'CIF', 'FOB']}
          />
          <ConditionField
            label="Carga/Descarga (Mobilização)"
            field="cargaDescargaMobilizacao"
            value={condicoes.cargaDescargaMobilizacao}
            onChange={handleChange}
            type="select"
            options={['Orçado', 'Incluso', 'Por conta do cliente', 'Não orçado']}
          />
          <ConditionField
            label="Carga/Descarga (Desmobilização)"
            field="cargaDescargaDesmobilizacao"
            value={condicoes.cargaDescargaDesmobilizacao}
            onChange={handleChange}
            type="select"
            options={['Orçado', 'Incluso', 'Por conta do cliente', 'Não orçado']}
          />
          <ConditionField
            label="Instalação"
            field="instalacao"
            value={condicoes.instalacao}
            onChange={handleChange}
            type="select"
            options={['Sim', 'Não', 'Orçado', 'Não incluso']}
          />
        </div>
      </div>

      {/* Section: Manutenção e Outros */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Manutenção e Outros
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ConditionField
            label="Manutenção Preventiva"
            field="manutencaoPreventiva"
            value={condicoes.manutencaoPreventiva}
            onChange={handleChange}
            type="select"
            options={['Incluso', 'Orçado sob demanda', 'Não incluso', 'A cada 250h']}
          />
          <ConditionField
            label="Combustível"
            field="combustivel"
            value={condicoes.combustivel}
            onChange={handleChange}
            type="select"
            options={['Não Incluso', 'Incluso', 'Por conta do cliente']}
          />
          <ConditionField
            label="Emissão de ART"
            field="emissaoArt"
            value={condicoes.emissaoArt}
            onChange={handleChange}
            type="select"
            options={['Não incluso', 'Incluso', 'Sob demanda']}
          />
          <ConditionField
            label="Telemetria"
            field="telemetria"
            value={condicoes.telemetria}
            onChange={handleChange}
            type="select"
            options={['Não incluso', 'Incluso', 'Opcional']}
          />
          <ConditionField
            label="Dimensionamento"
            field="dimensionamento"
            value={condicoes.dimensionamento}
            onChange={handleChange}
            type="select"
            options={['Locatária', 'EGEN', 'Conjunto']}
          />
          <ConditionField
            label="Definição de Escopo"
            field="definicaoEscopo"
            value={condicoes.definicaoEscopo}
            onChange={handleChange}
            type="select"
            options={['Locatária', 'EGEN', 'Conjunto']}
          />
        </div>
      </div>

      {/* Section: Seguros e Impostos */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Seguros e Impostos
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConditionField
            label="Seguro"
            field="seguro"
            value={condicoes.seguro}
            onChange={handleChange}
            type="select"
            options={['Incluso', 'Não Incluso', 'Opcional']}
          />
          <ConditionField
            label="Impostos"
            field="impostos"
            value={condicoes.impostos}
            onChange={handleChange}
            type="select"
            options={['Incluso', 'Não Incluso']}
          />
        </div>
      </div>
    </div>
  );
}

export default ConditionsEditor;
