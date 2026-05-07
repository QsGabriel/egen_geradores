-- ============================================
-- Adiciona suporte a múltiplos contatos em leads e clientes
-- ============================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS contacts JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS contacts JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN leads.contacts IS 'Array de contatos adicionais: [{name, phone, email}]';
COMMENT ON COLUMN clients.contacts IS 'Array de contatos adicionais: [{name, phone, email}]';
