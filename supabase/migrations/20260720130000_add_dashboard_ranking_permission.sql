-- Migration: Permissão para ver o Ranking de Vendedores no Dashboard
-- Data: 2026-07-20
-- Controla a visibilidade da produção de TODOS os vendedores no Dashboard
-- (card "Ranking de Vendedores" + filtro por vendedor). Sem esta permissão,
-- o usuário não vê a produção de outros usuários.

-- Concede canViewSalesRanking ao Administrador.
-- Idempotente: só adiciona se ainda não existir no array de permissões.
UPDATE custom_roles
SET permissions = permissions || '["canViewSalesRanking"]'::jsonb,
    updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000001'
  AND NOT (permissions ? 'canViewSalesRanking');

-- Demais cargos (Operador, etc.): conceder pela tela de Cargos/Permissões
-- conforme a necessidade — mantido como negado por padrão.
