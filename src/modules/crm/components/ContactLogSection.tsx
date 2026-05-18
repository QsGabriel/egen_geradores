/**
 * ContactLogSection
 * Seção de Histórico de Contatos — componente reutilizável para leads e clientes.
 *
 * Funcionalidades:
 * - Exibe registros de contatos em timeline (mais recente primeiro)
 * - Formulário inline para registrar novo contato
 * - Data/hora do contato escolhida pelo usuário (obrigatório)
 * - Campos obrigatórios: data/hora + pessoa contatada + observações
 * - Usuário responsável gravado automaticamente
 */
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquarePlus, Plus, Clock, User2, Send, X, AlertCircle } from 'lucide-react';
import { useCRM } from '../hooks/useCRM';
import type { ContactLog } from '../types';

interface Props {
  entityType: 'client' | 'lead';
  entityId: string;
}

// Format ISO to 'dd/mm/yyyy às hh:mm'
function fmtDatetime(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' às ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
}

// Returns current datetime in 'YYYY-MM-DDTHH:mm' format for datetime-local input
function nowInputValue() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ContactLogSection({ entityType, entityId }: Props) {
  const { fetchContactLogs, addContactLog } = useCRM();

  const [logs, setLogs] = useState<ContactLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [contactedAt, setContactedAt] = useState(nowInputValue());
  const [contactedPerson, setContactedPerson] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{
    contactedAt?: string;
    contactedPerson?: string;
    notes?: string;
  }>({});

  // Stable ref prevents infinite loop when useCRM state updates create new function refs
  const fetchRef = useRef(fetchContactLogs);
  useEffect(() => { fetchRef.current = fetchContactLogs; }, [fetchContactLogs]);

  // Only re-run when entity changes — not on every useCRM re-render
  const load = async () => {
    setLoadingLogs(true);
    try {
      const data = await fetchRef.current(entityType, entityId);
      setLogs(data);
    } catch {
      // non-critical
    } finally {
      setLoadingLogs(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [entityType, entityId]);

  // ── Form helpers ──────────────────────────────────────────────────────
  const resetForm = () => {
    setContactedAt(nowInputValue());
    setContactedPerson('');
    setNotes('');
    setErrors({});
    setShowForm(false);
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!contactedAt) errs.contactedAt = 'Informe a data e hora do contato';
    if (!contactedPerson.trim())
      errs.contactedPerson = 'Informe com quem foi realizado o contato';
    if (!notes.trim()) errs.notes = 'Descreva o que foi tratado no contato';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await addContactLog(
        entityType,
        entityId,
        contactedPerson.trim(),
        notes.trim(),
        new Date(contactedAt).toISOString(),
      );
      resetForm();
      await load();
    } catch {
      setErrors(p => ({ ...p, notes: 'Erro ao salvar. Tente novamente.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <MessageSquarePlus className="h-4 w-4 text-yellow-500" />
          Histórico de Contatos
          {logs.length > 0 && (
            <span className="ml-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {logs.length}
            </span>
          )}
        </h4>

        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 rounded-lg transition-colors font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            Registrar Contato
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-yellow-50/70 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/40 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
              Novo Registro de Contato
            </p>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded text-yellow-600 dark:text-yellow-400 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Date + time */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Data e hora do contato <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={contactedAt}
                onChange={e => {
                  setContactedAt(e.target.value);
                  if (errors.contactedAt)
                    setErrors(p => ({ ...p, contactedAt: undefined }));
                }}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors ${
                  errors.contactedAt
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              />
              {errors.contactedAt && (
                <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  {errors.contactedAt}
                </p>
              )}
            </div>

            {/* Contacted person */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pessoa contatada <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contactedPerson}
                onChange={e => {
                  setContactedPerson(e.target.value);
                  if (errors.contactedPerson)
                    setErrors(p => ({ ...p, contactedPerson: undefined }));
                }}
                placeholder="Ex: João Silva — Gerente de Compras"
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors ${
                  errors.contactedPerson
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              />
              {errors.contactedPerson && (
                <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  {errors.contactedPerson}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Observações do contato <span className="text-red-500">*</span>
              </label>
              <textarea
                value={notes}
                onChange={e => {
                  setNotes(e.target.value);
                  if (errors.notes) setErrors(p => ({ ...p, notes: undefined }));
                }}
                placeholder="Descreva o que foi tratado, próximos passos, necessidades levantadas..."
                rows={3}
                className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none transition-colors ${
                  errors.notes
                    ? 'border-red-400 dark:border-red-500'
                    : 'border-gray-200 dark:border-gray-600'
                }`}
              />
              {errors.notes && (
                <p className="flex items-center gap-1 text-xs text-red-500 mt-0.5">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" />
                  {errors.notes}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-gray-900 text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                {isSubmitting ? 'Salvando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Timeline */}
      {loadingLogs ? (
        <div className="flex items-center justify-center py-6">
          <div className="h-5 w-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic py-2 pl-1">
          Nenhum contato registrado ainda. Clique em "Registrar Contato" para adicionar.
        </p>
      ) : (
        <div className="space-y-0">
          {logs.map((log, idx) => (
            <div key={log.id} className="relative flex gap-3 pb-4">
              {/* Vertical connector line */}
              {idx < logs.length - 1 && (
                <div className="absolute left-[9px] top-5 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
              )}

              {/* Timeline dot */}
              <div className="relative z-10 mt-1 flex-shrink-0 w-[18px] h-[18px] rounded-full bg-yellow-400 dark:bg-yellow-500 border-2 border-white dark:border-gray-800 shadow-sm" />

              {/* Card */}
              <div className="flex-1 bg-white dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600/50 rounded-xl p-3 shadow-sm min-w-0">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-1 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <User2 className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {log.contactedPerson}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                    <Clock className="h-2.5 w-2.5" />
                    {fmtDatetime(log.contactedAt || log.createdAt)}
                  </div>
                </div>

                {/* Notes */}
                <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                  {log.notes}
                </p>

                {/* Footer */}
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 pt-1.5 border-t border-gray-100 dark:border-gray-600/40">
                  Registrado por <span className="font-medium">{log.createdBy}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
