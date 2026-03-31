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
  EQUIPAMENTOS_TABLE: '{{equipamentos.table}}',
  SERVICOS_TABLE: '{{servicos.table}}',
  HORAS_EXCEDENTES_TABLE: '{{horasExcedentes.table}}',
  
  // Totais
  TOTAL_EQUIPAMENTOS: '{{totais.equipamentos}}',
  TOTAL_SERVICOS: '{{totais.servicos}}',
  TOTAL_GERAL: '{{totais.geral}}',
  DESCONTO_PERCENT: '{{totais.descontoPercent}}',
  DESCONTO_VALOR: '{{totais.descontoValor}}',
  TOTAL_FINAL: '{{totais.final}}',
  
  // Condições
  CONDICOES_SECTION: '{{condicoes.section}}',
  LOCAL_UTILIZACAO: '{{condicoes.localUtilizacao}}',
  FORMA_PAGAMENTO: '{{condicoes.formaPagamento}}',
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
`;

/**
 * Cabeçalho padrão das páginas
 */
export const TEMPLATE_HEADER = `
<header class="page-header">
  <div class="header-logo">
    <img src="/LOGO-DM.png" alt="EGEN Geradores" class="header-logo-img" />
  </div>
  <div class="header-info">
    <div class="header-doc-id">${PLACEHOLDERS.DOCUMENT_ID}</div>
    <div class="header-date">Data: ${PLACEHOLDERS.DATA_EMISSAO}</div>
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
    <h2 class="section-title">DADOS DO CLIENTE</h2>
    <div class="client-grid">
      <div class="client-field">
        <span class="field-label">Razão Social / Nome:</span>
        <span class="field-value">${PLACEHOLDERS.CLIENTE_NOME}</span>
      </div>
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
      <div class="client-field full-width">
        <span class="field-label">Endereço:</span>
        <span class="field-value">${PLACEHOLDERS.CLIENTE_ENDERECO}</span>
      </div>
      <div class="client-field">
        <span class="field-label">Cidade/UF:</span>
        <span class="field-value">${PLACEHOLDERS.CLIENTE_CIDADE_UF}</span>
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
 * Seção de equipamentos (Página 3)
 */
export const TEMPLATE_EQUIPAMENTOS = `
<section class="page content-page">
  ${TEMPLATE_HEADER}
  
  <div class="equipamentos-section">
    <h2 class="section-title">EQUIPAMENTOS</h2>
    <p class="section-subtitle">Grupos geradores propostos para atender à sua demanda:</p>
    
    <table class="items-table">
      <thead>
        <tr>
          <th class="col-desc">Descrição</th>
          <th class="col-qty">Qtd</th>
          <th class="col-franquia">Franquia</th>
          <th class="col-periodo">Período</th>
          <th class="col-unit">Valor Unit.</th>
          <th class="col-total">Valor Total</th>
        </tr>
      </thead>
      <tbody>
        ${PLACEHOLDERS.EQUIPAMENTOS_TABLE}
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="5" class="total-label">SUBTOTAL EQUIPAMENTOS</td>
          <td class="total-value">${PLACEHOLDERS.TOTAL_EQUIPAMENTOS}</td>
        </tr>
      </tfoot>
    </table>
  </div>
  
  <div class="horas-excedentes-section">
    <h2 class="section-title">HORAS EXCEDENTES</h2>
    <p class="section-subtitle">Valores para utilização além da franquia contratada:</p>
    
    <table class="items-table compact">
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
  </div>
</section>
`;

/**
 * Seção de serviços (Página 4)
 */
export const TEMPLATE_SERVICOS = `
<section class="page content-page">
  ${TEMPLATE_HEADER}
  
  <div class="servicos-section">
    <h2 class="section-title">SERVIÇOS INCLUSOS</h2>
    <p class="section-subtitle">Serviços contemplados nesta proposta:</p>
    
    <table class="items-table">
      <thead>
        <tr>
          <th class="col-desc">Descrição</th>
          <th class="col-qty">Qtd</th>
          <th class="col-unit">Valor Unit.</th>
          <th class="col-total">Valor Total</th>
        </tr>
      </thead>
      <tbody>
        ${PLACEHOLDERS.SERVICOS_TABLE}
      </tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="3" class="total-label">SUBTOTAL SERVIÇOS</td>
          <td class="total-value">${PLACEHOLDERS.TOTAL_SERVICOS}</td>
        </tr>
      </tfoot>
    </table>
  </div>
  
  <div class="totais-section">
    <h2 class="section-title">RESUMO FINANCEIRO</h2>
    <div class="totais-box">
      <div class="total-line">
        <span class="total-label">Total Equipamentos:</span>
        <span class="total-value">${PLACEHOLDERS.TOTAL_EQUIPAMENTOS}</span>
      </div>
      <div class="total-line">
        <span class="total-label">Total Serviços:</span>
        <span class="total-value">${PLACEHOLDERS.TOTAL_SERVICOS}</span>
      </div>
      <div class="total-line subtotal">
        <span class="total-label">Subtotal:</span>
        <span class="total-value">${PLACEHOLDERS.TOTAL_GERAL}</span>
      </div>
      <div class="total-line desconto">
        <span class="total-label">Desconto (${PLACEHOLDERS.DESCONTO_PERCENT}%):</span>
        <span class="total-value">- ${PLACEHOLDERS.DESCONTO_VALOR}</span>
      </div>
      <div class="total-line final">
        <span class="total-label">VALOR TOTAL:</span>
        <span class="total-value highlight">${PLACEHOLDERS.TOTAL_FINAL}</span>
      </div>
    </div>
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
    
    <div class="condicoes-grid">
      <div class="condicao-item">
        <span class="condicao-label">Local de Utilização:</span>
        <span class="condicao-value">${PLACEHOLDERS.LOCAL_UTILIZACAO}</span>
      </div>
      <div class="condicao-item">
        <span class="condicao-label">Forma de Pagamento:</span>
        <span class="condicao-value">${PLACEHOLDERS.FORMA_PAGAMENTO}</span>
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
    
    <table class="responsibilities-table">
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
    <h2 class="section-title">ASSINATURAS</h2>
    
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
  
  if (finalConfig.includeEquipamentos) {
    sections.push(TEMPLATE_EQUIPAMENTOS);
  }
  
  if (finalConfig.includeServicos) {
    sections.push(TEMPLATE_SERVICOS);
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
