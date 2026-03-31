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
  | 'pending_review'
  | 'pending_approval'
  | 'sent' 
  | 'sent_to_client'
  | 'approved' 
  | 'accepted'
  | 'rejected' 
  | 'converted_to_contract'
  | 'expired'
  | 'cancelled';

export const DocumentTipoLabels: Record<DocumentTipo, string> = {
  proposta: 'Proposta Comercial',
  orcamento: 'Orçamento',
  contrato: 'Contrato de Locação',
};

export const DocumentStatusLabels: Record<DocumentStatus, string> = {
  draft: 'Rascunho',
  pending_review: 'Em Revisão',
  pending_approval: 'Aguardando Aprovação',
  sent: 'Enviado',
  sent_to_client: 'Enviado ao Cliente',
  approved: 'Aprovado',
  accepted: 'Aceito',
  rejected: 'Rejeitado',
  converted_to_contract: 'Convertido em Contrato',
  expired: 'Expirado',
  cancelled: 'Cancelado',
};

export const DocumentStatusColors: Record<DocumentStatus, string> = {
  draft: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
  pending_review: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200',
  pending_approval: 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200',
  sent: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
  sent_to_client: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200',
  approved: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200',
  accepted: 'bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-200',
  rejected: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200',
  converted_to_contract: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200',
  expired: 'bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200',
  cancelled: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
};

export type FranquiaHoras = 'standby' | '120h' | '240h' | '360h' | 'continuo';

export const FranquiaHorasLabels: Record<FranquiaHoras, string> = {
  standby: 'Stand-By (35h/mês)',
  '120h': '120h/mês (04h/dia)',
  '240h': '240h/mês (08h/dia)',
  '360h': '360h/mês (12h/dia)',
  continuo: 'Contínuo/Livre (24h/dia)',
};

export type PeriodoLocacao = 'semanal' | 'quinzenal' | 'mensal';

export const PeriodoLocacaoLabels: Record<PeriodoLocacao, string> = {
  semanal: 'Semanal (7 dias)',
  quinzenal: 'Quinzenal (15 dias)',
  mensal: 'Mensal (30 dias)',
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
// EQUIPAMENTO (GERADOR)
// ============================================

export interface ProposalEquipamento {
  id: string;
  descricao: string;
  potenciaKva: string;
  quantidade: number;
  franquiaHoras: FranquiaHoras;
  periodoLocacao: PeriodoLocacao;
  valorUnitario: number;
  valorTotal: number;
  incluiCabo380v: boolean;
  incluiCabo220v: boolean;
  valorCabo380v: number;
  valorCabo220v: number;
  incluiManutencao: boolean;
  valorManutencao: number;
  observacoes: string;
}

// ============================================
// SERVIÇO INCLUSO
// ============================================

export interface ProposalServico {
  id: string;
  codigo: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  observacoes: string;
}

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
  
  // Itens
  equipamentos: ProposalEquipamento[];
  servicos: ProposalServico[];
  horasExcedentes: ProposalHoraExcedente[];
  
  // Condições
  condicoes: CondicoesComerciais;
  
  // Totais calculados
  totalEquipamentos: number;
  totalServicos: number;
  totalGeral: number;
  
  // Desconto
  descontoPercent: number;
  descontoValor: number;
  totalComDesconto: number;
  
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
}

// ============================================
// FORM DATA TYPES
// ============================================

export interface SalesQuotationFormData {
  tipo: DocumentTipo;
  dataEmissao: string;
  validade: string;
  cliente: ClienteSnapshot;
  equipamentos: ProposalEquipamento[];
  servicos: ProposalServico[];
  horasExcedentes: ProposalHoraExcedente[];
  condicoes: CondicoesComerciais;
  descontoPercent: number;
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
  formaPagamento: 'Boleto - 15 dias',
  faturamento: 'Data da saída do pátio',
  prazoEntrega: 'A combinar',
  validadeProposta: '15 dias',
  inicioCobranca: 'Data da saída dos equipamentos',
  finalCobranca: 'Data do retorno',
  periodoMinimo: '30 dias',
  periodoOrcado: 'Mensal',
  tensao: '380/220V',
  emissaoArt: 'Não incluso',
  transporteEnvio: 'Orçado',
  transporteRetirada: 'Orçado',
  cargaDescargaMobilizacao: 'Orçado',
  cargaDescargaDesmobilizacao: 'Não orçado',
  instalacao: 'Sim',
  manutencaoPreventiva: 'Orçado sob demanda',
  combustivel: 'Não Incluso',
  seguro: 'Incluso',
  impostos: 'Incluso',
  telemetria: 'Não incluso',
  dimensionamento: 'Locatária',
  definicaoEscopo: 'Locatária',
};

export const createEmptyEquipamento = (): ProposalEquipamento => ({
  id: crypto.randomUUID(),
  descricao: '',
  potenciaKva: '',
  quantidade: 1,
  franquiaHoras: '240h',
  periodoLocacao: 'mensal',
  valorUnitario: 0,
  valorTotal: 0,
  incluiCabo380v: false,
  incluiCabo220v: false,
  valorCabo380v: 0,
  valorCabo220v: 0,
  incluiManutencao: false,
  valorManutencao: 0,
  observacoes: '',
});

export const createEmptyServico = (): ProposalServico => ({
  id: crypto.randomUUID(),
  codigo: '',
  descricao: '',
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

export function calculateEquipamentoTotal(eq: ProposalEquipamento): number {
  let total = eq.valorUnitario * eq.quantidade;
  
  if (eq.incluiCabo380v) {
    total += eq.valorCabo380v * eq.quantidade;
  }
  if (eq.incluiCabo220v) {
    total += eq.valorCabo220v * eq.quantidade;
  }
  if (eq.incluiManutencao) {
    total += eq.valorManutencao * eq.quantidade;
  }
  
  return total;
}

export function calculateServicoTotal(serv: ProposalServico): number {
  return serv.valorUnitario * serv.quantidade;
}
