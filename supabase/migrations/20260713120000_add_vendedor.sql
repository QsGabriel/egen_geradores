-- Migration: Adicionar vendedor_id em sales_quotations
-- - Coluna com FK para user_profiles
-- - Backfill: copia created_by para vendedor_id

ALTER TABLE sales_quotations
  ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_quotations_vendedor ON sales_quotations(vendedor_id);

-- Backfill: registros existentes herdam o created_by como vendedor
UPDATE sales_quotations
  SET vendedor_id = created_by
  WHERE vendedor_id IS NULL AND created_by IS NOT NULL;
