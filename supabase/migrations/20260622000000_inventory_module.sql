-- ============================================
-- MÓDULO INVENTÁRIO / ESTOQUE / SUPRIMENTOS
-- Cria tabelas ausentes e ajusta schemas existentes
-- ============================================

-- ============================================
-- 1. TABELA: products (itens de inventário)
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'technical')),
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'un',
  supplier TEXT NOT NULL DEFAULT '',
  batch TEXT NOT NULL DEFAULT '',
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiration_date DATE,
  location TEXT DEFAULT '',
  min_stock INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'low-stock', 'expired')),
  unit_price NUMERIC(12,2) DEFAULT 0,
  invoicenumber TEXT,
  iswithholding BOOLEAN DEFAULT false,
  supplier_id UUID,
  supplier_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. TABELA: requests (solicitações SC/SM)
-- ============================================
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'SC' CHECK (type IN ('SC', 'SM')),
  items JSONB NOT NULL DEFAULT '[]',
  reason TEXT NOT NULL DEFAULT '',
  requested_by TEXT NOT NULL DEFAULT '',
  request_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  priority TEXT NOT NULL DEFAULT 'standard' CHECK (priority IN ('low', 'standard', 'priority', 'urgent')),
  approved_by TEXT,
  approval_date TIMESTAMPTZ,
  notes TEXT,
  department TEXT,
  supplier_id UUID,
  supplier_name TEXT,
  receiver_signature TEXT,
  received_by TEXT,
  attachment_url TEXT,
  attachment_name TEXT,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_type ON requests(type);
CREATE INDEX IF NOT EXISTS idx_requests_department ON requests(department);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. TABELA: product_change_logs (log de alterações)
-- ============================================
CREATE TABLE IF NOT EXISTS product_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT '',
  change_reason TEXT NOT NULL DEFAULT '',
  change_date DATE NOT NULL DEFAULT CURRENT_DATE,
  change_time TIME NOT NULL DEFAULT CURRENT_TIME,
  field_changes JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_change_logs_product ON product_change_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_product_change_logs_date ON product_change_logs(created_at DESC);

-- ============================================
-- 4. TABELA: suppliers (fornecedores)
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  contact_person TEXT DEFAULT '',
  products TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_cnpj ON suppliers(cnpj);

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. AJUSTES NA TABELA stock_movements
--    Adiciona colunas esperadas pelo código
-- ============================================

-- Tornar stock_item_id opcional (código usa product_id)
ALTER TABLE stock_movements ALTER COLUMN stock_item_id DROP NOT NULL;

-- Adicionar colunas faltantes
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS request_id UUID;
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS authorized_by TEXT;

-- ============================================
-- 6. AJUSTES NA TABELA quotations
--    Tabela existe (CRM), mas código usa schema diferente
-- ============================================

-- Remover constraint de status antiga e recriar com valores amplos
-- Usa DO block para encontrar dinamicamente o nome da constraint
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON con.conrelid = rel.oid
  WHERE rel.relname = 'quotations'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%status%';
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE quotations DROP CONSTRAINT ' || quote_ident(constraint_name);
  END IF;
END;
$$;

ALTER TABLE quotations ADD CONSTRAINT quotations_status_check
  CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired', 'open', 'pending', 'in_progress', 'completed', 'cancelled'));

-- Tornar title opcional (código não define)
ALTER TABLE quotations ALTER COLUMN title DROP NOT NULL;

-- Adicionar trigger para auto-gerar code quando vazio
CREATE OR REPLACE FUNCTION generate_quotation_code()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 'COT-(\d+)') AS INTEGER)), 0) + 1
    INTO next_num
    FROM quotations;
    NEW.code := 'COT-' || LPAD(next_num::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_quotation_code ON quotations;
CREATE TRIGGER set_quotation_code
  BEFORE INSERT ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION generate_quotation_code();

-- Adicionar colunas esperadas pelo código de inventário
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS request_id UUID;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS requested_quantity INTEGER DEFAULT 1;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS selected_supplier_id UUID;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS selected_price NUMERIC(12,2);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS selected_delivery_time TEXT;

-- ============================================
-- 7. AJUSTES NA TABELA quotation_items
-- ============================================

-- Tornar description opcional (código não define)
ALTER TABLE quotation_items ALTER COLUMN description DROP NOT NULL;

-- Adicionar colunas esperadas pelo código
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS supplier_id UUID;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS supplier_name TEXT;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS delivery_time TEXT;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'un';

-- ============================================
-- 8. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Políticas: products
CREATE POLICY "products_select" ON products
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_insert" ON products
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "products_update" ON products
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "products_delete" ON products
  FOR DELETE TO authenticated USING (true);

-- Políticas: requests
CREATE POLICY "requests_select" ON requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "requests_insert" ON requests
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "requests_update" ON requests
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "requests_delete" ON requests
  FOR DELETE TO authenticated USING (true);

-- Políticas: product_change_logs
CREATE POLICY "product_change_logs_select" ON product_change_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_change_logs_insert" ON product_change_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Políticas: suppliers
CREATE POLICY "suppliers_select" ON suppliers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "suppliers_insert" ON suppliers
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "suppliers_update" ON suppliers
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "suppliers_delete" ON suppliers
  FOR DELETE TO authenticated USING (true);
