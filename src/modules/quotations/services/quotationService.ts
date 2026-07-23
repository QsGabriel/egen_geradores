/**
 * EGEN System - Quotation Service
 * Serviço para persistência de propostas no Supabase
 */
import { supabase } from '../../../lib/supabase';
import type { SalesQuotation, DocumentStatus } from '../types/proposal';
import { buildContractVars, renderContractText } from './contractTemplate';

async function convertLeadToClient(leadId: string, leadData: {
  name: string;
  documentNumber?: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
}): Promise<string> {
  const { data: newClient, error: insertErr } = await supabase
    .from('clients')
    .insert({
      name: leadData.name,
      document_number: leadData.documentNumber || null,
      contact_name: leadData.contactName,
      contact_phone: leadData.contactPhone,
      contact_email: leadData.contactEmail,
      client_status: 'active',
    })
    .select()
    .single();

  if (insertErr) throw insertErr;

  const { error: updateErr } = await supabase
    .from('leads')
    .update({
      status: 'client_with_demand',
      converted_client_id: newClient.id,
      converted_at: new Date().toISOString(),
    })
    .eq('id', leadId);

  if (updateErr) throw updateErr;

  return newClient.id;
}

// ============================================
// DATABASE ROW TYPE
// ============================================

interface QuotationRow {
  id: string;
  document_id: string;
  client_id: string | null;
  lead_id: string | null;
  vendedor_id: string | null;
  tipo: string;
  status: string;
  data_emissao: string;
  validade: string;
  conteudo: any;
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
    vendedor_id: quotation.vendedorId ?? null,
    tipo: quotation.tipo,
    status: quotation.status,
    data_emissao: quotation.dataEmissao,
    validade: quotation.validade,
    conteudo: {
      cliente: quotation.cliente,
      itensPeriodicos: quotation.itensPeriodicos,
      itensSpot: quotation.itensSpot,
      horasExcedentes: quotation.horasExcedentes,
      condicoes: quotation.condicoes,
      observacoesGerais: quotation.observacoesGerais,
      exibirTotaisPorTabela: quotation.exibirTotaisPorTabela,
      contractText: quotation.contractText || '',
      isAnnex: quotation.isAnnex ?? false,
    },
    total_equipamentos: quotation.totalPeriodicos,
    total_servicos: quotation.totalSpot,
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
    vendedorId: row.vendedor_id,
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
    itensPeriodicos: conteudo.itensPeriodicos || conteudo.equipamentos || [],
    itensSpot: conteudo.itensSpot || conteudo.servicos || [],
    horasExcedentes: conteudo.horasExcedentes || [],
    condicoes: conteudo.condicoes || {},
    observacoesGerais: conteudo.observacoesGerais || '',
    exibirTotaisPorTabela: conteudo.exibirTotaisPorTabela ?? true,
    totalPeriodicos: row.total_equipamentos,
    totalSpot: row.total_servicos,
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
    contractText: conteudo.contractText || '',
    isAnnex: conteudo.isAnnex ?? false,
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

  // Transição automática: draft → negotiating
  if (row.status === 'draft') {
    row.status = 'negotiating';
  }

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

  // Transição automática: draft → negotiating
  if (row.status === 'draft') {
    row.status = 'negotiating';
  }

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
  vendedorId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
  excludeDraft?: boolean;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  minValue?: number;
  maxValue?: number;
  page?: number;
  pageSize?: number;
}

const SORT_FIELD_MAP: Record<string, string> = {
  documentId: 'document_id',
  dataEmissao: 'data_emissao',
  status: 'status',
  valorTotal: 'total_com_desconto',
  tipo: 'tipo',
  cliente: 'conteudo->cliente->>nome',
  vendedor: 'vendedor_id',
};

export async function listQuotations(filters: SalesQuotationFilters = {}): Promise<{
  data: SalesQuotation[];
  count: number;
}> {
  let query = supabase
    .from('sales_quotations')
    .select('*', { count: 'exact' });

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

  if (filters.vendedorId) {
    query = query.eq('vendedor_id', filters.vendedorId);
  }

  if (filters.excludeDraft) {
    query = query.neq('status', 'draft');
  }

  if (filters.fromDate) {
    query = query.gte('data_emissao', filters.fromDate);
  }

  if (filters.toDate) {
    query = query.lte('data_emissao', filters.toDate);
  }

  if (filters.minValue != null) {
    query = query.gte('total_com_desconto', filters.minValue);
  }

  if (filters.maxValue != null) {
    query = query.lte('total_com_desconto', filters.maxValue);
  }

  if (filters.search) {
    query = query.or(`document_id.ilike.%${filters.search}%,conteudo->cliente->>nome.ilike.%${filters.search}%`);
  }

  if (filters.sortField && SORT_FIELD_MAP[filters.sortField]) {
    const dbField = SORT_FIELD_MAP[filters.sortField];
    const ascending = filters.sortDir !== 'desc';
    query = query.order(dbField, { ascending });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 25;

  if (filters.page != null) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
  } else if (filters.limit) {
    query = query.limit(filters.limit);
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + filters.limit - 1);
    }
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
 * Delete quotation (hard delete)
 */
export async function deleteQuotation(id: string, userId?: string): Promise<void> {
  const { error } = await supabase
    .from('sales_quotations')
    .delete()
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
 *
 * Flow:
 *  1. Validates that the proposal can be converted (not already a contract/annex)
 *  2. Generates a sequential CONT-YYYY-NNNN document ID
 *  3. Interpolates the contract template with proposal data
 *  4. Creates the new contract record (tipo='contrato', parentId = original.id)
 *  5. Marks the original proposal as isAnnex=true and status='closed'
 */
export async function convertToContract(
  id: string,
  userId?: string
): Promise<SalesQuotation> {
  const quotation = await getQuotationById(id);
  if (!quotation) throw new Error('Proposta não encontrada.');
  if (quotation.tipo === 'contrato') throw new Error('Este documento já é um contrato.');
  if (quotation.isAnnex) throw new Error('Esta proposta já foi vinculada a um contrato.');

  // --- 1. Generate sequential contract documentId ---
  const year = new Date().getFullYear();
  const { data: existingContracts } = await supabase
    .from('sales_quotations')
    .select('document_id')
    .eq('tipo', 'contrato')
    .like('document_id', `CONT-${year}-%`)
    .order('document_id', { ascending: false })
    .limit(1);

  const lastNum =
    existingContracts?.[0]
      ? parseInt(existingContracts[0].document_id.split('-')[2] ?? '0', 10)
      : 0;
  const contractDocumentId = `CONT-${year}-${String(lastNum + 1).padStart(4, '0')}`;

  // --- 2. Render contract template ---
  const vars = buildContractVars(quotation, contractDocumentId);
  const contractText = renderContractText(vars);

  // --- 3. Create contract record ---
  const contract: SalesQuotation = {
    ...quotation,
    id: crypto.randomUUID(),
    documentId: contractDocumentId,
    tipo: 'contrato',
    status: 'draft',
    version: 1,
    parentId: quotation.id,
    contractText,
    isAnnex: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: userId || null,
    updatedBy: userId || null,
  };

  // Use a plain INSERT (no .select().single()) to avoid PostgREST 406 on
  // content-negotiation mismatch, then fetch the created row separately.
  const contractRow = quotationToRow(contract);
  contractRow.created_by = userId || null;
  contractRow.updated_by = userId || null;

  const { error: insertError } = await supabase
    .from('sales_quotations')
    .insert(contractRow);

  if (insertError) {
    console.error('[convertToContract] Insert error:', insertError);
    throw new Error(`Erro ao criar contrato: ${insertError.message} (${insertError.code})`);
  }

  const created = await getQuotationById(contract.id);
  if (!created) {
    throw new Error('Contrato criado mas não encontrado na base. Verifique as permissões RLS.');
  }

  // --- 4. Auto-convert lead to client ---
  let finalContract = created;
  let targetClientId = quotation.clientId;

  if (quotation.leadId && !quotation.clientId) {
    try {
      const { data: lead } = await supabase.from('leads')
        .select('name, company, phone, email, document_number')
        .eq('id', quotation.leadId).single();

      if (lead) {
        const leadName = lead.company || lead.name;
        const clientId = await convertLeadToClient(quotation.leadId, {
          name: leadName,
          documentNumber: lead.document_number || undefined,
          contactName: lead.name,
          contactPhone: lead.phone || '',
          contactEmail: lead.email || '',
        });
        targetClientId = clientId;

        // Update contract with new client_id
        await supabase.from('sales_quotations').update({ client_id: clientId }).eq('id', contract.id);
        finalContract = { ...created, clientId };
      }
    } catch (err) {
      console.error('[convertToContract] Lead conversion failed:', err);
      // Non-fatal: contract is still created, just without client link
    }
  }

  // --- 5. Mark original proposal as annex + close it ---
  const updatedConteudo = {
    ...((quotation as any)._rawConteudo || {}),
    cliente: quotation.cliente,
    itensPeriodicos: quotation.itensPeriodicos,
    itensSpot: quotation.itensSpot,
    horasExcedentes: quotation.horasExcedentes,
    condicoes: quotation.condicoes,
    observacoesGerais: quotation.observacoesGerais,
    exibirTotaisPorTabela: quotation.exibirTotaisPorTabela,
    contractText: '',
    isAnnex: true,
  };

  await supabase
    .from('sales_quotations')
    .update({
      status: 'closed',
      client_id: targetClientId || undefined,
      conteudo: updatedConteudo,
      updated_by: userId || null,
    })
    .eq('id', id);

  return finalContract;
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
