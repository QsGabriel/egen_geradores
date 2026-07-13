-- Migration: Sistema de Roles Dinâmicas (RBAC)
-- - Tabela custom_roles com permissions JSONB
-- - Seed 3 cargos de sistema (Administrador, Operador, Solicitante)
-- - Adiciona custom_role_id em user_profiles + backfill
-- - View user_roles_view
-- - Função user_has_permission (com fallback legado)
-- - RLS granular
--
-- Ordem: 3/7

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  1. CRIAR TABELA custom_roles                                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_roles_name ON custom_roles(name);
CREATE INDEX IF NOT EXISTS idx_custom_roles_is_system ON custom_roles(is_system);
CREATE INDEX IF NOT EXISTS idx_custom_roles_permissions ON custom_roles USING GIN(permissions);

-- Trigger updated_at
CREATE TRIGGER update_custom_roles_updated_at
  BEFORE UPDATE ON custom_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  2. SEED: 3 CARGOS DE SISTEMA                                                ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

INSERT INTO custom_roles (id, name, description, permissions, is_system) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'Administrador',
  'Acesso completo a todos os módulos do sistema.',
  '["canViewDashboard","canManageEquipment","canViewEquipment","canAddEquipment","canEditEquipment","canDeleteEquipment","canManageUsers","canManageRoles","canManageDepartments","canManageWhitelist","canManageQuotations","canConfigureRequestPeriods","canViewClients","canCreateClients","canEditClients","canDeleteClients","canViewLeads","canCreateLeads","canEditLeads","canDeleteLeads","canViewMaintenance","canManageMaintenance"]'::jsonb,
  true
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Operador',
  'Acesso operacional. Sem dashboard, sem gerenciamento de usuários/cargos.',
  '["canManageEquipment","canViewEquipment","canAddEquipment","canEditEquipment","canDeleteEquipment","canManageQuotations","canConfigureRequestPeriods","canViewClients","canCreateClients","canEditClients","canDeleteClients","canViewLeads","canCreateLeads","canEditLeads","canDeleteLeads","canViewMaintenance","canManageMaintenance"]'::jsonb,
  true
),
(
  'a0000000-0000-0000-0000-000000000003',
  'Solicitante',
  'Acesso básico: visualizar clientes, leads e manutenções.',
  '["canViewClients","canViewLeads","canViewMaintenance"]'::jsonb,
  true
)
ON CONFLICT (name) DO NOTHING;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  3. ALTERAR user_profiles                                                    ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES custom_roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_custom_role_id ON user_profiles(custom_role_id);

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  4. BACKFILL: vincular usuários existentes aos cargos do sistema             ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

UPDATE user_profiles SET custom_role_id = 'a0000000-0000-0000-0000-000000000001'
WHERE role = 'admin' AND custom_role_id IS NULL;

UPDATE user_profiles SET custom_role_id = 'a0000000-0000-0000-0000-000000000002'
WHERE role = 'operator' AND custom_role_id IS NULL;

UPDATE user_profiles SET custom_role_id = 'a0000000-0000-0000-0000-000000000003'
WHERE role = 'requester' AND custom_role_id IS NULL;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  5. RLS                                                                       ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_roles_select" ON custom_roles
  FOR SELECT TO authenticated USING (true);

-- Políticas de escrita com fallback para role='admin' (antes da criação
-- da função current_user_has_permission na migration 06)
CREATE POLICY "custom_roles_insert" ON custom_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "custom_roles_update" ON custom_roles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "custom_roles_delete" ON custom_roles
  FOR DELETE TO authenticated
  USING (
    is_system = false
    AND EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  6. VIEW: usuários com seus cargos e permissões                              ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

CREATE OR REPLACE VIEW user_roles_view AS
SELECT
  up.id AS user_id,
  up.email,
  up.name AS user_name,
  up.role AS legacy_role,
  up.department,
  up.custom_role_id,
  cr.name AS role_name,
  cr.description AS role_description,
  cr.permissions,
  cr.is_system
FROM user_profiles up
LEFT JOIN custom_roles cr ON cr.id = up.custom_role_id;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  7. FUNÇÃO: verificar permissão do usuário (com fallback legado)             ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

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

  -- Fallback para sistema antigo (coluna role)
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
