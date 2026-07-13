-- Migration: Corrigir políticas RLS (substituir USING (true))
-- - Função SECURITY DEFINER current_user_has_permission
-- - Remove políticas antigas de user_profiles
-- - Novas políticas granulares (self + admin via canManageUsers)
-- - Reaplica políticas de custom_roles usando current_user_has_permission
--
-- Ordem: 6/7

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  1. FUNÇÃO SECURITY DEFINER (evita recursão infinita em RLS)                 ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

CREATE OR REPLACE FUNCTION public.current_user_has_permission(p_permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_profiles p
    LEFT JOIN custom_roles cr ON cr.id = p.custom_role_id
    WHERE p.id = auth.uid()
      AND (
        cr.permissions @> to_jsonb(ARRAY[p_permission])
        OR (p.role = 'admin' AND cr.id IS NULL)
      )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.current_user_has_permission(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_has_permission(text) TO authenticated;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  2. REMOVER POLÍTICAS ANTIGAS DE user_profiles                               ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update" ON user_profiles;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  3. NOVAS POLÍTICAS GRANULARES                                               ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

-- SELECT: todos autenticados
CREATE POLICY "user_profiles_select" ON user_profiles
  FOR SELECT TO authenticated USING (true);

-- INSERT: permitido (trigger on_auth_user_created roda como SECURITY DEFINER)
CREATE POLICY "user_profiles_insert" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- UPDATE: próprio perfil
CREATE POLICY "user_profiles_update_self" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- UPDATE: admin (canManageUsers)
CREATE POLICY "user_profiles_update_admin" ON user_profiles
  FOR UPDATE TO authenticated
  USING (public.current_user_has_permission('canManageUsers'))
  WITH CHECK (public.current_user_has_permission('canManageUsers'));

-- DELETE: apenas canManageUsers
CREATE POLICY "user_profiles_delete" ON user_profiles
  FOR DELETE TO authenticated
  USING (public.current_user_has_permission('canManageUsers'));

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  4. REAPLICAR POLÍTICAS DE custom_roles COM current_user_has_permission      ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

DROP POLICY IF EXISTS "custom_roles_insert" ON custom_roles;
DROP POLICY IF EXISTS "custom_roles_update" ON custom_roles;
DROP POLICY IF EXISTS "custom_roles_delete" ON custom_roles;

CREATE POLICY "custom_roles_insert" ON custom_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_permission('canManageRoles'));

CREATE POLICY "custom_roles_update" ON custom_roles
  FOR UPDATE TO authenticated
  USING (public.current_user_has_permission('canManageRoles'))
  WITH CHECK (public.current_user_has_permission('canManageRoles'));

CREATE POLICY "custom_roles_delete" ON custom_roles
  FOR DELETE TO authenticated
  USING (is_system = false AND public.current_user_has_permission('canManageRoles'));

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  5. ATUALIZAR POLÍTICAS DE departments PARA USAR current_user_has_permission ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

DROP POLICY IF EXISTS "departments_insert" ON departments;
DROP POLICY IF EXISTS "departments_update" ON departments;
DROP POLICY IF EXISTS "departments_delete" ON departments;

CREATE POLICY "departments_insert" ON departments
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_permission('canManageDepartments'));

CREATE POLICY "departments_update" ON departments
  FOR UPDATE TO authenticated
  USING (public.current_user_has_permission('canManageDepartments'))
  WITH CHECK (public.current_user_has_permission('canManageDepartments'));

CREATE POLICY "departments_delete" ON departments
  FOR DELETE TO authenticated
  USING (public.current_user_has_permission('canManageDepartments'));

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║  6. ATUALIZAR POLÍTICA DE whitelist                                          ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

DROP POLICY IF EXISTS "whitelist_write" ON user_whitelist;

CREATE POLICY "whitelist_write" ON user_whitelist
  FOR ALL USING (public.current_user_has_permission('canManageWhitelist'));
