# Plano de Implementação — Restrição de Acesso por Estados (CRM)

> **Projeto:** egen_geradores | **Stack:** React 18 + TypeScript + Tailwind 3 + Supabase
> **Elaborado por:** Engenharia | **Data:** 04/08/2026

---

## Problema

Vendedores com regiões (estados) específicos de atuação estão tendo acesso a clientes e leads de estados onde não operam, causando vazamento de dados entre vendedores — especialmente sobre regiões onde um vendedor específico não tem bom rendimento.

Atualmente, `canViewAllProposals` / `canViewOwnProposals` já individualizam as **propostas** por vendedor, mas **clientes e leads** não possuem nenhuma restrição regional.

## Diagnóstico

### Modelo atual

| Entidade | Campo de estado | Tipo | Observação |
|---|---|---|---|
| `clients` | `state` | TEXT (free-text) | Sem enum/constraint |
| `leads` | `state` | TEXT (free-text) | Sem enum/constraint |
| `custom_roles` | `permissions` | JSONB | `["canViewClients","canViewLeads",...]` |
| `user_profiles` | `custom_role_id` | UUID FK → custom_roles | Link RBAC |

### Pontos-chave

1. **Não existe nenhum controle regional no CRM hoje.** Quem tem `canViewClients` vê **todos** os clientes; quem tem `canViewLeads` vê **todos** os leads.
2. As permissões são um array plano de strings (`permissions JSONB`), sem estrutura hierárquica ou parametrizada.
3. O filtro de propostas por vendedor (`canViewAllProposals` vs `canViewOwnProposals`) é o padrão que queremos espelhar, mas por estado em vez de por vendedor.
4. Estados são armazenados como texto livre (ex: `"SP"`, `"São Paulo"`, `"sp"`). Precisaremos normalizar a comparação.

---

## Solução Proposta

### Estratégia

Adicionar uma coluna `allowed_states` (JSONB) na tabela `custom_roles`, contendo um array de siglas de UF que o cargo pode acessar. Combinado com uma nova permissão `canViewAllStates` (override para admin/gestores), o sistema filtrará clientes e leads no frontend.

**Regras de negócio:**

| Cenário | Comportamento |
|---|---|
| `canViewAllStates` = true | Vê clientes/leads de **todos** os estados (bypass) |
| `allowed_states = null` ou `[]` | Vê clientes/leads de **todos** os estados (sem restrição — retrocompatível) |
| `allowed_states = ["SP","RJ","MG"]` | Vê **apenas** clientes/leads cujo `state` está na lista |
| Sem `canViewClients` / `canViewLeads` | Não vê nada (comportamento atual mantido) |

### Por que frontend e não RLS?

O padrão atual do projeto é filtragem no frontend (ex: `canViewAllProposals` filtra na UI e componente). Para uma primeira iteração, manteremos esse padrão por:
- Consistência com o restante do código
- Menor complexidade de deploy (sem alterar políticas RLS que já são complexas)
- Facilidade de teste

**Endurecimento futuro:** Adicionar políticas RLS nas tabelas `clients` e `leads` que validem `state IN (SELECT allowed_states FROM custom_roles WHERE id = current_user_custom_role())` quando a coluna `allowed_states` não for nula/vazia.

---

## Estados do Brasil (UF)

Lista padrão de 27 UFs para o seletor:

```
AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO
```

---

## Plano de Execução

### Fase 1 — Migration SQL (1 arquivo)

**Arquivo:** `supabase/migrations/20260804120000_allowed_states.sql`

```sql
-- Adicionar coluna allowed_states em custom_roles
ALTER TABLE custom_roles
  ADD COLUMN IF NOT EXISTS allowed_states JSONB DEFAULT NULL;

-- Atualizar cargos de sistema: admin vê todos (allowed_states = null = sem restrição)
-- Operador e Solicitante: já ficam com NULL (sem restrição por padrão)

-- Adicionar permissão canViewAllStates ao Administrador
UPDATE custom_roles
SET permissions = permissions || '["canViewAllStates"]'::jsonb,
    updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000001'
  AND NOT permissions ? 'canViewAllStates';
```

### Fase 2 — Tipos e Constantes (2 arquivos)

| # | Ação | Arquivo |
|---|------|---------|
| 2.1 | Adicionar `allowedStates: string[]` ao `CustomRole` | `src/types/index.ts` |
| 2.2 | Adicionar `allowedStates: string[]` ao `UserProfile` | `src/types/index.ts` |
| 2.3 | Adicionar `canViewAllStates` ao `ALL_PERMISSION_KEYS` (grupo: CRM) | `src/utils/permissions.ts` |
| 2.4 | Criar constante `BRAZILIAN_STATES` com as 27 UFs | `src/utils/permissions.ts` |
| 2.5 | Criar helper `filterByAllowedStates<T>(items, stateField, allowedStates, canViewAll)` | `src/utils/permissions.ts` |

### Fase 3 — Carregar `allowed_states` no perfil (1 arquivo)

| # | Ação | Arquivo |
|---|------|---------|
| 3.1 | No `loadUserProfile`, incluir `allowed_states` do JOIN com `custom_roles` | `src/hooks/useAuth.ts` |
| 3.2 | Fallback: se `allowed_states` for null/undefined, default para `[]` (sem restrição) | `src/hooks/useAuth.ts` |

### Fase 4 — Aplicar filtro no CRM (1 arquivo)

| # | Ação | Arquivo |
|---|------|---------|
| 4.1 | Em `fetchClients`, após mapear os dados, aplicar `filterByAllowedStates` | `src/modules/crm/hooks/useCRM.ts` |
| 4.2 | Em `fetchLeads`, após mapear os dados, aplicar `filterByAllowedStates` | `src/modules/crm/hooks/useCRM.ts` |

**Lógica do filtro:**

```typescript
function filterByAllowedStates<T>(
  items: T[],
  getState: (item: T) => string,
  allowedStates: string[],
  canViewAllStates: boolean,
): T[] {
  if (canViewAllStates) return items;                    // bypass total
  if (!allowedStates || allowedStates.length === 0) return items; // sem restrição
  return items.filter(item => {
    const itemState = getState(item)?.trim().toUpperCase();
    return allowedStates.map(s => s.toUpperCase()).includes(itemState);
  });
}
```

### Fase 5 — UI de configuração no gerenciamento de cargos (1 arquivo)

| # | Ação | Arquivo |
|---|------|---------|
| 5.1 | Adicionar `allowedStates: string[]` ao `roleFormData` | `src/components/UserManagement.tsx` |
| 5.2 | No formulário de criação/edição de cargo, adicionar seletor de estados (multi-select com chips/checkboxes) | `src/components/UserManagement.tsx` |
| 5.3 | Ao salvar (`handleSaveRole`), incluir `allowed_states` no payload (`insert`/`update`) | `src/components/UserManagement.tsx` |
| 5.4 | Exibir estados permitidos nos cards de visualização de cargos | `src/components/UserManagement.tsx` |
| 5.5 | Ao abrir edição (`handleEditRole`), carregar `allowedStates` do cargo | `src/components/UserManagement.tsx` |

**UI do seletor de estados:**
- Grid de chips (similar ao seletor de permissões)
- Cada UF é um chip clicável (toggle on/off)
- Botão "Todos" / "Nenhum" para seleção rápida
- Agrupado por região (Norte, Nordeste, Centro-Oeste, Sudeste, Sul) — opcional, se houver espaço
- Label: "Estados Permitidos (CRM)" com tooltip: "Restringe visualização de clientes e leads. Vazio = todos os estados."
- A permissão `canViewAllStates` aparece no grupo CRM como override

### Fase 6 — Sincronizar permissões legadas (1 arquivo)

| # | Ação | Arquivo |
|---|------|---------|
| 6.1 | Adicionar `canViewAllStates` ao array do admin no fallback legado | `src/utils/permissions.ts` |

### Fase 7 — Atualizar migration de sync (1 arquivo)

| # | Ação | Arquivo |
|---|------|---------|
| 7.1 | Atualizar `20260712120800_sync_system_roles_permissions.sql` com `canViewAllStates` (ou criar nova migration) | `supabase/migrations/` |

---

## Resumo de Arquivos Atingidos

| Arquivo | Tipo de alteração |
|---|---|
| `supabase/migrations/20260804120000_allowed_states.sql` | **Novo** — migration |
| `src/types/index.ts` | Editar — `CustomRole` + `UserProfile` |
| `src/utils/permissions.ts` | Editar — constantes + helpers |
| `src/hooks/useAuth.ts` | Editar — carregar `allowed_states` |
| `src/modules/crm/hooks/useCRM.ts` | Editar — aplicar filtro |
| `src/components/UserManagement.tsx` | Editar — UI seletor de estados |

**Total: 6 arquivos (1 novo + 5 editados)**

---

## Estimativa de Esforço

| Fase | Complexidade | Arquivos | Tempo |
|------|-------------|----------|-------|
| Migration SQL | Baixa | 1 SQL | 5min |
| Tipos e constantes | Baixa | 2 TS | 10min |
| Carregar no perfil | Baixa | 1 TS | 10min |
| Filtro no CRM | Baixa | 1 TS | 10min |
| UI seletor estados | Média | 1 TSX | 30min |
| Sync permissões | Baixa | 2 TS/SQL | 5min |
| **Total** | | **~6 arquivos** | **~1h10min** |

---

## Pontos de Atenção

1. **Case sensitivity:** Estados no banco estão em texto livre (pode ter `"SP"`, `"sp"`, `"São Paulo"`). O filtro fará `toUpperCase().trim()` em ambos os lados para comparação. Idealmente, uma normalização futura dos dados padronizaria todos para UF maiúscula.

2. **Retrocompatibilidade:** `allowed_states = NULL` ou `[]` = sem restrição. Cargos existentes continuam funcionando sem alteração.

3. **Admin sempre vê tudo:** O Administrador tem `canViewAllStates` e `allowed_states = NULL`, garantindo acesso total.

4. **Combinação com permissões existentes:** Se o usuário não tem `canViewClients`, o filtro de estados é irrelevante — ele já não vê nada. O filtro de estado é uma **restrição adicional** sobre permissões já concedidas.

5. **Performance:** A filtragem é no frontend, em memória, sobre arrays já carregados. Sem impacto perceptível para volumes normais de CRM (centenas/milhares de registros).

6. **Propostas não são afetadas:** Propostas continuam com seu modelo próprio de visibilidade (`canViewAllProposals` / `canViewOwnProposals`). O cliente pediu explicitamente para não alterar a lógica de propostas.

7. **Normalização futura dos dados:** Recomenda-se criar uma constraint ou trigger para garantir que o campo `state` em `clients` e `leads` seja sempre uma UF válida em maiúsculo. Isso garante consistência com o filtro.
