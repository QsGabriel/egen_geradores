-- Migration: Corrigir user_profiles
-- - Remove 'financial' do CHECK constraint (nunca utilizado)
-- - Garante trigger updated_at
--
-- Ordem: 1/7

-- 1. Remover 'financial' do CHECK constraint
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('admin', 'operator', 'requester'));

-- 2. Garantir trigger updated_at (caso não exista)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
