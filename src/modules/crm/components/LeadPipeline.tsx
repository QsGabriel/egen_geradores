import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Mail,
  Building,
  Search,
  ChevronDown,
  FileText,
  Calendar,
} from 'lucide-react';
import { useCRM } from '../hooks/useCRM';
import { useNotification } from '../../../hooks/useNotification';
import Notification from '../../../components/Notification';
import type { Lead, LeadStatus } from '../types';
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_DESCRIPTIONS,
  LEAD_PIPELINE_ORDER,
} from '../types';
import LeadDetailModal from './LeadDetailModal';

const COLUMN_COLORS: Record<LeadStatus, string> = {
  to_contact: 'border-t-blue-500',
  no_demand: 'border-t-rose-400',
  potential_client: 'border-t-yellow-500',
  follow_up: 'border-t-orange-500',
  in_proposal: 'border-t-indigo-500',
  client_no_demand: 'border-t-teal-500',
  client_with_demand: 'border-t-green-500',
};

const COLUMN_INITIAL_LIMIT = 15;

const LeadPipeline: React.FC = () => {
  const { leads, updateLeadStatus, generateProposalFromLead } = useCRM();
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [columnLimits, setColumnLimits] = useState<Partial<Record<LeadStatus, number>>>({});
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

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

  const handleStatusChange = async (lead: Lead, newStatus: LeadStatus) => {
    setOpenDropdownId(null);
    try {
      await updateLeadStatus(lead.id, newStatus);
      showSuccess(`Lead "${lead.name}" movido para "${LEAD_STATUS_LABELS[newStatus]}"`);
    } catch {
      showError('Erro ao atualizar status do lead.');
    }
  };

  const handleGenerateProposal = async (lead: Lead) => {
    try {
      const proposalId = await generateProposalFromLead(lead.id);
      showSuccess(`Proposta criada com sucesso!`);
      navigate(`/propostas/${proposalId}`);
    } catch {
      showError('Erro ao gerar proposta.');
    }
  };

  const renderCard = (lead: Lead) => (
    <div
      key={lead.id}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => setSelectedLead(lead)}
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
          <Phone className="h-3 w-3" /> {[lead.areaCode, lead.phone].filter(Boolean).join(' ')}
        </div>
      )}
      {lead.scheduledAt && (
        <div className="flex items-center gap-1 text-orange-400 text-xs mt-1">
          <Calendar className="h-3 w-3" />
          {new Date(lead.scheduledAt).toLocaleDateString('pt-BR')}
        </div>
      )}
      {lead.source && (
        <div className="text-xs text-gray-300 dark:text-gray-500 mt-1">
          Origem: {lead.source}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
        {/* Status dropdown */}
        <div className="relative flex-1">
          <button
            onClick={() => setOpenDropdownId(openDropdownId === lead.id ? null : lead.id)}
            className="w-full inline-flex items-center justify-between gap-1 px-2 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all border border-gray-200 dark:border-gray-600"
          >
            <span>Mover</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          {openDropdownId === lead.id && (
            <div className="absolute left-0 top-full mt-1 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-20 py-1">
              {LEAD_PIPELINE_ORDER.map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(lead, s)}
                  disabled={s === lead.status}
                  className={`w-full flex items-start gap-2 px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${s === lead.status ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full mt-0.5 flex-shrink-0 ${LEAD_STATUS_COLORS[s].split(' ')[0].replace('bg-', 'bg-')}`} />
                  <div className="text-left">
                    <div className="font-medium text-gray-800 dark:text-gray-200">{LEAD_STATUS_LABELS[s]}</div>
                    {LEAD_STATUS_DESCRIPTIONS[s] && (
                      <div className="text-gray-400 dark:text-gray-500 text-[10px]">{LEAD_STATUS_DESCRIPTIONS[s]}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Generate proposal */}
        <button
          onClick={() => handleGenerateProposal(lead)}
          className="px-2 py-1.5 text-yellow-500 text-xs rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-all"
          title="Gerar Proposta"
        >
          <FileText className="h-3.5 w-3.5" />
        </button>
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
                {LEAD_STATUS_DESCRIPTIONS[status] && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{LEAD_STATUS_DESCRIPTIONS[status]}</p>
                )}
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

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onGenerateProposal={handleGenerateProposal}
          onLeadUpdated={() => setSelectedLead(null)}
        />
      )}
    </div>
  );
};

export default LeadPipeline;
