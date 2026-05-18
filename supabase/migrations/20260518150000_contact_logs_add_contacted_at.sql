-- Add contacted_at column to contact_logs
-- This field stores the date/time of the contact as informed by the user,
-- distinct from created_at (when the record was inserted).

ALTER TABLE contact_logs
  ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;

-- Backfill existing rows: use created_at as contacted_at
UPDATE contact_logs
  SET contacted_at = created_at
  WHERE contacted_at IS NULL;

-- Make the column NOT NULL after backfill
ALTER TABLE contact_logs
  ALTER COLUMN contacted_at SET NOT NULL;

-- Update index to sort by contacted_at instead of created_at
DROP INDEX IF EXISTS idx_contact_logs_created_at;
CREATE INDEX IF NOT EXISTS idx_contact_logs_contacted_at
  ON contact_logs(contacted_at DESC);
