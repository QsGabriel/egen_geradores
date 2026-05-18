/**
 * ClientDetailModal
 * Modal de detalhes do cliente — abrível com clique na linha da tabela.
 * Exibe todos os dados do cliente + histórico de contatos.
 */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Edit,
  Save,
  Phone,
  Mail,
  MapPin,
  User,
  Building2,
  FileText,
  UserCircle2,
  Plus,
} from 'lucide-react';
import { useCRM } from '../hooks/useCRM';
import ContactLogSection from './ContactLogSection';
import type { Client, ClientFormData, ClientStatus, ContactPerson } from '../types';
import {
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_COLORS,
  CLIENT_CLASSIFICATIONS,
  EMPTY_CONTACT,
} from '../types';

interface Props {
  client: Client;
  onClose: () => void;
  onClientUpdated?: () => void;
}

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none';

export default function ClientDetailModal({ client: initialClient, onClose, onClientUpdated }: Props) {
  const { updateClient } = useCRM();

  const [client, setClient] = useState<Client>(initialClient);
  const [editing, setEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ClientFormData>({
    name: client.name,
    documentNumber: client.documentNumber,
    contactName: client.contactName,
    contactPhone: client.contactPhone,
    contactEmail: client.contactEmail,
    address: client.address,
    city: client.city,
    state: client.state,
    notes: client.notes,
    locationUrl: client.locationUrl ?? '',
    classification: client.classification ?? '',
    clientStatus: client.clientStatus,
    contacts: client.contacts ?? [],
  });

  // ── Contact helpers ───────────────────────────────────────────────────
  const addContact = () =>
    setFormData(p => ({ ...p, contacts: [...p.contacts, { ...EMPTY_CONTACT }] }));

  const removeContact = (i: number) =>
    setFormData(p => ({ ...p, contacts: p.contacts.filter((_, idx) => idx !== i) }));

  const updateContact = (i: number, field: keyof ContactPerson, value: string) =>
    setFormData(p => ({
      ...p,
      contacts: p.contacts.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)),
    }));

  // ── Save ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await updateClient(client.id, formData);
      setClient(prev => ({ ...prev, ...formData }));
      setEditing(false);
      onClientUpdated?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDocument = (doc: string) => {
    const clean = doc.replace(/\D/g, '');
    if (clean.length === 11)
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    if (clean.length === 14)
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    return doc;
  };

  return createPortal(
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
        className="flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div
          className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold ${CLIENT_STATUS_COLORS[client.clientStatus]}`}>
                  {CLIENT_STATUS_LABELS[client.clientStatus]}
                </span>
                {client.classification && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                    {client.classification}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mt-2 truncate flex items-center gap-2">
                <Building2 className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                {client.name}
              </h3>
              {client.documentNumber && (
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                  {formatDocument(client.documentNumber)}
                </p>
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
          <div className="p-5 space-y-5">
            {!editing ? (
              /* ── VIEW mode ── */
              <>
                {/* Primary contact */}
                {(client.contactName || client.contactPhone || client.contactEmail) && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contato Principal
                    </p>
                    {client.contactName && (
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        {client.contactName}
                      </div>
                    )}
                    {client.contactPhone && (
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        {client.contactPhone}
                      </div>
                    )}
                    {client.contactEmail && (
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        {client.contactEmail}
                      </div>
                    )}
                  </div>
                )}

                {/* Address */}
                {(client.address || client.city || client.state) && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Endereço
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {[client.address, client.city, client.state].filter(Boolean).join(', ')}
                    </p>
                    {client.locationUrl && (
                      <a
                        href={client.locationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
                      >
                        <MapPin className="h-3 w-3" /> Ver no mapa
                      </a>
                    )}
                  </div>
                )}

                {/* Extra contacts */}
                {client.contacts && client.contacts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contatos adicionais
                    </p>
                    {client.contacts.map((c, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 text-xs space-y-0.5">
                        {c.name && <p className="font-medium text-gray-800 dark:text-gray-200">{c.name}</p>}
                        {c.phone && (
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Phone className="h-3 w-3" /> {c.phone}
                          </div>
                        )}
                        {c.email && (
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Mail className="h-3 w-3" /> {c.email}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {client.notes && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Observações
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {client.notes}
                    </p>
                  </div>
                )}

                {/* Divider + Contact Log */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <ContactLogSection entityType="client" entityId={client.id} />
                </div>
              </>
            ) : (
              /* ── EDIT mode ── */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome / Razão Social *</label>
                    <input type="text" required value={formData.name}
                      onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                      className={inputClass} placeholder="Nome do cliente" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">CPF / CNPJ</label>
                    <input type="text" value={formData.documentNumber}
                      onChange={e => setFormData(p => ({ ...p, documentNumber: e.target.value }))}
                      className={inputClass} placeholder="00.000.000/0000-00" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select value={formData.clientStatus}
                      onChange={e => setFormData(p => ({ ...p, clientStatus: e.target.value as ClientStatus }))}
                      className={inputClass}>
                      {Object.entries(CLIENT_STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Classificação</label>
                    <select value={formData.classification}
                      onChange={e => setFormData(p => ({ ...p, classification: e.target.value }))}
                      className={inputClass}>
                      <option value="">Selecione...</option>
                      {CLIENT_CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Contato Principal</label>
                    <input type="text" value={formData.contactName}
                      onChange={e => setFormData(p => ({ ...p, contactName: e.target.value }))}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone Principal</label>
                    <input type="text" value={formData.contactPhone}
                      onChange={e => setFormData(p => ({ ...p, contactPhone: e.target.value }))}
                      className={inputClass} placeholder="(00) 00000-0000" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail Principal</label>
                    <input type="email" value={formData.contactEmail}
                      onChange={e => setFormData(p => ({ ...p, contactEmail: e.target.value }))}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Endereço</label>
                    <input type="text" value={formData.address}
                      onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                    <input type="text" value={formData.city}
                      onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Estado (UF)</label>
                    <input type="text" value={formData.state} maxLength={2}
                      onChange={e => setFormData(p => ({ ...p, state: e.target.value }))}
                      className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-yellow-500" /> Localização (Maps)
                    </label>
                    <input type="url" value={formData.locationUrl}
                      onChange={e => setFormData(p => ({ ...p, locationUrl: e.target.value }))}
                      className={inputClass} placeholder="https://maps.google.com/..." />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                    <textarea value={formData.notes} rows={2}
                      onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                      className={inputClass} />
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

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-5 py-4 flex items-center gap-2">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-xl shadow-sm transition-all text-sm"
              >
                <Edit className="h-4 w-4" /> Editar
              </button>
            ) : (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-gray-900 font-semibold rounded-xl shadow-sm transition-all text-sm"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="ml-auto px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
