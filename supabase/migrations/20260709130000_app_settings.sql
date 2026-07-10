-- ============================================
-- EGEN System - App Settings
-- Migration: Create app_settings table for global configuration
-- ============================================

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID
);

-- Seed default proposal cover config
INSERT INTO app_settings (key, value) VALUES (
  'proposal_cover',
  '{"capaUrl": null, "textColor": null, "textBgColor": null}'::jsonb
) ON CONFLICT (key) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated SELECT on app_settings"
ON app_settings
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated INSERT on app_settings"
ON app_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated UPDATE on app_settings"
ON app_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
