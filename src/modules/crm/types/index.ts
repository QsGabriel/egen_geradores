/**
 * CRM Module Types
 * Tipos e interfaces para o módulo Comercial / CRM
 */

// ============================================
// CONTACT PERSON (múltiplos contatos)
// ============================================

export interface ContactPerson {
  name: string;
  phone: string;
  email: string;
}

export const EMPTY_CONTACT: ContactPerson = { name: '', phone: '', email: '' };

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
  locationUrl: string;
  classification: string;
  clientStatus: ClientStatus;
  contractsCount: number;
  quotationsCount: number;
  contacts: ContactPerson[];
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
  locationUrl: string;
  classification: string;
  clientStatus: ClientStatus;
  contacts: ContactPerson[];
}

export const CLIENT_CLASSIFICATIONS = [
  'Sistemas de Irrigação',
  'Armazéns de Grãos e Sementes',
  'Mineração Minerais Metálicos',
  'Minerais Não Metálicos',
  'Obras Const. Civil',
  'Pecuária',
  'Agroindústria Energética',
  'Indústria de Alimentos',
  'Comércio',
  'Paradas de Manutenção',
] as const;

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

export type LeadStatus =
  | 'to_contact'
  | 'no_demand'
  | 'potential_client'
  | 'follow_up'
  | 'in_proposal'
  | 'client_no_demand'
  | 'client_with_demand';

export interface Lead {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  source: string;
  status: LeadStatus;
  notes: string;
  contacts: ContactPerson[];
  scheduledAt: string | null;
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
  contacts: ContactPerson[];
  scheduledAt?: string;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  to_contact: 'A contatar',
  no_demand: 'Sem demanda',
  potential_client: 'Cliente potencial',
  follow_up: 'Retomar contato',
  in_proposal: 'Em proposta',
  client_no_demand: 'Cliente sem demanda',
  client_with_demand: 'Cliente com demanda',
};

export const LEAD_STATUS_DESCRIPTIONS: Record<LeadStatus, string> = {
  to_contact: 'Realizar contato inicial',
  no_demand: 'Não é um lead em potencial',
  potential_client: 'Agendamento obrigatório',
  follow_up: 'Agendamento obrigatório',
  in_proposal: 'Cliente que somente orçou',
  client_no_demand: 'Agendamento sazonal',
  client_with_demand: 'Agendamento sazonal',
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  to_contact: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  no_demand: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  potential_client: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  follow_up: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  in_proposal: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  client_no_demand: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
  client_with_demand: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

/** Status que exigem agendamento obrigatório */
export const STATUSES_REQUIRING_SCHEDULE: LeadStatus[] = ['potential_client', 'follow_up'];

/** Status com agendamento sazonal (clientes) */
export const STATUSES_SEASONAL_SCHEDULE: LeadStatus[] = ['client_no_demand', 'client_with_demand'];

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
  'to_contact',
  'potential_client',
  'follow_up',
  'in_proposal',
  'client_with_demand',
  'client_no_demand',
  'no_demand',
];

// ============================================
// CONTACT LOG (histórico de contatos com leads/clientes)
// ============================================

export interface ContactLog {
  id: string;
  entityType: 'client' | 'lead';
  entityId: string;
  /** Obrigatório: identificação da pessoa com quem foi realizado o contato */
  contactedPerson: string;
  /** Observações livres sobre o contato */
  notes: string;
  /** Data e hora do contato (informado pelo usuário) */
  contactedAt: string;
  /** Usuário que registrou */
  createdBy: string;
  createdAt: string;
}

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
