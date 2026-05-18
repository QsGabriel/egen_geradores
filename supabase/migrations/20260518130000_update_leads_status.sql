-- Migrate lead status values and add scheduled_at column

-- 1. Drop old status CHECK constraint
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE t.relname = 'leads' AND c.contype = 'c' AND c.conname ILIKE '%status%';
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE leads DROP CONSTRAINT ' || quote_ident(constraint_name);
  END IF;
END $$;

-- 2. Migrate old statuses to new values
UPDATE leads SET status = 'to_contact'         WHERE status IN ('new', 'contacted');
UPDATE leads SET status = 'in_proposal'         WHERE status = 'proposal_sent';
UPDATE leads SET status = 'follow_up'           WHERE status = 'negotiation';
UPDATE leads SET status = 'client_with_demand'  WHERE status = 'won';
UPDATE leads SET status = 'no_demand'           WHERE status = 'lost';

-- 3. Add new status CHECK constraint
ALTER TABLE leads ADD CONSTRAINT leads_status_check
  CHECK (status IN (
    'to_contact',
    'no_demand',
    'potential_client',
    'follow_up',
    'in_proposal',
    'client_no_demand',
    'client_with_demand'
  ));

-- 4. Add scheduled_at column
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_leads_scheduled_at ON leads(scheduled_at);
