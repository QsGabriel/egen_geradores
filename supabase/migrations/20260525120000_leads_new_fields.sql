-- ============================================
-- LEADS: novos campos para cadastro completo
-- ============================================

-- 1. Adicionar colunas novas à tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS document_number TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS area_code       TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city            TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS state           TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS classification  TEXT;

-- 2. Índices para filtragem eficiente
CREATE INDEX IF NOT EXISTS idx_leads_document        ON leads(document_number);
CREATE INDEX IF NOT EXISTS idx_leads_area_code       ON leads(area_code);
CREATE INDEX IF NOT EXISTS idx_leads_city            ON leads(city);
CREATE INDEX IF NOT EXISTS idx_leads_state           ON leads(state);
CREATE INDEX IF NOT EXISTS idx_leads_classification  ON leads(classification);
