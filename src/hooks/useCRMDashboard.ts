import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Client, Lead, LeadStatus } from '../modules/crm/types';

export interface CRMQuotation {
  id: string;
  code: string;
  clientId: string | null;
  clientName?: string;
  title: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
  totalAmount: number;
  validUntil: string | null;
  createdAt: string;
}

export interface SalesQuotationSummary {
  id: string;
  documentId: string;
  clientId: string | null;
  leadId: string | null;
  tipo: string;
  status: string;
  totalGeral: number;
  totalComDesconto: number;
  dataEmissao: string;
  validade: string;
  createdAt: string;
}

export interface CRMDashboardMetrics {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  blockedClients: number;
  prospectClients: number;
  newClientsThisMonth: number;
  totalLeads: number;
  newLeadsThisMonth: number;
  leadsByStatus: Record<LeadStatus, number>;
  convertedLeads: number;
  conversionRate: number;
  totalProposals: number;
  proposalsByStatus: Record<string, number>;
  proposalsTotalValue: number;
  approvedProposalsValue: number;
  leadsRequiringContact: number;
  leadsRequiringFollowUp: number;
  recentActivity: CrmActivity[];
  monthlyClientGrowth: MonthlyTrend[];
  monthlyLeadGrowth: MonthlyTrend[];
  vendedorRanking: VendedorRanking[];
}

export interface CrmActivity {
  id: string;
  type: 'new_client' | 'new_lead' | 'lead_converted' | 'proposal_created' | 'proposal_approved';
  description: string;
  entity: string;
  createdAt: string;
}

export interface MonthlyTrend {
  month: string;
  count: number;
}

export interface VendedorRanking {
  id: string;
  name: string;
  totalPropostas: number;
  valorTotal: number;
  propostasFechadas: number;
  propostasEmNegociacao: number;
  propostasPerdidas: number;
  propostasPesquisa: number;
  totalLeads: number;
  leadsConvertidos: number;
  taxaConversao: number;
}

export function useCRMDashboard(vendedorId?: string | null, includeRanking: boolean = true, periodo: '30d' | '90d' | 'ano' | 'todos' = 'todos') {
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotations, setQuotations] = useState<CRMQuotation[]>([]);
  const [salesQuotations, setSalesQuotations] = useState<SalesQuotationSummary[]>([]);
  const [vendedorRanking, setVendedorRanking] = useState<VendedorRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let salesQuery = supabase.from('sales_quotations').select('*').order('created_at', { ascending: false });
      if (vendedorId) {
        salesQuery = salesQuery.eq('vendedor_id', vendedorId);
      }

      const [clientsRes, leadsRes, quotationsRes, salesRes] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('leads').select('*').order('created_at', { ascending: false }),
        supabase.from('quotations').select('*').order('created_at', { ascending: false }),
        salesQuery,
      ]);

      if (clientsRes.error) console.warn('Erro ao buscar clients:', clientsRes.error.message);
      if (leadsRes.error) console.warn('Erro ao buscar leads:', leadsRes.error.message);
      if (quotationsRes.error) console.warn('Erro ao buscar quotations:', quotationsRes.error.message);
      if (salesRes.error) console.warn('Erro ao buscar sales_quotations:', salesRes.error.message);

      const rawClients: any[] = clientsRes.data || [];
      const rawLeads: any[] = leadsRes.data || [];
      const rawQuotations: any[] = quotationsRes.data || [];
      const rawSales: any[] = salesRes.data || [];

      setClients(rawClients.map(mapClient));
      setLeads(rawLeads.map(mapLead));

      const clientMap = new Map<string, string>();
      rawClients.forEach((c: any) => clientMap.set(c.id, c.name));

      setQuotations(rawQuotations.map((q: any) => mapQuotation(q, clientMap)));
      setSalesQuotations(rawSales.map(mapSalesQuotation));

      // Ranking de vendedores — só busca quando o usuário tem permissão
      // (evita expor a produção de terceiros a quem não pode vê-la).
      if (includeRanking) {
        let rankingQuery = supabase
          .from('sales_quotations')
          .select('vendedor_id, total_com_desconto, status, data_emissao')
          .not('vendedor_id', 'is', null);

        if (periodo !== 'todos') {
          const now = new Date();
          let cutoff = new Date();
          if (periodo === '30d') {
            cutoff.setDate(now.getDate() - 30);
          } else if (periodo === '90d') {
            cutoff.setDate(now.getDate() - 90);
          } else if (periodo === 'ano') {
            cutoff.setMonth(0);
            cutoff.setDate(1);
          }
          rankingQuery = rankingQuery.gte('data_emissao', cutoff.toISOString().split('T')[0]);
        }

        const rankingRes = await rankingQuery;
        const rankingRaw: any[] = rankingRes.data || [];
        if (rankingRaw.length > 0) {
          const vendedorIds = [...new Set(rankingRaw.map(r => r.vendedor_id))];
          const { data: profiles } = await supabase.from('user_profiles').select('id, name').in('id', vendedorIds);
          const nameMap = new Map<string, string>();
          (profiles || []).forEach((p: any) => nameMap.set(p.id, p.name));

          // Fetch leads by vendedor
          const { data: leadsData } = await supabase
            .from('leads')
            .select('converted_client_id, converted_at');
          const vendedorLeadsMap = new Map<string, { total: number; convertidos: number }>();

          // Since leads table doesn't have vendedor_id, approximate using the
          // quotation's vendedor_id when leads are associated with quotations.
          const rankingMap = new Map<string, VendedorRanking>();
          rankingRaw.forEach((r: any) => {
            const entry = rankingMap.get(r.vendedor_id) || {
              id: r.vendedor_id,
              name: nameMap.get(r.vendedor_id) || 'Desconhecido',
              totalPropostas: 0,
              valorTotal: 0,
              propostasFechadas: 0,
              propostasEmNegociacao: 0,
              propostasPerdidas: 0,
              propostasPesquisa: 0,
              totalLeads: 0,
              leadsConvertidos: 0,
              taxaConversao: 0,
            };
            entry.totalPropostas++;
            entry.valorTotal += r.total_com_desconto || 0;
            if (r.status === 'closed') entry.propostasFechadas++;
            if (r.status === 'negotiating') entry.propostasEmNegociacao++;
            if (r.status === 'lost') entry.propostasPerdidas++;
            if (r.status === 'price_survey') entry.propostasPesquisa++;
            rankingMap.set(r.vendedor_id, entry);
          });

          // Approximate leads by vendedor using converted leads count from leads table
          const convertedLeadIds = new Set((leadsData || []).filter((l: any) => l.converted_client_id).map((l: any) => l.converted_client_id));
          vendedorIds.forEach(id => {
            const entry = rankingMap.get(id);
            if (entry) {
              entry.totalLeads = convertedLeadIds.size > 0 ? Math.round(convertedLeadIds.size / vendedorIds.length) : 0;
              entry.leadsConvertidos = Math.round(convertedLeadIds.size / vendedorIds.length);
              entry.taxaConversao = entry.totalLeads > 0
                ? Math.round((entry.propostasFechadas / entry.totalPropostas) * 100)
                : 0;
            }
          });

          setVendedorRanking(
            Array.from(rankingMap.values()).sort((a, b) => b.valorTotal - a.valorTotal),
          );
        } else {
          setVendedorRanking([]);
        }
      } else {
        setVendedorRanking([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [vendedorId, includeRanking, periodo]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const metrics = computeMetrics(clients, leads, quotations, salesQuotations, vendedorRanking);

  return {
    clients,
    leads,
    quotations,
    salesQuotations,
    metrics,
    loading,
    error,
    refresh: fetchAll,
  };
}

function mapClient(r: any): Client {
  return {
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
    locationUrl: r.location_url || '',
    classification: r.classification || '',
    clientStatus: r.client_status,
    contractsCount: r.contracts_count || 0,
    quotationsCount: r.quotations_count || 0,
    contacts: Array.isArray(r.contacts) ? r.contacts : [],
    lastInteraction: r.last_interaction,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapLead(r: any): Lead {
  return {
    id: r.id,
    name: r.name,
    company: r.company || '',
    responsavel: r.responsavel || '',
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
    scheduledAt: r.scheduled_at,
    convertedClientId: r.converted_client_id,
    convertedAt: r.converted_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapQuotation(r: any, clientMap: Map<string, string>): CRMQuotation {
  return {
    id: r.id,
    code: r.code,
    clientId: r.client_id,
    clientName: r.client_id ? clientMap.get(r.client_id) : undefined,
    title: r.title,
    status: r.status,
    totalAmount: Number(r.total_amount) || 0,
    validUntil: r.valid_until,
    createdAt: r.created_at,
  };
}

function mapSalesQuotation(r: any): SalesQuotationSummary {
  return {
    id: r.id,
    documentId: r.document_id,
    clientId: r.client_id,
    leadId: r.lead_id,
    tipo: r.tipo,
    status: r.status,
    totalGeral: Number(r.total_geral) || 0,
    totalComDesconto: Number(r.total_com_desconto) || 0,
    dataEmissao: r.data_emissao,
    validade: r.validade,
    createdAt: r.created_at,
  };
}

function computeMetrics(
  clients: Client[],
  leads: Lead[],
  quotations: CRMQuotation[],
  salesQuotations: SalesQuotationSummary[],
  vendedorRanking: VendedorRanking[],
): CRMDashboardMetrics {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const isThisMonth = (d: string) => {
    if (!d) return false;
    const date = new Date(d);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  };

  // Clients
  const activeClients = clients.filter(c => c.clientStatus === 'active').length;
  const inactiveClients = clients.filter(c => c.clientStatus === 'inactive').length;
  const blockedClients = clients.filter(c => c.clientStatus === 'blocked').length;
  const prospectClients = clients.filter(c => c.clientStatus === 'prospect').length;
  const newClientsThisMonth = clients.filter(c => isThisMonth(c.createdAt)).length;

  // Leads
  const newLeadsThisMonth = leads.filter(l => isThisMonth(l.createdAt)).length;
  const convertedLeads = leads.filter(l => l.convertedClientId).length;
  const conversionRate = leads.length > 0 ? (convertedLeads / leads.length) * 100 : 0;

  const leadsByStatus = {} as Record<LeadStatus, number>;
  const allStatuses: LeadStatus[] = [
    'to_contact', 'no_demand', 'potential_client', 'follow_up',
    'in_proposal', 'client_no_demand', 'client_with_demand',
  ];
  allStatuses.forEach(s => { leadsByStatus[s] = leads.filter(l => l.status === s).length; });

  const leadsRequiringContact = leads.filter(l => l.status === 'to_contact').length;
  const leadsRequiringFollowUp = leads.filter(l => l.status === 'follow_up' || l.status === 'potential_client').length;

  // Proposals (combine quotations + sales_quotations)
  const allProposals = [
    ...quotations.map(q => ({ status: q.status, value: q.totalAmount, date: q.createdAt })),
    ...salesQuotations.map(s => ({ status: s.status, value: s.totalComDesconto, date: s.dataEmissao })),
  ];

  const proposalsByStatus: Record<string, number> = {};
  allProposals.forEach(p => {
    proposalsByStatus[p.status] = (proposalsByStatus[p.status] || 0) + 1;
  });

  const proposalsTotalValue = allProposals.reduce((sum, p) => sum + p.value, 0);
  const approvedProposalsValue = quotations
    .filter(q => q.status === 'approved')
    .reduce((sum, q) => sum + q.totalAmount, 0);

  // Recent activity
  const recentActivity = buildRecentActivity(clients, leads, quotations, salesQuotations);

  // Monthly trends (last 6 months)
  const monthlyClientGrowth = buildMonthlyTrends(clients, 'createdAt', 6);
  const monthlyLeadGrowth = buildMonthlyTrends(leads, 'createdAt', 6);

  return {
    totalClients: clients.length,
    activeClients,
    inactiveClients,
    blockedClients,
    prospectClients,
    newClientsThisMonth,
    totalLeads: leads.length,
    newLeadsThisMonth,
    leadsByStatus,
    convertedLeads,
    conversionRate,
    totalProposals: allProposals.length,
    proposalsByStatus,
    proposalsTotalValue,
    approvedProposalsValue,
    leadsRequiringContact,
    leadsRequiringFollowUp,
    recentActivity,
    monthlyClientGrowth,
    monthlyLeadGrowth,
    vendedorRanking,
  };
}

function buildRecentActivity(
  clients: Client[],
  leads: Lead[],
  quotations: CRMQuotation[],
  salesQuotations: SalesQuotationSummary[],
): CrmActivity[] {
  const activities: CrmActivity[] = [];

  clients.slice(0, 3).forEach(c => {
    activities.push({
      id: `client-${c.id}`,
      type: 'new_client',
      description: `Novo cliente cadastrado`,
      entity: c.name,
      createdAt: c.createdAt,
    });
  });

  leads.filter(l => l.convertedClientId).slice(0, 3).forEach(l => {
    activities.push({
      id: `conv-${l.id}`,
      type: 'lead_converted',
      description: `Lead convertido em cliente`,
      entity: l.name,
      createdAt: l.convertedAt || l.updatedAt,
    });
  });

  leads.slice(0, 5).forEach(l => {
    activities.push({
      id: `lead-${l.id}`,
      type: 'new_lead',
      description: `Novo lead captado via ${l.source || 'outro'}`,
      entity: l.name,
      createdAt: l.createdAt,
    });
  });

  quotations.slice(0, 5).forEach(q => {
    activities.push({
      id: `quot-${q.id}`,
      type: 'proposal_created',
      description: `Proposta ${q.code} criada`,
      entity: q.clientName || q.title,
      createdAt: q.createdAt,
    });
  });

  salesQuotations.slice(0, 5).forEach(s => {
    activities.push({
      id: `sales-${s.id}`,
      type: 'proposal_created',
      description: `Proposta ${s.documentId} (${s.tipo})`,
      entity: s.documentId,
      createdAt: s.createdAt,
    });
  });

  return activities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);
}

function buildMonthlyTrends(items: { createdAt: string }[], dateField: string, months: number): MonthlyTrend[] {
  const now = new Date();
  const result: MonthlyTrend[] = [];
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
    const count = items.filter(item => {
      if (!item.createdAt) return false;
      const itemDate = new Date(item.createdAt);
      return itemDate.getMonth() === d.getMonth() && itemDate.getFullYear() === d.getFullYear();
    }).length;
    result.push({ month: key, count });
  }

  return result;
}
