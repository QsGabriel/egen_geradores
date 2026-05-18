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
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react';
import { quotationService } from '../../services';
import type { SalesQuotation, DocumentStatus } from '../../types/proposal';
import { DocumentStatusLabels, DocumentStatusColors, DocumentTipoLabels } from '../../types/proposal';

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
      className={`group flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 w-full
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
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
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

  const [proposals, setProposals] = useState<SalesQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');

  const [deleteTarget, setDeleteTarget] = useState<SalesQuotation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Data loading ----

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await quotationService.list({
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 100,
      });
      setProposals(data);
    } catch (err) {
      console.error('[ProposalManagementPage] load error:', err);
      setError('Não foi possível carregar as propostas. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

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

  const handleNew = () => navigate('/propostas/nova');

  const handleView = (p: SalesQuotation) => navigate(`/propostas/${p.id}?mode=preview`);

  const handleEdit = (p: SalesQuotation) => navigate(`/propostas/${p.id}`);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await quotationService.delete(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.error('[ProposalManagementPage] delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  const isEmpty = !loading && proposals.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ===== PAGE HEADER ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <FileText className="h-8 w-8 text-yellow-500" />
            Gestão de Propostas
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Crie, acompanhe e gerencie propostas comerciais de locação
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            title="Atualizar lista"
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-xl font-semibold text-sm transition-all shadow-md"
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por cliente ou número da proposta..."
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Active filter pill */}
          {statusFilter !== 'all' && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-500 dark:text-gray-400">Filtro:</span>
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${DocumentStatusColors[statusFilter]}`}>
                {DocumentStatusLabels[statusFilter]}
                <button onClick={() => setStatusFilter('all')} className="hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}

          {/* Summary */}
          <div className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 flex items-center gap-1.5">
            <Filter className="w-4 h-4" />
            <span>
              {loading ? '...' : `${proposals.length} proposta${proposals.length !== 1 ? 's' : ''}`}
            </span>
          </div>
        </div>
      </div>

      {/* ===== ERROR STATE ===== */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {error}
          <button onClick={load} className="ml-auto underline hover:no-underline">Tentar novamente</button>
        </div>
      )}

      {/* ===== LOADING SKELETON ===== */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded hidden sm:block" />
                <div className="w-28 h-4 bg-gray-200 dark:bg-gray-700 rounded hidden md:block" />
                <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded-full hidden lg:block" />
                <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== EMPTY STATE ===== */}
      {isEmpty && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-12 text-center">
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
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-xl font-semibold text-sm transition-colors shadow-md"
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
          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-36">
                    Nº Proposta
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-36">
                    Data de Emissão
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40">
                    Valor Total
                  </th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-44">
                    Status
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
                    className="group hover:bg-yellow-50/40 dark:hover:bg-yellow-900/10 transition-colors"
                    style={{ animationDelay: `${Math.min(idx * 0.03, 0.18)}s` }}
                  >
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
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                            {DocumentTipoLabels[p.tipo] || p.tipo}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Cliente */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-800 dark:text-gray-100 truncate max-w-xs">
                            {p.cliente.nome || <span className="text-gray-400 italic">Não informado</span>}
                          </p>
                          {p.cliente.responsavel && (
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-xs">
                              {p.cliente.responsavel}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Data */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="text-sm">{formatDate(p.dataEmissao)}</span>
                      </div>
                    </td>

                    {/* Valor */}
                    <td className="px-5 py-4 text-right">
                      <span className="font-semibold text-gray-800 dark:text-gray-100 tabular-nums">
                        {formatCurrency(p.totalComDesconto || p.totalGeral || 0)}
                      </span>
                      {p.descontoPercent > 0 && (
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                          -{p.descontoPercent}% desc.
                        </p>
                      )}
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
                          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(p)}
                          title="Editar"
                          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          title="Excluir"
                          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Table footer */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex items-center justify-between">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {proposals.length} proposta{proposals.length !== 1 ? 's' : ''}
                {statusFilter !== 'all' ? ` com status "${DocumentStatusLabels[statusFilter]}"` : ' no total'}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Valor total em aberto:{' '}
                <span className="font-semibold text-gray-600 dark:text-gray-300">
                  {formatCurrency(metrics.totalValue)}
                </span>
              </span>
            </div>
          </div>

          {/* Mobile/Tablet cards */}
          <div className="md:hidden space-y-3">
            {proposals.map(p => (
              <div
                key={p.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 space-y-3"
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
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {DocumentTipoLabels[p.tipo] || p.tipo}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>

                {/* Client + date */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Cliente</p>
                    <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                      {p.cliente.nome || <span className="text-gray-400 italic text-xs">Não informado</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Data de Emissão</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300">{formatDate(p.dataEmissao)}</p>
                  </div>
                </div>

                {/* Value + actions */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Valor Total</p>
                    <p className="font-bold text-gray-800 dark:text-gray-100">
                      {formatCurrency(p.totalComDesconto || p.totalGeral || 0)}
                    </p>
                    {p.descontoPercent > 0 && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400">-{p.descontoPercent}% desc.</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleView(p)}
                      title="Visualizar"
                      className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(p)}
                      title="Editar"
                      className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      title="Excluir"
                      className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
    </div>
  );
}
