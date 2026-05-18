-- ============================================
-- CONTACT LOGS — Histórico de Contatos
-- Registra todos os contatos realizados com
-- clientes e leads, com data, usuário e
-- identificação da pessoa contatada.
-- ============================================

CREATE TABLE IF NOT EXISTS contact_logs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type      TEXT        NOT NULL CHECK (entity_type IN ('client', 'lead')),
  entity_id        UUID        NOT NULL,
  contacted_person TEXT        NOT NULL,
  notes            TEXT        NOT NULL,
  created_by       TEXT        NOT NULL DEFAULT 'Sistema',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas rápidas por entidade e por data
CREATE INDEX IF NOT EXISTS idx_contact_logs_entity
  ON contact_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_contact_logs_created_at
  ON contact_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE contact_logs ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem ler todos os registros
CREATE POLICY "contact_logs_select"
  ON contact_logs FOR SELECT
  TO authenticated
  USING (true);

-- Usuários autenticados podem inserir registros
CREATE POLICY "contact_logs_insert"
  ON contact_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Apenas administradores podem excluir (opcional — protege o histórico)
CREATE POLICY "contact_logs_delete"
  ON contact_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
