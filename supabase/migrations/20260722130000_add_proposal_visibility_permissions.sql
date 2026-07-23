-- Add proposal visibility permissions (canViewAllProposals, canViewOwnProposals)
-- and update admin custom roles to include them.

-- Admin padrão (id fixo)
UPDATE custom_roles
SET permissions = permissions || '["canViewAllProposals", "canViewOwnProposals"]'::jsonb,
    updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000001'
  AND NOT (permissions ? 'canViewAllProposals');

-- Demais cargos com canManageQuotations: adicionar canViewOwnProposals como fallback
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, permissions FROM custom_roles
    WHERE permissions ? 'canManageQuotations'
      AND NOT (permissions ? 'canViewAllProposals')
      AND NOT (permissions ? 'canViewOwnProposals')
  LOOP
    UPDATE custom_roles
    SET permissions = permissions || '["canViewOwnProposals"]'::jsonb,
        updated_at = NOW()
    WHERE id = r.id;
  END LOOP;
END $$;
