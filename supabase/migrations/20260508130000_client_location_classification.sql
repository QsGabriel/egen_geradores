-- ============================================
-- Adiciona campos de localização e classificação à tabela clients
-- ============================================

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS location_url TEXT,
  ADD COLUMN IF NOT EXISTS classification TEXT;

COMMENT ON COLUMN clients.location_url    IS 'Link do Google Maps com a localização do cliente';
COMMENT ON COLUMN clients.classification  IS 'Classificação do segmento do cliente';
