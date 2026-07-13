-- Migration: Tabela user_whitelist (CPF)
-- - Whitelist de CPFs autorizados a se cadastrar
-- - Coluna cpf UNIQUE em user_profiles com FK para whitelist
-- - RLS granular
--
-- Ordem: 4/7

-- 1. Tabela de whitelist
CREATE TABLE IF NOT EXISTS user_whitelist (
  cpf TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  activity BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CPF em user_profiles (FK → whitelist)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS cpf TEXT UNIQUE;
ALTER TABLE user_profiles
  ADD CONSTRAINT fk_user_profiles_cpf
  FOREIGN KEY (cpf) REFERENCES user_whitelist(cpf);

-- 3. RLS
ALTER TABLE user_whitelist ENABLE ROW LEVEL SECURITY;

-- Leitura: autenticados + anon (necessário para validação no signup)
CREATE POLICY "whitelist_read_auth" ON user_whitelist
  FOR SELECT USING (auth.role() IN ('authenticated', 'anon'));

-- Escrita: apenas canManageWhitelist (com fallback para role='admin')
CREATE POLICY "whitelist_write" ON user_whitelist
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      LEFT JOIN custom_roles cr ON cr.id = p.custom_role_id
      WHERE p.id = auth.uid()
        AND (
          cr.permissions @> '["canManageWhitelist"]'::jsonb
          OR p.role = 'admin'
        )
    )
  );
