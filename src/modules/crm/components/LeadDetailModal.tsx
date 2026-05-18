/**
 * LeadDetailModal
 * Modal de detalhes do lead abrível a partir do Pipeline.
 * Suporta visualização, edição inline e ações rápidas.
 */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Edit,
  Save,
  Phone,
  Mail,
  Building,
  Calendar,
  FileText,
  UserCheck,
  UserCircle2,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { useCRM } from '../hooks/useCRM';
import type { Lead, LeadFormData, LeadStatus, ContactPerson } from '../types';
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_COLORS,
  LEAD_STATUS_DESCRIPTIONS,
  LEAD_PIPELINE_ORDER,
  LEAD_SOURCES,
  STATUSES_REQUIRING_SCHEDULE,
  EMPTY_CONTACT,
} from '../types';
import LeadConvertModal from './LeadConvertModal';
import ContactLogSection from './ContactLogSection';
import type { ClientFormData } from '../types';

interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
  onGenerateProposal: (leadId: string) => void;
  onLeadUpdated?: () => void;
}

export default function LeadDetailModal({
  lead: initialLead,
  onClose,
  onGenerateProposal,
  onLeadUpdated,
}: LeadDetailModalProps) {
  const { updateLead, updateLeadStatus, convertLeadToClient } = useCRM();

  const [lead, setLead] = useState<Lead>(initialLead);
  const [editing, setEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

  const [formData, setFormData] = useState<LeadFormData>({
    name: lead.name,
    company: lead.company,
    phone: lead.phone,
    email: lead.email,
    source: lead.source,
    status: lead.status,
    notes: lead.notes,
    contacts: lead.contacts ?? [],
    scheduledAt: lead.scheduledAt || '',
  });

  const requiresSchedule = STATUSES_REQUIRING_SCHEDULE.includes(formData.status);

  // ── Contact helpers ──────────────────────────────────────────────────
  const addContact = () =>
    setFormData(p => ({ ...p, contacts: [...p.contacts, { ...EMPTY_CONTACT }] }));

  const removeContact = (i: number) =>
    setFormData(p => ({ ...p, contacts: p.contacts.filter((_, idx) => idx !== i) }));

  const updateContact = (i: number, field: keyof ContactPerson, value: string) =>
    setFormData(p => ({
      ...p,
      contacts: p.contacts.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)),
    }));

  // ── Save edits ────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateLead(lead.id, formData);
      setLead(prev => ({
        ...prev,
        ...formData,
        scheduledAt: formData.scheduledAt || null,
      }));
      setEditing(false);
      onLeadUpdated?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Status change ─────────────────────────────────────────────────────
  const handleStatusChange = async (status: LeadStatus) => {
    setShowStatusDropdown(false);
    try {
      await updateLeadStatus(lead.id, status);
      setLead(prev => ({ ...prev, status }));
      setFormData(prev => ({ ...prev, status }));
      onLeadUpdated?.();
    } catch {
      // error is surfaced by parent if needed
    }
  };

  // ── Convert ──────────────────────────────────────────────────────────
  const handleConvertConfirm = async (clientData: ClientFormData) => {
    await convertLeadToClient(lead.id, clientData);
    setShowConvertModal(false);
    onLeadUpdated?.();
    onClose();
  };

  const inputClass =
    'w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-yellow-500';

  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    const [y, m, d] = iso.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  };

  return createPortal(
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
        className="flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Status badge with tooltip */}
                <div className="relative group inline-block">
                  <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${LEAD_STATUS_COLORS[lead.status]}`}>
                    {LEAD_STATUS_LABELS[lead.status]}
                  </span>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {LEAD_STATUS_DESCRIPTIONS[lead.status]}
                  </div>
                </div>

                {/* Change status button */}
                <div className="relative">
                  <button
                    onClick={() => setShowStatusDropdown(p => !p)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
                  >
                    <ChevronDown className="h-3 w-3" />
                    Mover
                  </button>
                  {showStatusDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowStatusDropdown(false)} />
                      <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[200px]">
                        {LEAD_PIPELINE_ORDER.map(s => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(s)}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${s === lead.status ? 'opacity-50 cursor-default' : ''}`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${LEAD_STATUS_COLORS[s].split(' ')[0]}`} />
                              <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                                {LEAD_STATUS_LABELS[s]}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 ml-4">
                              {LEAD_STATUS_DESCRIPTIONS[s]}
                            </p>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <h3 className="text-base font-bold text-gray-900 dark:text-white mt-2 truncate">
                {lead.name}
              </h3>
              {lead.company && (
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                  <Building className="h-3 w-3" />
                  {lead.company}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ml-2 flex-shrink-0"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {!editing ? (
              /* ── VIEW mode ── */
              <div className="space-y-4">
                {/* Contacts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(lead.phone || lead.email) && (
                    <div className="space-y-1.5">
                      {lead.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          {lead.phone}
                        </div>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          {lead.email}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {lead.source && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Origem:</span> {lead.source}
                      </p>
                    )}
                    {lead.scheduledAt && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1.5 rounded-lg">
                        <Calendar className="h-3.5 w-3.5" />
                        Agendamento: {formatDate(lead.scheduledAt)}
                      </div>
                    )}
                    {lead.convertedAt && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Convertido em: {formatDate(lead.convertedAt)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Extra contacts */}
                {lead.contacts && lead.contacts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contatos adicionais
                    </p>
                    {lead.contacts.map((c, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 text-xs space-y-0.5">
                        {c.name && <p className="font-medium text-gray-800 dark:text-gray-200">{c.name}</p>}
                        {c.email && (
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Mail className="h-3 w-3" /> {c.email}
                          </div>
                        )}
                        {c.phone && (
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Phone className="h-3 w-3" /> {c.phone}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {lead.notes && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Observações
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {lead.notes}
                    </p>
                  </div>
                )}

                {/* Created at */}
                <p className="text-[11px] text-gray-400 dark:text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-700">
                  Cadastrado em {formatDate(lead.createdAt)}
                </p>

                {/* Contact log */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <ContactLogSection entityType="lead" entityId={lead.id} />
                </div>
              </div>
            ) : (
              /* ── EDIT mode ── */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
                    <input type="text" value={formData.name}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa</label>
                    <input type="text" value={formData.company}
                      onChange={e => setFormData(p => ({ ...p, company: e.target.value }))}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                    <input type="text" value={formData.phone}
                      onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                      className={inputClass} placeholder="(00) 00000-0000" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                    <input type="email" value={formData.email}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Origem</label>
                    <select value={formData.source}
                      onChange={e => setFormData(p => ({ ...p, source: e.target.value }))}
                      className={inputClass}>
                      <option value="">Selecione...</option>
                      {LEAD_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select value={formData.status}
                      onChange={e => setFormData(p => ({ ...p, status: e.target.value as LeadStatus }))}
                      className={inputClass}>
                      {LEAD_PIPELINE_ORDER.map(s => (
                        <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>

                  {requiresSchedule && (
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                        📅 Data de Agendamento *
                      </label>
                      <input type="date" value={formData.scheduledAt || ''}
                        onChange={e => setFormData(p => ({ ...p, scheduledAt: e.target.value }))}
                        className={inputClass} />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                    <textarea value={formData.notes}
                      onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                      rows={2} className={inputClass} />
                  </div>
                </div>

                {/* Additional contacts */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                      <UserCircle2 className="h-3.5 w-3.5 text-yellow-500" />
                      Contatos adicionais
                    </span>
                    <button type="button" onClick={addContact}
                      className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg text-gray-600 dark:text-gray-300 transition-colors flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Adicionar
                    </button>
                  </div>
                  {formData.contacts.map((c, i) => (
                    <div key={i} className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-semibold text-gray-400">Contato {i + 1}</span>
                        <button type="button" onClick={() => removeContact(i)}
                          className="p-0.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['name', 'phone', 'email'] as const).map(field => (
                          <input key={field} type={field === 'email' ? 'email' : 'text'}
                            value={c[field]}
                            onChange={e => updateContact(i, field, e.target.value)}
                            placeholder={field === 'name' ? 'Nome' : field === 'phone' ? 'Telefone' : 'E-mail'}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-5 py-4 flex flex-wrap items-center gap-2">
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm font-medium"
                >
                  <Edit className="h-4 w-4" /> Editar
                </button>
                <button
                  onClick={() => onGenerateProposal(lead.id)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all text-sm font-medium"
                >
                  <FileText className="h-4 w-4" /> Gerar Proposta
                </button>
                {!lead.convertedClientId && (
                  <button
                    onClick={() => setShowConvertModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 rounded-xl shadow-sm transition-all text-sm font-semibold ml-auto"
                  >
                    <UserCheck className="h-4 w-4" /> Converter em Cliente
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-xl shadow-md transition-all disabled:opacity-50 text-sm ml-auto"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 rounded-full border-2 border-gray-900/30 border-t-gray-900 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showConvertModal && (
        <LeadConvertModal
          lead={lead}
          onConfirm={handleConvertConfirm}
          onClose={() => setShowConvertModal(false)}
        />
      )}
    </>,
    document.body
  );
}
