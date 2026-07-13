import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, X, Loader2, ChevronDown, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CustomRole, Department } from '../types';
import { formatCPF, validateCPF } from '../utils/cpf';

interface NewUserFormProps {
  customRoles: CustomRole[];
  departments: Department[];
  onClose: () => void;
  onCreated: (tempPassword: string) => void;
}

const formatPhone = (value: string): string => {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
};

const FIELD_BASE =
  'w-full px-4 py-2.5 border rounded-xl focus:ring-2 transition-all duration-200 bg-white dark:bg-gray-900/50 text-slate-800 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-400';
const FIELD_DEFAULT_BORDER =
  'border-slate-300 dark:border-gray-600 hover:border-slate-400 dark:hover:border-gray-500 focus:ring-[#F3B229]/30 focus:border-[#F3B229]';
const inputClass = `${FIELD_BASE} ${FIELD_DEFAULT_BORDER}`;
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5';

const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const MIN_AGE = 15;
const isValidBirth = (value: string): boolean => {
  if (!value) return false;
  const year = parseInt(value.slice(0, 4), 10);
  if (!year) return false;
  return new Date().getFullYear() - year >= MIN_AGE;
};
const maxBirthDate = `${new Date().getFullYear() - MIN_AGE}-12-31`;

const borderFor = (error: boolean, valid: boolean): string =>
  error
    ? 'border-red-400 dark:border-red-500 focus:ring-red-500/30 focus:border-red-500'
    : valid
      ? 'border-emerald-400 dark:border-emerald-500 focus:ring-emerald-500/30 focus:border-emerald-500'
      : FIELD_DEFAULT_BORDER;

const dateClassFor = (error: boolean, valid: boolean): string =>
  `${FIELD_BASE} cursor-pointer [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer ${borderFor(error, valid)}`;

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  id?: string;
  value: string;
  options: SelectOption[];
  placeholder: string;
  error?: boolean;
  valid?: boolean;
  openUp?: boolean;
  onSelect: (value: string) => void;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  value,
  options,
  placeholder,
  error = false,
  valid = false,
  openUp = false,
  onSelect,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const borderState = error
    ? 'border-red-400 dark:border-red-500 ring-2 ring-red-500/30'
    : open
      ? 'border-[#F3B229] ring-2 ring-[#F3B229]/30'
      : valid
        ? 'border-emerald-400 dark:border-emerald-500'
        : 'border-slate-300 dark:border-gray-600 hover:border-slate-400 dark:hover:border-gray-500';

  return (
    <div ref={ref} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between pl-4 pr-3 py-2.5 border rounded-xl text-sm transition-all duration-200 bg-white dark:bg-gray-900/50 text-left cursor-pointer ${borderState}`}
      >
        <span className={value ? 'text-slate-800 dark:text-gray-100' : 'text-slate-400 dark:text-gray-500'}>
          {selectedLabel || placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          className="flex-shrink-0 ml-2"
        >
          <ChevronDown className="h-4 w-4 text-slate-400 dark:text-gray-500" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: openUp ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUp ? 6 : -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`absolute z-50 left-0 right-0 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-xl shadow-xl shadow-slate-900/10 dark:shadow-black/30 overflow-hidden ${
              openUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            }`}
          >
            <div className="max-h-52 overflow-y-auto py-1">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onSelect(opt.value); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-100 ${
                    value === opt.value
                      ? 'bg-[#F3B229]/10 text-[#B8860B] font-medium'
                      : 'text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NewUserForm: React.FC<NewUserFormProps> = ({ customRoles, departments, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [customRoleId, setCustomRoleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [cpfTouched, setCpfTouched] = useState(false);
  const [deptTouched, setDeptTouched] = useState(false);
  const [roleTouched, setRoleTouched] = useState(false);
  const [birthTouched, setBirthTouched] = useState(false);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  const emailValid = isValidEmail(email);
  const cpfValid = validateCPF(cpf);
  const deptValid = departmentId !== '';
  const roleValid = customRoleId !== '';
  const birthValid = isValidBirth(dataNascimento);

  const emailError = emailTouched && email.length > 0 && !emailValid;
  const cpfError = cpfTouched && cpf.length > 0 && !cpfValid;
  const deptError = deptTouched && !deptValid;
  const roleError = roleTouched && !roleValid;
  const birthError = birthTouched && !birthValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setEmailTouched(true);
      setError('Email inválido.');
      return;
    }
    if (!validateCPF(cpf)) {
      setCpfTouched(true);
      setError('CPF inválido.');
      return;
    }
    if (!departmentId) {
      setDeptTouched(true);
      setError('Selecione o departamento.');
      return;
    }
    if (!customRoleId) {
      setRoleTouched(true);
      setError('Selecione o cargo.');
      return;
    }
    if (!isValidBirth(dataNascimento)) {
      setBirthTouched(true);
      setError('Data de nascimento inválida.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setError('Sessão expirada. Faça login novamente.');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          email,
          cpf,
          dataNascimento: dataNascimento || undefined,
          departmentId,
          customRoleId: customRoleId || null,
        }),
      });

      const data: { success?: boolean; error?: string; userId?: string; tempPassword?: string } =
        await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setError(data.error || 'Erro ao cadastrar usuário.');
        setLoading(false);
        return;
      }

      onCreated(data.tempPassword || '');
    } catch {
      setError('Erro de rede ao cadastrar usuário.');
      setLoading(false);
    }
  };

  const departmentOptions: SelectOption[] = departments
    .filter(d => d.isActive)
    .map(d => ({ value: d.id, label: d.name }));

  const roleOptions: SelectOption[] = customRoles.map(r => ({ value: r.id, label: r.name }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={loading ? undefined : onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-gray-700 p-6 sm:p-8"
      >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-all duration-200 disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F3B229] to-[#E5A320] text-white shadow-md shadow-[#F3B229]/25 mb-3">
              <UserPlus className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100">Novo Usuário</h2>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              Cadastre um novo usuário no sistema EGEN.
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nu-name" className={labelClass}>Nome Completo *</label>
              <input id="nu-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} placeholder="Nome completo" />
            </div>

            <div>
              <label htmlFor="nu-email" className={labelClass}>Email *</label>
              <div className="relative">
                <input id="nu-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setEmailTouched(true)} required className={`${FIELD_BASE} pr-10 ${borderFor(emailError, emailTouched && email.length > 0 && emailValid)}`} placeholder="email@exemplo.com" />
                {emailTouched && email.length > 0 && (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                    {emailValid ? <Check className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                  </span>
                )}
              </div>
              {emailError && <p className="mt-1 text-xs text-red-500">Email inválido.</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nu-phone" className={labelClass}>Telefone</label>
                <input id="nu-phone" type="tel" value={telefone} onChange={(e) => setTelefone(formatPhone(e.target.value))} className={inputClass} placeholder="(00) 00000-0000" maxLength={16} />
              </div>
              <div>
                <label htmlFor="nu-cpf" className={labelClass}>CPF *</label>
                <div className="relative">
                  <input id="nu-cpf" type="text" value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} onBlur={() => setCpfTouched(true)} required maxLength={14} className={`${FIELD_BASE} pr-10 ${borderFor(cpfError, cpfTouched && cpf.length > 0 && cpfValid)}`} placeholder="000.000.000-00" />
                  {cpfTouched && cpf.length > 0 && (
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                      {cpfValid ? <Check className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
                    </span>
                  )}
                </div>
                {cpfError && <p className="mt-1 text-xs text-red-500">CPF inválido.</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nu-birth" className={labelClass}>Data de Nascimento *</label>
                <input id="nu-birth" type="date" value={dataNascimento} onChange={(e) => { setDataNascimento(e.target.value); setBirthTouched(true); }} onBlur={() => setBirthTouched(true)} required max={maxBirthDate} className={dateClassFor(birthError, birthTouched && birthValid)} />
                {birthError && <p className="mt-1 text-xs text-red-500">Deve ter no mínimo {MIN_AGE} anos.</p>}
              </div>
              <div>
                <label htmlFor="nu-dept" className={labelClass}>Departamento *</label>
                <CustomSelect
                  id="nu-dept"
                  value={departmentId}
                  placeholder="Selecione"
                  error={deptError}
                  valid={deptValid}
                  onSelect={(v) => { setDepartmentId(v); setDeptTouched(true); }}
                  options={departmentOptions}
                />
                {deptError && <p className="mt-1 text-xs text-red-500">Selecione um departamento.</p>}
              </div>
            </div>

            <div>
              <label htmlFor="nu-role" className={labelClass}>Cargo *</label>
              <CustomSelect
                id="nu-role"
                value={customRoleId}
                placeholder="Selecione o cargo"
                error={roleError}
                valid={roleValid}
                openUp
                onSelect={(v) => { setCustomRoleId(v); setRoleTouched(true); }}
                options={roleOptions}
              />
              {roleError && <p className="mt-1 text-xs text-red-500">Selecione um cargo.</p>}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2.5 text-slate-700 dark:text-gray-300 bg-slate-100 dark:bg-gray-700 rounded-xl hover:bg-slate-200 dark:hover:bg-gray-600 transition-all duration-200 font-medium disabled:opacity-50">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-[#F3B229] to-[#E5A320] text-white font-medium rounded-xl shadow-md shadow-[#F3B229]/25 hover:from-[#E5A320] hover:to-[#D4941A] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Cadastrar Usuário
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
    </div>
  );
};

export default NewUserForm;
