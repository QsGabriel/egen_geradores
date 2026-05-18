-- ============================================
-- EGEN System - Setup sales_quotations table
-- Apply this script in the Supabase SQL editor
-- if the table does not exist yet, OR to update
-- the status constraint to the new values.
-- ============================================

-- ============================================
-- 1. CREATE TABLE (if it doesn't exist)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS sales_quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id VARCHAR(50) UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  tipo VARCHAR(50) NOT NULL DEFAULT 'proposta'
    CHECK (tipo IN ('proposta', 'orcamento', 'contrato')),

  status VARCHAR(50) NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft',
      'negotiating',
      'price_survey',
      'lost',
      'cancelled',
      'closed'
    )),

  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  validade DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),

  conteudo JSONB NOT NULL DEFAULT '{}'::jsonb,

  total_equipamentos DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_servicos DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_geral DECIMAL(15, 2) NOT NULL DEFAULT 0,
  desconto_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
  desconto_valor DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_com_desconto DECIMAL(15, 2) NOT NULL DEFAULT 0,

  notas_internas TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  parent_id UUID REFERENCES sales_quotations(id) ON DELETE SET NULL,

  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. UPDATE STATUS CONSTRAINT (if table already existed
--    with the old statuses)
-- ============================================

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- Find the existing check constraint on status
  SELECT conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'sales_quotations'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%status%'
  LIMIT 1;

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE sales_quotations DROP CONSTRAINT ' || quote_ident(constraint_name);
    RAISE NOTICE 'Dropped old status constraint: %', constraint_name;
  END IF;
END $$;

-- Migrate any rows with old status values to the closest new equivalent
UPDATE sales_quotations SET status = 'negotiating'  WHERE status IN ('pending_review', 'pending_approval', 'sent', 'sent_to_client');
UPDATE sales_quotations SET status = 'closed'        WHERE status IN ('approved', 'accepted', 'converted_to_contract');
UPDATE sales_quotations SET status = 'lost'          WHERE status IN ('rejected', 'expired');

-- Add new constraint
ALTER TABLE sales_quotations
  ADD CONSTRAINT sales_quotations_status_check
  CHECK (status IN ('draft', 'negotiating', 'price_survey', 'lost', 'cancelled', 'closed'));

-- ============================================
-- 3. INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sq_status       ON sales_quotations(status);
CREATE INDEX IF NOT EXISTS idx_sq_tipo         ON sales_quotations(tipo);
CREATE INDEX IF NOT EXISTS idx_sq_client_id    ON sales_quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_sq_lead_id      ON sales_quotations(lead_id);
CREATE INDEX IF NOT EXISTS idx_sq_data_emissao ON sales_quotations(data_emissao);
CREATE INDEX IF NOT EXISTS idx_sq_created_at   ON sales_quotations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sq_document_id  ON sales_quotations(document_id);
CREATE INDEX IF NOT EXISTS idx_sq_conteudo     ON sales_quotations USING gin(conteudo);

-- ============================================
-- 4. AUTO-UPDATE updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_sales_quotation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sq_updated_at ON sales_quotations;
CREATE TRIGGER trigger_sq_updated_at
  BEFORE UPDATE ON sales_quotations
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_quotation_timestamp();

-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE sales_quotations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'sales_quotations' AND policyname = 'Allow authenticated read sq'
  ) THEN
    CREATE POLICY "Allow authenticated read sq" ON sales_quotations
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'sales_quotations' AND policyname = 'Allow authenticated insert sq'
  ) THEN
    CREATE POLICY "Allow authenticated insert sq" ON sales_quotations
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'sales_quotations' AND policyname = 'Allow authenticated update sq'
  ) THEN
    CREATE POLICY "Allow authenticated update sq" ON sales_quotations
      FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'sales_quotations' AND policyname = 'Allow authenticated delete sq'
  ) THEN
    CREATE POLICY "Allow authenticated delete sq" ON sales_quotations
      FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- ============================================
-- 6. AUDIT LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS sales_quotation_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES sales_quotations(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  changes JSONB,
  notes TEXT,
  performed_by UUID,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sq_audit_quotation_id ON sales_quotation_audit_log(quotation_id);
CREATE INDEX IF NOT EXISTS idx_sq_audit_performed_at ON sales_quotation_audit_log(performed_at DESC);

ALTER TABLE sales_quotation_audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies
    WHERE tablename = 'sales_quotation_audit_log' AND policyname = 'Allow authenticated read sq audit'
  ) THEN
    CREATE POLICY "Allow authenticated read sq audit" ON sales_quotation_audit_log
      FOR SELECT TO authenticated USING (true);
    CREATE POLICY "Allow authenticated insert sq audit" ON sales_quotation_audit_log
      FOR INSERT TO authenticated WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- Done. Table sales_quotations is ready.
-- ============================================
