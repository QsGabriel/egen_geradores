-- ============================================
-- EGEN System - Sales Quotations Module
-- Migration: Create sales_quotations table
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MAIN TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS sales_quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id VARCHAR(50) UNIQUE NOT NULL,
  client_id UUID REFERENCES crm_clients(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  
  -- Document metadata
  tipo VARCHAR(50) NOT NULL DEFAULT 'proposta' CHECK (tipo IN ('proposta', 'orcamento', 'contrato')),
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'pending_review',
    'pending_approval',
    'approved',
    'sent_to_client',
    'accepted',
    'rejected',
    'expired',
    'cancelled',
    'converted_to_contract'
  )),
  
  -- Dates
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  validade DATE NOT NULL,
  
  -- Full content stored as JSON
  conteudo JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Totals (denormalized for quick queries and sorting)
  total_equipamentos DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_servicos DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_geral DECIMAL(15, 2) NOT NULL DEFAULT 0,
  desconto_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
  desconto_valor DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_com_desconto DECIMAL(15, 2) NOT NULL DEFAULT 0,
  
  -- Notes
  notas_internas TEXT,
  
  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  parent_id UUID REFERENCES sales_quotations(id) ON DELETE SET NULL,
  
  -- Audit
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_quotations_status ON sales_quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_tipo ON sales_quotations(tipo);
CREATE INDEX IF NOT EXISTS idx_quotations_client_id ON sales_quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_lead_id ON sales_quotations(lead_id);
CREATE INDEX IF NOT EXISTS idx_quotations_data_emissao ON sales_quotations(data_emissao);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON sales_quotations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_document_id ON sales_quotations(document_id);

-- JSONB indexes for searching within conteudo
CREATE INDEX IF NOT EXISTS idx_quotations_conteudo ON sales_quotations USING gin(conteudo);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_quotation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_quotation_updated_at ON sales_quotations;
CREATE TRIGGER trigger_quotation_updated_at
  BEFORE UPDATE ON sales_quotations
  FOR EACH ROW
  EXECUTE FUNCTION update_quotation_timestamp();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE sales_quotations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all quotations
CREATE POLICY "Allow authenticated read" ON sales_quotations
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert quotations
CREATE POLICY "Allow authenticated insert" ON sales_quotations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update quotations
CREATE POLICY "Allow authenticated update" ON sales_quotations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================
-- QUOTATION AUDIT LOG (optional - for tracking changes)
-- ============================================

CREATE TABLE IF NOT EXISTS sales_quotation_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quotation_id UUID NOT NULL REFERENCES sales_quotations(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'status_changed', 'sent', 'approved', etc.
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  changes JSONB, -- Detailed changes
  notes TEXT,
  performed_by UUID,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotation_audit_quotation_id ON sales_quotation_audit_log(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_audit_performed_at ON sales_quotation_audit_log(performed_at DESC);

-- RLS for audit log
ALTER TABLE sales_quotation_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read audit" ON sales_quotation_audit_log
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated insert audit" ON sales_quotation_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- VIEWS
-- ============================================

-- View: Quotations with client/lead info
CREATE OR REPLACE VIEW v_quotations_with_relations AS
SELECT 
  q.*,
  c.razao_social AS client_name,
  c.email AS client_email,
  l.company_name AS lead_company,
  l.contact_name AS lead_contact
FROM sales_quotations q
LEFT JOIN crm_clients c ON q.client_id = c.id
LEFT JOIN crm_leads l ON q.lead_id = l.id;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Get next document number for a specific type
CREATE OR REPLACE FUNCTION get_next_quotation_number(doc_type VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  prefix VARCHAR;
  year_suffix VARCHAR;
  max_num INTEGER;
  new_num VARCHAR;
BEGIN
  -- Determine prefix based on type
  prefix := CASE doc_type
    WHEN 'proposta' THEN 'PROP'
    WHEN 'orcamento' THEN 'ORC'
    WHEN 'contrato' THEN 'CONT'
    ELSE 'DOC'
  END;
  
  -- Get current year suffix
  year_suffix := TO_CHAR(CURRENT_DATE, 'YY');
  
  -- Find maximum number for this prefix and year
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(document_id FROM '[0-9]{4}$') AS INTEGER)
  ), 0)
  INTO max_num
  FROM sales_quotations
  WHERE document_id LIKE prefix || '-' || year_suffix || '-%';
  
  -- Generate new number
  new_num := prefix || '-' || year_suffix || '-' || LPAD((max_num + 1)::TEXT, 4, '0');
  
  RETURN new_num;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (optional - for development)
-- ============================================

-- Uncomment to insert sample data:
/*
INSERT INTO sales_quotations (
  document_id,
  tipo,
  status,
  validade,
  conteudo,
  total_equipamentos,
  total_servicos,
  total_geral,
  total_com_desconto
) VALUES (
  'PROP-25-0001',
  'proposta',
  'draft',
  CURRENT_DATE + INTERVAL '30 days',
  '{
    "cliente": {
      "nome": "Empresa Exemplo LTDA",
      "responsavel": "João Silva",
      "email": "joao@exemplo.com",
      "telefone": "(11) 99999-9999",
      "documento": "00.000.000/0001-00",
      "endereco": "Rua das Flores, 123",
      "cidadeUf": "São Paulo - SP"
    },
    "equipamentos": [],
    "servicos": [],
    "horasExcedentes": [],
    "condicoes": {
      "validadeProposta": 30,
      "formaPagamento": "A combinar",
      "prazoMobilizacao": 7,
      "combustivelIncluso": true,
      "operadorIncluso": true,
      "franquiaHoras": 8,
      "valorHoraExcedente": 150,
      "tipoLocacao": "diaria",
      "horarioTrabalho": "08:00 às 18:00",
      "diasSemana": ["seg", "ter", "qua", "qui", "sex"],
      "transporteIncluso": false,
      "responsavelDescarga": "Cliente",
      "localEntrega": "São Paulo - SP",
      "manutencaoPreventivaInclusa": true,
      "manutencaoCorretivaInclusa": true
    }
  }'::jsonb,
  0,
  0,
  0,
  0
);
*/

COMMENT ON TABLE sales_quotations IS 'Propostas comerciais, orçamentos e contratos do módulo de vendas';
COMMENT ON COLUMN sales_quotations.conteudo IS 'JSON contendo cliente snapshot, equipamentos, serviços, horas excedentes e condições comerciais';
COMMENT ON COLUMN sales_quotations.version IS 'Versão do documento para controle de revisões';
COMMENT ON COLUMN sales_quotations.parent_id IS 'ID da proposta original quando é uma revisão ou conversão';
