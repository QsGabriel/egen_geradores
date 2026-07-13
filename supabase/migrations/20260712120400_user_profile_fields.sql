-- Migration: Novos campos em user_profiles
-- - avatar_url: foto de perfil (URL do Storage)
-- - qrcode_url: QR Code WhatsApp (upload livre)
-- - data_nascimento: data de nascimento
--
-- Ordem: 5/7

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS qrcode_url TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS data_nascimento DATE;
