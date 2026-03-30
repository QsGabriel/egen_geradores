-- ============================================
-- EGEN SYSTEM — BANCO DE DADOS COMPLETO
-- Migração inicial: todas as tabelas do sistema
-- Baseado na arquitetura EGEN (locação de geradores)
-- ============================================

-- ============================================
-- 0. FUNÇÃO UTILITÁRIA: updated_at automático
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. MÓDULO USUÁRIOS
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'requester' CHECK (role IN ('admin', 'operator', 'requester', 'financial')),
  department TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Trigger: cria perfil automaticamente no signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
  assigned_role TEXT;
BEGIN
  SELECT COUNT(*) INTO user_count FROM user_profiles;
  IF user_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'requester';
  END IF;

  INSERT INTO user_profiles (id, email, name, role, department)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    assigned_role,
    NEW.raw_user_meta_data->>'department'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. MÓDULO CRM / COMERCIAL
-- ============================================

-- 2.1 CLIENTES
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  document_number TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  notes TEXT,
  client_status TEXT NOT NULL DEFAULT 'active' CHECK (client_status IN ('active', 'inactive', 'blocked', 'prospect')),
  contracts_count INTEGER DEFAULT 0,
  quotations_count INTEGER DEFAULT 0,
  last_interaction TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(client_status);
CREATE INDEX IF NOT EXISTS idx_clients_document ON clients(document_number);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2.2 LEADS
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  email TEXT,
  source TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'proposal_sent', 'negotiation', 'won', 'lost')),
  notes TEXT,
  converted_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_converted ON leads(converted_client_id);

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2.3 HISTÓRICO CRM
CREATE TABLE IF NOT EXISTS crm_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client', 'lead', 'contract', 'quotation', 'equipment')),
  entity_id UUID NOT NULL,
  description TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_history_entity ON crm_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_history_created ON crm_history(created_at DESC);

-- ============================================
-- 3. MÓDULO EQUIPAMENTOS
-- ============================================

CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  power_kva NUMERIC,
  fuel_type TEXT CHECK (fuel_type IN ('diesel', 'gas', 'bi_fuel', 'other')),
  year_manufacture INTEGER,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'unavailable')),
  rental_daily_rate NUMERIC(12,2),
  rental_monthly_rate NUMERIC(12,2),
  location TEXT,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_code ON equipment(code);

CREATE TRIGGER update_equipment_updated_at
  BEFORE UPDATE ON equipment
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. MÓDULO ORÇAMENTOS E CONTRATOS
-- ============================================

-- 4.1 ORÇAMENTOS (propostas comerciais)
CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'expired')),
  valid_until DATE,
  total_amount NUMERIC(14,2) DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_client ON quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_code ON quotations(code);

CREATE TRIGGER update_quotations_updated_at
  BEFORE UPDATE ON quotations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4.2 ITENS DO ORÇAMENTO
CREATE TABLE IF NOT EXISTS quotation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_price NUMERIC(14,2) NOT NULL DEFAULT 0,
  rental_period_days INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON quotation_items(quotation_id);

-- 4.3 CONTRATOS
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'suspended', 'completed', 'cancelled')),
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_value NUMERIC(14,2),
  total_value NUMERIC(14,2),
  payment_terms TEXT,
  contract_file_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_code ON contracts(code);
CREATE INDEX IF NOT EXISTS idx_contracts_dates ON contracts(start_date, end_date);

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4.4 EQUIPAMENTOS DO CONTRATO (relação N:N)
CREATE TABLE IF NOT EXISTS contract_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  rental_value NUMERIC(12,2),
  delivery_date DATE,
  return_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_equipment_contract ON contract_equipment(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_equipment_equipment ON contract_equipment(equipment_id);

-- ============================================
-- 5. MÓDULO MANUTENÇÃO
-- ============================================

CREATE TABLE IF NOT EXISTS maintenance_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
  type TEXT NOT NULL DEFAULT 'corrective' CHECK (type IN ('preventive', 'corrective')),
  priority TEXT NOT NULL DEFAULT 'common' CHECK (priority IN ('urgent', 'priority', 'common')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  description TEXT NOT NULL,
  scheduled_date DATE,
  completed_date DATE,
  cost NUMERIC(12,2),
  technician TEXT,
  notes TEXT,
  service_order_url TEXT,
  requester_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_orders(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment ON maintenance_orders(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_type ON maintenance_orders(type);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled ON maintenance_orders(scheduled_date);

CREATE TRIGGER update_maintenance_orders_updated_at
  BEFORE UPDATE ON maintenance_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Gerador automático de código de OS
CREATE OR REPLACE FUNCTION generate_maintenance_code()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 'OS-(\d+)') AS INTEGER)), 0) + 1
  INTO next_num
  FROM maintenance_orders;

  NEW.code := 'OS-' || LPAD(next_num::TEXT, 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_maintenance_code
  BEFORE INSERT ON maintenance_orders
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION generate_maintenance_code();

-- ============================================
-- 6. MÓDULO FINANCEIRO
-- ============================================

CREATE TABLE IF NOT EXISTS billings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  description TEXT,
  amount NUMERIC(14,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method TEXT,
  invoice_number TEXT,
  notes TEXT,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billings_status ON billings(status);
CREATE INDEX IF NOT EXISTS idx_billings_contract ON billings(contract_id);
CREATE INDEX IF NOT EXISTS idx_billings_client ON billings(client_id);
CREATE INDEX IF NOT EXISTS idx_billings_due_date ON billings(due_date);

CREATE TRIGGER update_billings_updated_at
  BEFORE UPDATE ON billings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. MÓDULO ESTOQUE
-- ============================================

-- 7.1 ITENS DE ESTOQUE (peças, insumos)
CREATE TABLE IF NOT EXISTS stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'un',
  min_stock NUMERIC(12,2) DEFAULT 0,
  unit_price NUMERIC(12,2) DEFAULT 0,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'low_stock')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_items_code ON stock_items(code);
CREATE INDEX IF NOT EXISTS idx_stock_items_status ON stock_items(status);
CREATE INDEX IF NOT EXISTS idx_stock_items_category ON stock_items(category);

CREATE TRIGGER update_stock_items_updated_at
  BEFORE UPDATE ON stock_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7.2 MOVIMENTAÇÕES DE ESTOQUE
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_item_id UUID NOT NULL REFERENCES stock_items(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')),
  reason TEXT,
  quantity NUMERIC(12,2) NOT NULL,
  unit_price NUMERIC(12,2) DEFAULT 0,
  total_value NUMERIC(14,2) DEFAULT 0,
  maintenance_order_id UUID REFERENCES maintenance_orders(id) ON DELETE SET NULL,
  equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
  performed_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(stock_item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at DESC);

-- ============================================
-- 8. ROW LEVEL SECURITY
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE billings ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Políticas: user_profiles
CREATE POLICY "user_profiles_select" ON user_profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_profiles_insert" ON user_profiles
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "user_profiles_update" ON user_profiles
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Políticas: clients
CREATE POLICY "clients_select" ON clients
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients_insert" ON clients
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clients_update" ON clients
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "clients_delete" ON clients
  FOR DELETE TO authenticated USING (true);

-- Políticas: leads
CREATE POLICY "leads_select" ON leads
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "leads_insert" ON leads
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "leads_update" ON leads
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "leads_delete" ON leads
  FOR DELETE TO authenticated USING (true);

-- Políticas: crm_history
CREATE POLICY "crm_history_select" ON crm_history
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "crm_history_insert" ON crm_history
  FOR INSERT TO authenticated WITH CHECK (true);

-- Políticas: equipment
CREATE POLICY "equipment_select" ON equipment
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "equipment_insert" ON equipment
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "equipment_update" ON equipment
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "equipment_delete" ON equipment
  FOR DELETE TO authenticated USING (true);

-- Políticas: quotations
CREATE POLICY "quotations_select" ON quotations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "quotations_insert" ON quotations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "quotations_update" ON quotations
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "quotations_delete" ON quotations
  FOR DELETE TO authenticated USING (true);

-- Políticas: quotation_items
CREATE POLICY "quotation_items_select" ON quotation_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "quotation_items_insert" ON quotation_items
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "quotation_items_update" ON quotation_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "quotation_items_delete" ON quotation_items
  FOR DELETE TO authenticated USING (true);

-- Políticas: contracts
CREATE POLICY "contracts_select" ON contracts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "contracts_insert" ON contracts
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "contracts_update" ON contracts
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "contracts_delete" ON contracts
  FOR DELETE TO authenticated USING (true);

-- Políticas: contract_equipment
CREATE POLICY "contract_equipment_select" ON contract_equipment
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "contract_equipment_insert" ON contract_equipment
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "contract_equipment_update" ON contract_equipment
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "contract_equipment_delete" ON contract_equipment
  FOR DELETE TO authenticated USING (true);

-- Políticas: maintenance_orders
CREATE POLICY "maintenance_orders_select" ON maintenance_orders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "maintenance_orders_insert" ON maintenance_orders
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "maintenance_orders_update" ON maintenance_orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "maintenance_orders_delete" ON maintenance_orders
  FOR DELETE TO authenticated USING (true);

-- Políticas: billings
CREATE POLICY "billings_select" ON billings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "billings_insert" ON billings
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "billings_update" ON billings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "billings_delete" ON billings
  FOR DELETE TO authenticated USING (true);

-- Políticas: stock_items
CREATE POLICY "stock_items_select" ON stock_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "stock_items_insert" ON stock_items
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "stock_items_update" ON stock_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "stock_items_delete" ON stock_items
  FOR DELETE TO authenticated USING (true);

-- Políticas: stock_movements
CREATE POLICY "stock_movements_select" ON stock_movements
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "stock_movements_insert" ON stock_movements
  FOR INSERT TO authenticated WITH CHECK (true);
