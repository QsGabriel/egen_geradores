/**
 * EGEN System - Render Engine
 * Renderiza documentos substituindo placeholders por dados reais
 */

import type {
  SalesQuotation,
  ProposalItemPeriodico,
  ProposalItemSpot,
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
 * Renderiza uma linha de item periódico (Equipamentos e Acessórios)
 */
function renderItemPeriodicoRow(item: ProposalItemPeriodico, index: number): string {
  const observacoes = item.observacoes
    ? `<br><small class="obs">${item.observacoes}</small>`
    : '';

  return `
    <tr class="item-row">
      <td class="col-item">${index}</td>
      <td class="col-desc">${item.descricao}${observacoes}</td>
      <td class="col-qty">${item.quantidade}</td>
      <td class="col-unit">${formatCurrency(item.valorUnitario)}</td>
      <td class="col-total">${formatCurrency(item.valorTotal)}</td>
      <td class="col-franquia">${FranquiaHorasLabels[item.franquiaHoras]}</td>
    </tr>
  `;
}

/**
 * Renderiza todas as linhas de itens periódicos
 */
function renderItensPeriodicosTable(itens: ProposalItemPeriodico[]): string {
  if (!itens || itens.length === 0) {
    return `
      <tr class="empty-row">
        <td colspan="6" class="empty-message">Nenhum equipamento ou acessório adicionado</td>
      </tr>
    `;
  }

  return itens.map((item, i) => renderItemPeriodicoRow(item, i + 1)).join('\n');
}

/**
 * Renderiza uma linha de item spot (Serviços)
 */
function renderItemSpotRow(item: ProposalItemSpot): string {
  const observacoes = item.observacoes
    ? `<br><small class="obs">${item.observacoes}</small>`
    : '';

  return `
    <tr class="item-row">
      <td class="col-desc">${item.descricao}${observacoes}</td>
      <td class="col-qty">${item.quantidade}</td>
      <td class="col-unit">${formatCurrency(item.valorUnitario)}</td>
      <td class="col-total">${formatCurrency(item.valorTotal)}</td>
    </tr>
  `;
}

/**
 * Renderiza todas as linhas de itens spot
 */
function renderItensSpotTable(itens: ProposalItemSpot[]): string {
  if (!itens || itens.length === 0) {
    return `
      <tr class="empty-row">
        <td colspan="4" class="empty-message">Nenhum serviço adicionado</td>
      </tr>
    `;
  }

  return itens.map(renderItemSpotRow).join('\n');
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
// TOTALS TOGGLE HELPERS (Opção A / Opção B)
// ============================================

/**
 * Opção A: subtotal row inside the periodic items table footer
 */
function renderSubtotalPeriodicosRow(total: number, show: boolean): string {
  if (!show) return '';
  return `
    <tr class="subtotal-row">
      <td colspan="4" class="subtotal-label">Total Equipamentos e Acessórios:</td>
      <td class="col-total subtotal-value">${formatCurrency(total)}</td>
      <td></td>
    </tr>
  `;
}

/**
 * Opção A: subtotal row inside the spot items table footer
 */
function renderSubtotalSpotRow(total: number, show: boolean): string {
  if (!show) return '';
  return `
    <tr class="subtotal-row">
      <td colspan="3" class="subtotal-label">Total Serviços:</td>
      <td class="col-total subtotal-value">${formatCurrency(total)}</td>
    </tr>
  `;
}

/**
 * Opção B: unified total block shown between services table and horas excedentes
 */
function renderSomaGeralSection(totalGeral: number, show: boolean): string {
  if (!show) return '';
  return `
    <div class="soma-geral-box">
      <span class="soma-geral-label">Subtotal Geral (Equipamentos + Serviços):</span>
      <span class="soma-geral-value">${formatCurrency(totalGeral)}</span>
    </div>
  `;
}

/**
 * Renderiza o bloco de observações gerais (visível no documento final)
 */
function renderObservacoesGerais(obs: string): string {
  if (!obs || !obs.trim()) return '';
  return `
    <div class="observacoes-box">
      <h3 class="subsection-title">Observações</h3>
      <p class="observacoes-text">${obs.replace(/\n/g, '<br>')}</p>
    </div>
  `;
}

/**
 * Renderiza o bloco de observações das condições comerciais
 */
function renderCondicoesObservacoes(obs: string): string {
  if (!obs || !obs.trim()) return '';
  return `
    <div class="observacoes-box condicoes-obs">
      <h3 class="subsection-title">Observações das Condições</h3>
      <p class="observacoes-text">${obs.replace(/\n/g, '<br>')}</p>
    </div>
  `;
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
    [PLACEHOLDERS.CAPA_URL]: '/CAPA.png',
    
    // Cliente
    [PLACEHOLDERS.CLIENTE_NOME]: cliente.nome || '-',
    [PLACEHOLDERS.CLIENTE_RESPONSAVEL]: cliente.responsavel || '-',
    [PLACEHOLDERS.CLIENTE_EMAIL]: cliente.email || '-',
    [PLACEHOLDERS.CLIENTE_TELEFONE]: cliente.telefone || '-',
    [PLACEHOLDERS.CLIENTE_DOCUMENTO]: cliente.documento || '-',
    [PLACEHOLDERS.CLIENTE_ENDERECO]: cliente.endereco || '-',
    [PLACEHOLDERS.CLIENTE_CIDADE_UF]: cliente.cidadeUf || '-',
    
    // Tabelas
    [PLACEHOLDERS.ITENS_PERIODICOS_TABLE]: renderItensPeriodicosTable(quotation.itensPeriodicos),
    [PLACEHOLDERS.ITENS_SPOT_TABLE]: renderItensSpotTable(quotation.itensSpot),
    [PLACEHOLDERS.HORAS_EXCEDENTES_TABLE]: renderHorasExcedentesTable(quotation.horasExcedentes),
    
    // Totais
    [PLACEHOLDERS.TOTAL_PERIODICOS]: formatCurrency(quotation.totalPeriodicos),
    [PLACEHOLDERS.TOTAL_SPOT]: formatCurrency(quotation.totalSpot),
    [PLACEHOLDERS.TOTAL_GERAL]: formatCurrency(quotation.totalGeral),
    [PLACEHOLDERS.DESCONTO_PERCENT]: formatNumber(quotation.descontoPercent),
    [PLACEHOLDERS.DESCONTO_VALOR]: formatCurrency(quotation.descontoValor),
    [PLACEHOLDERS.TOTAL_FINAL]: formatCurrency(quotation.totalComDesconto),
    [PLACEHOLDERS.VALOR_ANUAL]: formatCurrency(quotation.totalComDesconto),
    [PLACEHOLDERS.VALOR_MENSAL]: formatCurrency((quotation.totalComDesconto || 0) / 12),
    
    // Toggle: subtotals per table (Opção A) vs unified total (Opção B)
    [PLACEHOLDERS.SUBTOTAL_PERIODICOS_ROW]: renderSubtotalPeriodicosRow(
      quotation.totalPeriodicos,
      quotation.exibirTotaisPorTabela,
    ),
    [PLACEHOLDERS.SUBTOTAL_SPOT_ROW]: renderSubtotalSpotRow(
      quotation.totalSpot,
      quotation.exibirTotaisPorTabela,
    ),
    [PLACEHOLDERS.SOMA_GERAL_SECTION]: renderSomaGeralSection(
      quotation.totalGeral,
      !quotation.exibirTotaisPorTabela,
    ),
    
    // Observações
    [PLACEHOLDERS.OBSERVACOES_GERAIS]: renderObservacoesGerais(quotation.observacoesGerais),
    [PLACEHOLDERS.CONDICOES_OBSERVACOES]: renderCondicoesObservacoes(quotation.condicoes.observacoes ?? ''),
    
    // Condições
    [PLACEHOLDERS.LOCAL_UTILIZACAO]: condicoes.localUtilizacao || '-',
    [PLACEHOLDERS.FORMA_PAGAMENTO]: condicoes.formaPagamento || '-',
    [PLACEHOLDERS.PRAZO_PAGAMENTO]: condicoes.prazoPagamento || '-',
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
      return renderItensPeriodicosTable(quotation.itensPeriodicos);
    case 'servicos':
      return renderItensSpotTable(quotation.itensSpot);
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
          <p>Periódicos: ${values[PLACEHOLDERS.TOTAL_PERIODICOS]}</p>
          <p>Spot: ${values[PLACEHOLDERS.TOTAL_SPOT]}</p>
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
