/**
 * EGEN System - Sales Proposal Types
 * Tipos para propostas comerciais, orçamentos e contratos de locação
 */

// ============================================
// ENUMS E CONSTANTES
// ============================================

export type DocumentTipo = 'proposta' | 'orcamento' | 'contrato';

export type DocumentStatus =
  | 'draft'
  | 'negotiating'
  | 'price_survey'
  | 'lost'
  | 'cancelled'
  | 'closed';

export const DocumentTipoLabels: Record<DocumentTipo, string> = {
  proposta: 'Proposta Comercial',
  orcamento: 'Orçamento',
  contrato: 'Contrato de Locação',
};

export const DocumentStatusLabels: Record<DocumentStatus, string> = {
  draft: 'Rascunho',
  negotiating: 'Em negociação',
  price_survey: 'Tomada de preço',
  lost: 'Proposta Perdida',
  cancelled: 'Proposta Cancelada',
  closed: 'Proposta Fechada',
};

export const DocumentStatusColors: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
  negotiating: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
  price_survey: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200',
  lost: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
  cancelled: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  closed: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200',
};

export type FranquiaHoras = 'standby' | '120h' | '240h' | '360h' | 'continuo';

export const FranquiaHorasLabels: Record<FranquiaHoras, string> = {
  standby: 'Stand-By (35h/mês)',
  '120h': '120h/mês (04h/dia)',
  '240h': '240h/mês (08h/dia)',
  '360h': '360h/mês (12h/dia)',
  continuo: 'Contínuo/Livre (24h/dia)',
};

export type PeriodoLocacao = 'semanal' | 'quinzenal' | 'mensal' | 'anual';

export const PeriodoLocacaoLabels: Record<PeriodoLocacao, string> = {
  semanal: 'Semanal (7 dias)',
  quinzenal: 'Quinzenal (15 dias)',
  mensal: 'Mensal (30 dias)',
  anual: 'Anual (360 dias)',
};

// ============================================
// ITEM CATEGORIES (NEW)
// ============================================

export type ItemTipoPeriodico =
  | 'gerador'
  | 'cabo_380v'
  | 'cabo_220v'
  | 'qta'
  | 'tanque'
  | 'telemetria_item';

export const ItemTipoPeriodicoLabels: Record<ItemTipoPeriodico, string> = {
  gerador: 'Gerador',
  cabo_380v: 'Kit Cabos 380V',
  cabo_220v: 'Kit Cabos 220V',
  qta: 'QTA',
  tanque: 'Tanque Auxiliar',
  telemetria_item: 'Telemetria',
};

export type ItemTipoSpot =
  | 'frete'
  | 'instalacao'
  | 'manutencao'
  | 'personalizado';

export const ItemTipoSpotLabels: Record<ItemTipoSpot, string> = {
  frete: 'Frete',
  instalacao: 'Instalação',
  manutencao: 'Manutenção',
  personalizado: 'Serviço Personalizado',
};

// ============================================
// CLIENTE SNAPSHOT
// ============================================

export interface ClienteSnapshot {
  nome: string;
  responsavel: string;
  email: string;
  telefone: string;
  documento: string; // CPF ou CNPJ
  endereco: string;
  cidadeUf: string;
}

// ============================================
// ITEM PERIÓDICO (Recurring — generators and accessories)
// ============================================

export interface ProposalItemPeriodico {
  id: string;
  tipo: ItemTipoPeriodico;
  descricao: string;
  /** Only used for type === 'gerador' */
  potenciaKva?: string;
  quantidade: number;
  franquiaHoras: FranquiaHoras;
  periodoLocacao: PeriodoLocacao;
  valorUnitario: number;
  valorTotal: number;
  observacoes: string;
}

// ============================================
// ITEM SPOT (One-time / on-demand services)
// ============================================

export interface ProposalItemSpot {
  id: string;
  tipo: ItemTipoSpot;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  observacoes: string;
}

// Backward-compat aliases (used by service mapper)
/** @deprecated Use ProposalItemPeriodico */
export type ProposalEquipamento = ProposalItemPeriodico;
/** @deprecated Use ProposalItemSpot */
export type ProposalServico = ProposalItemSpot;

// ============================================
// HORA EXCEDENTE
// ============================================

export interface ProposalHoraExcedente {
  id: string;
  descricao: string;
  potenciaKva: string;
  valorUnitario: number;
  observacoes: string;
}

// ============================================
// CONDIÇÕES COMERCIAIS
// ============================================

export interface CondicoesComerciais {
  localUtilizacao: string;
  formaPagamento: string;
  prazoPagamento: string;
  faturamento: string;
  prazoEntrega: string;
  validadeProposta: string;
  inicioCobranca: string;
  finalCobranca: string;
  periodoMinimo: string;
  periodoOrcado: string;
  tensao: string;
  emissaoArt: string;
  transporteEnvio: string;
  transporteRetirada: string;
  cargaDescargaMobilizacao: string;
  cargaDescargaDesmobilizacao: string;
  instalacao: string;
  manutencaoPreventiva: string;
  combustivel: string;
  seguro: string;
  impostos: string;
  telemetria: string;
  dimensionamento: string;
  definicaoEscopo: string;
  observacoes: string;
}

// ============================================
// MODELO PRINCIPAL: SALES QUOTATION
// ============================================

export interface SalesQuotation {
  id: string;
  documentId: string; // Código do documento (ex: PROP-2026-0001)
  
  // Relacionamentos
  clientId: string | null;
  leadId: string | null;
  
  // Tipo e Status
  tipo: DocumentTipo;
  status: DocumentStatus;
  
  // Datas
  dataEmissao: string;
  validade: string;
  
  // Snapshot do cliente (gravado no momento da criação)
  cliente: ClienteSnapshot;
  
  // Itens (NOVA ESTRUTURA)
  itensPeriodicos: ProposalItemPeriodico[];
  itensSpot: ProposalItemSpot[];
  horasExcedentes: ProposalHoraExcedente[];
  
  // Condições
  condicoes: CondicoesComerciais;
  
  // Observações Gerais (exibidas na proposta final)
  observacoesGerais: string;
  
  // Totais calculados
  totalPeriodicos: number;
  totalSpot: number;
  totalGeral: number;
  
  // Desconto
  descontoPercent: number;
  descontoValor: number;
  totalComDesconto: number;
  
  // Opção de exibição de totais:
  // true  = Subtotal por tabela | false = Soma Geral unificada
  exibirTotaisPorTabela: boolean;
  
  // Metadados
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Versioning
  version: number;
  parentId: string | null; // Para revisões
  
  // Notas internas
  notasInternas: string;

  // Contrato: texto gerado pelo template após a conversão (só em tipo === 'contrato')
  contractText: string;

  // Proposta original vinculada a um contrato (true quando tipo === 'proposta' e foi convertida)
  isAnnex: boolean;
}

// ============================================
// FORM DATA TYPES
// ============================================

export interface SalesQuotationFormData {
  tipo: DocumentTipo;
  dataEmissao: string;
  validade: string;
  cliente: ClienteSnapshot;
  itensPeriodicos: ProposalItemPeriodico[];
  itensSpot: ProposalItemSpot[];
  horasExcedentes: ProposalHoraExcedente[];
  condicoes: CondicoesComerciais;
  observacoesGerais: string;
  descontoPercent: number;
  exibirTotaisPorTabela: boolean;
  notasInternas: string;
}

// ============================================
// DEFAULTS
// ============================================

export const DEFAULT_CLIENTE_SNAPSHOT: ClienteSnapshot = {
  nome: '',
  responsavel: '',
  email: '',
  telefone: '',
  documento: '',
  endereco: '',
  cidadeUf: '',
};

export const DEFAULT_CONDICOES: CondicoesComerciais = {
  localUtilizacao: '',
  formaPagamento: 'Boleto',
  prazoPagamento: '14 dias',
  faturamento: 'Data da saída do pátio',
  prazoEntrega: 'A combinar',
  validadeProposta: '15 dias',
  inicioCobranca: 'Data da instalação',
  finalCobranca: 'Data de desinstalação',
  periodoMinimo: '30 dias',
  periodoOrcado: 'Mensal',
  tensao: '380/220V',
  emissaoArt: 'Não orçado',
  transporteEnvio: 'Não orçado',
  transporteRetirada: 'Não orçado',
  cargaDescargaMobilizacao: 'Não orçado',
  cargaDescargaDesmobilizacao: 'Não orçado',
  instalacao: 'Não orçado',
  manutencaoPreventiva: 'Não orçado',
  combustivel: 'Não orçado',
  seguro: 'Não incluso',
  impostos: 'Incluso',
  telemetria: 'Não orçado',
  dimensionamento: 'Locatária',
  definicaoEscopo: 'Locatária',
  observacoes: '',
};

export const createEmptyItemPeriodico = (tipo: ItemTipoPeriodico = 'gerador'): ProposalItemPeriodico => ({
  id: crypto.randomUUID(),
  tipo,
  descricao: tipo === 'gerador' ? '' : ItemTipoPeriodicoLabels[tipo],
  potenciaKva: tipo === 'gerador' ? '' : undefined,
  quantidade: 1,
  franquiaHoras: '240h',
  periodoLocacao: 'mensal',
  valorUnitario: 0,
  valorTotal: 0,
  observacoes: '',
});

export const createEmptyItemSpot = (tipo: ItemTipoSpot = 'personalizado'): ProposalItemSpot => ({
  id: crypto.randomUUID(),
  tipo,
  descricao: tipo === 'personalizado' ? '' : ItemTipoSpotLabels[tipo],
  quantidade: 1,
  valorUnitario: 0,
  valorTotal: 0,
  observacoes: '',
});

export const createEmptyHoraExcedente = (): ProposalHoraExcedente => ({
  id: crypto.randomUUID(),
  descricao: 'Hora excedente',
  potenciaKva: '',
  valorUnitario: 0,
  observacoes: 'por equipamento',
});

// ============================================
// GENERATOR ID
// ============================================

export function generateDocumentId(tipo: DocumentTipo = 'proposta'): string {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  
  const prefixMap: Record<DocumentTipo, string> = {
    proposta: 'PROP',
    orcamento: 'ORC',
    contrato: 'CONT',
  };
  
  return `${prefixMap[tipo]}-${year}-${random}`;
}

// ============================================
// CALCULATION HELPERS
// ============================================

export function calculateItemPeriodicoTotal(item: ProposalItemPeriodico): number {
  return item.valorUnitario * item.quantidade;
}

export function calculateItemSpotTotal(item: ProposalItemSpot): number {
  return item.valorUnitario * item.quantidade;
}

// Backward-compat aliases
/** @deprecated */
export const calculateEquipamentoTotal = calculateItemPeriodicoTotal as (eq: ProposalItemPeriodico) => number;
/** @deprecated */
export const calculateServicoTotal = calculateItemSpotTotal as (s: ProposalItemSpot) => number;
/** @deprecated */
export const createEmptyEquipamento = () => createEmptyItemPeriodico('gerador');
/** @deprecated */
export const createEmptyServico = () => createEmptyItemSpot('personalizado');
