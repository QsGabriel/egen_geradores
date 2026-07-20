import { UserRole } from '../types';

export const ALL_PERMISSION_KEYS: { key: string; label: string; group: string }[] = [
  { key: 'canViewDashboard', label: 'Visualizar Dashboard', group: 'Dashboard' },
  { key: 'canViewSalesRanking', label: 'Ver Ranking de Vendedores (produção de todos)', group: 'Dashboard' },

  { key: 'canManageEquipment', label: 'Gerenciar Equipamentos', group: 'Equipamentos' },
  { key: 'canViewEquipment', label: 'Visualizar Equipamentos', group: 'Equipamentos' },
  { key: 'canAddEquipment', label: 'Adicionar Equipamentos', group: 'Equipamentos' },
  { key: 'canEditEquipment', label: 'Editar Equipamentos', group: 'Equipamentos' },
  { key: 'canDeleteEquipment', label: 'Excluir Equipamentos', group: 'Equipamentos' },

  { key: 'canViewClients', label: 'Visualizar Clientes', group: 'CRM' },
  { key: 'canCreateClients', label: 'Criar Clientes', group: 'CRM' },
  { key: 'canEditClients', label: 'Editar Clientes', group: 'CRM' },
  { key: 'canDeleteClients', label: 'Excluir Clientes', group: 'CRM' },

  { key: 'canViewLeads', label: 'Visualizar Leads', group: 'CRM' },
  { key: 'canCreateLeads', label: 'Criar Leads', group: 'CRM' },
  { key: 'canEditLeads', label: 'Editar Leads', group: 'CRM' },
  { key: 'canDeleteLeads', label: 'Excluir Leads', group: 'CRM' },

  { key: 'canManageQuotations', label: 'Gerenciar Propostas', group: 'Propostas' },
  { key: 'canDeleteQuotations', label: 'Excluir Propostas', group: 'Propostas' },
  { key: 'canConfigureRequestPeriods', label: 'Configurar Períodos', group: 'Propostas' },

  { key: 'canViewMaintenance', label: 'Visualizar Manutenções', group: 'Manutenção' },
  { key: 'canManageMaintenance', label: 'Gerenciar Manutenções', group: 'Manutenção' },

  { key: 'canManageUsers', label: 'Gerenciar Usuários', group: 'Administração' },
  { key: 'canDeleteUsers', label: 'Excluir Usuários', group: 'Administração' },
  { key: 'canManageRoles', label: 'Gerenciar Cargos', group: 'Administração' },
  { key: 'canManageDepartments', label: 'Gerenciar Departamentos', group: 'Administração' },
  { key: 'canManageWhitelist', label: 'Gerenciar Whitelist', group: 'Administração' },
];

// Fallback para roles legadas (transição)
const LEGACY_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ALL_PERMISSION_KEYS.map(p => p.key),
  operator: ALL_PERMISSION_KEYS.map(p => p.key).filter(
    k => !['canViewDashboard', 'canManageUsers', 'canDeleteUsers', 'canManageRoles', 'canManageDepartments', 'canManageWhitelist'].includes(k)
  ),
  requester: ['canViewClients', 'canViewLeads', 'canViewMaintenance'],
};

export const getPermissionsForLegacyRole = (role: UserRole): string[] => {
  return LEGACY_ROLE_PERMISSIONS[role] || [];
};

export const hasPermission = (permissions: string[], permission: string): boolean => {
  return permissions.includes(permission);
};

export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    admin: 'Administrador',
    operator: 'Operador',
    requester: 'Solicitante',
  };
  return labels[role];
};

export const getDepartmentLabel = (name: string): string => name;

export const DEPARTMENTS = ['Administrativo', 'Comercial', 'TI'];
