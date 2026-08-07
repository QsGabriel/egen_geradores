import React from 'react';
import { createPortal } from 'react-dom';
import { Z_INDEX } from '../../../constants/zIndex';
import { X, Users, UserCheck, TrendingUp } from 'lucide-react';
import type { Lead } from '../types';
import { LEAD_STATUS_LABELS, LEAD_PIPELINE_ORDER } from '../types';

interface LeadSummaryModalProps {
  filteredLeads: Lead[];
  totalLeads: number;
  vendedorName: string;
  hasActiveFilters: boolean;
  onClose: () => void;
}

const STATUS_BAR_COLORS: Record<string, string> = {
  to_contact:        'from-blue-400 to-blue-500',
  potential_client:  'from-yellow-400 to-yellow-500',
  follow_up:         'from-orange-400 to-orange-500',
  in_proposal:       'from-indigo-400 to-indigo-500',
  client_with_demand:'from-green-400 to-green-500',
  client_no_demand:  'from-teal-400 to-teal-500',
  no_demand:         'from-red-400 to-red-500',
};

const STATUS_DOT_COLORS: Record<string, string> = {
  to_contact:        'bg-blue-500',
  potential_client:  'bg-yellow-500',
  follow_up:         'bg-orange-500',
  in_proposal:       'bg-indigo-500',
  client_with_demand:'bg-green-500',
  client_no_demand:  'bg-teal-500',
  no_demand:         'bg-red-500',
};

const LeadSummaryModal: React.FC<LeadSummaryModalProps> = ({
  filteredLeads,
  totalLeads,
  vendedorName,
  hasActiveFilters,
  onClose,
}) => {
  const statusCounts = LEAD_PIPELINE_ORDER.map(status => ({
    status,
    label: LEAD_STATUS_LABELS[status],
    count: filteredLeads.filter(l => l.status === status).length,
  }));

  const maxCount = Math.max(1, ...statusCounts.map(s => s.count));
  const filteredCount = filteredLeads.length;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Resumo de Leads</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {hasActiveFilters ? 'Filtros ativos aplicados' : 'Todos os leads'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Leads */}
            <div className="bg-gradient-to-br from-[#F3B229]/10 to-amber-50 dark:from-[#F3B229]/20 dark:to-amber-900/20 rounded-2xl p-5 border border-[#F3B229]/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F3B229] to-[#E5A320] flex items-center justify-center shadow-lg shadow-[#F3B229]/30">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Leads</span>
              </div>
              <p className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 tabular-nums">{filteredCount}</p>
              {hasActiveFilters && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">de {totalLeads} no total</p>
              )}
            </div>

            {/* Vendedor */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10 rounded-2xl p-5 border border-purple-200 dark:border-purple-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Vendedor</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                {vendedorName || 'Todos'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {vendedorName ? 'Filtro ativo' : 'Nenhum selecionado'}
              </p>
            </div>

            {/* Statuses with leads */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Status com Leads</span>
              </div>
              <p className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 tabular-nums">
                {statusCounts.filter(s => s.count > 0).length}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">de {statusCounts.length} status</p>
            </div>
          </div>

          {/* Status distribution */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
              Distribuição por Status
            </h3>
            <div className="space-y-3">
              {statusCounts.map(({ status, label, count }) => (
                <div key={status} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT_COLORS[status] || 'bg-gray-400'}`} />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">{count}</span>
                  </div>
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${STATUS_BAR_COLORS[status] || 'from-gray-400 to-gray-500'} transition-all duration-500 ease-out`}
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default LeadSummaryModal;
