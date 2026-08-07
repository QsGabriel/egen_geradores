-- Migration: Restrição de acesso por estados no CRM
-- - Adiciona coluna allowed_states (JSONB) em custom_roles
-- - Nova permissão canViewAllStates (bypass de restrição regional)
-- - Nova permissão canViewLeadsProduction (filtro por vendedor nos leads)
-- - Atualiza cargo Administrador com as novas permissões
-- Ordem: pós-deploy

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  1. ADICIONAR COLUNA allowed_states EM custom_roles                          ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE custom_roles
  ADD COLUMN IF NOT EXISTS allowed_states JSONB DEFAULT NULL;

COMMENT ON COLUMN custom_roles.allowed_states IS 'UFs permitidas para visualização de clientes/leads no CRM. NULL ou [] = sem restrição.';

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  2. ADICIONAR NOVAS PERMISSÕES AO ADMINISTRADOR                             ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

UPDATE custom_roles
SET permissions = permissions || '["canViewAllStates","canViewLeadsProduction"]'::jsonb,
    updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000001'
  AND (NOT permissions ? 'canViewAllStates' OR NOT permissions ? 'canViewLeadsProduction');

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  3. ATUALIZAR VIEW user_roles_view PARA INCLUIR allowed_states               ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

DROP VIEW IF EXISTS user_roles_view;

CREATE VIEW user_roles_view AS
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
  cr.allowed_states,
  cr.is_system
FROM user_profiles up
LEFT JOIN custom_roles cr ON cr.id = up.custom_role_id;
