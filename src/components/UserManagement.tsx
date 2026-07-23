import React, { useState, useEffect } from 'react';
import { Users, Edit, Shield, Plus, X, Save, UserCog, User, ShieldCheck, Search, UserPlus, Trash2, Lock, Building2, Check, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole, CustomRole, Department } from '../types';
import { ALL_PERMISSION_KEYS, hasPermission, getRoleLabel } from '../utils/permissions';
import Notification from './Notification';
import NewUserForm from './NewUserForm';
import AvatarUpload from './AvatarUpload';
import QrcodeUpload from './QrcodeUpload';

const GROUP_COLORS: Record<string, { dot: string; activePill: string; activeText: string; groupHeader: string; groupBg: string }> = {
  'Dashboard':     { dot: 'bg-purple-500',  activePill: 'bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-700',  activeText: 'text-purple-700 dark:text-purple-300',  groupHeader: 'text-purple-600 dark:text-purple-400',  groupBg: 'border-l-2 border-purple-300 dark:border-purple-700 pl-3' },
  'Equipamentos':  { dot: 'bg-blue-500',    activePill: 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700',      activeText: 'text-blue-700 dark:text-blue-300',      groupHeader: 'text-blue-600 dark:text-blue-400',      groupBg: 'border-l-2 border-blue-300 dark:border-blue-700 pl-3' },
  'CRM':           { dot: 'bg-pink-500',    activePill: 'bg-pink-100 dark:bg-pink-900/40 border-pink-300 dark:border-pink-700',      activeText: 'text-pink-700 dark:text-pink-300',      groupHeader: 'text-pink-600 dark:text-pink-400',      groupBg: 'border-l-2 border-pink-300 dark:border-pink-700 pl-3' },
  'Propostas':     { dot: 'bg-rose-500',    activePill: 'bg-rose-100 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700',      activeText: 'text-rose-700 dark:text-rose-300',      groupHeader: 'text-rose-600 dark:text-rose-400',      groupBg: 'border-l-2 border-rose-300 dark:border-rose-700 pl-3' },
  'Manutenção':    { dot: 'bg-teal-500',    activePill: 'bg-teal-100 dark:bg-teal-900/40 border-teal-300 dark:border-teal-700',      activeText: 'text-teal-700 dark:text-teal-300',      groupHeader: 'text-teal-600 dark:text-teal-400',      groupBg: 'border-l-2 border-teal-300 dark:border-teal-700 pl-3' },
  'Administração': { dot: 'bg-amber-500',   activePill: 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700',   activeText: 'text-amber-700 dark:text-amber-300',    groupHeader: 'text-amber-600 dark:text-amber-400',    groupBg: 'border-l-2 border-amber-300 dark:border-amber-700 pl-3' },
};

const UserManagement: React.FC = () => {
  const { userProfile, refreshProfile } = useAuth();
  const { notification, showSuccess, showError, hideNotification } = useNotification();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'departments'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');

  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [roleFormData, setRoleFormData] = useState({ name: '', description: '', permissions: [] as string[] });

  // Department form
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isSavingDept, setIsSavingDept] = useState(false);
  const [deptFormData, setDeptFormData] = useState({ name: '', description: '' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '' as string,
    customRoleId: '' as string,
    department: '' as string,
  });

  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);

  const topRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsers();
    fetchCustomRoles();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoadingDepts(true);
    try {
      const { data, error } = await supabase.from('departments').select('*').order('name');
      if (error) throw error;
      setDepartments((data || []).map((d: any) => ({
        id: d.id, name: d.name, description: d.description,
        isActive: d.is_active, createdAt: d.created_at, updatedAt: d.updated_at,
      })));
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
    } finally {
      setLoadingDepts(false);
    }
  };

  const fetchCustomRoles = async () => {
    setLoadingRoles(true);
    try {
      const { data, error } = await supabase.from('custom_roles').select('*')
        .order('is_system', { ascending: false }).order('name', { ascending: true });
      if (error) throw error;
      setCustomRoles((data || []).map((r: any) => ({
        id: r.id, name: r.name, description: r.description,
        permissions: r.permissions || [], isSystem: r.is_system,
        createdAt: r.created_at, updatedAt: r.updated_at,
      })));
    } catch (error) {
      console.error('Erro ao carregar cargos:', error);
    } finally {
      setLoadingRoles(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('user_profiles')
        .select('*, custom_roles(id, name, permissions)').order('created_at', { ascending: false });
      if (error) throw error;
      setUsers((data || []).map((user: any) => ({
        id: user.id, email: user.email, name: user.name,
        phone: user.phone, avatar_url: user.avatar_url, qrcode_url: user.qrcode_url,
        cpf: user.cpf, data_nascimento: user.data_nascimento,
        role: user.role, department: user.department || '',
        customRoleId: user.custom_role_id,
        permissions: user.custom_roles?.permissions || [],
        roleName: user.custom_roles?.name,
        createdAt: user.created_at, updatedAt: user.updated_at,
      })));
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      showError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      customRoleId: user.customRoleId || '',
      department: user.department || '',
    });
    setEditingUser(user);
    setShowAddForm(true);
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingUser) {
        const { error } = await supabase.from('user_profiles').update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          custom_role_id: formData.customRoleId || null,
          department: formData.department,
          avatar_url: editingUser.avatar_url ?? null,
          qrcode_url: editingUser.qrcode_url ?? null,
          updated_at: new Date().toISOString(),
        }).eq('id', editingUser.id);
        if (error) throw error;
        showSuccess('Usuário atualizado com sucesso!');
      }
      await fetchUsers();
      handleCancel();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      showError('Erro ao salvar usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', email: '', phone: '', customRoleId: '', department: '' });
    setEditingUser(null);
    setShowAddForm(false);
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeletingUser(true);
    try {
      const { error: profileErr } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', deleteTarget.id);

      if (profileErr) throw new Error(profileErr.message);

      showSuccess('Usuário excluído', `${deleteTarget.name} foi removido com sucesso.`);
      setDeleteTarget(null);
      await fetchUsers();
    } catch (error: any) {
      showError('Erro ao excluir', error?.message || 'Não foi possível excluir o usuário.');
    } finally {
      setDeletingUser(false);
    }
  };

  const userPermissions = userProfile?.permissions ?? [];

  const handleUserCreated = (tempPassword: string) => {
    setShowNewUserForm(false);
    fetchUsers();
    showSuccess(`Usuário cadastrado! Senha temporária: ${tempPassword}`);
  };

  // ─── Roles CRUD ────────────────────────────────────────────────────────────
  const handleEditRole = (role: CustomRole) => {
    setRoleFormData({ name: role.name, description: role.description || '', permissions: [...role.permissions] });
    setEditingRole(role);
    setShowRoleForm(true);
  };

  const handleCancelRole = () => {
    setRoleFormData({ name: '', description: '', permissions: [] });
    setEditingRole(null);
    setShowRoleForm(false);
  };

  const togglePermission = (key: string) => {
    setRoleFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key) ? prev.permissions.filter(p => p !== key) : [...prev.permissions, key],
    }));
  };

  const toggleAllPermissions = () => {
    const allKeys = ALL_PERMISSION_KEYS.map(p => p.key);
    setRoleFormData(prev => ({
      ...prev,
      permissions: prev.permissions.length === allKeys.length ? [] : allKeys,
    }));
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleFormData.name.trim()) return;
    setIsSavingRole(true);
    try {
      if (editingRole) {
        const { error } = await supabase.from('custom_roles').update({
          name: roleFormData.name.trim(),
          description: roleFormData.description.trim() || null,
          permissions: roleFormData.permissions,
          updated_at: new Date().toISOString(),
        }).eq('id', editingRole.id);
        if (error) throw error;
        showSuccess('Cargo atualizado!');
        if (editingRole.id === userProfile?.customRoleId) {
          await refreshProfile();
        }
      } else {
        const { error } = await supabase.from('custom_roles').insert({
          name: roleFormData.name.trim(),
          description: roleFormData.description.trim() || null,
          permissions: roleFormData.permissions,
          is_system: false,
        });
        if (error) throw error;
        showSuccess('Cargo criado!');
      }
      await fetchCustomRoles();
      handleCancelRole();
    } catch (error: any) {
      showError(error?.message?.includes('unique') ? 'Já existe um cargo com este nome.' : 'Erro ao salvar cargo.');
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleDeleteRole = async (role: CustomRole) => {
    if (role.isSystem) return;
    if (!window.confirm(`Excluir o cargo "${role.name}"?`)) return;
    try {
      const { error } = await supabase.from('custom_roles').delete().eq('id', role.id);
      if (error) throw error;
      showSuccess('Cargo excluído!');
      await fetchCustomRoles();
      await fetchUsers();
    } catch (error) {
      showError('Erro ao excluir cargo.');
    }
  };

  // ─── Departments CRUD ──────────────────────────────────────────────────────
  const handleEditDept = (dept: Department) => {
    setDeptFormData({ name: dept.name, description: dept.description || '' });
    setEditingDept(dept);
    setShowDeptForm(true);
  };

  const handleCancelDept = () => {
    setDeptFormData({ name: '', description: '' });
    setEditingDept(null);
    setShowDeptForm(false);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptFormData.name.trim()) return;
    setIsSavingDept(true);
    try {
      if (editingDept) {
        const { error } = await supabase.from('departments').update({
          name: deptFormData.name.trim(),
          description: deptFormData.description.trim() || null,
          updated_at: new Date().toISOString(),
        }).eq('id', editingDept.id);
        if (error) throw error;
        showSuccess('Departamento atualizado!');
      } else {
        const { error } = await supabase.from('departments').insert({
          name: deptFormData.name.trim(),
          description: deptFormData.description.trim() || null,
        });
        if (error) throw error;
        showSuccess('Departamento criado!');
      }
      await fetchDepartments();
      handleCancelDept();
    } catch (error: any) {
      showError(error?.message?.includes('unique') ? 'Já existe um departamento com este nome.' : 'Erro ao salvar.');
    } finally {
      setIsSavingDept(false);
    }
  };

  const handleToggleDeptActive = async (dept: Department) => {
    try {
      const { error } = await supabase.from('departments').update({
        is_active: !dept.isActive,
        updated_at: new Date().toISOString(),
      }).eq('id', dept.id);
      if (error) throw error;
      await fetchDepartments();
    } catch (error) {
      showError('Erro ao alterar status.');
    }
  };

  const getSelectedRolePermissions = (): string[] => {
    const role = customRoles.find(r => r.id === formData.customRoleId);
    return role?.permissions || [];
  };

  const filteredUsers = users.filter(user => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || user.name.toLowerCase().includes(q) || user.email.toLowerCase().includes(q) || user.department.toLowerCase().includes(q) || (user.roleName || '').toLowerCase().includes(q);
    const matchesDept = filterDept === 'all' || user.department === filterDept;
    const matchesRole = filterRole === 'all' || (user.roleName || getRoleLabel(user.role)) === filterRole;
    return matchesSearch && matchesDept && matchesRole;
  });

  const activeFilterCount = (filterRole !== 'all' ? 1 : 0) + (filterDept !== 'all' ? 1 : 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#F3B229] border-t-transparent"></div>
          <span className="mt-3 text-gray-500 dark:text-gray-400 font-medium">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={topRef}>
      <Notification type={notification.type} title={notification.title} message={notification.message} isVisible={notification.isVisible} onClose={hideNotification} />

      {showNewUserForm && (
        <NewUserForm customRoles={customRoles} departments={departments} onClose={() => setShowNewUserForm(false)} onCreated={handleUserCreated} />
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">Gerenciamento de Usuários</h2>
          <p className="text-gray-500 dark:text-gray-400">Gerencie usuários, cargos e departamentos</p>
        </div>
        {hasPermission(userPermissions, 'canManageUsers') && activeTab === 'users' && (
          <button onClick={() => setShowNewUserForm(true)} className="flex items-center px-4 py-2 bg-gradient-to-r from-[#F3B229] to-[#E5A320] text-white rounded-xl hover:from-[#E5A320] hover:to-[#D4941A] transition-all duration-200 shadow-md">
            <UserPlus className="w-4 h-4 mr-2" /> Novo Usuário
          </button>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !deletingUser && setDeleteTarget(null)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Excluir Usuário</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Tem certeza que deseja excluir <span className="font-semibold text-gray-700 dark:text-gray-300">{deleteTarget.name}</span>?
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deletingUser}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-150 active:scale-[0.97] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deletingUser}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-all duration-150 active:scale-[0.97] disabled:opacity-50 flex items-center gap-2"
              >
                {deletingUser ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {(['users', 'roles', 'departments'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === tab ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'users' ? <Users className="w-4 h-4" /> : tab === 'roles' ? <Shield className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
            {tab === 'users' ? 'Usuários' : tab === 'roles' ? 'Cargos e Permissões' : 'Departamentos'}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ────────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <>
          {/* Edit Form */}
          {showAddForm && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                <button onClick={handleCancel} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome Completo *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#F3B229] focus:border-transparent bg-gray-50/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-100" placeholder="Nome do usuário" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email *</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} required className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#F3B229] focus:border-transparent bg-gray-50/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-100" placeholder="email@empresa.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefone</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#F3B229] focus:border-transparent bg-gray-50/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-100" placeholder="(00) 00000-0000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Departamento</label>
                  <select value={formData.department} onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#F3B229] focus:border-transparent bg-gray-50/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-100 cursor-pointer">
                    <option value="">Sem departamento</option>
                    {departments.filter(d => d.isActive).map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cargo</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                    {customRoles.map(role => {
                      const isSelected = formData.customRoleId === role.id;
                      const coveragePct = Math.round((role.permissions.length / ALL_PERMISSION_KEYS.length) * 100);
                      const activeGroups = [...new Set(ALL_PERMISSION_KEYS.filter(p => role.permissions.includes(p.key)).map(p => p.group))];
                      return (
                        <button key={role.id} type="button" onClick={() => setFormData(prev => ({ ...prev, customRoleId: role.id }))}
                          className={`relative group text-left rounded-xl border-2 p-3 transition-all duration-150 ${
                            isSelected ? 'border-[#F3B229] bg-[#F3B229]/5 shadow-md shadow-[#F3B229]/10' : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/30 hover:border-[#F3B229]/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className={`text-sm font-semibold leading-tight ${isSelected ? 'text-[#B8860B]' : 'text-gray-800 dark:text-gray-200'}`}>{role.name}</span>
                            {isSelected && <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#F3B229] flex items-center justify-center"><Check className="w-2.5 h-2.5 text-white" /></span>}
                            {role.isSystem && !isSelected && <Lock className="flex-shrink-0 w-3 h-3 text-gray-400" />}
                          </div>
                          <div className="flex gap-1 flex-wrap mb-2">
                            {activeGroups.map(g => <span key={g} className={`w-2 h-2 rounded-full ${GROUP_COLORS[g]?.dot || 'bg-gray-400'}`} title={g} />)}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              <div className={`h-1 rounded-full transition-all duration-300 ${isSelected ? 'bg-gradient-to-r from-[#F3B229] to-[#E5A320]' : 'bg-gradient-to-r from-gray-300 to-gray-400'}`} style={{ width: `${coveragePct}%` }} />
                            </div>
                            <span className="text-[10px] text-gray-400 tabular-nums whitespace-nowrap">{coveragePct}%</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {formData.customRoleId && (
                  <div className="md:col-span-2">
                    <div className="bg-gradient-to-r from-[#F3B229]/5 to-amber-50 dark:from-[#F3B229]/10 dark:to-amber-900/20 p-4 rounded-xl border border-[#F3B229]/20">
                      <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">Permissões do cargo:</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {getSelectedRolePermissions().map(perm => {
                          const info = ALL_PERMISSION_KEYS.find(p => p.key === perm);
                          return <span key={perm} className="px-2 py-0.5 bg-[#F3B229]/10 dark:bg-amber-800/30 rounded-md text-xs text-amber-700 dark:text-amber-300">{info?.label || perm}</span>;
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {editingUser && (
                  <div className="md:col-span-2 flex gap-8 py-2">
                    <AvatarUpload
                      userId={editingUser.id}
                      currentUrl={editingUser.avatar_url}
                      onUploaded={(url) => setEditingUser(prev => prev ? { ...prev, avatar_url: url } : null)}
                      onRemove={() => setEditingUser(prev => prev ? { ...prev, avatar_url: undefined } : null)}
                    />
                    <QrcodeUpload
                      userId={editingUser.id}
                      currentUrl={editingUser.qrcode_url}
                      onUploaded={(url) => setEditingUser(prev => prev ? { ...prev, qrcode_url: url } : null)}
                      onRemove={() => setEditingUser(prev => prev ? { ...prev, qrcode_url: undefined } : null)}
                    />
                  </div>
                )}
                <div className="md:col-span-2 flex justify-end space-x-3">
                  <button type="button" onClick={handleCancel} className="px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 bg-gradient-to-r from-[#F3B229] to-[#E5A320] text-white rounded-xl hover:from-[#E5A320] hover:to-[#D4941A] disabled:opacity-50 flex items-center font-medium shadow-md">
                    {isSubmitting ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>Salvando...</> : <><Save className="w-4 h-4 mr-2" />{editingUser ? 'Atualizar' : 'Criar'}</>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search & Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nome, email, departamento ou cargo..."
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#F3B229] focus:border-transparent focus:bg-white dark:focus:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                  className="px-3.5 py-2.5 text-sm font-medium bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-[#F3B229] focus:border-transparent cursor-pointer transition-all duration-200 min-w-[130px]"
                >
                  <option value="all">Todos os cargos</option>
                  {customRoles.map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>

                <select
                  value={filterDept}
                  onChange={e => setFilterDept(e.target.value)}
                  className="px-3.5 py-2.5 text-sm font-medium bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-[#F3B229] focus:border-transparent cursor-pointer transition-all duration-200 min-w-[150px]"
                >
                  <option value="all">Todos os departamentos</option>
                  {departments.filter(d => d.isActive).map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>

                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { setFilterRole('all'); setFilterDept('all'); setSearchQuery(''); }}
                    className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200 whitespace-nowrap"
                  >
                    <X className="w-3 h-3" />
                    Limpar filtros
                  </button>
                )}

                <span className="ml-1 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 rounded-xl whitespace-nowrap">
                  {filteredUsers.length} de {users.length} usuários
                </span>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuário</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Departamento</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cargo</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Criado em</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredUsers.map(user => {
                    const getRoleIcon = (role: UserRole) => {
                      switch (role) {
                        case 'admin': return <ShieldCheck className="w-5 h-5 text-white" />;
                        case 'operator': return <UserCog className="w-5 h-5 text-white" />;
                        default: return <User className="w-5 h-5 text-white" />;
                      }
                    };
                    const getRoleGradient = (role: UserRole) => {
                      switch (role) {
                        case 'admin': return 'bg-gradient-to-br from-red-500 to-rose-500 shadow-red-500/25';
                        case 'operator': return 'bg-gradient-to-br from-blue-500 to-indigo-500 shadow-blue-500/25';
                        default: return 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-green-500/25';
                      }
                    };
                    return (
                      <tr key={user.id} className="hover:bg-[#F3B229]/5 dark:hover:bg-[#F3B229]/10 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.name} className="w-10 h-10 rounded-xl object-cover mr-3 shadow-md" />
                            ) : (
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 shadow-md ${getRoleGradient(user.role)}`}>
                                {getRoleIcon(user.role)}
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{user.department}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            user.role === 'admin' ? 'bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/50 dark:to-rose-900/50 text-red-800 dark:text-red-200' :
                            user.role === 'operator' ? 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 text-blue-800 dark:text-blue-200' :
                            'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 text-green-800 dark:text-green-200'
                          }`}>{user.roleName || getRoleLabel(user.role)}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleEdit(user)} className="text-[#F3B229] hover:text-[#E5A320] flex items-center px-3 py-1.5 rounded-lg hover:bg-[#F3B229]/10 transition-all duration-200">
                              <Edit className="w-4 h-4 mr-1" /> Editar
                            </button>
                            {hasPermission(userPermissions, 'canDeleteUsers') && user.id !== userProfile?.id && (
                              <button onClick={() => setDeleteTarget(user)} className="text-red-500 hover:text-red-600 flex items-center px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200">
                                <Trash2 className="w-4 h-4 mr-1" /> Excluir
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {users.length === 0 && (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Nenhum usuário</h3>
                <p className="text-gray-500 dark:text-gray-400">Os usuários aparecerão aqui conforme forem cadastrados.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── ROLES TAB ────────────────────────────────────────────────────────── */}
      {activeTab === 'roles' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => { handleCancelRole(); setShowRoleForm(true); }} className="flex items-center px-4 py-2 bg-gradient-to-r from-[#F3B229] to-[#E5A320] text-white rounded-xl hover:from-[#E5A320] hover:to-[#D4941A] transition-all duration-200 shadow-md">
              <Plus className="w-4 h-4 mr-2" /> Novo Cargo
            </button>
          </div>

          {showRoleForm && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{editingRole ? 'Editar Cargo' : 'Novo Cargo'}</h3>
                <button onClick={handleCancelRole} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveRole} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome do Cargo *</label>
                    <input type="text" value={roleFormData.name} onChange={(e) => setRoleFormData(prev => ({ ...prev, name: e.target.value }))} required className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#F3B229] focus:border-transparent bg-gray-50/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-100" placeholder="Ex: Analista Financeiro" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descrição</label>
                    <input type="text" value={roleFormData.description} onChange={(e) => setRoleFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#F3B229] focus:border-transparent bg-gray-50/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-100" placeholder="Descrição do cargo" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Permissões</label>
                    <button type="button" onClick={toggleAllPermissions} className="text-xs text-[#F3B229] hover:text-[#E5A320] font-medium">{roleFormData.permissions.length === ALL_PERMISSION_KEYS.length ? 'Desmarcar todas' : 'Marcar todas'}</button>
                  </div>
                  {Object.entries(
                    ALL_PERMISSION_KEYS.reduce((acc, p) => {
                      if (!acc[p.group]) acc[p.group] = [];
                      acc[p.group].push(p);
                      return acc;
                    }, {} as Record<string, typeof ALL_PERMISSION_KEYS>)
                  ).map(([group, perms]) => (
                    <div key={group} className="mb-3">
                      <p className={`text-xs font-semibold uppercase tracking-wide mb-1.5 ${GROUP_COLORS[group]?.groupHeader || 'text-gray-500'}`}>{group}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {perms.map(p => {
                          const active = roleFormData.permissions.includes(p.key);
                          const colors = GROUP_COLORS[group];
                          return (
                            <button key={p.key} type="button" onClick={() => togglePermission(p.key)}
                              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all duration-150 ${
                                active ? `${colors?.activePill || 'bg-gray-100 border-gray-300'} ${colors?.activeText || 'text-gray-700'}` : 'bg-white dark:bg-gray-700/30 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                              }`}
                            >{p.label}</button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={handleCancelRole} className="px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium">Cancelar</button>
                  <button type="submit" disabled={isSavingRole} className="px-6 py-2.5 bg-gradient-to-r from-[#F3B229] to-[#E5A320] text-white rounded-xl hover:from-[#E5A320] hover:to-[#D4941A] disabled:opacity-50 flex items-center font-medium shadow-md">
                    {isSavingRole ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>Salvando...</> : <><Save className="w-4 h-4 mr-2" />{editingRole ? 'Atualizar' : 'Criar'}</>}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loadingRoles ? (
              <div className="col-span-full flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-4 border-[#F3B229] border-t-transparent"></div></div>
            ) : (
              customRoles.map(role => {
                const coveragePct = Math.round((role.permissions.length / ALL_PERMISSION_KEYS.length) * 100);
                const activeGroups = [...new Set(ALL_PERMISSION_KEYS.filter(p => role.permissions.includes(p.key)).map(p => p.group))];
                return (
                  <div key={role.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">{role.name}</h4>
                        {role.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{role.description}</p>}
                      </div>
                      {role.isSystem && <Lock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" title="Cargo do sistema" />}
                    </div>
                    <div className="flex gap-1 flex-wrap mb-3">
                      {activeGroups.map(g => <span key={g} className={`w-2 h-2 rounded-full ${GROUP_COLORS[g]?.dot || 'bg-gray-400'}`} title={g} />)}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-[#F3B229] to-[#E5A320] transition-all" style={{ width: `${coveragePct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 tabular-nums">{coveragePct}%</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditRole(role)} className="flex-1 px-3 py-1.5 text-xs font-medium text-[#B8860B] bg-[#F3B229]/10 rounded-lg hover:bg-[#F3B229]/20 transition-all">Editar</button>
                      {!role.isSystem && (
                        <button onClick={() => handleDeleteRole(role)} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* ── DEPARTMENTS TAB ──────────────────────────────────────────────────── */}
      {activeTab === 'departments' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => { handleCancelDept(); setShowDeptForm(true); }} className="flex items-center px-4 py-2 bg-gradient-to-r from-[#F3B229] to-[#E5A320] text-white rounded-xl hover:from-[#E5A320] hover:to-[#D4941A] transition-all duration-200 shadow-md">
              <Plus className="w-4 h-4 mr-2" /> Novo Departamento
            </button>
          </div>

          {showDeptForm && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{editingDept ? 'Editar Departamento' : 'Novo Departamento'}</h3>
                <button onClick={handleCancelDept} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveDept} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome *</label>
                    <input type="text" value={deptFormData.name} onChange={(e) => setDeptFormData(prev => ({ ...prev, name: e.target.value }))} required className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#F3B229] focus:border-transparent bg-gray-50/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-100" placeholder="Nome do departamento" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descrição</label>
                    <input type="text" value={deptFormData.description} onChange={(e) => setDeptFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#F3B229] focus:border-transparent bg-gray-50/50 dark:bg-gray-700/50 text-gray-800 dark:text-gray-100" placeholder="Descrição do departamento" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={handleCancelDept} className="px-4 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium">Cancelar</button>
                  <button type="submit" disabled={isSavingDept} className="px-6 py-2.5 bg-gradient-to-r from-[#F3B229] to-[#E5A320] text-white rounded-xl hover:from-[#E5A320] hover:to-[#D4941A] disabled:opacity-50 flex items-center font-medium shadow-md">
                    {isSavingDept ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>Salvando...</> : <><Save className="w-4 h-4 mr-2" />{editingDept ? 'Atualizar' : 'Criar'}</>}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Departamento</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                  {loadingDepts ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-4 border-[#F3B229] border-t-transparent mx-auto"></div></td></tr>
                  ) : departments.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Nenhum departamento cadastrado.</td></tr>
                  ) : (
                    departments.map(dept => (
                      <tr key={dept.id} className="hover:bg-[#F3B229]/5 dark:hover:bg-[#F3B229]/10 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-9 h-9 rounded-lg bg-[#F3B229]/10 flex items-center justify-center mr-3">
                              <Building2 className="w-4 h-4 text-[#B8860B]" />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{dept.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{dept.description || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button onClick={() => handleToggleDeptActive(dept)} className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${dept.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                            {dept.isActive ? 'Ativo' : 'Inativo'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button onClick={() => handleEditDept(dept)} className="text-[#F3B229] hover:text-[#E5A320] flex items-center px-3 py-1.5 rounded-lg hover:bg-[#F3B229]/10 transition-all duration-200">
                            <Edit className="w-4 h-4 mr-1" /> Editar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserManagement;
