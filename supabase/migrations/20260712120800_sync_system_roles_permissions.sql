-- Migration: Atualizar permissões dos cargos de sistema
-- Removidos: Movimentações, Solicitações, Monitoramento (não se aplicam à EGEN)
-- Ordem: pós-deploy

UPDATE custom_roles
SET permissions = '["canViewDashboard","canManageEquipment","canViewEquipment","canAddEquipment","canEditEquipment","canDeleteEquipment","canManageUsers","canManageRoles","canManageDepartments","canManageWhitelist","canManageQuotations","canConfigureRequestPeriods","canViewClients","canCreateClients","canEditClients","canDeleteClients","canViewLeads","canCreateLeads","canEditLeads","canDeleteLeads","canViewMaintenance","canManageMaintenance"]'::jsonb,
    description = 'Acesso completo a todos os módulos do sistema.',
    updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000001';

UPDATE custom_roles
SET permissions = '["canManageEquipment","canViewEquipment","canAddEquipment","canEditEquipment","canDeleteEquipment","canManageQuotations","canConfigureRequestPeriods","canViewClients","canCreateClients","canEditClients","canDeleteClients","canViewLeads","canCreateLeads","canEditLeads","canDeleteLeads","canViewMaintenance","canManageMaintenance"]'::jsonb,
    description = 'Acesso operacional. Sem dashboard, sem gerenciamento de usuários/cargos.',
    updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000002';

UPDATE custom_roles
SET permissions = '["canViewClients","canViewLeads","canViewMaintenance"]'::jsonb,
    description = 'Acesso básico: visualizar clientes, leads e manutenções.',
    updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000003';

-- Atualizar função user_has_permission (fallback para requester)
CREATE OR REPLACE FUNCTION user_has_permission(user_id UUID, permission_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles up
    JOIN custom_roles cr ON cr.id = up.custom_role_id
    WHERE up.id = user_id
    AND cr.permissions ? permission_key
  ) INTO has_perm;

  IF has_perm IS NULL OR has_perm = false THEN
    SELECT CASE
      WHEN up.role = 'admin' THEN true
      WHEN up.role = 'operator' AND permission_key NOT IN ('canViewDashboard','canManageUsers','canManageRoles','canManageDepartments','canManageWhitelist') THEN true
      WHEN up.role = 'requester' AND permission_key IN ('canViewClients','canViewLeads','canViewMaintenance') THEN true
      ELSE false
    END INTO has_perm
    FROM user_profiles up
    WHERE up.id = user_id;
  END IF;

  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
