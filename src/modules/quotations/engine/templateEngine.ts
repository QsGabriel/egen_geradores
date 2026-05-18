/**
 * EGEN System - Template Engine
 * Define a estrutura base dos templates de documentos
 */

import type { DocumentTipo } from '../types/proposal';

// ============================================
// TEMPLATE PLACEHOLDERS
// ============================================

export const PLACEHOLDERS = {
  // Documento
  DOCUMENT_ID: '{{documento.id}}',
  DOCUMENT_TIPO: '{{documento.tipo}}',
  DOCUMENT_TIPO_TITULO: '{{documento.tipoTitulo}}',
  DATA_EMISSAO: '{{documento.dataEmissao}}',
  VALIDADE: '{{documento.validade}}',
  
  // Cliente
  CLIENTE_NOME: '{{cliente.nome}}',
  CLIENTE_RESPONSAVEL: '{{cliente.responsavel}}',
  CLIENTE_EMAIL: '{{cliente.email}}',
  CLIENTE_TELEFONE: '{{cliente.telefone}}',
  CLIENTE_DOCUMENTO: '{{cliente.documento}}',
  CLIENTE_ENDERECO: '{{cliente.endereco}}',
  CLIENTE_CIDADE_UF: '{{cliente.cidadeUf}}',
  
  // Tabelas
  ITENS_PERIODICOS_TABLE: '{{itensPeriodicos.table}}',
  ITENS_SPOT_TABLE: '{{itensSpot.table}}',
  HORAS_EXCEDENTES_TABLE: '{{horasExcedentes.table}}',
  
  // Totais
  TOTAL_PERIODICOS: '{{totais.periodicos}}',
  TOTAL_SPOT: '{{totais.spot}}',
  TOTAL_GERAL: '{{totais.geral}}',
  DESCONTO_PERCENT: '{{totais.descontoPercent}}',
  DESCONTO_VALOR: '{{totais.descontoValor}}',
  TOTAL_FINAL: '{{totais.final}}',
  SUBTOTAL_PERIODICOS_ROW: '{{totais.subtotalPeriodicosRow}}',
  SUBTOTAL_SPOT_ROW: '{{totais.subtotalSpotRow}}',
  SOMA_GERAL_SECTION: '{{totais.somaGeralSection}}',
  VALOR_ANUAL: '{{totais.valorAnual}}',
  VALOR_MENSAL: '{{totais.valorMensal}}',
  
  // Observações
  OBSERVACOES_GERAIS: '{{observacoesGerais}}',
  
  // Condições
  CONDICOES_SECTION: '{{condicoes.section}}',
  LOCAL_UTILIZACAO: '{{condicoes.localUtilizacao}}',
  FORMA_PAGAMENTO: '{{condicoes.formaPagamento}}',
  PRAZO_PAGAMENTO: '{{condicoes.prazoPagamento}}',
  FATURAMENTO: '{{condicoes.faturamento}}',
  PRAZO_ENTREGA: '{{condicoes.prazoEntrega}}',
  VALIDADE_PROPOSTA: '{{condicoes.validadeProposta}}',
  INICIO_COBRANCA: '{{condicoes.inicioCobranca}}',
  FINAL_COBRANCA: '{{condicoes.finalCobranca}}',
  PERIODO_MINIMO: '{{condicoes.periodoMinimo}}',
  PERIODO_ORCADO: '{{condicoes.periodoOrcado}}',
  TENSAO: '{{condicoes.tensao}}',
  EMISSAO_ART: '{{condicoes.emissaoArt}}',
  TRANSPORTE_ENVIO: '{{condicoes.transporteEnvio}}',
  TRANSPORTE_RETIRADA: '{{condicoes.transporteRetirada}}',
  CARGA_MOBILIZACAO: '{{condicoes.cargaDescargaMobilizacao}}',
  CARGA_DESMOBILIZACAO: '{{condicoes.cargaDescargaDesmobilizacao}}',
  INSTALACAO: '{{condicoes.instalacao}}',
  MANUTENCAO_PREV: '{{condicoes.manutencaoPreventiva}}',
  COMBUSTIVEL: '{{condicoes.combustivel}}',
  SEGURO: '{{condicoes.seguro}}',
  IMPOSTOS: '{{condicoes.impostos}}',
  TELEMETRIA: '{{condicoes.telemetria}}',
  DIMENSIONAMENTO: '{{condicoes.dimensionamento}}',
  DEFINICAO_ESCOPO: '{{condicoes.definicaoEscopo}}',
  CONDICOES_OBSERVACOES: '{{condicoes.observacoes}}',
} as const;

// ============================================
// DOCUMENT TITLE BY TYPE
// ============================================

export const DOCUMENT_TITLES: Record<DocumentTipo, string> = {
  proposta: 'PROPOSTA DE LOCAÇÃO',
  orcamento: 'ORÇAMENTO',
  contrato: 'CONTRATO DE LOCAÇÃO',
};

// ============================================
// HTML TEMPLATE SECTIONS
// ============================================

/**
 * Capa do documento (Página 1)
 */
export const TEMPLATE_COVER = `
<section class="page cover-page">
  <img src="/CAPA.png" alt="Capa EGEN" class="cover-background" />
  <div class="cover-content">
    <h1 class="cover-title">${PLACEHOLDERS.DOCUMENT_TIPO_TITULO}</h1>
    <div class="cover-subtitle">
      <span class="cover-id">${PLACEHOLDERS.DOCUMENT_ID}</span>
    </div>
  </div>
</section>
<div class="html2pdf__page-break"></div>
`;

/**
 * Cabeçalho padrão das páginas
 */
export const TEMPLATE_HEADER = `
<header class="page-header">
  <div class="header-logo">
    <img src="/LOGO-DM.png" alt="EGEN Geradores" class="header-logo-img" onerror="this.style.visibility='hidden'" />
  </div>
  <div class="header-info">
    <div class="header-doc-id">${PLACEHOLDERS.DOCUMENT_ID}</div>
    <div class="header-date">Data: ${PLACEHOLDERS.DATA_EMISSAO}</div>
  </div>
  <div class="header-logo-right">
    <img src="/BRG-LOGO.png" alt="BRG" class="header-logo-img brg-logo" onerror="this.style.visibility='hidden'" />
  </div>
</header>
`;

/**
 * Seção de introdução com dados do cliente (Página 2)
 */
export const TEMPLATE_INTRO = `
<section class="page content-page">
  ${TEMPLATE_HEADER}
  
  <div class="client-section">
    <div class="client-section-title">DADOS DO CLIENTE</div>
    <div class="client-two-col">
      <div class="client-side locadora-side">
        <p class="client-side-label">Locadora:</p>
        <p class="client-side-name">EGEN Geradores</p>
        <div class="client-field-list">
          <div class="client-field">
            <span class="field-label">Site:</span>
            <span class="field-value">www.egengeradores.com.br</span>
          </div>
          <div class="client-field">
            <span class="field-label">E-mail:</span>
            <span class="field-value">contato@egengeradores.com.br</span>
          </div>
        </div>
      </div>
      <div class="client-side cliente-side">
        <p class="client-side-label">Cliente:</p>
        <p class="client-side-name">${PLACEHOLDERS.CLIENTE_NOME}</p>
        <div class="client-field-list">
          <div class="client-field">
            <span class="field-label">CNPJ/CPF:</span>
            <span class="field-value">${PLACEHOLDERS.CLIENTE_DOCUMENTO}</span>
          </div>
          <div class="client-field">
            <span class="field-label">Responsável:</span>
            <span class="field-value">${PLACEHOLDERS.CLIENTE_RESPONSAVEL}</span>
          </div>
          <div class="client-field">
            <span class="field-label">Telefone:</span>
            <span class="field-value">${PLACEHOLDERS.CLIENTE_TELEFONE}</span>
          </div>
          <div class="client-field">
            <span class="field-label">E-mail:</span>
            <span class="field-value">${PLACEHOLDERS.CLIENTE_EMAIL}</span>
          </div>
          <div class="client-field">
            <span class="field-label">Endereço:</span>
            <span class="field-value">${PLACEHOLDERS.CLIENTE_ENDERECO} – ${PLACEHOLDERS.CLIENTE_CIDADE_UF}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <div class="intro-section">
    <h2 class="section-title">INTRODUÇÃO</h2>
    <p>A <strong>EGEN Geradores</strong> é especializada em <strong>venda e locação</strong> de Grupos Geradores de Energia, entregando soluções completas e personalizadas para os mais diversos setores, como <strong>mineração</strong>, <strong>agronegócio</strong>, <strong>indústria</strong>, <strong>construção civil</strong> e <strong>comércio</strong>.</p>
    <p>Contamos com uma equipe de engenharia altamente capacitada, pronta para dimensionar e implementar sistemas de geração de energia com máxima eficiência e segurança.</p>
    <p>Fazemos parte de um dos maiores grupos do setor, o que nos permite acesso a uma ampla frota própria de geradores modernos e de alta performance.</p>
  </div>
  
  <div class="generator-image-wrapper">
    <img src="/GERADOR.png" alt="Gerador EGEN" class="generator-image" />
  </div>
  
  <div class="intro-continuation">
    <p>Nosso suporte técnico é ágil e atuante, garantindo atendimento rápido e eficaz em demandas programadas ou emergenciais.</p>
    <p>Com foco em qualidade, continuidade operacional e transparência, oferecemos energia sob medida para manter sua operação sempre em movimento.</p>
  </div>
</section>
`;

/**
 * Seção de Escopo de Fornecimento (Periódicos + Spot + Horas Excedentes)
 */
export const TEMPLATE_ESCOPO = `
<section class="page content-page">
  ${TEMPLATE_HEADER}
  
  <div class="escopo-section">
    <h2 class="section-title">ESCOPO DE FORNECIMENTO</h2>
    <p class="section-subtitle">Preços e condições comerciais de equipamentos e serviços:</p>
    
    <!-- TABLE 1: Equipamentos e Acessórios (Itens Periódicos) -->
    <h3 class="subsection-title">Equipamentos e Acessórios</h3>
    <table class="items-table break-inside-avoid">
      <thead>
        <tr>
          <th class="col-item">#</th>
          <th class="col-desc">Descrição</th>
          <th class="col-qty">Qtd.</th>
          <th class="col-unit">Valor Unitário</th>
          <th class="col-total">Valor Total</th>
          <th class="col-franquia">Franquia</th>
        </tr>
      </thead>
      <tbody>
        ${PLACEHOLDERS.ITENS_PERIODICOS_TABLE}
      </tbody>
      <tfoot>
        ${PLACEHOLDERS.SUBTOTAL_PERIODICOS_ROW}
      </tfoot>
    </table>

    <!-- TABLE 2: Serviços (Itens Spot) -->
    <h3 class="subsection-title">Serviços de outros:</h3>
    <table class="items-table break-inside-avoid">
      <thead>
        <tr>
          <th class="col-desc">Descrição</th>
          <th class="col-qty">Qtd.</th>
          <th class="col-unit">Valor Unitário</th>
          <th class="col-total">Valor Total</th>
        </tr>
      </thead>
      <tbody>
        ${PLACEHOLDERS.ITENS_SPOT_TABLE}
      </tbody>
      <tfoot>
        ${PLACEHOLDERS.SUBTOTAL_SPOT_ROW}
      </tfoot>
    </table>

    <!-- Soma Geral (Option B: unified total) -->
    ${PLACEHOLDERS.SOMA_GERAL_SECTION}

    <!-- TABLE 3: Horas Excedentes (separate, excluded from main totals) -->
    <h3 class="subsection-title">Horas Excedentes</h3>
    <p class="section-note">Os valores de horas excedentes não estão incluídos nos totais acima.</p>
    <table class="items-table compact break-inside-avoid">
      <thead>
        <tr>
          <th class="col-desc">Equipamento</th>
          <th class="col-unit">Valor/Hora</th>
          <th class="col-obs">Observações</th>
        </tr>
      </thead>
      <tbody>
        ${PLACEHOLDERS.HORAS_EXCEDENTES_TABLE}
      </tbody>
    </table>

    <!-- Desconto e Totais Finais -->
    <div class="totais-box break-inside-avoid">
      <div class="total-line desconto">
        <span class="total-label">Desconto (${PLACEHOLDERS.DESCONTO_PERCENT}%):</span>
        <span class="total-value">- ${PLACEHOLDERS.DESCONTO_VALOR}</span>
      </div>
      <div class="total-line valor-anual">
        <span class="total-label">VALOR ANUAL:</span>
        <span class="total-value">${PLACEHOLDERS.VALOR_ANUAL}</span>
      </div>
      <div class="total-line valor-mensal">
        <span class="total-label">VALOR MENSAL:</span>
        <span class="total-value">${PLACEHOLDERS.VALOR_MENSAL}</span>
      </div>
    </div>

    <!-- Observações Gerais -->
    ${PLACEHOLDERS.OBSERVACOES_GERAIS}
  </div>
</section>
`;

/**
 * Seção de condições comerciais (Página 5)
 */
export const TEMPLATE_CONDICOES = `
<section class="page content-page">
  ${TEMPLATE_HEADER}
  
  <div class="condicoes-section">
    <h2 class="section-title">CONDIÇÕES COMERCIAIS</h2>
    
    <div class="condicoes-grid break-inside-avoid">
      <div class="condicao-item">
        <span class="condicao-label">Local de Utilização:</span>
        <span class="condicao-value">${PLACEHOLDERS.LOCAL_UTILIZACAO}</span>
      </div>
      <div class="condicao-item">
        <span class="condicao-label">Forma de Pagamento:</span>
        <span class="condicao-value">${PLACEHOLDERS.FORMA_PAGAMENTO}</span>
      </div>
      <div class="condicao-item">
        <span class="condicao-label">Prazo de Pagamento:</span>
        <span class="condicao-value">${PLACEHOLDERS.PRAZO_PAGAMENTO}</span>
      </div>
      <div class="condicao-item">
        <span class="condicao-label">Faturamento:</span>
        <span class="condicao-value">${PLACEHOLDERS.FATURAMENTO}</span>
      </div>
      <div class="condicao-item">
        <span class="condicao-label">Prazo de Entrega:</span>
        <span class="condicao-value">${PLACEHOLDERS.PRAZO_ENTREGA}</span>
      </div>
      <div class="condicao-item">
        <span class="condicao-label">Validade da Proposta:</span>
        <span class="condicao-value">${PLACEHOLDERS.VALIDADE_PROPOSTA}</span>
      </div>
      <div class="condicao-item">
        <span class="condicao-label">Início da Cobrança:</span>
        <span class="condicao-value">${PLACEHOLDERS.INICIO_COBRANCA}</span>
      </div>
      <div class="condicao-item">
        <span class="condicao-label">Término da Cobrança:</span>
        <span class="condicao-value">${PLACEHOLDERS.FINAL_COBRANCA}</span>
      </div>
      <div class="condicao-item">
        <span class="condicao-label">Período Mínimo:</span>
        <span class="condicao-value">${PLACEHOLDERS.PERIODO_MINIMO}</span>
      </div>
      <div class="condicao-item">
        <span class="condicao-label">Período Orçado:</span>
        <span class="condicao-value">${PLACEHOLDERS.PERIODO_ORCADO}</span>
      </div>
      <div class="condicao-item">
        <span class="condicao-label">Tensão:</span>
        <span class="condicao-value">${PLACEHOLDERS.TENSAO}</span>
      </div>
    </div>
    
    <h3 class="subsection-title">RESPONSABILIDADES</h3>
    
    <table class="responsibilities-table break-inside-avoid">
      <thead>
        <tr>
          <th>Item</th>
          <th>Responsabilidade</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Emissão de ART</td>
          <td>${PLACEHOLDERS.EMISSAO_ART}</td>
        </tr>
        <tr>
          <td>Transporte (Envio)</td>
          <td>${PLACEHOLDERS.TRANSPORTE_ENVIO}</td>
        </tr>
        <tr>
          <td>Transporte (Retirada)</td>
          <td>${PLACEHOLDERS.TRANSPORTE_RETIRADA}</td>
        </tr>
        <tr>
          <td>Carga/Descarga (Mobilização)</td>
          <td>${PLACEHOLDERS.CARGA_MOBILIZACAO}</td>
        </tr>
        <tr>
          <td>Carga/Descarga (Desmobilização)</td>
          <td>${PLACEHOLDERS.CARGA_DESMOBILIZACAO}</td>
        </tr>
        <tr>
          <td>Instalação</td>
          <td>${PLACEHOLDERS.INSTALACAO}</td>
        </tr>
        <tr>
          <td>Manutenção Preventiva</td>
          <td>${PLACEHOLDERS.MANUTENCAO_PREV}</td>
        </tr>
        <tr>
          <td>Combustível</td>
          <td>${PLACEHOLDERS.COMBUSTIVEL}</td>
        </tr>
        <tr>
          <td>Seguro</td>
          <td>${PLACEHOLDERS.SEGURO}</td>
        </tr>
        <tr>
          <td>Impostos</td>
          <td>${PLACEHOLDERS.IMPOSTOS}</td>
        </tr>
        <tr>
          <td>Telemetria</td>
          <td>${PLACEHOLDERS.TELEMETRIA}</td>
        </tr>
        <tr>
          <td>Dimensionamento</td>
          <td>${PLACEHOLDERS.DIMENSIONAMENTO}</td>
        </tr>
        <tr>
          <td>Definição de Escopo</td>
          <td>${PLACEHOLDERS.DEFINICAO_ESCOPO}</td>
        </tr>
      </tbody>
    </table>

    <!-- Observações das Condições -->
    ${PLACEHOLDERS.CONDICOES_OBSERVACOES}
  </div>
</section>
`;

/**
 * Rodapé do documento (Página final)
 */
export const TEMPLATE_FOOTER = `
<section class="page content-page footer-page">
  ${TEMPLATE_HEADER}
  
  <div class="footer-section">
    <div class="disposicoes-gerais">
      <h2 class="section-title">DISPOSIÇÕES GERAIS</h2>
      <p>Todas as condições, preços e especificações técnicas constantes neste documento são válidos pelo período de validade definido. Os valores apresentados referem-se exclusivamente aos itens descritos no Escopo de Fornecimento, não incluindo quaisquer outros serviços ou equipamentos não especificados.</p>
      <p>As partes reconhecem este instrumento como registro fiel das condições acordadas. Qualquer alteração deverá ser formalizada por aditivo escrito e assinado por ambas as partes. A assinatura abaixo confirma o aceite integral dos termos e condições desta proposta.</p>
    </div>

    <div class="signatures-section break-inside-avoid">
      <h2 class="section-title">ACEITE E ASSINATURAS</h2>
      <p class="aceite-text">Ao assinar este documento, o Contratante declara ter lido, compreendido e aceito integralmente todos os termos e condições descritos nesta proposta.</p>

      <div class="signatures-grid">
        <div class="signature-box">
          <div class="signature-line"></div>
          <p class="signature-label">EGEN Geradores</p>
          <p class="signature-sublabel">Representante</p>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <p class="signature-label">${PLACEHOLDERS.CLIENTE_NOME}</p>
          <p class="signature-sublabel">Contratante</p>
        </div>
      </div>

      <div class="footer-info">
        <p class="footer-text">Documento gerado em ${PLACEHOLDERS.DATA_EMISSAO}</p>
        <p class="footer-text">Válido até ${PLACEHOLDERS.VALIDADE}</p>
      </div>
    </div>
  </div>
  
  <footer class="document-footer">
    <div class="footer-contact">
      <p><strong>EGEN Geradores</strong></p>
      <p>www.egengeradores.com.br</p>
      <p>contato@egengeradores.com.br</p>
      <p>(11) 1234-5678</p>
    </div>
  </footer>
</section>
`;

// ============================================
// FULL TEMPLATE ASSEMBLY
// ============================================

export interface TemplateConfig {
  includeCover: boolean;
  includeIntro: boolean;
  includeEquipamentos: boolean;
  includeServicos: boolean;
  includeCondicoes: boolean;
  includeFooter: boolean;
}

export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
  includeCover: true,
  includeIntro: true,
  includeEquipamentos: true,
  includeServicos: true,
  includeCondicoes: true,
  includeFooter: true,
};

/**
 * Monta o template completo do documento
 */
export function assembleTemplate(config: Partial<TemplateConfig> = {}): string {
  const finalConfig = { ...DEFAULT_TEMPLATE_CONFIG, ...config };
  
  const sections: string[] = [
    '<div class="document proposal-document">',
  ];
  
  if (finalConfig.includeCover) {
    sections.push(TEMPLATE_COVER);
  }
  
  if (finalConfig.includeIntro) {
    sections.push(TEMPLATE_INTRO);
  }
  
  if (finalConfig.includeEquipamentos || finalConfig.includeServicos) {
    sections.push(TEMPLATE_ESCOPO);
  }
  
  if (finalConfig.includeCondicoes) {
    sections.push(TEMPLATE_CONDICOES);
  }
  
  if (finalConfig.includeFooter) {
    sections.push(TEMPLATE_FOOTER);
  }
  
  sections.push('</div>');
  
  return sections.join('\n');
}

/**
 * Retorna o template para um tipo específico de documento
 */
export function getTemplateForType(tipo: DocumentTipo): string {
  switch (tipo) {
    case 'orcamento':
      // Orçamento simplificado: sem capa, sem introdução
      return assembleTemplate({
        includeCover: false,
        includeIntro: false,
        includeFooter: false,
      });
    
    case 'contrato':
      // Contrato: todas as seções
      return assembleTemplate({
        includeCover: true,
        includeIntro: true,
        includeEquipamentos: true,
        includeServicos: true,
        includeCondicoes: true,
        includeFooter: true,
      });
    
    case 'proposta':
    default:
      // Proposta: template padrão completo
      return assembleTemplate();
  }
}
