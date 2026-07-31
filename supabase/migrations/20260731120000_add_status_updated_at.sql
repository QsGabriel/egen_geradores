-- Migration: Filtro por período (Propostas) + novo status Contrato Finalizado
-- 1. Adiciona status_updated_at para rastrear quando uma proposta mudou de status
-- 2. Adiciona contract_finished ao CHECK constraint de status

-- 1. Coluna status_updated_at
ALTER TABLE sales_quotations ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ DEFAULT NOW();
UPDATE sales_quotations SET status_updated_at = updated_at WHERE status_updated_at IS NULL;

-- 2. Novo status contract_finished
ALTER TABLE sales_quotations DROP CONSTRAINT IF EXISTS sales_quotations_status_check;
ALTER TABLE sales_quotations ADD CONSTRAINT sales_quotations_status_check
  CHECK (status IN ('draft','negotiating','price_survey','lost','cancelled','closed','contract_finished'));
