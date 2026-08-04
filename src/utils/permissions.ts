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

  { key: 'canViewAllStates', label: 'Ver Todos os Estados (CRM)', group: 'CRM' },

  { key: 'canManageQuotations', label: 'Gerenciar Propostas', group: 'Propostas' },
  { key: 'canViewAllProposals', label: 'Ver Todas as Propostas', group: 'Propostas' },
  { key: 'canViewOwnProposals', label: 'Ver Próprias Propostas', group: 'Propostas' },
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

export const BRAZILIAN_STATES: { uf: string; label: string; region: string }[] = [
  { uf: 'AC', label: 'Acre', region: 'Norte' },
  { uf: 'AL', label: 'Alagoas', region: 'Nordeste' },
  { uf: 'AP', label: 'Amapá', region: 'Norte' },
  { uf: 'AM', label: 'Amazonas', region: 'Norte' },
  { uf: 'BA', label: 'Bahia', region: 'Nordeste' },
  { uf: 'CE', label: 'Ceará', region: 'Nordeste' },
  { uf: 'DF', label: 'Distrito Federal', region: 'Centro-Oeste' },
  { uf: 'ES', label: 'Espírito Santo', region: 'Sudeste' },
  { uf: 'GO', label: 'Goiás', region: 'Centro-Oeste' },
  { uf: 'MA', label: 'Maranhão', region: 'Nordeste' },
  { uf: 'MT', label: 'Mato Grosso', region: 'Centro-Oeste' },
  { uf: 'MS', label: 'Mato Grosso do Sul', region: 'Centro-Oeste' },
  { uf: 'MG', label: 'Minas Gerais', region: 'Sudeste' },
  { uf: 'PA', label: 'Pará', region: 'Norte' },
  { uf: 'PB', label: 'Paraíba', region: 'Nordeste' },
  { uf: 'PR', label: 'Paraná', region: 'Sul' },
  { uf: 'PE', label: 'Pernambuco', region: 'Nordeste' },
  { uf: 'PI', label: 'Piauí', region: 'Nordeste' },
  { uf: 'RJ', label: 'Rio de Janeiro', region: 'Sudeste' },
  { uf: 'RN', label: 'Rio Grande do Norte', region: 'Nordeste' },
  { uf: 'RS', label: 'Rio Grande do Sul', region: 'Sul' },
  { uf: 'RO', label: 'Rondônia', region: 'Norte' },
  { uf: 'RR', label: 'Roraima', region: 'Norte' },
  { uf: 'SC', label: 'Santa Catarina', region: 'Sul' },
  { uf: 'SP', label: 'São Paulo', region: 'Sudeste' },
  { uf: 'SE', label: 'Sergipe', region: 'Nordeste' },
  { uf: 'TO', label: 'Tocantins', region: 'Norte' },
];

export const BRAZILIAN_STATE_REGIONS = [...new Set(BRAZILIAN_STATES.map(s => s.region))];

export function filterByAllowedStates<T>(
  items: T[],
  getState: (item: T) => string,
  allowedStates: string[],
  canViewAllStates: boolean,
): T[] {
  if (canViewAllStates) return items;
  if (!allowedStates || allowedStates.length === 0) return items;
  const normalizedAllowed = allowedStates.map(s => s.trim().toUpperCase());
  return items.filter(item => {
    const itemState = getState(item)?.trim().toUpperCase() || '';
    return normalizedAllowed.includes(itemState);
  });
}

// Fallback para roles legadas (transição)
const LEGACY_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ALL_PERMISSION_KEYS.map(p => p.key),
  operator: ALL_PERMISSION_KEYS.map(p => p.key).filter(
    k => !['canViewDashboard', 'canManageUsers', 'canDeleteUsers', 'canManageRoles', 'canManageDepartments', 'canManageWhitelist', 'canViewAllProposals'].includes(k)
  ),
  requester: ['canViewClients', 'canViewLeads', 'canViewMaintenance', 'canViewOwnProposals'],
};

export const getPermissionsForLegacyRole = (role: UserRole): string[] => {
  return LEGACY_ROLE_PERMISSIONS[role] || [];
};

export const hasPermission = (permissions: string[], permission: string): boolean => {
  return permissions.includes(permission);
};

export const hasAnyPermission = (permissions: string[], keys: string[]): boolean => {
  return keys.some(k => permissions.includes(k));
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
