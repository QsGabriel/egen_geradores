-- Add responsavel column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS responsavel TEXT DEFAULT '';
