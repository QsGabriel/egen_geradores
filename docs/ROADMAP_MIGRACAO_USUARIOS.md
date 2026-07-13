# Roadmap de Migração — Módulo de Usuários EGEN

## Escopo

**Objetivo:** Migrar o módulo de usuários para RBAC escalável com:

- Cargos customizáveis com permissões gerenciáveis (matriz RBAC)
- Departamentos gerenciáveis pelo admin
- Campos de perfil completos: telefone, avatar (foto de perfil), QR Code (WhatsApp)
- Políticas RLS granulares (substituir `USING (true)` atual)

**Fora do escopo (não implementar):**

| Item | Motivo |
|---|---|
| Envio de e-mail / SMTP / nodemailer | Não utilizado na EGEN |
| `notification_templates` | Sem e-mail, sem templates |
| Google Workspace alias | EGEN não utiliza |
| Convite do Slack | EGEN não utiliza |
| Alçadas de aprovação (`approval_level_config`, `user_approval_limits`) | Não se aplica à EGEN |
| Role `financial` | Nunca utilizado; remover do CHECK constraint |

---

## Sumário

1. [Diagnóstico AS-IS vs TO-BE](#1-diagnóstico-as-is-vs-to-be)
2. [Fase 1 — Banco de Dados](#2-fase-1--banco-de-dados)
3. [Fase 2 — API / Backend](#3-fase-2--api--backend)
4. [Fase 3 — Frontend](#4-fase-3--frontend)
5. [Fase 4 — QR Code e Avatar](#5-fase-4--qr-code-e-avatar)
6. [Fase 5 — Rollout e Deploy](#6-fase-5--rollout-e-deploy)
7. [Apêndice A — Catálogo de Permissões EGEN](#apêndice-a--catálogo-de-permissões-egen)
8. [Apêndice B — Checklist de Migração](#apêndice-b--checklist-de-migração)

---

## 1. Diagnóstico AS-IS vs TO-BE

| Aspecto | AS-IS (atual) | TO-BE (alvo) |
|---|---|---|
| **Roles** | 3 fixas: `admin`, `operator`, `requester` (+ `financial` ignorado) | `custom_roles` com `permissions JSONB` — ilimitado, customizável pelo admin |
| **Permissões** | Matriz estática `ROLE_PERMISSIONS` no frontend | Catálogo `ALL_PERMISSION_KEYS` + permissões resolvidas dinamicamente do `custom_role` no banco |
| **Departamentos** | 14 hardcoded (herdados do FlowLab: Transporte, Estoque, Financeiro, Biologia Molecular...) | Tabela `departments` gerenciável pelo admin. Seed inicial: Administrativo, Comercial, TI |
| **RLS** | `USING (true)` em todas as tabelas — sem segurança efetiva | `SECURITY DEFINER` + `current_user_has_permission()` com políticas granulares |
| **Criação de usuário** | Só self-signup via `Auth.tsx` | Admin cria via `NewUserForm` → `POST /api/users/create` (senha temporária exibida na tela, sem e-mail) |
| **Campos de perfil** | `id`, `email`, `name`, `role`, `department`, `phone` | + `cpf`, `data_nascimento`, `custom_role_id`, `avatar_url`, `qrcode_url` |
| **QR Code** | Lib `qrcode` no `package.json` sem uso real | Upload livre por usuário (QR Code do WhatsApp para exibição em contratos) |
| **Foto de perfil** | Não existe | Upload livre (`avatar_url`) |
| **Whitelist** | Não existe | `user_whitelist` (CPF) — controle de quem pode ser cadastrado |
| **API Backend** | Nenhuma (front → Supabase direto) | 1 Vercel Function: `POST /api/users/create` (cria auth user + perfil, retorna senha temporária) |
| **Assinatura `hasPermission`** | `(role: UserRole, perm: keyof RolePermissions) => boolean` | `(permissions: string[], perm: string) => boolean` |

---

## 2. Fase 1 — Banco de Dados

**Tempo estimado:** 4-5 horas
**Risco:** Baixo (migrations puramente aditivas, sem destruir dados)

### 2.1 — Correção prévia: `user_profiles`

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_01_fix_user_profiles.sql`

```sql
-- Remover 'financial' do CHECK constraint (nunca usado)
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('admin', 'operator', 'requester'));

-- Garantir trigger updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at'
  ) THEN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
```

**Responsável:** @backend

---

### 2.2 — `departments` (tabela gerenciável)

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_02_departments.sql`

```sql
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(is_active);

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed inicial EGEN
INSERT INTO departments (name, description) VALUES
  ('Administrativo', 'Setor administrativo e finanças'),
  ('Comercial', 'Setor comercial e vendas'),
  ('TI', 'Tecnologia da Informação')
ON CONFLICT (name) DO NOTHING;

-- RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "departments_select" ON departments
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "departments_insert" ON departments
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_permission('canManageDepartments'));

CREATE POLICY "departments_update" ON departments
  FOR UPDATE TO authenticated
  USING (public.current_user_has_permission('canManageDepartments'))
  WITH CHECK (public.current_user_has_permission('canManageDepartments'));

CREATE POLICY "departments_delete" ON departments
  FOR DELETE TO authenticated
  USING (public.current_user_has_permission('canManageDepartments'));
```

**Responsável:** @backend

---

### 2.3 — `custom_roles` (RBAC dinâmico)

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_03_custom_roles.sql`

```sql
-- 1. Tabela de cargos customizáveis
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_roles_name ON custom_roles(name);
CREATE INDEX IF NOT EXISTS idx_custom_roles_is_system ON custom_roles(is_system);
CREATE INDEX IF NOT EXISTS idx_custom_roles_permissions ON custom_roles USING GIN(permissions);

CREATE TRIGGER update_custom_roles_updated_at
  BEFORE UPDATE ON custom_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Seed: 3 cargos de sistema (IDs fixos)
INSERT INTO custom_roles (id, name, description, permissions, is_system) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  'Administrador',
  'Acesso completo a todos os módulos do sistema.',
  '["canViewDashboard","canManageEquipment","canViewEquipment","canAddEquipment","canEditEquipment","canDeleteEquipment","canViewMovements","canAddMovements","canViewRequests","canAddRequests","canApproveRequests","canViewExpiration","canViewChangelog","canManageUsers","canManageRoles","canManageDepartments","canManageWhitelist","canManageQuotations","canConfigureRequestPeriods","canViewClients","canCreateClients","canEditClients","canDeleteClients","canViewLeads","canCreateLeads","canEditLeads","canDeleteLeads","canViewMaintenance","canManageMaintenance"]'::jsonb,
  true
),
(
  'a0000000-0000-0000-0000-000000000002',
  'Operador',
  'Acesso operacional. Sem dashboard, sem gerenciamento de usuários/cargos.',
  '["canManageEquipment","canViewEquipment","canAddEquipment","canEditEquipment","canDeleteEquipment","canViewMovements","canAddMovements","canViewRequests","canAddRequests","canApproveRequests","canViewExpiration","canViewChangelog","canManageQuotations","canConfigureRequestPeriods","canViewClients","canCreateClients","canEditClients","canDeleteClients","canViewLeads","canCreateLeads","canEditLeads","canDeleteLeads","canViewMaintenance","canManageMaintenance"]'::jsonb,
  true
),
(
  'a0000000-0000-0000-0000-000000000003',
  'Solicitante',
  'Apenas visualização e criação de solicitações.',
  '["canViewRequests","canAddRequests"]'::jsonb,
  true
)
ON CONFLICT (name) DO NOTHING;

-- 3. Adicionar custom_role_id em user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES custom_roles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_custom_role_id ON user_profiles(custom_role_id);

-- 4. Backfill: vincular usuários existentes
UPDATE user_profiles SET custom_role_id = 'a0000000-0000-0000-0000-000000000001'
WHERE role = 'admin' AND custom_role_id IS NULL;

UPDATE user_profiles SET custom_role_id = 'a0000000-0000-0000-0000-000000000002'
WHERE role = 'operator' AND custom_role_id IS NULL;

UPDATE user_profiles SET custom_role_id = 'a0000000-0000-0000-0000-000000000003'
WHERE role = 'requester' AND custom_role_id IS NULL;

-- 5. RLS
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_roles_select" ON custom_roles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "custom_roles_insert" ON custom_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_permission('canManageRoles'));

CREATE POLICY "custom_roles_update" ON custom_roles
  FOR UPDATE TO authenticated
  USING (public.current_user_has_permission('canManageRoles'))
  WITH CHECK (public.current_user_has_permission('canManageRoles'));

CREATE POLICY "custom_roles_delete" ON custom_roles
  FOR DELETE TO authenticated
  USING (is_system = false AND public.current_user_has_permission('canManageRoles'));

-- 6. View: usuários com seus cargos
CREATE OR REPLACE VIEW user_roles_view AS
SELECT
  up.id AS user_id,
  up.email,
  up.name AS user_name,
  up.role AS legacy_role,
  up.department,
  up.custom_role_id,
  cr.name AS role_name,
  cr.description AS role_description,
  cr.permissions,
  cr.is_system
FROM user_profiles up
LEFT JOIN custom_roles cr ON cr.id = up.custom_role_id;

-- 7. Função: verificar permissão (com fallback legado)
CREATE OR REPLACE FUNCTION user_has_permission(user_id UUID, permission_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles up
    JOIN custom_roles cr ON cr.id = up.custom_role_id
    WHERE up.id = user_id
    AND cr.permissions ? permission_key
  ) INTO has_perm;

  -- Fallback para coluna role (transição)
  IF has_perm IS NULL OR has_perm = false THEN
    SELECT CASE
      WHEN up.role = 'admin' THEN true
      WHEN up.role = 'operator' AND permission_key NOT IN ('canViewDashboard','canManageUsers','canManageRoles','canManageDepartments','canManageWhitelist') THEN true
      WHEN up.role = 'requester' AND permission_key IN ('canViewRequests','canAddRequests') THEN true
      ELSE false
    END INTO has_perm
    FROM user_profiles up
    WHERE up.id = user_id;
  END IF;

  RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Responsável:** @backend

---

### 2.4 — `user_whitelist` (CPF)

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_04_user_whitelist.sql`

```sql
CREATE TABLE IF NOT EXISTS user_whitelist (
  cpf TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  activity BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS cpf TEXT UNIQUE;
ALTER TABLE user_profiles
  ADD CONSTRAINT fk_user_profiles_cpf
  FOREIGN KEY (cpf) REFERENCES user_whitelist(cpf);

ALTER TABLE user_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whitelist_read_auth" ON user_whitelist
  FOR SELECT USING (auth.role() IN ('authenticated', 'anon'));

CREATE POLICY "whitelist_write" ON user_whitelist
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      LEFT JOIN custom_roles cr ON cr.id = p.custom_role_id
      WHERE p.id = auth.uid()
        AND cr.permissions @> '["canManageWhitelist"]'::jsonb
    )
  );
```

**Responsável:** @backend

---

### 2.5 — Novos campos em `user_profiles`

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_05_user_profile_fields.sql`

```sql
-- Foto de perfil (URL do Storage)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- QR Code WhatsApp (upload livre pelo usuário)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS qrcode_url TEXT;

-- Data de nascimento
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS data_nascimento DATE;
```

> O campo `phone` já existe. Mantê-lo como está, sem renomear.

**Responsável:** @backend

---

### 2.6 — Corrigir RLS (substituir `USING (true)`)

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_06_fix_rls.sql`

```sql
-- 1. Função SECURITY DEFINER (evita recursão em políticas RLS)
CREATE OR REPLACE FUNCTION public.current_user_has_permission(p_permission text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_profiles p
    LEFT JOIN custom_roles cr ON cr.id = p.custom_role_id
    WHERE p.id = auth.uid()
      AND (
        cr.permissions @> to_jsonb(ARRAY[p_permission])
        OR (p.role = 'admin' AND cr.id IS NULL)
      )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.current_user_has_permission(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_has_permission(text) TO authenticated;

-- 2. Remover políticas antigas de user_profiles
DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update" ON user_profiles;

-- 3. Novas políticas
CREATE POLICY "user_profiles_select" ON user_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "user_profiles_insert" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "user_profiles_update_self" ON user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_update_admin" ON user_profiles
  FOR UPDATE TO authenticated
  USING (public.current_user_has_permission('canManageUsers'))
  WITH CHECK (public.current_user_has_permission('canManageUsers'));

CREATE POLICY "user_profiles_delete" ON user_profiles
  FOR DELETE TO authenticated
  USING (public.current_user_has_permission('canManageUsers'));
```

**Responsável:** @backend

---

### 2.7 — Remover alçadas (se existirem)

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_07_drop_approval_limits.sql`

```sql
DROP VIEW IF EXISTS user_approval_limits_with_details;
DROP TABLE IF EXISTS user_approval_limits;
DROP TABLE IF EXISTS approval_level_config;
DROP FUNCTION IF EXISTS get_user_approval_limit(UUID);
```

> Verificar antes se as tabelas existem em produção:
> ```sql
> SELECT table_name FROM information_schema.tables
> WHERE table_name IN ('approval_level_config', 'user_approval_limits');
> ```

**Responsável:** @backend

---

### 2.8 — Ordem de execução

1. `01_fix_user_profiles.sql`
2. `02_departments.sql`
3. `03_custom_roles.sql`
4. `04_user_whitelist.sql`
5. `05_user_profile_fields.sql`
6. `06_fix_rls.sql`
7. `07_drop_approval_limits.sql`

---

## 3. Fase 2 — API / Backend

**Tempo estimado:** 1-2 horas
**Risco:** Baixo (1 única Vercel Function, mínima)

### 3.1 — Estrutura

```
api/
  _lib/
    supabase.ts          # Cliente Supabase service_role (singleton)
    createUser.ts        # Orquestrador de cadastro (sem e-mail)
  users/
    create.ts            # POST /api/users/create
```

### 3.2 — `api/_lib/supabase.ts`

Cliente admin com `SUPABASE_SERVICE_ROLE_KEY`, singleton.

**Fonte de referência:** `docs/users-module/api/_lib/supabase.ts` (cópia direta, trocar `flowlab` por `egen`).

### 3.3 — `api/_lib/createUser.ts`

Fluxo simplificado (sem e-mail, sem Google Workspace, sem Slack):

1. Extrai `Bearer <token>` do header `Authorization`
2. `auth.getUser(token)` → identifica o admin chamador
3. Busca perfil + `custom_roles.permissions` do admin
4. Verifica `canManageUsers` OU `role = 'admin'` (fallback)
5. Valida campos: `name`, `email`, `cpf`, `departmentId`
6. Valida CPF (algoritmo de dígitos verificadores)
7. Upsert `user_whitelist` (`cpf`, `name`, `activity = true`)
8. Gera senha temporária (12 caracteres aleatórios)
9. `auth.admin.createUser(email, tempPassword, { email_confirm: true, user_metadata: { name } })`
10. Upsert `user_profiles` (`cpf`, `data_nascimento`, `custom_role_id`, `department`)
    - Fallback: se trigger não criou o perfil, faz INSERT manual
11. Retorna `{ success: true, userId, tempPassword }` — senha exibida na tela para o admin copiar

### 3.4 — `api/users/create.ts`

Vercel Function handler:

- Método: `POST`
- Headers: `Authorization: Bearer <access_token>`
- Body: `{ name, email, cpf, dataNascimento?, departmentId, customRoleId }`
- Response 201: `{ success: true, userId, tempPassword }`
- Response 401/403: erro de autorização
- Response 400: erro de validação

### 3.5 — Variáveis de ambiente

```env
# Frontend (já existem)
VITE_SUPABASE_URL=https://iiqoqdtactacwdhkpkzd.supabase.co
VITE_SUPABASE_ANON_KEY=...

# Backend (nova)
SUPABASE_URL=https://iiqoqdtactacwdhkpkzd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

> Sem SMTP, sem nodemailer. Apenas `@supabase/supabase-js` no backend.

**Responsável:** @backend

---

## 4. Fase 3 — Frontend

**Tempo estimado:** 10-14 horas
**Risco:** Médio (breaking change na assinatura de `hasPermission` — impacta App, Layout, Home)

### 4.1 — `src/types/index.ts`

```typescript
// Manter UserRole legado para compatibilidade
export type UserRole = 'admin' | 'operator' | 'requester';

// NOVO — cargo customizável
export interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

// NOVO — departamento gerenciável
export interface Department {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// UserProfile expandido
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;         // NOVO
  qrcode_url?: string;         // NOVO
  cpf?: string;                // NOVO
  data_nascimento?: string;    // NOVO
  role: UserRole;              // mantido (compatibilidade)
  department: string;          // agora string livre (nome do departamento)
  customRoleId?: string;       // NOVO
  permissions: string[];       // NOVO — resolvido do custom_role
  roleName?: string;           // NOVO — nome de exibição do cargo
  createdAt: string;
  updatedAt: string;
}

// RolePermissions — remover futuramente (manter até migração completa)
```

**Responsável:** @frontend

---

### 4.2 — `src/utils/permissions.ts` (reescrita)

```typescript
import { UserRole } from '../types';

// Catálogo de permissões da EGEN
export const ALL_PERMISSION_KEYS: { key: string; label: string; group: string }[] = [
  { key: 'canViewDashboard', label: 'Visualizar Dashboard', group: 'Dashboard' },

  { key: 'canManageEquipment', label: 'Gerenciar Equipamentos', group: 'Equipamentos' },
  { key: 'canViewEquipment', label: 'Visualizar Equipamentos', group: 'Equipamentos' },
  { key: 'canAddEquipment', label: 'Adicionar Equipamentos', group: 'Equipamentos' },
  { key: 'canEditEquipment', label: 'Editar Equipamentos', group: 'Equipamentos' },
  { key: 'canDeleteEquipment', label: 'Excluir Equipamentos', group: 'Equipamentos' },

  { key: 'canViewMovements', label: 'Visualizar Movimentações', group: 'Movimentações' },
  { key: 'canAddMovements', label: 'Adicionar Movimentações', group: 'Movimentações' },

  { key: 'canViewRequests', label: 'Visualizar Solicitações', group: 'Solicitações' },
  { key: 'canAddRequests', label: 'Criar Solicitações', group: 'Solicitações' },
  { key: 'canApproveRequests', label: 'Aprovar Solicitações', group: 'Solicitações' },

  { key: 'canViewExpiration', label: 'Monitorar Vencimentos', group: 'Monitoramento' },
  { key: 'canViewChangelog', label: 'Visualizar Changelog', group: 'Monitoramento' },

  { key: 'canViewClients', label: 'Visualizar Clientes', group: 'CRM' },
  { key: 'canCreateClients', label: 'Criar Clientes', group: 'CRM' },
  { key: 'canEditClients', label: 'Editar Clientes', group: 'CRM' },
  { key: 'canDeleteClients', label: 'Excluir Clientes', group: 'CRM' },

  { key: 'canViewLeads', label: 'Visualizar Leads', group: 'CRM' },
  { key: 'canCreateLeads', label: 'Criar Leads', group: 'CRM' },
  { key: 'canEditLeads', label: 'Editar Leads', group: 'CRM' },
  { key: 'canDeleteLeads', label: 'Excluir Leads', group: 'CRM' },

  { key: 'canManageQuotations', label: 'Gerenciar Propostas', group: 'Propostas' },
  { key: 'canConfigureRequestPeriods', label: 'Configurar Períodos', group: 'Propostas' },

  { key: 'canViewMaintenance', label: 'Visualizar Manutenções', group: 'Manutenção' },
  { key: 'canManageMaintenance', label: 'Gerenciar Manutenções', group: 'Manutenção' },

  { key: 'canManageUsers', label: 'Gerenciar Usuários', group: 'Administração' },
  { key: 'canManageRoles', label: 'Gerenciar Cargos', group: 'Administração' },
  { key: 'canManageDepartments', label: 'Gerenciar Departamentos', group: 'Administração' },
  { key: 'canManageWhitelist', label: 'Gerenciar Whitelist', group: 'Administração' },
];

// Fallback legado (transição)
const LEGACY_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ALL_PERMISSION_KEYS.map(p => p.key),
  operator: ALL_PERMISSION_KEYS.map(p => p.key).filter(
    k => !['canViewDashboard', 'canManageUsers', 'canManageRoles', 'canManageDepartments', 'canManageWhitelist'].includes(k)
  ),
  requester: ['canViewRequests', 'canAddRequests'],
};

export const getPermissionsForLegacyRole = (role: UserRole): string[] =>
  LEGACY_ROLE_PERMISSIONS[role] || [];

// Assinatura NOVA — baseada em array de permissões
export const hasPermission = (permissions: string[], permission: string): boolean =>
  permissions.includes(permission);

// Labels (compatibilidade)
export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    admin: 'Administrador', operator: 'Operador', requester: 'Solicitante',
  };
  return labels[role];
};

export const getDepartmentLabel = (name: string): string => name;
```

**Responsável:** @frontend

---

### 4.3 — `src/hooks/useAuth.ts` (refatoração)

Alterações:

1. **`loadUserProfile()`** — join com `custom_roles`:

```typescript
const { data } = await supabase
  .from('user_profiles')
  .select('*, custom_roles(id, name, permissions)')
  .eq('id', userId)
  .single();
```

2. **Popular `permissions` e `roleName`**:

```typescript
setUserProfile({
  id: data.id,
  email: data.email,
  name: data.name,
  phone: data.phone,
  avatar_url: data.avatar_url,
  qrcode_url: data.qrcode_url,
  cpf: data.cpf,
  data_nascimento: data.data_nascimento,
  role: data.role,
  department: data.department,
  customRoleId: data.custom_role_id,
  permissions: data.custom_roles?.permissions || getPermissionsForLegacyRole(data.role),
  roleName: data.custom_roles?.name || getRoleLabel(data.role),
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});
```

3. Adicionar `refreshProfile()` público.
4. `updateUserRole()` adaptado para `customRoleId`.
5. `signUp()` — manter fluxo existente.

**Responsável:** @frontend

---

### 4.4 — `src/components/UserManagement.tsx` (substituição)

**Features:**

| Funcionalidade | Descrição |
|---|---|
| Aba "Usuários" | Tabela com search, filtros por departamento e cargo, avatar, badge de cargo, ações de editar |
| Aba "Cargos e Permissões" | Grid de cards + formulário com matriz de permissões agrupadas por módulo |
| Aba "Departamentos" | Tabela CRUD de departamentos (nome, descrição, ativo/inativo) |
| Botão "Novo Usuário" | Abre `NewUserForm` modal → chama `POST /api/users/create` — exibe senha temporária na tela após sucesso |
| Edição de usuário | Form com: nome, email (desabilitado), telefone, CPF, data nasc., departamento (select), cargo (cards), upload avatar, upload QR Code |
| **Sem aba de alçadas** | Removido completamente do componente |

**Base de código:** Adaptar `docs/users-module/src/components/UserManagement.tsx` com:
- Design System EGEN (`egen-yellow`, `egen-navy`, `rounded-xl/2xl`)
- Remover lógica de alçadas (`approvalLevel`, `canApprove`, `customMaxAmount`, `showLevelConfig`, etc.)
- Adicionar aba "Departamentos" com CRUD simples
- Substituir `GROUP_COLORS` pelas cores EGEN

**Responsável:** @frontend

---

### 4.5 — `src/components/NewUserForm.tsx` (novo)

Modal "Novo Usuário":
- Overlay com backdrop blur + framer-motion
- Campos: Nome*, Email*, Telefone (máscara), CPF (máscara + validação), Data Nasc., Departamento* (select), Cargo* (cards)
- Submit: `POST /api/users/create` com `Authorization: Bearer <session.access_token>`
- Sucesso: modal fecha, toast mostra "Usuário criado. Senha temporária: `XXXX` — copie e entregue ao usuário."
- Loading/erro states

**Fonte de referência:** `docs/users-module/src/components/NewUserForm.tsx` (adaptar, remover referências a aprovação/alçadas).

**Responsável:** @frontend

---

### 4.6 — `src/App.tsx` (adaptação `ProtectedRoute`)

```typescript
// ANTES
const ProtectedRoute = ({ children, permission, userRole }) => {
  if (permission && !hasPermission(userRole as any, permission as any)) { ... }
};

// DEPOIS — userPermissions vem do useAuth
const { userProfile } = useAuth();
const userPermissions = userProfile?.permissions || [];

const ProtectedRoute = ({ children, permission }) => {
  if (permission && !hasPermission(userPermissions, permission)) { ... }
};
```

**Responsável:** @frontend

---

### 4.7 — `src/components/Layout.tsx` (adaptação)

- `canAccessItem()` → `hasPermission(userPermissions, item.permission)`
- Sidebar user info: mostrar `roleName` (cargo) em vez de `getRoleLabel(role)`
- Avatar: `<img>` se `avatar_url`, fallback ícone `Shield` com `egen-yellow`

**Responsável:** @frontend

---

### 4.8 — `src/components/Home.tsx` (adaptação)

Mesmo padrão: `hasPermission(userPermissions, ...)`.

**Responsável:** @frontend

---

### 4.9 — Utilitários novos

| Arquivo | Descrição |
|---|---|
| `src/utils/cpf.ts` | `normalizeCPF`, `formatCPF`, `validateCPF` — copiar de `docs/users-module/src/utils/cpf.ts` |

### 4.10 — `src/lib/database.types.ts`

Regenerar após todas as migrations:

```bash
npx supabase gen types typescript --project-id <PROJECT_ID> > src/lib/database.types.ts
```

**Responsável:** @frontend

---

## 5. Fase 4 — QR Code e Avatar

**Tempo estimado:** 2-3 horas

### 5.1 — Buckets no Supabase Storage

Criar via dashboard ou migration:

| Bucket | Finalidade | Política |
|---|---|---|
| `user-avatars` | Fotos de perfil | SELECT público; INSERT/UPDATE owner + `canManageUsers` |
| `user-qrcodes` | QR Codes WhatsApp | SELECT autenticado; INSERT/UPDATE owner + `canManageUsers` |

### 5.2 — `AvatarUpload.tsx` (novo)

- Área de drop/click com preview circular
- Upload direto: `supabase.storage.from('user-avatars').upload(userId + ext, file)`
- `getPublicUrl()` → atualiza `user_profiles.avatar_url`
- Borda `egen-yellow` no preview
- Integrado ao form de edição no `UserManagement`

### 5.3 — `QrcodeUpload.tsx` (novo)

- Área de drop/click com preview
- Upload: `supabase.storage.from('user-qrcodes').upload(userId, file)`
- `getPublicUrl()` → atualiza `user_profiles.qrcode_url`
- Label: "QR Code WhatsApp"
- Integrado ao form de edição no `UserManagement`

### 5.4 — Exibição

- Na tabela de usuários: coluna com `<img>` do avatar (32x32, rounded) ou fallback de ícone colorido por cargo
- QR Code: botão "Ver QR Code" → modal com imagem + tooltip "WhatsApp"

**Responsável:** @frontend

---

## 6. Fase 5 — Rollout e Deploy

**Tempo estimado:** 2-3 horas

### 6.1 — Ordem de deploy

1. **Banco**: rodar migrations 01 a 07 no Supabase
2. **Storage**: criar buckets `user-avatars` e `user-qrcodes`
3. **Vercel**: adicionar `SUPABASE_SERVICE_ROLE_KEY` nas env vars
4. **Backend**: deploy da Vercel Function `api/users/create`
5. **Frontend**: build + deploy

### 6.2 — Compatibilidade e rollback

- Coluna `role` **não removida** — apenas deixa de ser fonte primária
- `hasPermission` tem fallback para `LEGACY_ROLE_PERMISSIONS` quando `permissions` está vazio
- `user_has_permission()` no banco tem fallback para `role = 'admin'`
- Backfill de `custom_role_id` garante zero usuários sem cargo
- Em caso de rollback, reverter deploy do frontend; banco permanece compatível

### 6.3 — Checklist de testes

#### Banco

- [ ] `custom_roles` com 3 cargos seedados, `custom_role_id` preenchido para todos
- [ ] `departments` com 3 seed iniciais
- [ ] `user_whitelist` criada
- [ ] Novas colunas em `user_profiles` (`avatar_url`, `qrcode_url`, `cpf`, `data_nascimento`, `custom_role_id`)
- [ ] `current_user_has_permission('canManageUsers')` funcional
- [ ] RLS bloqueia UPDATE para usuário sem permissão
- [ ] Tabelas de alçadas removidas

#### API

- [ ] `POST /api/users/create` — admin autenticado cria usuário, retorna `tempPassword`
- [ ] Rejeitado sem token (401)
- [ ] Rejeitado para usuário sem `canManageUsers` (403)
- [ ] CPF inválido rejeitado (400)

#### Frontend — Admin

- [ ] Acessa `/users`, vê 3 abas: Usuários, Cargos, Departamentos
- [ ] "Novo Usuário" → preenche → submit → senha temporária exibida na tela
- [ ] Edita usuário (nome, departamento, cargo, avatar, QR Code)
- [ ] Upload de avatar funcional (preview na tabela)
- [ ] Upload de QR Code funcional (modal "Ver QR Code")
- [ ] Cria/edita/exclui cargo customizado (sistema não pode ser excluído)
- [ ] Cria/edita departamento
- [ ] Search e filtros na tabela de usuários funcionais

#### Frontend — Operador / Solicitante

- [ ] Operador **não** vê menu "Usuários"
- [ ] Solicitante vê apenas módulos permitidos
- [ ] Acesso negado ao acessar `/users` diretamente

#### Regressão

- [ ] Login/logout
- [ ] Signup self-service (`Auth.tsx`)
- [ ] Dashboard (admin)
- [ ] CRUD equipamentos
- [ ] CRM clientes/leads
- [ ] Propostas comerciais
- [ ] Manutenções
- [ ] Dark mode

---

## Apêndice A — Catálogo de Permissões EGEN

| Chave | Rótulo | Grupo |
|---|---|---|
| `canViewDashboard` | Visualizar Dashboard | Dashboard |
| `canManageEquipment` | Gerenciar Equipamentos | Equipamentos |
| `canViewEquipment` | Visualizar Equipamentos | Equipamentos |
| `canAddEquipment` | Adicionar Equipamentos | Equipamentos |
| `canEditEquipment` | Editar Equipamentos | Equipamentos |
| `canDeleteEquipment` | Excluir Equipamentos | Equipamentos |
| `canViewMovements` | Visualizar Movimentações | Movimentações |
| `canAddMovements` | Adicionar Movimentações | Movimentações |
| `canViewRequests` | Visualizar Solicitações | Solicitações |
| `canAddRequests` | Criar Solicitações | Solicitações |
| `canApproveRequests` | Aprovar Solicitações | Solicitações |
| `canViewExpiration` | Monitorar Vencimentos | Monitoramento |
| `canViewChangelog` | Visualizar Changelog | Monitoramento |
| `canViewClients` | Visualizar Clientes | CRM |
| `canCreateClients` | Criar Clientes | CRM |
| `canEditClients` | Editar Clientes | CRM |
| `canDeleteClients` | Excluir Clientes | CRM |
| `canViewLeads` | Visualizar Leads | CRM |
| `canCreateLeads` | Criar Leads | CRM |
| `canEditLeads` | Editar Leads | CRM |
| `canDeleteLeads` | Excluir Leads | CRM |
| `canManageQuotations` | Gerenciar Propostas | Propostas |
| `canConfigureRequestPeriods` | Configurar Períodos | Propostas |
| `canViewMaintenance` | Visualizar Manutenções | Manutenção |
| `canManageMaintenance` | Gerenciar Manutenções | Manutenção |
| `canManageUsers` | Gerenciar Usuários | Administração |
| `canManageRoles` | Gerenciar Cargos | Administração |
| `canManageDepartments` | Gerenciar Departamentos | Administração |
| `canManageWhitelist` | Gerenciar Whitelist | Administração |

### Cargos de sistema (seed)

| Cargo | Permissões |
|---|---|
| Administrador | Todas (29) |
| Operador | Todas exceto `canViewDashboard`, `canManageUsers`, `canManageRoles`, `canManageDepartments`, `canManageWhitelist` |
| Solicitante | `canViewRequests`, `canAddRequests` |

---

## Apêndice B — Checklist de Migração

### Pré-migração

- [ ] Backup do banco (Supabase dashboard)
- [ ] Verificar existência de `approval_level_config` / `user_approval_limits`
- [ ] Criar branch `feature/rbac-migration`

### Migração — Banco

- [ ] Rodar `01_fix_user_profiles.sql`
- [ ] Rodar `02_departments.sql`
- [ ] Rodar `03_custom_roles.sql`
- [ ] Rodar `04_user_whitelist.sql`
- [ ] Rodar `05_user_profile_fields.sql`
- [ ] Rodar `06_fix_rls.sql`
- [ ] Rodar `07_drop_approval_limits.sql`
- [ ] Validar backfill: `SELECT COUNT(*) FROM user_profiles WHERE custom_role_id IS NULL` → 0

### Migração — Storage

- [ ] Criar bucket `user-avatars` (público)
- [ ] Criar bucket `user-qrcodes` (público)

### Migração — Vercel

- [ ] Adicionar `SUPABASE_SERVICE_ROLE_KEY` nas env vars
- [ ] Deploy `api/users/create`
- [ ] Testar endpoint via cURL

### Migração — Frontend

- [ ] `src/types/index.ts` atualizado
- [ ] `src/utils/permissions.ts` reescrito
- [ ] `src/hooks/useAuth.ts` refatorado
- [ ] `src/components/UserManagement.tsx` substituído (3 abas)
- [ ] `src/components/NewUserForm.tsx` criado
- [ ] `src/components/AvatarUpload.tsx` criado
- [ ] `src/components/QrcodeUpload.tsx` criado
- [ ] `src/utils/cpf.ts` criado
- [ ] `src/App.tsx` adaptado
- [ ] `src/components/Layout.tsx` adaptado
- [ ] `src/components/Home.tsx` adaptado
- [ ] `src/lib/database.types.ts` regerado
- [ ] Build sem erros (`npm run build`)
- [ ] Deploy

### Pós-migração

- [ ] Executar checklist de testes (seção 6.3)
- [ ] Monitorar logs Vercel por 24h

---

## Referências

| Arquivo | Conteúdo |
|---|---|
| `docs/users-module/README.md` | Documentação da inspiração (FlowLab) |
| `docs/users-module/src/types.ts` | Tipos de referência |
| `docs/users-module/src/utils/permissions.ts` | Catálogo de permissões de referência |
| `docs/users-module/src/components/UserManagement.tsx` | Componente de referência |
| `docs/users-module/src/components/NewUserForm.tsx` | Formulário de referência |
| `docs/users-module/api/_lib/createUser.ts` | Orquestrador de referência (a simplificar) |
| `docs/users-module/supabase/migrations/20260409120000_dynamic_roles_system.sql` | Migration `custom_roles` de referência |
| `docs/DB.MD` | Schema atual do banco EGEN |
| `docs/DESIGN_SYSTEM_EGEN.md` | Design system EGEN |
| `src/types/index.ts` | Tipos atuais (a modificar) |
| `src/utils/permissions.ts` | Permissões atuais (a reescrever) |
