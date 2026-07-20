-- Migration: Adicionar permissões de exclusão de usuários e propostas
-- Data: 2026-07-20

-- Adicionar canDeleteUsers e canDeleteQuotations ao Administrador
UPDATE custom_roles
SET permissions = permissions || '["canDeleteUsers", "canDeleteQuotations"]'::jsonb,
    updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- Adicionar canDeleteQuotations ao Operador (sem canDeleteUsers)
UPDATE custom_roles
SET permissions = permissions || '["canDeleteQuotations"]'::jsonb,
    updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000002';
