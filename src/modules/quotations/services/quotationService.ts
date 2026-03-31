/**
 * EGEN System - Quotation Service
 * Serviço para persistência de propostas no Supabase
 */
import { supabase } from '../../../lib/supabase';
import type { SalesQuotation, DocumentStatus } from '../types/proposal';

// ============================================
// DATABASE ROW TYPE
// ============================================

interface QuotationRow {
  id: string;
  document_id: string;
  client_id: string | null;
  lead_id: string | null;
  tipo: string;
  status: string;
  data_emissao: string;
  validade: string;
  conteudo: any; // JSON containing full quotation data
  total_equipamentos: number;
  total_servicos: number;
  total_geral: number;
  desconto_percent: number;
  desconto_valor: number;
  total_com_desconto: number;
  notas_internas: string | null;
  version: number;
  parent_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// MAPPERS
// ============================================

function quotationToRow(quotation: SalesQuotation): Omit<QuotationRow, 'created_at' | 'updated_at'> {
  return {
    id: quotation.id,
    document_id: quotation.documentId,
    client_id: quotation.clientId,
    lead_id: quotation.leadId,
    tipo: quotation.tipo,
    status: quotation.status,
    data_emissao: quotation.dataEmissao,
    validade: quotation.validade,
    conteudo: {
      cliente: quotation.cliente,
      equipamentos: quotation.equipamentos,
      servicos: quotation.servicos,
      horasExcedentes: quotation.horasExcedentes,
      condicoes: quotation.condicoes,
    },
    total_equipamentos: quotation.totalEquipamentos,
    total_servicos: quotation.totalServicos,
    total_geral: quotation.totalGeral,
    desconto_percent: quotation.descontoPercent,
    desconto_valor: quotation.descontoValor,
    total_com_desconto: quotation.totalComDesconto,
    notas_internas: quotation.notasInternas || null,
    version: quotation.version,
    parent_id: quotation.parentId,
    created_by: quotation.createdBy,
    updated_by: quotation.updatedBy,
  };
}

function rowToQuotation(row: QuotationRow): SalesQuotation {
  const conteudo = row.conteudo || {};
  
  return {
    id: row.id,
    documentId: row.document_id,
    clientId: row.client_id,
    leadId: row.lead_id,
    tipo: row.tipo as SalesQuotation['tipo'],
    status: row.status as DocumentStatus,
    dataEmissao: row.data_emissao,
    validade: row.validade,
    cliente: conteudo.cliente || {
      nome: '',
      responsavel: '',
      email: '',
      telefone: '',
      documento: '',
      endereco: '',
      cidadeUf: '',
    },
    equipamentos: conteudo.equipamentos || [],
    servicos: conteudo.servicos || [],
    horasExcedentes: conteudo.horasExcedentes || [],
    condicoes: conteudo.condicoes || {},
    totalEquipamentos: row.total_equipamentos,
    totalServicos: row.total_servicos,
    totalGeral: row.total_geral,
    descontoPercent: row.desconto_percent,
    descontoValor: row.desconto_valor,
    totalComDesconto: row.total_com_desconto,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
    parentId: row.parent_id,
    notasInternas: row.notas_internas || '',
  };
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Create a new quotation
 */
export async function createQuotation(
  quotation: SalesQuotation,
  userId?: string
): Promise<SalesQuotation> {
  const row = quotationToRow(quotation);
  row.created_by = userId || null;
  row.updated_by = userId || null;

  const { data, error } = await supabase
    .from('sales_quotations')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('[quotationService] Create error:', error);
    throw new Error(`Erro ao criar proposta: ${error.message}`);
  }

  return rowToQuotation(data);
}

/**
 * Update an existing quotation
 */
export async function updateQuotation(
  quotation: SalesQuotation,
  userId?: string
): Promise<SalesQuotation> {
  const row = quotationToRow(quotation);
  row.updated_by = userId || null;
  row.version = quotation.version + 1;

  const { data, error } = await supabase
    .from('sales_quotations')
    .update(row)
    .eq('id', quotation.id)
    .select()
    .single();

  if (error) {
    console.error('[quotationService] Update error:', error);
    throw new Error(`Erro ao atualizar proposta: ${error.message}`);
  }

  return rowToQuotation(data);
}

/**
 * Get quotation by ID
 */
export async function getQuotationById(id: string): Promise<SalesQuotation | null> {
  const { data, error } = await supabase
    .from('sales_quotations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('[quotationService] Get by ID error:', error);
    throw new Error(`Erro ao buscar proposta: ${error.message}`);
  }

  return rowToQuotation(data);
}

/**
 * Get quotation by document ID
 */
export async function getQuotationByDocumentId(documentId: string): Promise<SalesQuotation | null> {
  const { data, error } = await supabase
    .from('sales_quotations')
    .select('*')
    .eq('document_id', documentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('[quotationService] Get by document ID error:', error);
    throw new Error(`Erro ao buscar proposta: ${error.message}`);
  }

  return rowToQuotation(data);
}

/**
 * List quotations with filters
 */
export interface SalesQuotationFilters {
  status?: DocumentStatus | DocumentStatus[];
  tipo?: string;
  clientId?: string;
  leadId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listQuotations(filters: SalesQuotationFilters = {}): Promise<{
  data: SalesQuotation[];
  count: number;
}> {
  let query = supabase
    .from('sales_quotations')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      query = query.in('status', filters.status);
    } else {
      query = query.eq('status', filters.status);
    }
  }

  if (filters.tipo) {
    query = query.eq('tipo', filters.tipo);
  }

  if (filters.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  if (filters.leadId) {
    query = query.eq('lead_id', filters.leadId);
  }

  if (filters.fromDate) {
    query = query.gte('data_emissao', filters.fromDate);
  }

  if (filters.toDate) {
    query = query.lte('data_emissao', filters.toDate);
  }

  if (filters.search) {
    query = query.or(`document_id.ilike.%${filters.search}%,conteudo->cliente->nome.ilike.%${filters.search}%`);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[quotationService] List error:', error);
    throw new Error(`Erro ao listar propostas: ${error.message}`);
  }

  return {
    data: (data || []).map(rowToQuotation),
    count: count || 0,
  };
}

/**
 * Update quotation status
 */
export async function updateQuotationStatus(
  id: string,
  status: DocumentStatus,
  userId?: string
): Promise<SalesQuotation> {
  const { data, error } = await supabase
    .from('sales_quotations')
    .update({
      status,
      updated_by: userId || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[quotationService] Update status error:', error);
    throw new Error(`Erro ao atualizar status: ${error.message}`);
  }

  return rowToQuotation(data);
}

/**
 * Delete quotation (soft delete by setting status to cancelled)
 */
export async function deleteQuotation(id: string, userId?: string): Promise<void> {
  const { error } = await supabase
    .from('sales_quotations')
    .update({
      status: 'cancelled',
      updated_by: userId || null,
    })
    .eq('id', id);

  if (error) {
    console.error('[quotationService] Delete error:', error);
    throw new Error(`Erro ao excluir proposta: ${error.message}`);
  }
}

/**
 * Duplicate quotation (create a new version)
 */
export async function duplicateQuotation(
  id: string,
  userId?: string
): Promise<SalesQuotation> {
  // Get original
  const original = await getQuotationById(id);
  if (!original) {
    throw new Error('Proposta não encontrada');
  }

  // Create duplicate
  const duplicate: SalesQuotation = {
    ...original,
    id: crypto.randomUUID(),
    documentId: original.documentId.replace(/-\d{4}$/, `-${Math.floor(Math.random() * 9000) + 1000}`),
    status: 'draft',
    version: 1,
    parentId: original.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: userId || null,
    updatedBy: userId || null,
  };

  return createQuotation(duplicate, userId);
}

/**
 * Convert quotation to contract
 */
export async function convertToContract(
  id: string,
  userId?: string
): Promise<SalesQuotation> {
  const quotation = await getQuotationById(id);
  if (!quotation) {
    throw new Error('Proposta não encontrada');
  }

  // Update original status
  await updateQuotationStatus(id, 'converted_to_contract', userId);

  // Create contract version
  const contract: SalesQuotation = {
    ...quotation,
    id: crypto.randomUUID(),
    documentId: quotation.documentId.replace(/^(PROP|ORC)/, 'CONT'),
    tipo: 'contrato',
    status: 'draft',
    version: 1,
    parentId: quotation.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: userId || null,
    updatedBy: userId || null,
  };

  return createQuotation(contract, userId);
}

// ============================================
// EXPORT ALL
// ============================================

export const quotationService = {
  create: createQuotation,
  update: updateQuotation,
  getById: getQuotationById,
  getByDocumentId: getQuotationByDocumentId,
  list: listQuotations,
  updateStatus: updateQuotationStatus,
  delete: deleteQuotation,
  duplicate: duplicateQuotation,
  convertToContract,
};

export default quotationService;
