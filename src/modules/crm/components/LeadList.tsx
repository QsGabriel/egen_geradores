import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  UserPlus,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Phone,
  Mail,
  Search,
  ArrowRightCircle,
  Building,
  Upload,
  UserCircle2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useCRM } from '../hooks/useCRM';
import { useNotification } from '../../../hooks/useNotification';
import { useDialog } from '../../../hooks/useDialog';
import Notification from '../../../components/Notification';
import ConfirmDialog from '../../../components/ConfirmDialog';
import LeadImportModal from './LeadImportModal';
import type { Lead, LeadFormData, LeadStatus, ContactPerson } from '../types';
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_SOURCES,
  EMPTY_CONTACT,
} from '../types';

const EMPTY_FORM: LeadFormData = {
  name: '',
  company: '',
  phone: '',
  email: '',
  source: '',
  status: 'new',
  notes: '',
  contacts: [],
};

interface LeadListProps {
  onConvert?: (leadId: string) => void;
}

const LeadList: React.FC<LeadListProps> = ({ onConvert }) => {
  const { leads, addLead, updateLead, deleteLead, convertLeadToClient, importLeads } = useCRM();
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const { confirmDialog, showConfirmDialog, hideConfirmDialog } = useDialog();

  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [formData, setFormData] = useState<LeadFormData>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 25;

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditing(null);
    setShowForm(false);
  };

  // ── Contacts helpers ─────────────────────────────────────────────────────

  const addContact = () => {
    setFormData(prev => ({ ...prev, contacts: [...prev.contacts, { ...EMPTY_CONTACT }] }));
  };

  const removeContact = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== idx),
    }));
  };

  const updateContact = (idx: number, field: keyof ContactPerson, value: string) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.map((c, i) => (i === idx ? { ...c, [field]: value } : c)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editing) {
        await updateLead(editing.id, formData);
        showSuccess('Lead atualizado com sucesso!');
      } else {
        await addLead(formData);
        showSuccess('Lead cadastrado com sucesso!');
      }
      resetForm();
    } catch {
      showError('Erro ao salvar lead. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (lead: Lead) => {
    setFormData({
      name: lead.name,
      company: lead.company,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      status: lead.status,
      notes: lead.notes,
      contacts: lead.contacts ?? [],
    });
    setEditing(lead);
    setShowForm(true);
  };

  const handleDelete = (id: string, name: string) => {
    showConfirmDialog(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o lead "${name}"? Esta ação não pode ser desfeita.`,
      async () => {
        try {
          await deleteLead(id);
          showSuccess('Lead excluído com sucesso!');
        } catch {
          showError('Erro ao excluir lead.');
        }
      },
      { type: 'danger', confirmText: 'Excluir' }
    );
  };

  const handleConvert = (lead: Lead) => {
    showConfirmDialog(
      'Converter Lead em Cliente',
      `Deseja converter o lead "${lead.name}" (${lead.company || 'sem empresa'}) em um novo cliente? Os dados serão migrados automaticamente.`,
      async () => {
        try {
          await convertLeadToClient(lead.id);
          showSuccess(`Lead "${lead.name}" convertido em cliente com sucesso!`);
          onConvert?.(lead.id);
        } catch {
          showError('Erro ao converter lead.');
        }
      },
      { type: 'info', confirmText: 'Converter' }
    );
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedLeads = filteredLeads.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <Notification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        type={confirmDialog.type}
        onConfirm={() => {
          confirmDialog.onConfirm?.();
          hideConfirmDialog();
        }}
        onCancel={hideConfirmDialog}
      />

      {/* Form modal — React portal para evitar gap e sobreposição correta */}
      {showForm && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
          className="flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? 'Editar Lead' : 'Novo Lead'}
              </h3>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="Nome do lead"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="Nome da empresa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Origem</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="">Selecione...</option>
                    {LEAD_SOURCES.map((src) => (
                      <option key={src} value={src}>{src}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as LeadStatus })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                  >
                    {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="Informações adicionais..."
                  />
                </div>
              </div>

              {/* Contatos múltiplos */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <UserCircle2 className="h-4 w-4 text-yellow-500" />
                    Contatos
                  </h4>
                  <button
                    type="button"
                    onClick={addContact}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Adicionar Contato
                  </button>
                </div>

                {formData.contacts.length === 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                    Clique em "Adicionar Contato" para incluir contatos.
                  </p>
                )}

                {formData.contacts.map((contact, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Contato {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeContact(idx)}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-400 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Nome</label>
                        <input
                          type="text"
                          value={contact.name}
                          onChange={(e) => updateContact(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                          placeholder="Nome"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Telefone</label>
                        <input
                          type="text"
                          value={contact.phone}
                          onChange={(e) => updateContact(idx, 'phone', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">E-mail</label>
                        <input
                          type="email"
                          value={contact.email}
                          onChange={(e) => updateContact(idx, 'email', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                          placeholder="email@empresa.com"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  <Save className="h-4 w-4" /> {editing ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {showImport && (
        <LeadImportModal
          onClose={() => setShowImport(false)}
          onImport={async (rows, onProgress) => {
            const res = await importLeads(rows, onProgress);
            if (res.imported > 0) showSuccess(`${res.imported} lead(s) importado(s) com sucesso!`);
            return res;
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserPlus className="h-7 w-7 text-yellow-500" />
            Leads
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {leads.length} lead{leads.length !== 1 ? 's' : ''} registrado{leads.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all"
          >
            <Upload className="h-4 w-4" /> Importar
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-xl shadow-md transition-all"
          >
            <Plus className="h-5 w-5" /> Novo Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, empresa ou e-mail..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as LeadStatus | 'all'); setPage(1); }}
          className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 dark:text-white"
        >
          <option value="all">Todos os Status</option>
          {Object.entries(LEAD_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Lead Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-6 py-3 font-semibold text-gray-600 dark:text-gray-400">Nome</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 dark:text-gray-400">Empresa</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 dark:text-gray-400">Contatos</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 dark:text-gray-400">Origem</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-600 dark:text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Nenhum lead encontrado com os filtros aplicados.'
                      : 'Nenhum lead registrado ainda.'}
                  </td>
                </tr>
              ) : (
                pagedLeads.map((lead) => {
                  const allContacts = (lead.contacts?.length ?? 0) > 0
                    ? lead.contacts
                    : (lead.phone || lead.email)
                      ? [{ name: lead.name, phone: lead.phone, email: lead.email }]
                      : [];

                  return (
                    <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{lead.name}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs">
                        {lead.company ? (
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" /> {lead.company}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {allContacts.length > 0 ? (
                          <div className="space-y-1.5">
                            {allContacts.map((c, ci) => (
                              <div key={ci} className="text-xs">
                                {c.name && <div className="font-medium text-gray-700 dark:text-gray-300">{c.name}</div>}
                                {c.email && (
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <Mail className="h-3 w-3" /> {c.email}
                                  </div>
                                )}
                                {c.phone && (
                                  <div className="flex items-center gap-1 text-gray-400">
                                    <Phone className="h-3 w-3" /> {c.phone}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs">
                        {lead.source || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${LEAD_STATUS_COLORS[lead.status]}`}>
                          {LEAD_STATUS_LABELS[lead.status]}
                        </span>
                        {lead.convertedAt && (
                          <div className="text-xs text-green-500 mt-1">Convertido</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {!lead.convertedClientId && lead.status !== 'lost' && (
                            <button
                              onClick={() => handleConvert(lead)}
                              className="p-2 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg text-green-600 transition-all"
                              title="Converter em Cliente"
                            >
                              <ArrowRightCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(lead)}
                            className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg text-yellow-600 transition-all"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(lead.id, lead.name)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} •{' '}
            página {safePage} de {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
                      safePage === p
                        ? 'bg-yellow-500 text-gray-900'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadList;
