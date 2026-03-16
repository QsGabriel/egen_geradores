/**
 * CRM Module Types
 * Tipos e interfaces para o módulo Comercial / CRM
 */

// ============================================
// CLIENT
// ============================================

export type ClientStatus = 'active' | 'inactive' | 'blocked' | 'prospect';

export interface Client {
  id: string;
  name: string;
  documentNumber: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  city: string;
  state: string;
  notes: string;
  clientStatus: ClientStatus;
  contractsCount: number;
  quotationsCount: number;
  lastInteraction: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientFormData {
  name: string;
  documentNumber: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  city: string;
  state: string;
  notes: string;
  clientStatus: ClientStatus;
}

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  blocked: 'Bloqueado',
  prospect: 'Prospecto',
};

export const CLIENT_STATUS_COLORS: Record<ClientStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  blocked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  prospect: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

// ============================================
// LEAD
// ============================================

export type LeadStatus = 'new' | 'contacted' | 'proposal_sent' | 'negotiation' | 'won' | 'lost';

export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  source: string;
  status: LeadStatus;
  notes: string;
  convertedClientId: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadFormData {
  name: string;
  company: string;
  phone: string;
  email: string;
  source: string;
  status: LeadStatus;
  notes: string;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Novo',
  contacted: 'Contatado',
  proposal_sent: 'Proposta Enviada',
  negotiation: 'Negociação',
  won: 'Ganho',
  lost: 'Perdido',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  contacted: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  proposal_sent: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  negotiation: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  won: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  lost: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export const LEAD_SOURCES = [
  'Site',
  'Indicação',
  'Telefone',
  'E-mail',
  'Redes Sociais',
  'Feira/Evento',
  'Outro',
];

export const LEAD_PIPELINE_ORDER: LeadStatus[] = [
  'new',
  'contacted',
  'proposal_sent',
  'negotiation',
  'won',
  'lost',
];

// ============================================
// CRM HISTORY
// ============================================

export type CrmEntityType = 'client' | 'lead' | 'contract' | 'quotation' | 'equipment';

export interface CrmHistory {
  id: string;
  entityType: CrmEntityType;
  entityId: string;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface CrmHistoryFormData {
  entityType: CrmEntityType;
  entityId: string;
  description: string;
}

export const CRM_ENTITY_TYPE_LABELS: Record<CrmEntityType, string> = {
  client: 'Cliente',
  lead: 'Lead',
  contract: 'Contrato',
  quotation: 'Cotação',
  equipment: 'Equipamento',
};
