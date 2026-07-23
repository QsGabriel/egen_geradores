/**
 * EGEN System - Proposal Management Page
 * Página de listagem e gerenciamento de propostas comerciais
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  FileText,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Settings,
} from 'lucide-react';
import { quotationService } from '../../services';
import type { SalesQuotation, DocumentStatus } from '../../types/proposal';
import { DocumentStatusLabels, DocumentStatusColors, DocumentTipoLabels } from '../../types/proposal';
import { useNotification } from '../../../../hooks/useNotification';
import { useAuth } from '../../../../hooks/useAuth';
import { hasPermission } from '../../../../utils/permissions';
import Notification from '../../../../components/Notification';
import { supabase } from '../../../../lib/supabase';

// ============================================
// HELPERS
// ============================================

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (iso: string) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

const STATUS_ORDER: DocumentStatus[] = [
  'draft',
  'negotiating',
  'price_survey',
  'closed',
  'lost',
  'cancelled',
];

// ============================================
// STATUS METRIC CARD
// ============================================

interface StatusCardProps {
  label: string;
  count: number;
  active: boolean;
  colorClass: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function StatusCard({ label, count, active, colorClass, icon, onClick }: StatusCardProps) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 w-full active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-yellow-500 dark:focus-visible:ring-offset-gray-900
        ${active
          ? `${colorClass} border-current shadow-md`
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
        }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
        ${active ? 'bg-white/30 dark:bg-black/20' : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-gray-200 dark:group-hover:bg-gray-600'}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={`text-2xl font-bold leading-none ${active ? 'text-current' : 'text-gray-800 dark:text-gray-100'}`}>
          {count}
        </p>
        <p className={`text-xs font-medium mt-0.5 truncate ${active ? 'text-current opacity-80' : 'text-gray-500 dark:text-gray-400'}`}>
          {label}
        </p>
      </div>
      {active && <CheckCircle2 className="w-5 h-5 ml-auto flex-shrink-0 opacity-70" />}
    </button>
  );
}

// ============================================
// DELETE CONFIRM DIALOG
// ============================================

interface DeleteDialogProps {
  proposal: SalesQuotation;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function DeleteDialog({ proposal, onConfirm, onCancel, loading }: DeleteDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Excluir Proposta</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Tem certeza que deseja excluir a proposta{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-300">{proposal.documentId}</span>{' '}
              de <span className="font-semibold text-gray-700 dark:text-gray-300">{proposal.cliente.nome || 'cliente não informado'}</span>?
              Esta ação não pode ser desfeita.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-150 active:scale-[0.97] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-all duration-150 active:scale-[0.97] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// STATUS BADGE
// ============================================

function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${DocumentStatusColors[status]}`}>
      {DocumentStatusLabels[status]}
    </span>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProposalManagementPage() {
  const navigate = useNavigate();

  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const { userProfile } = useAuth();
  const userPermissions = userProfile?.permissions ?? [];
  const canViewAll = hasPermission(userPermissions, 'canViewAllProposals');
  const userId = userProfile?.id;

  const [proposals, setProposals] = useState<SalesQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [vendedorFilter, setVendedorFilter] = useState<string>('all');

  // Sincroniza filtro de vendedor com permissões (cobre carregamento assíncrono)
  useEffect(() => {
    if (canViewAll) {
      setVendedorFilter(prev => prev === 'all' ? prev : 'all');
    } else if (userId) {
      setVendedorFilter(userId);
    }
  }, [canViewAll, userId]);
  const [tipoFilter, setTipoFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  const [vendedores, setVendedores] = useState<{ id: string; name: string }[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<SalesQuotation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Data loading ----

  useEffect(() => {
    supabase.from('user_profiles').select('id, name').order('name').then(({ data }) => {
      if (data) setVendedores(data);
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, count } = await quotationService.list({
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        vendedorId: vendedorFilter !== 'all' ? vendedorFilter : undefined,
        tipo: tipoFilter !== 'all' ? tipoFilter : undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        minValue: minValue ? Number(minValue) : undefined,
        maxValue: maxValue ? Number(maxValue) : undefined,
        sortField: sortField || undefined,
        sortDir: sortField ? sortDir : undefined,
        page,
        pageSize,
      });
      setProposals(data);
      setTotalCount(count);
    } catch (err) {
      console.error('[ProposalManagementPage] load error:', err);
      setError('Não foi possível carregar as propostas. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, vendedorFilter, tipoFilter, fromDate, toDate, minValue, maxValue, sortField, sortDir, page, pageSize]);

  useEffect(() => { load(); }, [load]);

  // Debounce search input
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  // ---- Metrics ----

  const metrics = useMemo(() => {
    // Counts are derived from the full list (no status filter applied)
    const countByStatus = (s: DocumentStatus) =>
      proposals.filter(p => p.status === s).length;

    return {
      all: proposals.length,
      draft: countByStatus('draft'),
      negotiating: countByStatus('negotiating'),
      price_survey: countByStatus('price_survey'),
      closed: countByStatus('closed'),
      lost: countByStatus('lost'),
      cancelled: countByStatus('cancelled'),
      totalValue: proposals
        .filter(p => p.status !== 'cancelled' && p.status !== 'lost')
        .reduce((sum, p) => sum + (p.totalComDesconto || p.totalGeral || 0), 0),
    };
  }, [proposals]);

  // ---- Actions ----

  const handleSort = (field: string) => {
    setSortField(prev => {
      if (prev === field) {
        setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortDir('asc');
      return field;
    });
    setPage(1);
  };

  const sortIndicator = (field: string) => {
    if (sortField !== field) {
      return <span className="text-gray-300 dark:text-gray-600 ml-1">⇅</span>;
    }
    return sortDir === 'asc'
      ? <ChevronUp className="inline w-3.5 h-3.5 text-yellow-500 ml-1" />
      : <ChevronDown className="inline w-3.5 h-3.5 text-yellow-500 ml-1" />;
  };

  const activeFilterCount = [
    statusFilter !== 'all',
    vendedorFilter !== 'all',
    tipoFilter !== 'all',
    fromDate !== '',
    toDate !== '',
    minValue !== '',
    maxValue !== '',
    debouncedSearch !== '',
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setVendedorFilter(!canViewAll && userId ? userId : 'all');
    setTipoFilter('all');
    setFromDate('');
    setToDate('');
    setMinValue('');
    setMaxValue('');
    setSortField('');
    setSortDir('asc');
    setPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === proposals.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(proposals.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkStatusChange = async (status: DocumentStatus) => {
    setBulkActionLoading(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => quotationService.updateStatus(id, status)),
      );
      showSuccess('Status atualizado', `${selectedIds.size} proposta(s) atualizada(s) com sucesso.`);
      setSelectedIds(new Set());
      load();
    } catch (err) {
      showError('Erro', 'Não foi possível atualizar o status das propostas.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Excluir ${selectedIds.size} proposta(s)? Esta ação não pode ser desfeita.`)) return;
    setBulkActionLoading(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => quotationService.delete(id)),
      );
      showSuccess('Propostas excluídas', `${selectedIds.size} proposta(s) removida(s) com sucesso.`);
      setSelectedIds(new Set());
      load();
    } catch (err) {
      showError('Erro', 'Não foi possível excluir as propostas.');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleNew = () => navigate('/propostas/nova');

  const handleView = (p: SalesQuotation) => navigate(`/propostas/${p.id}?mode=preview`);

  const handleEdit = (p: SalesQuotation) => navigate(`/propostas/${p.id}`);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await quotationService.delete(deleteTarget.id);
      showSuccess(
        'Proposta excluída',
        `${deleteTarget.documentId || 'Proposta'} foi removida com sucesso.`
      );
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.error('[ProposalManagementPage] delete error:', err);
      showError(
        'Erro ao excluir',
        'Não foi possível excluir a proposta. Tente novamente.'
      );
    } finally {
      setDeleting(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  const isEmpty = !loading && proposals.length === 0;

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6 animate-fade-in">

      {/* ===== PAGE HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileText className="h-8 w-8 text-yellow-500" />
            Gestão de Propostas
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Crie, acompanhe e gerencie propostas comerciais de locação
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/configuracoes')}
            title="Configurações da capa"
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.93] transition-all duration-150 shadow-sm"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={load}
            disabled={loading}
            title="Atualizar lista"
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 active:scale-[0.93] transition-all duration-150 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-gray-900 rounded-xl font-semibold text-sm transition-all duration-150 shadow-md hover:shadow-lg active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Proposta</span>
          </button>
        </div>
      </div>

      {/* ===== METRIC CARDS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatusCard
          label="Rascunho"
          count={metrics.draft}
          active={statusFilter === 'draft'}
          colorClass="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          icon={<FileText className={`w-5 h-5 ${statusFilter === 'draft' ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}`} />}
          onClick={() => setStatusFilter(statusFilter === 'draft' ? 'all' : 'draft')}
        />
        <StatusCard
          label="Em negociação"
          count={metrics.negotiating}
          active={statusFilter === 'negotiating'}
          colorClass="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
          icon={<TrendingUp className={`w-5 h-5 ${statusFilter === 'negotiating' ? 'text-blue-700 dark:text-blue-300' : 'text-blue-500 dark:text-blue-400'}`} />}
          onClick={() => setStatusFilter(statusFilter === 'negotiating' ? 'all' : 'negotiating')}
        />
        <StatusCard
          label="Tomada de preço"
          count={metrics.price_survey}
          active={statusFilter === 'price_survey'}
          colorClass="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
          icon={<DollarSign className={`w-5 h-5 ${statusFilter === 'price_survey' ? 'text-amber-700 dark:text-amber-300' : 'text-amber-500 dark:text-amber-400'}`} />}
          onClick={() => setStatusFilter(statusFilter === 'price_survey' ? 'all' : 'price_survey')}
        />
        <StatusCard
          label="Proposta Fechada"
          count={metrics.closed}
          active={statusFilter === 'closed'}
          colorClass="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
          icon={<CheckCircle2 className={`w-5 h-5 ${statusFilter === 'closed' ? 'text-emerald-700 dark:text-emerald-300' : 'text-emerald-500 dark:text-emerald-400'}`} />}
          onClick={() => setStatusFilter(statusFilter === 'closed' ? 'all' : 'closed')}
        />
        <StatusCard
          label="Proposta Perdida"
          count={metrics.lost}
          active={statusFilter === 'lost'}
          colorClass="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
          icon={<XCircle className={`w-5 h-5 ${statusFilter === 'lost' ? 'text-red-700 dark:text-red-300' : 'text-red-500 dark:text-red-400'}`} />}
          onClick={() => setStatusFilter(statusFilter === 'lost' ? 'all' : 'lost')}
        />
        <StatusCard
          label="Canceladas"
          count={metrics.cancelled}
          active={statusFilter === 'cancelled'}
          colorClass="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
          icon={<XCircle className={`w-5 h-5 ${statusFilter === 'cancelled' ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400'}`} />}
          onClick={() => setStatusFilter(statusFilter === 'cancelled' ? 'all' : 'cancelled')}
        />
      </div>

      {/* ===== SEARCH & FILTER BAR ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por cliente ou número da proposta..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
            />
            {search && (
              <button
                onClick={() => { setSearch(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 active:scale-90 transition-transform duration-150"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {canViewAll ? (
            <select
              value={vendedorFilter}
              onChange={e => { setVendedorFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 text-sm font-medium bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 cursor-pointer transition-all min-w-[140px]"
            >
              <option value="all">Todos os vendedores</option>
              {vendedores.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          ) : (
            <div className="px-3 py-2.5 text-sm font-medium bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300">
              Minhas propostas
            </div>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl border transition-all ${showFilters ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300'}`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-yellow-500 text-white text-xs font-bold">{activeFilterCount}</span>
            )}
            {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 flex items-center gap-1.5">
            <span>
              {loading ? '...' : `${totalCount} proposta${totalCount !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tipo</label>
              <select
                value={tipoFilter}
                onChange={e => { setTipoFilter(e.target.value); setPage(1); }}
                className="w-full px-2.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-yellow-500"
              >
                <option value="all">Todos os tipos</option>
                <option value="proposta">Proposta Comercial</option>
                <option value="orcamento">Orçamento</option>
                <option value="contrato">Contrato de Locação</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data de</label>
              <input
                type="date"
                value={fromDate}
                onChange={e => { setFromDate(e.target.value); setPage(1); }}
                className="w-full px-2.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Data até</label>
              <input
                type="date"
                value={toDate}
                onChange={e => { setToDate(e.target.value); setPage(1); }}
                className="w-full px-2.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Valor mín. (R$)</label>
              <input
                type="number"
                value={minValue}
                onChange={e => { setMinValue(e.target.value); setPage(1); }}
                placeholder="0"
                className="w-full px-2.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Valor máx. (R$)</label>
              <input
                type="number"
                value={maxValue}
                onChange={e => { setMaxValue(e.target.value); setPage(1); }}
                placeholder="0"
                className="w-full px-2.5 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
              >
                Limpar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== ERROR STATE ===== */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
          <button onClick={load} className="ml-auto underline hover:no-underline active:scale-95 transition-all duration-150">Tentar novamente</button>
        </div>
      )}

      {/* ===== LOADING SKELETON ===== */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="w-16 h-4 skeleton" />
                <div className="flex-1 h-4 skeleton" />
                <div className="w-24 h-4 skeleton hidden sm:block" />
                <div className="w-28 h-4 skeleton hidden md:block" />
                <div className="w-24 h-6 skeleton-circle hidden lg:block" />
                <div className="w-20 h-8 skeleton rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== EMPTY STATE ===== */}
      {isEmpty && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm px-6 py-10 sm:p-12 text-center">
          <div className="w-16 h-16 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {search || statusFilter !== 'all' ? 'Nenhuma proposta encontrada' : 'Nenhuma proposta criada ainda'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {search || statusFilter !== 'all'
              ? 'Tente usar outros termos de busca ou remova os filtros.'
              : 'Crie sua primeira proposta comercial agora.'}
          </p>
          {!search && statusFilter === 'all' && (
            <button
              onClick={handleNew}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-gray-900 rounded-xl font-semibold text-sm transition-all duration-150 shadow-md hover:shadow-lg active:scale-[0.97]"
            >
              <Plus className="w-4 h-4" />
              Nova Proposta
            </button>
          )}
        </div>
      )}

      {/* ===== TABLE (DESKTOP) + CARDS (MOBILE) ===== */}
      {!loading && proposals.length > 0 && (
        <>
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl px-4 py-3 shadow-sm">
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {selectedIds.size} proposta(s) selecionada(s)
              </span>
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) handleBulkStatusChange(v as DocumentStatus);
                    e.target.value = '';
                  }}
                  disabled={bulkActionLoading}
                  className="px-3 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-yellow-500 cursor-pointer disabled:opacity-50"
                >
                  <option value="">Alterar status...</option>
                  <option value="draft">Rascunho</option>
                  <option value="negotiating">Em negociação</option>
                  <option value="price_survey">Tomada de preço</option>
                  <option value="closed">Fechada</option>
                  <option value="lost">Perdida</option>
                  <option value="cancelled">Cancelada</option>
                </select>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkActionLoading}
                  className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 transition-all"
                >
                  {bulkActionLoading ? '...' : `Excluir (${selectedIds.size})`}
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  Limpar seleção
                </button>
              </div>
            </div>
          )}

          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="px-3 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === proposals.length && proposals.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-yellow-500 focus:ring-yellow-500 cursor-pointer"
                    />
                  </th>
                  <th
                    className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-36 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                    onClick={() => handleSort('documentId')}
                  >
                    Nº Proposta {sortIndicator('documentId')}
                  </th>
                  <th
                    className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                    onClick={() => handleSort('cliente')}
                  >
                    Cliente {sortIndicator('cliente')}
                  </th>
                  <th
                    className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-36 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                    onClick={() => handleSort('vendedor')}
                  >
                    Vendedor {sortIndicator('vendedor')}
                  </th>
                  <th
                    className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-36 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                    onClick={() => handleSort('dataEmissao')}
                  >
                    Data de Emissão {sortIndicator('dataEmissao')}
                  </th>
                  <th
                    className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-44 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 select-none"
                    onClick={() => handleSort('status')}
                  >
                    Status {sortIndicator('status')}
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {proposals.map((p, idx) => (
                  <tr
                    key={p.id}
                    className="group hover:bg-yellow-50/40 dark:hover:bg-yellow-900/10 active:bg-yellow-50/70 dark:active:bg-yellow-900/20 transition-colors"
                    style={{ animationDelay: `${Math.min(idx * 0.03, 0.18)}s` }}
                  >
                    <td className="px-3 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-yellow-500 focus:ring-yellow-500 cursor-pointer"
                      />
                    </td>
                    {/* Número */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <span className="font-mono font-semibold text-gray-800 dark:text-gray-100 text-xs">
                            {p.documentId || `#${p.id.slice(0, 6).toUpperCase()}`}
                          </span>
                          <p className="text-[10px] text-gray-400 dark:text-gray-400 mt-0.5">
                            {DocumentTipoLabels[p.tipo] || p.tipo}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Cliente */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 dark:text-gray-100 truncate max-w-xs">
                            {p.cliente.nome || <span className="text-gray-400 italic">Não informado</span>}
                          </p>
                          {p.cliente.responsavel && (
                            <p className="text-xs text-gray-400 dark:text-gray-400 truncate max-w-xs">
                              {p.cliente.responsavel}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Vendedor */}
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {vendedores.find(v => v.id === p.vendedorId)?.name || <span className="text-gray-400 italic">—</span>}
                      </span>
                    </td>

                    {/* Data */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-sm">{formatDate(p.dataEmissao)}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 text-center">
                      <StatusBadge status={p.status} />
                    </td>

                    {/* Ações */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleView(p)}
                          title="Visualizar / Exportar PDF"
                          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 hover:text-yellow-600 dark:hover:text-yellow-400 active:scale-90 transition-all duration-150"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(p)}
                          title="Editar"
                          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400 active:scale-90 transition-all duration-150"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {hasPermission(userPermissions, 'canDeleteQuotations') && (
                          <button
                            onClick={() => setDeleteTarget(p)}
                            title="Excluir"
                            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 active:scale-90 transition-all duration-150"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Table footer with pagination */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 dark:text-gray-400">
                  {totalCount > 0
                    ? `Mostrando ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, totalCount)} de ${totalCount}`
                    : 'Nenhuma proposta'}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-400">
                  Valor em aberto:{' '}
                  <span className="font-semibold text-gray-600 dark:text-gray-300">
                    {formatCurrency(metrics.totalValue)}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(5, Math.ceil(totalCount / pageSize)) }, (_, i) => {
                  const totalPages = Math.ceil(totalCount / pageSize);
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 text-sm rounded-lg font-medium transition-all ${
                        pageNum === page
                          ? 'bg-yellow-500 text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= Math.ceil(totalCount / pageSize)}
                  className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile/Tablet cards */}
          <div className="md:hidden space-y-3">
            {proposals.map(p => (
              <div
                key={p.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 space-y-3 active:scale-[0.985] transition-transform duration-150"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-gray-800 dark:text-gray-100 text-sm">
                        {p.documentId || `#${p.id.slice(0, 6).toUpperCase()}`}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-400">
                        {DocumentTipoLabels[p.tipo] || p.tipo}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                {/* Client + date */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-400 mb-0.5">Cliente</p>
                    <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                      {p.cliente.nome || <span className="text-gray-400 italic text-xs">Não informado</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-400 mb-0.5">Data de Emissão</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300">{formatDate(p.dataEmissao)}</p>
                  </div>
                </div>

                {/* Vendedor + actions */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-400 mb-0.5">Vendedor</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                      {vendedores.find(v => v.id === p.vendedorId)?.name || <span className="text-gray-400 italic">—</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleView(p)}
                      title="Visualizar"
                      className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 hover:text-yellow-600 dark:hover:text-yellow-400 active:scale-90 transition-all duration-150"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(p)}
                      title="Editar"
                      className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400 active:scale-90 transition-all duration-150"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {hasPermission(userPermissions, 'canDeleteQuotations') && (
                      <button
                        onClick={() => setDeleteTarget(p)}
                        title="Excluir"
                        className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 active:scale-90 transition-all duration-150"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== DELETE DIALOG ===== */}
      {deleteTarget && (
        <DeleteDialog
          proposal={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {/* ===== TOAST NOTIFICATION ===== */}
      <Notification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
    </div>
  );
}
