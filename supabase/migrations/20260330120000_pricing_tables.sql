-- ============================================
-- EGEN System - Pricing Tables Migration
-- Tabelas de Precificação de Geradores e Acessórios
-- Data: 30/03/2026
-- ============================================

-- ============================================
-- 1. TABELA: pricing_generators
-- Preços de locação de geradores por potência e período
-- ============================================

CREATE TABLE IF NOT EXISTS pricing_generators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  power_kva VARCHAR(50) NOT NULL,              -- Ex: "20KVA", "40KVA", "53KVA à 63KVA"
  power_min_kva INTEGER,                        -- Potência mínima (para ranges)
  power_max_kva INTEGER,                        -- Potência máxima (para ranges)
  equipment_type VARCHAR(50) DEFAULT 'gerador', -- 'gerador', 'torre_diesel', 'torre_solar'
  
  -- Período de locação
  rental_period VARCHAR(20) NOT NULL,           -- 'mensal', 'quinzenal', 'semanal'
  
  -- Pacotes de horas (valores em BRL)
  price_standby DECIMAL(12,2),                  -- Stand-By (35h/mês)
  price_120h DECIMAL(12,2),                     -- 120h/mês (04h/dia)
  price_240h DECIMAL(12,2),                     -- 240h/mês (08h/dia)
  price_360h DECIMAL(12,2),                     -- 360h/mês (12h/dia)
  price_continuous DECIMAL(12,2),               -- Contínuo/Livre (24h/dia)
  
  -- Valores adicionais
  price_extra_hour DECIMAL(12,2),               -- Hora excedente
  price_cable_kit_380v DECIMAL(12,2),           -- Kit Cabos 20m (380/440V)
  price_cable_kit_220v DECIMAL(12,2),           -- Kit Cabos 20m (220V)
  price_preventive_maintenance DECIMAL(12,2),   -- Manutenção Preventiva (250h ou 6 meses)
  
  -- Regras comerciais
  discount_limit_percent DECIMAL(5,2) DEFAULT 5.00, -- Limite de desconto (%)
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_generator_pricing UNIQUE (power_kva, rental_period)
);

-- Índices para consultas frequentes
CREATE INDEX idx_pricing_generators_power ON pricing_generators(power_kva);
CREATE INDEX idx_pricing_generators_period ON pricing_generators(rental_period);
CREATE INDEX idx_pricing_generators_active ON pricing_generators(is_active);
CREATE INDEX idx_pricing_generators_type ON pricing_generators(equipment_type);

-- ============================================
-- 2. TABELA: pricing_accessories
-- Preços de acessórios e serviços
-- ============================================

CREATE TABLE IF NOT EXISTS pricing_accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação
  item_code VARCHAR(20) NOT NULL,              -- Ex: "DES", "SERV", "QTA", "TQ", "ROB", "BC"
  item_name VARCHAR(200) NOT NULL,             -- Descrição do item
  category VARCHAR(50) NOT NULL,               -- 'deslocamento', 'servico', 'qta', 'tanque', 'outro'
  
  -- Preços por período (valores em BRL)
  price_monthly DECIMAL(12,2),                 -- Valor mensal
  price_biweekly DECIMAL(12,2),                -- Valor quinzenal
  price_weekly DECIMAL(12,2),                  -- Valor semanal
  price_daily DECIMAL(12,2),                   -- Valor diário (quando aplicável)
  price_unit DECIMAL(12,2),                    -- Valor unitário (quando aplicável)
  
  -- Regras comerciais
  discount_limit_percent DECIMAL(5,2) DEFAULT 7.00, -- Limite de desconto (%)
  
  -- Especificações técnicas (opcional)
  amperage VARCHAR(20),                        -- Ex: "350/400A", "800A" para QTAs
  capacity VARCHAR(50),                        -- Ex: "15mil litros" para tanques
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_accessory_pricing UNIQUE (item_code, item_name)
);

-- Índices para consultas frequentes
CREATE INDEX idx_pricing_accessories_code ON pricing_accessories(item_code);
CREATE INDEX idx_pricing_accessories_category ON pricing_accessories(category);
CREATE INDEX idx_pricing_accessories_active ON pricing_accessories(is_active);

-- ============================================
-- 3. TRIGGERS para updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pricing_generators_updated_at
  BEFORE UPDATE ON pricing_generators
  FOR EACH ROW EXECUTE FUNCTION update_pricing_updated_at();

CREATE TRIGGER trigger_pricing_accessories_updated_at
  BEFORE UPDATE ON pricing_accessories
  FOR EACH ROW EXECUTE FUNCTION update_pricing_updated_at();

-- ============================================
-- 4. SEED DATA: Geradores - Locação MENSAL
-- ============================================

INSERT INTO pricing_generators (power_kva, power_min_kva, power_max_kva, equipment_type, rental_period, price_standby, price_120h, price_240h, price_360h, price_continuous, price_extra_hour, price_cable_kit_380v, price_cable_kit_220v, price_preventive_maintenance, discount_limit_percent) VALUES
('20KVA', 20, 20, 'gerador', 'mensal', 2021.94, 2191.14, 2394.18, 2588.76, 2944.08, 17.50, 106.00, 170.00, 1090.00, 5.00),
('40KVA', 40, 40, 'gerador', 'mensal', 2246.60, 2434.60, 2660.20, 2876.40, 3271.20, 21.34, 106.00, 170.00, 1090.00, 5.00),
('53KVA à 63KVA', 53, 63, 'gerador', 'mensal', 2246.60, 2434.60, 2660.20, 2876.40, 3271.20, 25.40, 106.00, 170.00, 1540.00, 5.00),
('75KVA à 83KVA', 75, 83, 'gerador', 'mensal', 2528.60, 2754.20, 2998.60, 3214.80, 3656.60, 27.95, 106.00, 170.00, 1250.00, 5.00),
('110KVA à 125KVA', 110, 125, 'gerador', 'mensal', 2528.60, 2754.20, 3308.80, 3713.00, 4267.60, 28.49, 106.00, 170.00, 1250.00, 5.00),
('140KVA', 140, 140, 'gerador', 'mensal', 3543.80, 3760.00, 4098.40, 4493.20, 5151.20, 29.49, 174.00, 284.00, 1250.00, 5.00),
('200KVA', 200, 200, 'gerador', 'mensal', 4098.40, 4502.60, 4897.40, 5527.20, 6363.80, 37.50, 174.00, 284.00, 1986.00, 5.00),
('251KVA', 251, 251, 'gerador', 'mensal', 4559.00, 4869.20, 5311.00, 6260.40, 7303.80, 54.72, 290.00, 496.00, 1986.00, 5.00),
('300KVA', 300, 300, 'gerador', 'mensal', 5987.80, 6528.30, 7111.10, 8140.40, 9404.70, 56.26, 507.00, 780.00, 1800.00, 5.00),
('350KVA à 400KVA', 350, 400, 'gerador', 'mensal', 7416.60, 8187.40, 8911.20, 10020.40, 11505.60, 69.18, 507.00, 780.00, 2200.00, 5.00),
('500KVA à 563KVA', 500, 563, 'gerador', 'mensal', 8450.00, 9280.00, 10460.00, 11500.00, 14496.40, 97.21, 780.00, 950.00, 3650.00, 11.00),
('640KVA', 640, 640, 'gerador', 'mensal', 9798.00, 10865.00, 12236.00, 13340.00, 15410.00, 105.00, 780.00, 950.00, 4700.00, 31.00),
('700KVA', 700, 700, 'gerador', 'mensal', 14833.20, 16374.80, 17822.40, 20040.80, 23011.20, 133.04, 1250.00, 2100.00, 4191.36, 5.00),
('750KVA', 750, 750, 'gerador', 'mensal', 15333.20, 16874.80, 18322.40, 20540.80, 23981.20, 150.04, 1250.00, 2100.00, 4191.36, 5.00),
('Torre Diesel', NULL, NULL, 'torre_diesel', 'mensal', NULL, NULL, 3400.00, NULL, NULL, NULL, NULL, NULL, 1750.00, 5.00),
('Torre Solar', NULL, NULL, 'torre_solar', 'mensal', NULL, NULL, 3600.00, NULL, NULL, NULL, NULL, NULL, NULL, 5.00);

-- ============================================
-- 5. SEED DATA: Geradores - Locação QUINZENAL
-- ============================================

INSERT INTO pricing_generators (power_kva, power_min_kva, power_max_kva, equipment_type, rental_period, price_standby, price_120h, price_240h, price_360h, price_continuous, price_extra_hour, price_cable_kit_380v, price_cable_kit_220v, price_preventive_maintenance, discount_limit_percent) VALUES
('20KVA', 20, 20, 'gerador', 'quinzenal', 1355.00, 1469.00, 1605.00, 1735.00, 1973.00, 17.50, 72.00, 114.00, 1090.00, 5.00),
('40KVA', 40, 40, 'gerador', 'quinzenal', 1506.00, 1632.00, 1783.00, 1928.00, 2192.00, 21.34, 72.00, 114.00, 1090.00, 5.00),
('53KVA à 63KVA', 53, 63, 'gerador', 'quinzenal', 1506.00, 1632.00, 1783.00, 1928.00, 2192.00, 25.40, 72.00, 114.00, 1540.00, 5.00),
('75KVA à 83KVA', 75, 83, 'gerador', 'quinzenal', 1695.00, 1846.00, 2010.00, 2154.00, 2450.00, 27.95, 72.00, 114.00, 1250.00, 5.00),
('110KVA à 125KVA', 110, 125, 'gerador', 'quinzenal', 1695.00, 1846.00, 2217.00, 2488.00, 2860.00, 28.49, 72.00, 114.00, 1250.00, 5.00),
('140KVA', 140, 140, 'gerador', 'quinzenal', 2375.00, 2520.00, 2746.00, 3011.00, 3452.00, 29.49, 117.00, 191.00, 1250.00, 5.00),
('170KVA à 207KVA', 170, 207, 'gerador', 'quinzenal', 2746.00, 3017.00, 3282.00, 3704.00, 4264.00, 37.50, 117.00, 191.00, 1986.00, 5.00),
('251KVA', 251, 251, 'gerador', 'quinzenal', 3055.00, 3263.00, 3559.00, 4195.00, 4894.00, 54.72, 195.00, 333.00, 1986.00, 5.00),
('300KVA', 300, 300, 'gerador', 'quinzenal', 4012.00, 4374.00, 4765.00, 5455.00, 6302.00, 56.26, 340.00, 523.00, 1800.00, 5.00),
('350KVA à 400KVA', 350, 400, 'gerador', 'quinzenal', 4970.00, 5486.00, 5971.00, 6714.00, 7709.00, 69.18, 340.00, 523.00, 2100.00, 5.00),
('500KVA à 563KVA', 500, 563, 'gerador', 'quinzenal', 5662.00, 6218.00, 7009.00, 7705.00, 9713.00, 97.21, 523.00, 637.00, 3650.00, 11.00),
('640KVA', 640, 640, 'gerador', 'quinzenal', 6565.00, 7280.00, 8199.00, 8938.00, 10325.00, 105.00, 523.00, 637.00, 3750.00, 13.00),
('700KVA', 700, 700, 'gerador', 'quinzenal', 9939.00, 10972.00, 11942.00, 13428.00, 15418.00, 133.04, 838.00, 1407.00, 4191.36, 5.00),
('750KVA', 750, 750, 'gerador', 'quinzenal', 10274.00, 11307.00, 12277.00, 13763.00, 16068.00, 150.04, 838.00, 1407.00, 4191.36, 5.00),
('Torre Diesel', NULL, NULL, 'torre_diesel', 'quinzenal', NULL, NULL, 2278.00, NULL, NULL, NULL, NULL, NULL, 1750.00, 5.00),
('Torre Solar', NULL, NULL, 'torre_solar', 'quinzenal', NULL, NULL, 2412.00, NULL, NULL, NULL, NULL, NULL, NULL, 5.00);

-- ============================================
-- 6. SEED DATA: Geradores - Locação SEMANAL
-- ============================================

INSERT INTO pricing_generators (power_kva, power_min_kva, power_max_kva, equipment_type, rental_period, price_standby, price_120h, price_240h, price_360h, price_continuous, price_extra_hour, price_cable_kit_380v, price_cable_kit_220v, price_preventive_maintenance, discount_limit_percent) VALUES
('20KVA', 20, 20, 'gerador', 'semanal', 688.00, 745.00, 815.00, 881.00, 1001.00, 17.50, 37.00, 58.00, 1090.00, 5.00),
('40KVA', 40, 40, 'gerador', 'semanal', 764.00, 828.00, 905.00, 978.00, 1113.00, 21.34, 37.00, 58.00, 1090.00, 5.00),
('53KVA à 63KVA', 53, 63, 'gerador', 'semanal', 764.00, 828.00, 905.00, 978.00, 1113.00, 25.40, 37.00, 58.00, 1540.00, 5.00),
('75KVA à 83KVA', 75, 83, 'gerador', 'semanal', 860.00, 937.00, 1020.00, 1094.00, 1244.00, 27.95, 37.00, 58.00, 1250.00, 5.00),
('110KVA à 125KVA', 110, 125, 'gerador', 'semanal', 860.00, 937.00, 1125.00, 1263.00, 1451.00, 28.49, 37.00, 58.00, 1250.00, 5.00),
('140KVA', 140, 140, 'gerador', 'semanal', 1205.00, 1279.00, 1394.00, 1528.00, 1752.00, 29.49, 60.00, 97.00, 1250.00, 5.00),
('170KVA à 207KVA', 170, 207, 'gerador', 'semanal', 1394.00, 1531.00, 1666.00, 1880.00, 2164.00, 37.50, 60.00, 97.00, 1986.00, 5.00),
('251KVA', 251, 251, 'gerador', 'semanal', 1551.00, 1656.00, 1806.00, 2129.00, 2484.00, 54.72, 99.00, 169.00, 1986.00, 5.00),
('300KVA', 300, 300, 'gerador', 'semanal', 2036.00, 2220.00, 2418.00, 2768.00, 3198.00, 56.26, 173.00, 266.00, 1800.00, 5.00),
('350KVA à 400KVA', 350, 400, 'gerador', 'semanal', 2522.00, 2784.00, 3030.00, 3407.00, 3912.00, 69.18, 173.00, 266.00, 2100.00, 5.00),
('500KVA à 563KVA', 500, 563, 'gerador', 'semanal', 2873.00, 3156.00, 3557.00, 3910.00, 4929.00, 97.21, 266.00, 323.00, 3650.00, 11.00),
('640KVA', 640, 640, 'gerador', 'semanal', 3332.00, 3695.00, 4161.00, 4536.00, 5240.00, 105.00, 266.00, 323.00, 3750.00, 13.00),
('700KVA', 700, 700, 'gerador', 'semanal', 5044.00, 5568.00, 6060.00, 6814.00, 7824.00, 133.04, 425.00, 714.00, 4191.36, 5.00),
('750KVA', 750, 750, 'gerador', 'semanal', 5214.00, 5738.00, 6230.00, 6984.00, 8154.00, 150.04, 425.00, 714.00, 4191.36, 5.00),
('Torre Diesel', NULL, NULL, 'torre_diesel', 'semanal', NULL, NULL, 1156.00, NULL, NULL, NULL, NULL, NULL, 1750.00, 5.00),
('Torre Solar', NULL, NULL, 'torre_solar', 'semanal', NULL, NULL, 1224.00, NULL, NULL, NULL, NULL, NULL, NULL, 5.00);

-- ============================================
-- 7. SEED DATA: Acessórios e Serviços
-- ============================================

INSERT INTO pricing_accessories (item_code, item_name, category, price_monthly, price_biweekly, price_weekly, price_unit, discount_limit_percent, amperage, capacity) VALUES
-- Deslocamento
('DES', 'Deslocamento Técnico (por km)', 'deslocamento', NULL, NULL, NULL, 3.00, 27.00, NULL, NULL),

-- Serviços
('SERV', 'Instalação Gerador Singelo até 250KVA', 'servico', 300.00, 300.00, 300.00, NULL, 7.00, NULL, NULL),
('SERV', 'Instalação Gerador Singelo acima 250KVA', 'servico', 450.00, 450.00, 450.00, NULL, 7.00, NULL, NULL),
('SERV', 'Paralelismos entre geradores', 'servico', 300.00, 300.00, 300.00, NULL, 7.00, NULL, NULL),
('SERV', 'Diária técnico', 'servico', 900.00, 900.00, 900.00, NULL, 7.00, NULL, NULL),
('SERV', 'Instalação QTA', 'servico', 600.00, 750.00, 750.00, NULL, 7.00, NULL, NULL),

-- Quadros de Transferência Automática
('QTA', 'Quadro de Transferência Automático Aberta 350/400A', 'qta', 900.00, 603.00, 306.00, NULL, 7.00, '350/400A', NULL),
('QTA', 'Quadro de Transferência Automático Aberta 800A', 'qta', 1880.00, 1260.00, 640.00, NULL, 7.00, '800A', NULL),
('QTA', 'Quadro de Transferência Automático Aberta 1.600A', 'qta', 2330.00, 1570.00, 800.00, NULL, 7.00, '1600A', NULL),
('QTA', 'Quadro de Transferência Automático Aberta 2.500A', 'qta', 2780.00, 1870.00, 950.00, NULL, 7.00, '2500A', NULL),
('QTA', 'Quadro de Transferência Automático Aberta 3.200A', 'qta', 2930.00, 1970.00, 1000.00, NULL, 7.00, '3200A', NULL),

-- Tanques
('TQ', 'Tanque de 15mil litros em contêiner s/ mangueiras', 'tanque', 5060.00, 3400.00, 1730.00, NULL, 7.00, NULL, '15000L'),
('TQ', 'Kit de mangueiras 15mil litros e instalação por gerador', 'tanque', 750.00, 510.00, 260.00, NULL, 30.00, NULL, '15000L'),
('TQ', 'Tanque de 1 mil litros em contêiner s/ mangueiras', 'tanque', 250.00, 170.00, 90.00, NULL, 7.00, NULL, '1000L'),
('TQ', 'Kit de mangueiras 1mil litros e instalação por gerador', 'tanque', 150.00, 110.00, 60.00, NULL, 30.00, NULL, '1000L'),

-- Outros
('ROB', 'Painel Robozinho 400A', 'outro', NULL, NULL, NULL, NULL, 7.00, '400A', NULL),
('BC', 'Banco de cargas 500kW - Diária', 'outro', NULL, NULL, 4500.00, NULL, 7.00, NULL, '500kW');

-- ============================================
-- 8. RLS (Row Level Security)
-- ============================================

ALTER TABLE pricing_generators ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_accessories ENABLE ROW LEVEL SECURITY;

-- Políticas: leitura para usuários autenticados
CREATE POLICY "pricing_generators_select_policy" ON pricing_generators
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "pricing_accessories_select_policy" ON pricing_accessories
  FOR SELECT TO authenticated USING (true);

-- Políticas: escrita apenas para admins (via service role ou função específica)
-- Por ora, apenas SELECT é permitido para usuários normais

-- ============================================
-- 9. COMMENTS (Documentação)
-- ============================================

COMMENT ON TABLE pricing_generators IS 'Tabela de preços de locação de geradores por potência e período';
COMMENT ON TABLE pricing_accessories IS 'Tabela de preços de acessórios e serviços complementares';

COMMENT ON COLUMN pricing_generators.power_kva IS 'Identificador da potência (ex: 20KVA, 53KVA à 63KVA)';
COMMENT ON COLUMN pricing_generators.rental_period IS 'Período de locação: mensal, quinzenal ou semanal';
COMMENT ON COLUMN pricing_generators.price_standby IS 'Preço Stand-By (35h/mês)';
COMMENT ON COLUMN pricing_generators.price_continuous IS 'Preço Contínuo/Livre (24h/dia)';
COMMENT ON COLUMN pricing_generators.discount_limit_percent IS 'Limite máximo de desconto permitido (%)';

COMMENT ON COLUMN pricing_accessories.item_code IS 'Código do item (DES, SERV, QTA, TQ, ROB, BC)';
COMMENT ON COLUMN pricing_accessories.category IS 'Categoria: deslocamento, servico, qta, tanque, outro';
