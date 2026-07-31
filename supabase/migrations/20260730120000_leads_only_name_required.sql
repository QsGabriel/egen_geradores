-- ============================================
-- LEADS: apenas "name" (nome/razão social) obrigatório
-- Demais colunas passam a aceitar NULL no banco de dados
-- ============================================
--
-- Baseado no schema real da tabela `leads` no Supabase (nem todas as
-- colunas abaixo foram criadas via migration neste repositório — city,
-- state, classification, phone_ddd e phone_number existem no banco com
-- NOT NULL DEFAULT '' mas não aparecem em nenhum arquivo desta pasta,
-- ou seja, foram alteradas direto no SQL Editor do Supabase em algum
-- momento). Os DEFAULTs são mantidos — só a restrição NOT NULL sai,
-- então inserts que omitirem essas colunas continuam recebendo o
-- default normalmente ('new', '[]'::jsonb ou '').

-- 1. Colunas que deixam de ser obrigatórias no banco
ALTER TABLE leads ALTER COLUMN status         DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN contacts       DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN city           DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN state          DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN classification DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN phone_ddd      DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN phone_number   DROP NOT NULL;

-- 2. Garante (idempotente) que "name" (nome/razão social) permanece obrigatório
ALTER TABLE leads ALTER COLUMN name SET NOT NULL;
