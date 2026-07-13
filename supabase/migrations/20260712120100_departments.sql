-- Migration: Tabela departments (gerenciável pelo admin)
-- - CRUD de departamentos com RLS granular
-- - Seed inicial: Administrativo, Comercial, TI
--
-- Ordem: 2/7

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);

-- Trigger updated_at
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed inicial EGEN
INSERT INTO departments (name, description) VALUES
  ('Administrativo', 'Setor administrativo e finanças'),
  ('Comercial', 'Setor comercial e vendas'),
  ('TI', 'Tecnologia da Informação')
ON CONFLICT (name) DO NOTHING;

-- RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Leitura: todos autenticados
CREATE POLICY "departments_select" ON departments
  FOR SELECT TO authenticated USING (true);

-- Escrita: apenas canManageDepartments
CREATE POLICY "departments_insert" ON departments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles p
      LEFT JOIN custom_roles cr ON cr.id = p.custom_role_id
      WHERE p.id = auth.uid()
        AND cr.permissions @> '["canManageDepartments"]'::jsonb
    )
  );

CREATE POLICY "departments_update" ON departments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      LEFT JOIN custom_roles cr ON cr.id = p.custom_role_id
      WHERE p.id = auth.uid()
        AND cr.permissions @> '["canManageDepartments"]'::jsonb
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles p
      LEFT JOIN custom_roles cr ON cr.id = p.custom_role_id
      WHERE p.id = auth.uid()
        AND cr.permissions @> '["canManageDepartments"]'::jsonb
    )
  );

CREATE POLICY "departments_delete" ON departments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      LEFT JOIN custom_roles cr ON cr.id = p.custom_role_id
      WHERE p.id = auth.uid()
        AND cr.permissions @> '["canManageDepartments"]'::jsonb
    )
  );
