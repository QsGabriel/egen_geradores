/**
 * useCRM Hook
 * Hook principal do módulo CRM — gerencia clients, leads e crm_history
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { quotationService } from '../../quotations/services';
import type { SalesQuotation } from '../../quotations/types/proposal';
import type {
  Client,
  ClientFormData,
  Lead,
  LeadFormData,
  CrmHistory,
  CrmHistoryFormData,
  LeadStatus,
  ContactLog,
} from '../types';

export function useCRM() {
  const { userProfile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [history, setHistory] = useState<CrmHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // FETCH
  // ============================================

  const fetchClients = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (err) throw err;

    const mapped: Client[] = (data || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      documentNumber: r.document_number || '',
      contactName: r.contact_name || '',
      contactPhone: r.contact_phone || '',
      contactEmail: r.contact_email || '',
      address: r.address || '',
      city: r.city || '',
      state: r.state || '',
      notes: r.notes || '',
      clientStatus: r.client_status,
      contractsCount: r.contracts_count || 0,
      quotationsCount: r.quotations_count || 0,
      lastInteraction: r.last_interaction,
      contacts: Array.isArray(r.contacts) ? r.contacts : [],
      locationUrl: r.location_url || '',
      classification: r.classification || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    setClients(mapped);
  }, []);

  const fetchLeads = useCallback(async () => {
    const PAGE = 1000;
    let all: any[] = [];
    let from = 0;
    while (true) {
      const { data, error: err } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE - 1);
      if (err) throw err;
      if (data && data.length > 0) all = all.concat(data);
      if (!data || data.length < PAGE) break;
      from += PAGE;
    }

    const mapped: Lead[] = all.map((r: any) => ({
      id: r.id,
      name: r.name,
      company: r.company || '',
      documentNumber: r.document_number || '',
      areaCode: r.area_code || '',
      phone: r.phone || '',
      email: r.email || '',
      city: r.city || '',
      state: r.state || '',
      classification: r.classification || '',
      source: r.source || '',
      status: r.status as LeadStatus,
      notes: r.notes || '',
      contacts: Array.isArray(r.contacts) ? r.contacts : [],
      scheduledAt: r.scheduled_at || null,
      convertedClientId: r.converted_client_id,
      convertedAt: r.converted_at,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    setLeads(mapped);
  }, []);

  const fetchHistory = useCallback(async (entityType?: string, entityId?: string) => {
    let query = supabase
      .from('crm_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (entityType) query = query.eq('entity_type', entityType);
    if (entityId) query = query.eq('entity_id', entityId);

    const { data, error: err } = await query;
    if (err) throw err;

    const mapped: CrmHistory[] = (data || []).map((r: any) => ({
      id: r.id,
      entityType: r.entity_type,
      entityId: r.entity_id,
      description: r.description,
      createdBy: r.created_by,
      createdAt: r.created_at,
    }));

    setHistory(mapped);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchClients(), fetchLeads(), fetchHistory()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do CRM');
    } finally {
      setLoading(false);
    }
  }, [fetchClients, fetchLeads, fetchHistory]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ============================================
  // CLIENT CRUD
  // ============================================

  const addClient = async (data: ClientFormData) => {
    const { error: err } = await supabase.from('clients').insert({
      name: data.name,
      document_number: data.documentNumber,
      contact_name: data.contactName,
      contact_phone: data.contactPhone,
      contact_email: data.contactEmail,
      address: data.address,
      city: data.city,
      state: data.state,
      notes: data.notes,
      client_status: data.clientStatus,
      contacts: data.contacts ?? [],
      location_url: data.locationUrl || null,
      classification: data.classification || null,
    });
    if (err) throw err;

    await addHistoryEntry({
      entityType: 'client',
      entityId: '', // will be filled by trigger or next fetch
      description: `Cliente "${data.name}" cadastrado`,
    });

    await fetchClients();
  };

  const updateClient = async (id: string, data: Partial<ClientFormData>) => {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.documentNumber !== undefined) updateData.document_number = data.documentNumber;
    if (data.contactName !== undefined) updateData.contact_name = data.contactName;
    if (data.contactPhone !== undefined) updateData.contact_phone = data.contactPhone;
    if (data.contactEmail !== undefined) updateData.contact_email = data.contactEmail;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.clientStatus !== undefined) updateData.client_status = data.clientStatus;
    if (data.contacts !== undefined) updateData.contacts = data.contacts;
    if (data.locationUrl !== undefined) updateData.location_url = data.locationUrl || null;
    if (data.classification !== undefined) updateData.classification = data.classification || null;

    const { error: err } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id);

    if (err) throw err;

    await addHistoryEntry({
      entityType: 'client',
      entityId: id,
      description: `Cliente atualizado`,
    });

    await fetchClients();
  };

  const deleteClient = async (id: string) => {
    const { error: err } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (err) throw err;
    await fetchClients();
  };

  // ============================================
  // LEAD CRUD
  // ============================================

  const addLead = async (data: LeadFormData) => {
    const { error: err } = await supabase.from('leads').insert({
      name: data.name,
      company: data.company,
      document_number: data.documentNumber?.trim() || null,
      area_code: data.areaCode?.trim() || null,
      phone: data.phone,
      email: data.email,
      city: data.city?.trim() || null,
      state: data.state?.trim() || null,
      classification: data.classification?.trim() || null,
      source: data.source,
      status: data.status,
      notes: data.notes,
      contacts: data.contacts ?? [],
      scheduled_at: data.scheduledAt || null,
    });
    if (err) throw err;

    await fetchLeads();
  };

  const updateLead = async (id: string, data: Partial<LeadFormData>) => {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.documentNumber !== undefined) updateData.document_number = data.documentNumber?.trim() || null;
    if (data.areaCode !== undefined) updateData.area_code = data.areaCode?.trim() || null;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.city !== undefined) updateData.city = data.city?.trim() || null;
    if (data.state !== undefined) updateData.state = data.state?.trim() || null;
    if (data.classification !== undefined) updateData.classification = data.classification?.trim() || null;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.contacts !== undefined) updateData.contacts = data.contacts;
    if (data.scheduledAt !== undefined) updateData.scheduled_at = data.scheduledAt || null;

    const { error: err } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id);

    if (err) throw err;
    await fetchLeads();
  };

  const updateLeadStatus = async (id: string, status: LeadStatus) => {
    const { error: err } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id);

    if (err) throw err;

    const lead = leads.find(l => l.id === id);
    await addHistoryEntry({
      entityType: 'lead',
      entityId: id,
      description: `Status do lead "${lead?.name || id}" alterado para "${status}"`,
    });

    await fetchLeads();
  };

  const deleteLead = async (id: string) => {
    const { error: err } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (err) throw err;
    await fetchLeads();
  };

  /**
   * Converte um lead em cliente com dados completos fornecidos via modal.
   * Requer preenchimento obrigatório antes de chamar esta função.
   */
  const convertLeadToClient = async (leadId: string, clientData: ClientFormData) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) throw new Error('Lead não encontrado');

    const { data: newClient, error: insertErr } = await supabase
      .from('clients')
      .insert({
        name: clientData.name,
        document_number: clientData.documentNumber || null,
        contact_name: clientData.contactName,
        contact_phone: clientData.contactPhone,
        contact_email: clientData.contactEmail,
        address: clientData.address || null,
        city: clientData.city || null,
        state: clientData.state || null,
        notes: clientData.notes || null,
        client_status: 'active',
        contacts: clientData.contacts ?? [],
        location_url: clientData.locationUrl || null,
        classification: clientData.classification || null,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Atualizar lead: status 'client_with_demand', vincular cliente
    const { error: updateErr } = await supabase
      .from('leads')
      .update({
        status: 'client_with_demand',
        converted_client_id: newClient.id,
        converted_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (updateErr) throw updateErr;

    await addHistoryEntry({
      entityType: 'lead',
      entityId: leadId,
      description: `Lead "${lead.name}" convertido em cliente`,
    });

    await addHistoryEntry({
      entityType: 'client',
      entityId: newClient.id,
      description: `Cliente criado a partir do lead "${lead.name}"`,
    });

    await Promise.all([fetchClients(), fetchLeads()]);
    return newClient.id;
  };

  /**
   * Gera um rascunho de proposta a partir dos dados do lead.
   * Retorna o ID da proposta criada para navegação.
   */
  const generateProposalFromLead = async (leadId: string): Promise<string> => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) throw new Error('Lead não encontrado');

    const today = new Date();
    const suffix = today.getTime().toString(36).toUpperCase().slice(-6);
    const docId = `PROP-${today.getFullYear()}-L${suffix}`;

    const draft: SalesQuotation = {
      id: crypto.randomUUID(),
      documentId: docId,
      clientId: lead.convertedClientId || null,
      leadId: lead.id,
      tipo: 'proposta',
      status: 'draft',
      dataEmissao: today.toISOString().split('T')[0],
      validade: new Date(today.getTime() + 30 * 86400000).toISOString().split('T')[0],
      cliente: {
        nome: lead.company || lead.name,
        responsavel: lead.name,
        email: lead.email,
        telefone: lead.phone,
        documento: '',
        endereco: '',
        cidadeUf: '',
      },
      itensPeriodicos: [],
      itensSpot: [],
      horasExcedentes: [],
      condicoes: {} as any,
      observacoesGerais: lead.notes || '',
      exibirTotaisPorTabela: true,
      totalPeriodicos: 0,
      totalSpot: 0,
      totalGeral: 0,
      descontoPercent: 0,
      descontoValor: 0,
      totalComDesconto: 0,
      notasInternas: '',
      version: 1,
      parentId: null,
      createdBy: null,
      updatedBy: null,
      createdAt: today.toISOString(),
      updatedAt: today.toISOString(),
    };

    const created = await quotationService.create(draft);

    await addHistoryEntry({
      entityType: 'lead',
      entityId: lead.id,
      description: `Proposta "${created.documentId}" gerada a partir do lead`,
    });

    // Avança para 'in_proposal' apenas se não for já cliente
    if (!['client_with_demand', 'client_no_demand'].includes(lead.status)) {
      await updateLeadStatus(lead.id, 'in_proposal');
    }

    return created.id;
  };

  // ============================================
  // CONTACT LOG
  // ============================================

  const fetchContactLogs = useCallback(async (
    entityType: 'client' | 'lead',
    entityId: string,
  ): Promise<ContactLog[]> => {
    const { data, error: err } = await supabase
      .from('contact_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('contacted_at', { ascending: false });

    if (err) throw err;

    return (data || []).map((r: any) => ({
      id: r.id,
      entityType: r.entity_type as 'client' | 'lead',
      entityId: r.entity_id,
      contactedPerson: r.contacted_person,
      notes: r.notes,
      contactedAt: r.contacted_at,
      createdBy: r.created_by,
      createdAt: r.created_at,
    }));
  }, []);

  const addContactLog = useCallback(async (
    entityType: 'client' | 'lead',
    entityId: string,
    contactedPerson: string,
    notes: string,
    contactedAt: string,
  ): Promise<void> => {
    const createdBy = userProfile?.name || userProfile?.email || 'Sistema';

    const { error: err } = await supabase.from('contact_logs').insert({
      entity_type: entityType,
      entity_id: entityId,
      contacted_person: contactedPerson.trim(),
      notes: notes.trim(),
      contacted_at: contactedAt,
      created_by: createdBy,
    });

    if (err) throw err;
  }, [userProfile]);

  // ============================================
  // CRM HISTORY
  // ============================================

  const addHistoryEntry = async (data: CrmHistoryFormData) => {
    const createdBy = userProfile?.name || userProfile?.email || 'Sistema';

    const { error: err } = await supabase.from('crm_history').insert({
      entity_type: data.entityType,
      entity_id: data.entityId,
      description: data.description,
      created_by: createdBy,
    });

    // Não propaga erro de histórico para não bloquear operação principal
    if (err) console.error('Erro ao registrar histórico CRM:', err);
  };

  const getEntityHistory = async (entityType: string, entityId: string) => {
    await fetchHistory(entityType, entityId);
  };

  // ============================================
  // LEAD IMPORT (importação em massa)
  // ============================================

  const IMPORT_BATCH_SIZE = 200;

  const importLeads = async (
    rows: LeadFormData[],
    onProgress?: (done: number, total: number) => void,
  ): Promise<{ imported: number; errors: string[] }> => {
    const errors: string[] = [];
    let imported = 0;

    // Validate and prepare payloads
    type IndexedRecord = { index: number; payload: Record<string, unknown> };
    const valid: IndexedRecord[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.name?.trim()) {
        errors.push(`Linha ${i + 2}: campo "Nome" é obrigatório.`);
        continue;
      }
      valid.push({
        index: i,
        payload: {
          name: row.name.trim(),
          company: row.company?.trim() || '',
          document_number: row.documentNumber?.trim() || null,
          area_code: row.areaCode?.trim() || null,
          phone: row.phone?.trim() || '',
          email: row.email?.trim() || '',
          city: row.city?.trim() || null,
          state: row.state?.trim() || null,
          classification: row.classification?.trim() || null,
          source: row.source?.trim() || '',
          status: row.status || 'to_contact',
          notes: row.notes?.trim() || '',
          contacts: row.contacts ?? [],
        },
      });
    }

    // Insert in batches to handle high volumes efficiently
    for (let b = 0; b < valid.length; b += IMPORT_BATCH_SIZE) {
      const batch = valid.slice(b, b + IMPORT_BATCH_SIZE);
      try {
        const { error: err } = await supabase
          .from('leads')
          .insert(batch.map(r => r.payload));
        if (err) {
          batch.forEach(r =>
            errors.push(`Linha ${r.index + 2} (${rows[r.index].name}): ${err.message}`),
          );
        } else {
          imported += batch.length;
        }
      } catch {
        batch.forEach(r =>
          errors.push(`Linha ${r.index + 2}: erro inesperado.`),
        );
      }
      onProgress?.(Math.min(b + IMPORT_BATCH_SIZE, valid.length), valid.length);
    }

    if (imported > 0) await fetchLeads();
    return { imported, errors };
  };

  // ============================================
  // RETURN
  // ============================================

  return {
    // State
    clients,
    leads,
    history,
    loading,
    error,

    // Client operations
    addClient,
    updateClient,
    deleteClient,

    // Lead operations
    addLead,
    updateLead,
    updateLeadStatus,
    deleteLead,
    convertLeadToClient,
    generateProposalFromLead,
    importLeads,

    // Contact log operations
    fetchContactLogs,
    addContactLog,

    // History operations
    addHistoryEntry,
    getEntityHistory,

    // Refresh
    refreshData: fetchAll,
  };
}
