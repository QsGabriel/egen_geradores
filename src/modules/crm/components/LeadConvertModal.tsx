/**
 * LeadConvertModal
 * Modal que exige preenchimento completo dos dados antes de converter
 * um lead em cliente. Pré-preenche com os dados disponíveis do lead.
 */
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Z_INDEX } from '../../../constants/zIndex';
import { X, UserCheck, AlertCircle, Save } from 'lucide-react';
import type { Lead, ClientFormData } from '../types';
import { CLIENT_CLASSIFICATIONS } from '../types';

interface LeadConvertModalProps {
  lead: Lead;
  onConfirm: (data: ClientFormData) => Promise<void>;
  onClose: () => void;
}

const STATES = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
];

export default function LeadConvertModal({ lead, onConfirm, onClose }: LeadConvertModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});

  const [formData, setFormData] = useState<ClientFormData>({
    name: lead.company || lead.name || '',
    documentNumber: '',
    contactName: lead.name || '',
    contactPhone: lead.phone || '',
    contactEmail: lead.email || '',
    address: '',
    city: '',
    state: '',
    notes: lead.notes || '',
    locationUrl: '',
    classification: '',
    clientStatus: 'active',
    contacts: lead.contacts ?? [],
  });

  const set = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ClientFormData, string>> = {};
    if (!formData.name.trim()) newErrors.name = 'Nome/Razão Social é obrigatório';
    if (!formData.documentNumber.trim()) newErrors.documentNumber = 'CNPJ/CPF é obrigatório';
    if (!formData.contactName.trim()) newErrors.contactName = 'Nome do contato é obrigatório';
    if (!formData.address.trim()) newErrors.address = 'Endereço é obrigatório';
    if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
    if (!formData.state) newErrors.state = 'Estado é obrigatório';
    if (!formData.classification) newErrors.classification = 'Classificação é obrigatória';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onConfirm(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (field: keyof ClientFormData) =>
    `w-full px-3 py-2.5 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-yellow-500 transition-colors ${
      errors[field]
        ? 'border-red-400 dark:border-red-500'
        : 'border-gray-200 dark:border-gray-600'
    }`;

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: Z_INDEX.modal }}
      className="flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Converter em Cliente
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Preencha todos os dados obrigatórios para concluir a conversão
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Info banner */}
        <div className="mx-6 mt-4 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl text-xs text-blue-700 dark:text-blue-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            Os dados do lead <strong>{lead.name}</strong> foram pré-preenchidos.
            Complete as informações faltantes — campos marcados com * são obrigatórios.
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
          {/* Empresa / Nome */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome / Razão Social <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => set('name', e.target.value)}
                className={inputClass('name')}
                placeholder="Empresa LTDA"
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                CNPJ / CPF <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.documentNumber}
                onChange={e => set('documentNumber', e.target.value)}
                className={inputClass('documentNumber')}
                placeholder="00.000.000/0001-00"
              />
              {errors.documentNumber && (
                <p className="text-xs text-red-500 mt-1">{errors.documentNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Classificação <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.classification}
                onChange={e => set('classification', e.target.value)}
                className={inputClass('classification')}
              >
                <option value="">Selecione...</option>
                {CLIENT_CLASSIFICATIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.classification && (
                <p className="text-xs text-red-500 mt-1">{errors.classification}</p>
              )}
            </div>
          </div>

          {/* Contato principal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome do Contato <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={e => set('contactName', e.target.value)}
                className={inputClass('contactName')}
                placeholder="João Silva"
              />
              {errors.contactName && (
                <p className="text-xs text-red-500 mt-1">{errors.contactName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={e => set('contactPhone', e.target.value)}
                className={inputClass('contactPhone')}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={e => set('contactEmail', e.target.value)}
                className={inputClass('contactEmail')}
                placeholder="contato@empresa.com"
              />
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Endereço <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={e => set('address', e.target.value)}
              className={inputClass('address')}
              placeholder="Rua, número, bairro"
            />
            {errors.address && (
              <p className="text-xs text-red-500 mt-1">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cidade <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={e => set('city', e.target.value)}
                className={inputClass('city')}
                placeholder="Cuiabá"
              />
              {errors.city && (
                <p className="text-xs text-red-500 mt-1">{errors.city}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.state}
                onChange={e => set('state', e.target.value)}
                className={inputClass('state')}
              >
                <option value="">UF</option>
                {STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.state && (
                <p className="text-xs text-red-500 mt-1">{errors.state}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Link Localização
              </label>
              <input
                type="url"
                value={formData.locationUrl}
                onChange={e => set('locationUrl', e.target.value)}
                className={inputClass('locationUrl')}
                placeholder="https://maps.google.com/..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              className={inputClass('notes')}
              placeholder="Informações adicionais sobre o cliente..."
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold rounded-xl shadow-md transition-all disabled:opacity-50 text-sm"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-gray-900/30 border-t-gray-900 animate-spin" />
                  Convertendo...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Confirmar Conversão
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
