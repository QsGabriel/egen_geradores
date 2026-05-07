/**
 * useCRM Hook
 * Hook principal do módulo CRM — gerencia clients, leads e crm_history
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import type {
  Client,
  ClientFormData,
  Lead,
  LeadFormData,
  CrmHistory,
  CrmHistoryFormData,
  LeadStatus,
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
    const { data, error: err } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) throw err;

    const mapped: Lead[] = (data || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      company: r.company || '',
      phone: r.phone || '',
      email: r.email || '',
      source: r.source || '',
      status: r.status,
      notes: r.notes || '',
      contacts: Array.isArray(r.contacts) ? r.contacts : [],
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
      phone: data.phone,
      email: data.email,
      source: data.source,
      status: data.status,
      notes: data.notes,
      contacts: data.contacts ?? [],
    });
    if (err) throw err;

    await fetchLeads();
  };

  const updateLead = async (id: string, data: Partial<LeadFormData>) => {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.company !== undefined) updateData.company = data.company;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.contacts !== undefined) updateData.contacts = data.contacts;

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
   * Converte um lead em cliente, migrando dados automaticamente.
   */
  const convertLeadToClient = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) throw new Error('Lead não encontrado');

    // Criar cliente a partir dos dados do lead
    const { data: newClient, error: insertErr } = await supabase
      .from('clients')
      .insert({
        name: lead.company || lead.name,
        contact_name: lead.name,
        contact_phone: lead.phone,
        contact_email: lead.email,
        notes: lead.notes,
        client_status: 'active',
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Atualizar lead com referência ao cliente e status "won"
    const { error: updateErr } = await supabase
      .from('leads')
      .update({
        status: 'won',
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
          phone: row.phone?.trim() || '',
          email: row.email?.trim() || '',
          source: row.source?.trim() || '',
          status: row.status || 'new',
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
    importLeads,

    // History operations
    addHistoryEntry,
    getEntityHistory,

    // Refresh
    refreshData: fetchAll,
  };
}
