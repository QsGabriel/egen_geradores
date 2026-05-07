import React, { useState } from 'react';
import {
  ArrowRightCircle,
  Phone,
  Mail,
  Building,
  MoveRight,
  Search,
  ChevronDown,
} from 'lucide-react';
import { useCRM } from '../hooks/useCRM';
import { useNotification } from '../../../hooks/useNotification';
import Notification from '../../../components/Notification';
import type { Lead, LeadStatus } from '../types';
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_PIPELINE_ORDER,
} from '../types';

const COLUMN_COLORS: Record<LeadStatus, string> = {
  new: 'border-t-blue-500',
  contacted: 'border-t-purple-500',
  proposal_sent: 'border-t-yellow-500',
  negotiation: 'border-t-orange-500',
  won: 'border-t-green-500',
  lost: 'border-t-red-500',
};

const COLUMN_INITIAL_LIMIT = 15;

const LeadPipeline: React.FC = () => {
  const { leads, updateLeadStatus, convertLeadToClient } = useCRM();
  const { notification, showSuccess, showError, hideNotification } = useNotification();

  const [searchTerm, setSearchTerm] = useState('');
  const [columnLimits, setColumnLimits] = useState<Partial<Record<LeadStatus, number>>>({});

  const expandColumn = (status: LeadStatus, total: number) =>
    setColumnLimits(prev => ({ ...prev, [status]: total }));

  const filteredLeads = searchTerm.trim()
    ? leads.filter(
        l =>
          l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.phone.includes(searchTerm),
      )
    : leads;

  const getLeadsByStatus = (status: LeadStatus) =>
    filteredLeads.filter((lead) => lead.status === status);

  const handleAdvance = async (lead: Lead) => {
    const currentIndex = LEAD_PIPELINE_ORDER.indexOf(lead.status);
    // Can't advance past negotiation (won/lost are terminal)
    if (currentIndex >= 3) return;

    const nextStatus = LEAD_PIPELINE_ORDER[currentIndex + 1];
    try {
      await updateLeadStatus(lead.id, nextStatus);
      showSuccess(`Lead "${lead.name}" movido para "${LEAD_STATUS_LABELS[nextStatus]}"`);
    } catch {
      showError('Erro ao atualizar status do lead.');
    }
  };

  const handleConvert = async (lead: Lead) => {
    try {
      await convertLeadToClient(lead.id);
      showSuccess(`Lead "${lead.name}" convertido em cliente!`);
    } catch {
      showError('Erro ao converter lead em cliente.');
    }
  };

  const handleMarkLost = async (lead: Lead) => {
    try {
      await updateLeadStatus(lead.id, 'lost');
      showSuccess(`Lead "${lead.name}" marcado como perdido.`);
    } catch {
      showError('Erro ao atualizar status do lead.');
    }
  };

  const renderCard = (lead: Lead) => (
    <div
      key={lead.id}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="font-medium text-gray-900 dark:text-white text-sm">{lead.name}</div>
      {lead.company && (
        <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
          <Building className="h-3 w-3" /> {lead.company}
        </div>
      )}
      {lead.email && (
        <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
          <Mail className="h-3 w-3" /> {lead.email}
        </div>
      )}
      {lead.phone && (
        <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
          <Phone className="h-3 w-3" /> {lead.phone}
        </div>
      )}
      {lead.source && (
        <div className="text-xs text-gray-300 dark:text-gray-500 mt-1">
          Origem: {lead.source}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
        {lead.status !== 'won' && lead.status !== 'lost' && (
          <>
            {lead.status === 'negotiation' ? (
              <button
                onClick={() => handleConvert(lead)}
                className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-all"
                title="Converter em Cliente"
              >
                <ArrowRightCircle className="h-3 w-3" /> Converter
              </button>
            ) : (
              <button
                onClick={() => handleAdvance(lead)}
                className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all"
                title="Avançar etapa"
              >
                <MoveRight className="h-3 w-3" /> Avançar
              </button>
            )}
            <button
              onClick={() => handleMarkLost(lead)}
              className="px-2 py-1.5 text-red-400 text-xs rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
              title="Marcar como perdido"
            >
              Perdido
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Notification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Pipeline de Leads
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Visualização do funil comercial
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar lead por nome, empresa, e-mail ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:text-white"
        />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {LEAD_PIPELINE_ORDER.map((status) => {
          const statusLeads = getLeadsByStatus(status);
          const limit = columnLimits[status] ?? COLUMN_INITIAL_LIMIT;
          const visibleLeads = statusLeads.slice(0, limit);
          const hiddenCount = statusLeads.length - visibleLeads.length;

          return (
            <div
              key={status}
              className={`flex-shrink-0 w-72 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-t-4 ${COLUMN_COLORS[status]}`}
            >
              {/* Column Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className={`inline-block px-2 py-1 rounded-md text-xs font-semibold ${LEAD_STATUS_COLORS[status]}`}>
                    {LEAD_STATUS_LABELS[status]}
                  </span>
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {statusLeads.length}
                  </span>
                </div>
              </div>

              {/* Column Cards */}
              <div className="p-3 space-y-3 min-h-[200px]">
                {statusLeads.length === 0 ? (
                  <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-8">
                    {searchTerm ? 'Nenhum resultado' : 'Nenhum lead'}
                  </div>
                ) : (
                  <>
                    {visibleLeads.map(renderCard)}
                    {hiddenCount > 0 && (
                      <button
                        onClick={() => expandColumn(status, statusLeads.length)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                        Ver mais {hiddenCount} lead{hiddenCount !== 1 ? 's' : ''}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeadPipeline;
