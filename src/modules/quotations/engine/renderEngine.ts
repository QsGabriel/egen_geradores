/**
 * EGEN System - Render Engine
 * Renderiza documentos substituindo placeholders por dados reais
 */

import type {
  SalesQuotation,
  ProposalEquipamento,
  ProposalServico,
  ProposalHoraExcedente,
} from '../types/proposal';
import {
  PLACEHOLDERS,
  DOCUMENT_TITLES,
  getTemplateForType,
  assembleTemplate,
  type TemplateConfig,
} from './templateEngine';
import {
  FranquiaHorasLabels,
  PeriodoLocacaoLabels,
  DocumentTipoLabels,
} from '../types/proposal';

// ============================================
// FORMATTERS
// ============================================

/**
 * Formata valor em BRL
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata data para exibição
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formata número para exibição
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0';
  return new Intl.NumberFormat('pt-BR').format(value);
}

// ============================================
// ROW RENDERERS
// ============================================

/**
 * Renderiza uma linha de equipamento
 */
function renderEquipamentoRow(eq: ProposalEquipamento): string {
  const extras: string[] = [];
  
  if (eq.incluiCabo380v) {
    extras.push(`+ Kit Cabos 380V: ${formatCurrency(eq.valorCabo380v)}`);
  }
  if (eq.incluiCabo220v) {
    extras.push(`+ Kit Cabos 220V: ${formatCurrency(eq.valorCabo220v)}`);
  }
  if (eq.incluiManutencao) {
    extras.push(`+ Manutenção Prev.: ${formatCurrency(eq.valorManutencao)}`);
  }
  
  const descricaoCompleta = extras.length > 0
    ? `${eq.descricao}<br><small class="extras">${extras.join('<br>')}</small>`
    : eq.descricao;
  
  const observacoes = eq.observacoes
    ? `<br><small class="obs">${eq.observacoes}</small>`
    : '';
  
  return `
    <tr class="item-row">
      <td class="col-desc">${descricaoCompleta}${observacoes}</td>
      <td class="col-qty">${eq.quantidade}</td>
      <td class="col-franquia">${FranquiaHorasLabels[eq.franquiaHoras]}</td>
      <td class="col-periodo">${PeriodoLocacaoLabels[eq.periodoLocacao]}</td>
      <td class="col-unit">${formatCurrency(eq.valorUnitario)}</td>
      <td class="col-total">${formatCurrency(eq.valorTotal)}</td>
    </tr>
  `;
}

/**
 * Renderiza todas as linhas de equipamentos
 */
function renderEquipamentosTable(equipamentos: ProposalEquipamento[]): string {
  if (!equipamentos || equipamentos.length === 0) {
    return `
      <tr class="empty-row">
        <td colspan="6" class="empty-message">Nenhum equipamento adicionado</td>
      </tr>
    `;
  }
  
  return equipamentos.map(renderEquipamentoRow).join('\n');
}

/**
 * Renderiza uma linha de serviço
 */
function renderServicoRow(serv: ProposalServico): string {
  const observacoes = serv.observacoes
    ? `<br><small class="obs">${serv.observacoes}</small>`
    : '';
  
  return `
    <tr class="item-row">
      <td class="col-desc">${serv.descricao}${observacoes}</td>
      <td class="col-qty">${serv.quantidade}</td>
      <td class="col-unit">${formatCurrency(serv.valorUnitario)}</td>
      <td class="col-total">${formatCurrency(serv.valorTotal)}</td>
    </tr>
  `;
}

/**
 * Renderiza todas as linhas de serviços
 */
function renderServicosTable(servicos: ProposalServico[]): string {
  if (!servicos || servicos.length === 0) {
    return `
      <tr class="empty-row">
        <td colspan="4" class="empty-message">Nenhum serviço adicionado</td>
      </tr>
    `;
  }
  
  return servicos.map(renderServicoRow).join('\n');
}

/**
 * Renderiza uma linha de hora excedente
 */
function renderHoraExcedenteRow(hora: ProposalHoraExcedente): string {
  return `
    <tr class="item-row">
      <td class="col-desc">${hora.descricao} ${hora.potenciaKva}</td>
      <td class="col-unit">${formatCurrency(hora.valorUnitario)}</td>
      <td class="col-obs">${hora.observacoes || '-'}</td>
    </tr>
  `;
}

/**
 * Renderiza todas as linhas de horas excedentes
 */
function renderHorasExcedentesTable(horas: ProposalHoraExcedente[]): string {
  if (!horas || horas.length === 0) {
    return `
      <tr class="empty-row">
        <td colspan="3" class="empty-message">Valores conforme tabela padrão</td>
      </tr>
    `;
  }
  
  return horas.map(renderHoraExcedenteRow).join('\n');
}

// ============================================
// PLACEHOLDER REPLACEMENT
// ============================================

interface PlaceholderValues {
  [key: string]: string;
}

/**
 * Extrai todos os valores de placeholders de uma cotação
 */
function extractPlaceholderValues(quotation: SalesQuotation): PlaceholderValues {
  const { cliente, condicoes } = quotation;
  
  return {
    // Documento
    [PLACEHOLDERS.DOCUMENT_ID]: quotation.documentId || '-',
    [PLACEHOLDERS.DOCUMENT_TIPO]: quotation.tipo,
    [PLACEHOLDERS.DOCUMENT_TIPO_TITULO]: DOCUMENT_TITLES[quotation.tipo],
    [PLACEHOLDERS.DATA_EMISSAO]: formatDate(quotation.dataEmissao),
    [PLACEHOLDERS.VALIDADE]: formatDate(quotation.validade),
    
    // Cliente
    [PLACEHOLDERS.CLIENTE_NOME]: cliente.nome || '-',
    [PLACEHOLDERS.CLIENTE_RESPONSAVEL]: cliente.responsavel || '-',
    [PLACEHOLDERS.CLIENTE_EMAIL]: cliente.email || '-',
    [PLACEHOLDERS.CLIENTE_TELEFONE]: cliente.telefone || '-',
    [PLACEHOLDERS.CLIENTE_DOCUMENTO]: cliente.documento || '-',
    [PLACEHOLDERS.CLIENTE_ENDERECO]: cliente.endereco || '-',
    [PLACEHOLDERS.CLIENTE_CIDADE_UF]: cliente.cidadeUf || '-',
    
    // Tabelas
    [PLACEHOLDERS.EQUIPAMENTOS_TABLE]: renderEquipamentosTable(quotation.equipamentos),
    [PLACEHOLDERS.SERVICOS_TABLE]: renderServicosTable(quotation.servicos),
    [PLACEHOLDERS.HORAS_EXCEDENTES_TABLE]: renderHorasExcedentesTable(quotation.horasExcedentes),
    
    // Totais
    [PLACEHOLDERS.TOTAL_EQUIPAMENTOS]: formatCurrency(quotation.totalEquipamentos),
    [PLACEHOLDERS.TOTAL_SERVICOS]: formatCurrency(quotation.totalServicos),
    [PLACEHOLDERS.TOTAL_GERAL]: formatCurrency(quotation.totalGeral),
    [PLACEHOLDERS.DESCONTO_PERCENT]: formatNumber(quotation.descontoPercent),
    [PLACEHOLDERS.DESCONTO_VALOR]: formatCurrency(quotation.descontoValor),
    [PLACEHOLDERS.TOTAL_FINAL]: formatCurrency(quotation.totalComDesconto),
    
    // Condições
    [PLACEHOLDERS.LOCAL_UTILIZACAO]: condicoes.localUtilizacao || '-',
    [PLACEHOLDERS.FORMA_PAGAMENTO]: condicoes.formaPagamento || '-',
    [PLACEHOLDERS.FATURAMENTO]: condicoes.faturamento || '-',
    [PLACEHOLDERS.PRAZO_ENTREGA]: condicoes.prazoEntrega || '-',
    [PLACEHOLDERS.VALIDADE_PROPOSTA]: condicoes.validadeProposta || '-',
    [PLACEHOLDERS.INICIO_COBRANCA]: condicoes.inicioCobranca || '-',
    [PLACEHOLDERS.FINAL_COBRANCA]: condicoes.finalCobranca || '-',
    [PLACEHOLDERS.PERIODO_MINIMO]: condicoes.periodoMinimo || '-',
    [PLACEHOLDERS.PERIODO_ORCADO]: condicoes.periodoOrcado || '-',
    [PLACEHOLDERS.TENSAO]: condicoes.tensao || '-',
    [PLACEHOLDERS.EMISSAO_ART]: condicoes.emissaoArt || '-',
    [PLACEHOLDERS.TRANSPORTE_ENVIO]: condicoes.transporteEnvio || '-',
    [PLACEHOLDERS.TRANSPORTE_RETIRADA]: condicoes.transporteRetirada || '-',
    [PLACEHOLDERS.CARGA_MOBILIZACAO]: condicoes.cargaDescargaMobilizacao || '-',
    [PLACEHOLDERS.CARGA_DESMOBILIZACAO]: condicoes.cargaDescargaDesmobilizacao || '-',
    [PLACEHOLDERS.INSTALACAO]: condicoes.instalacao || '-',
    [PLACEHOLDERS.MANUTENCAO_PREV]: condicoes.manutencaoPreventiva || '-',
    [PLACEHOLDERS.COMBUSTIVEL]: condicoes.combustivel || '-',
    [PLACEHOLDERS.SEGURO]: condicoes.seguro || '-',
    [PLACEHOLDERS.IMPOSTOS]: condicoes.impostos || '-',
    [PLACEHOLDERS.TELEMETRIA]: condicoes.telemetria || '-',
    [PLACEHOLDERS.DIMENSIONAMENTO]: condicoes.dimensionamento || '-',
    [PLACEHOLDERS.DEFINICAO_ESCOPO]: condicoes.definicaoEscopo || '-',
  };
}

/**
 * Substitui todos os placeholders no template
 */
function replacePlaceholders(template: string, values: PlaceholderValues): string {
  let result = template;
  
  for (const [placeholder, value] of Object.entries(values)) {
    // Escape special regex characters in placeholder
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedPlaceholder, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}

// ============================================
// MAIN RENDER FUNCTIONS
// ============================================

export interface RenderOptions {
  templateConfig?: Partial<TemplateConfig>;
  includeStyles?: boolean;
  printMode?: boolean;
}

/**
 * Renderiza o documento completo
 */
export function renderDocument(
  quotation: SalesQuotation,
  options: RenderOptions = {}
): string {
  const { templateConfig, includeStyles = false, printMode = false } = options;
  
  // Get template based on document type
  const template = templateConfig
    ? assembleTemplate(templateConfig)
    : getTemplateForType(quotation.tipo);
  
  // Extract values
  const values = extractPlaceholderValues(quotation);
  
  // Replace placeholders
  const renderedContent = replacePlaceholders(template, values);
  
  // Wrap with print styles if needed
  if (includeStyles || printMode) {
    return wrapWithStyles(renderedContent, printMode);
  }
  
  return renderedContent;
}

/**
 * Renderiza apenas uma seção específica do documento
 */
export function renderSection(
  quotation: SalesQuotation,
  section: 'equipamentos' | 'servicos' | 'horas' | 'condicoes' | 'totais'
): string {
  const values = extractPlaceholderValues(quotation);
  
  switch (section) {
    case 'equipamentos':
      return renderEquipamentosTable(quotation.equipamentos);
    case 'servicos':
      return renderServicosTable(quotation.servicos);
    case 'horas':
      return renderHorasExcedentesTable(quotation.horasExcedentes);
    case 'condicoes':
      return `
        <div class="condicoes-preview">
          <p><strong>Local:</strong> ${values[PLACEHOLDERS.LOCAL_UTILIZACAO]}</p>
          <p><strong>Pagamento:</strong> ${values[PLACEHOLDERS.FORMA_PAGAMENTO]}</p>
          <p><strong>Entrega:</strong> ${values[PLACEHOLDERS.PRAZO_ENTREGA]}</p>
          <p><strong>Válido até:</strong> ${values[PLACEHOLDERS.VALIDADE]}</p>
        </div>
      `;
    case 'totais':
      return `
        <div class="totais-preview">
          <p>Equipamentos: ${values[PLACEHOLDERS.TOTAL_EQUIPAMENTOS]}</p>
          <p>Serviços: ${values[PLACEHOLDERS.TOTAL_SERVICOS]}</p>
          <p><strong>Total: ${values[PLACEHOLDERS.TOTAL_FINAL]}</strong></p>
        </div>
      `;
    default:
      return '';
  }
}

/**
 * Wrapper com estilos de impressão
 */
function wrapWithStyles(content: string, printMode: boolean): string {
  const printClass = printMode ? 'print-mode' : '';
  
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Documento EGEN</title>
      <link rel="stylesheet" href="/proposal-print.css" />
    </head>
    <body class="${printClass}">
      ${content}
    </body>
    </html>
  `;
}

// ============================================
// EXPORT
// ============================================

export const RenderEngine = {
  render: renderDocument,
  renderSection,
  formatCurrency,
  formatDate,
  formatNumber,
};

export default RenderEngine;
