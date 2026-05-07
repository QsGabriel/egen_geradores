import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Phone,
  Mail,
  MapPin,
  User,
  Search,
  FileText,
  History,
  UserCircle2,
} from 'lucide-react';
import { useCRM } from '../hooks/useCRM';
import { useNotification } from '../../../hooks/useNotification';
import { useDialog } from '../../../hooks/useDialog';
import Notification from '../../../components/Notification';
import ConfirmDialog from '../../../components/ConfirmDialog';
import type { Client, ClientFormData, ClientStatus, ContactPerson } from '../types';
import {
  CLIENT_STATUS_LABELS,
  CLIENT_STATUS_COLORS,
  EMPTY_CONTACT,
  CLIENT_CLASSIFICATIONS,
} from '../types';

const EMPTY_FORM: ClientFormData = {
  name: '',
  documentNumber: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  address: '',
  city: '',
  state: '',
  notes: '',
  locationUrl: '',
  classification: '',
  clientStatus: 'active',
  contacts: [],
};

interface ClientListProps {
  onViewHistory?: (clientId: string, clientName: string) => void;
}

const ClientList: React.FC<ClientListProps> = ({ onViewHistory }) => {
  const { clients, addClient, updateClient, deleteClient } = useCRM();
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const { confirmDialog, showConfirmDialog, hideConfirmDialog } = useDialog();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');

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
        await updateClient(editing.id, formData);
        showSuccess('Cliente atualizado com sucesso!');
      } else {
        await addClient(formData);
        showSuccess('Cliente cadastrado com sucesso!');
      }
      resetForm();
    } catch (err) {
      showError('Erro ao salvar cliente. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (client: Client) => {
    setFormData({
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
    setEditing(client);
    setShowForm(true);
  };

  const handleDelete = (id: string, name: string) => {
    showConfirmDialog(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir o cliente "${name}"? Esta ação não pode ser desfeita.`,
      async () => {
        try {
          await deleteClient(id);
          showSuccess('Cliente excluído com sucesso!');
        } catch {
          showError('Erro ao excluir cliente.');
        }
      },
      { type: 'danger', confirmText: 'Excluir' }
    );
  };

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || client.clientStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDocument = (doc: string) => {
    const clean = doc.replace(/\D/g, '');
    if (clean.length === 11) {
      return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (clean.length === 14) {
      return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return doc;
  };

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-7 w-7 text-yellow-500" />
            Clientes
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {clients.length} cliente{clients.length !== 1 ? 's' : ''} cadastrado{clients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-xl shadow-md transition-all"
        >
          <Plus className="h-5 w-5" /> Novo Cliente
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, documento, contato ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ClientStatus | 'all')}
          className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-yellow-500 dark:text-white"
        >
          <option value="all">Todos os Status</option>
          {Object.entries(CLIENT_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Modal Form — React portal para posicionamento correto */}
      {showForm && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
          className="flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Dados principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome / Razão Social *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="Nome do cliente"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF / CNPJ</label>
                  <input
                    type="text"
                    value={formData.documentNumber}
                    onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={formData.clientStatus}
                    onChange={(e) => setFormData({ ...formData, clientStatus: e.target.value as ClientStatus })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                  >
                    {Object.entries(CLIENT_STATUS_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Classificação</label>
                  <select
                    value={formData.classification}
                    onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="">Selecione a classificação...</option>
                    {CLIENT_CLASSIFICATIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Contato Principal</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="Pessoa de contato"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone Principal</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail Principal</label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="email@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endereço</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="Rua, número"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cidade</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="Cidade"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-yellow-500" /> Localização (Google Maps)
                  </label>
                  <input
                    type="url"
                    value={formData.locationUrl}
                    onChange={(e) => setFormData({ ...formData, locationUrl: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="https://maps.google.com/..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="Informações adicionais sobre o cliente..."
                  />
                </div>
              </div>

              {/* Contatos múltiplos */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <UserCircle2 className="h-4 w-4 text-yellow-500" />
                    Contatos Adicionais
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
                    Clique em "Adicionar Contato" para incluir contatos adicionais.
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

      {/* Client Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-6 py-3 font-semibold text-gray-600 dark:text-gray-400">Cliente</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 dark:text-gray-400">Documento</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 dark:text-gray-400">Contato</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 dark:text-gray-400">Classificação</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 dark:text-gray-400">Cidade/UF</th>
                <th className="text-left px-6 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                <th className="text-right px-6 py-3 font-semibold text-gray-600 dark:text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Nenhum cliente encontrado com os filtros aplicados.'
                      : 'Nenhum cliente cadastrado ainda.'}
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{client.name}</div>
                      {client.locationUrl && (
                        <a
                          href={client.locationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 hover:underline mt-0.5"
                        >
                          <MapPin className="h-3 w-3" /> Ver no mapa
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 font-mono text-xs">
                      {client.documentNumber ? formatDocument(client.documentNumber) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {client.contactName && (
                        <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300 text-xs">
                          <User className="h-3 w-3" /> {client.contactName}
                        </div>
                      )}
                      {client.contactPhone && (
                        <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                          <Phone className="h-3 w-3" /> {client.contactPhone}
                        </div>
                      )}
                      {client.contactEmail && (
                        <div className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
                          <Mail className="h-3 w-3" /> {client.contactEmail}
                        </div>
                      )}
                      {(client.contacts?.length ?? 0) > 0 && (
                        <div className="text-xs text-gray-400 mt-0.5 italic">
                          +{client.contacts.length} contato{client.contacts.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs">
                      {client.classification || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-xs">
                      {client.city || client.state
                        ? `${client.city}${client.city && client.state ? '/' : ''}${client.state}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${CLIENT_STATUS_COLORS[client.clientStatus]}`}>
                        {CLIENT_STATUS_LABELS[client.clientStatus]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {onViewHistory && (
                          <button
                            onClick={() => onViewHistory(client.id, client.name)}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg text-blue-500 transition-all"
                            title="Histórico"
                          >
                            <History className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(client)}
                          className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg text-yellow-600 transition-all"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id, client.name)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientList;
