-- Migration: Remover tabelas de alçadas (não utilizadas na EGEN)
-- - Remove view, tabelas e função relacionadas a approval limits
-- - Seguro: usa IF EXISTS para não quebrar se já não existirem
--
-- Ordem: 7/7

DROP VIEW IF EXISTS user_approval_limits_with_details;
DROP TABLE IF EXISTS user_approval_limits;
DROP TABLE IF EXISTS approval_level_config;
DROP FUNCTION IF EXISTS get_user_approval_limit(UUID);
