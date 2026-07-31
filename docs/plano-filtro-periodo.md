# Plano de Implementação — Filtro por Período (Leads e Propostas)

> **Projeto:** egen_geradores | **Stack:** React 18 + TypeScript + Tailwind 3 + Supabase + Zustand  
> **Elaborado por:** Engenharia Front-end Sênior | **Data:** 22/07/2026

---

## Diagnóstico

### Leads — situação atual

- **Não existe filtro por data/período** na tela de leads. Filtros atuais: busca textual, status, cidade, estado, classificação e origem (`LeadList.tsx:82-87`).
- A tabela `contact_logs` registra cada interação (telefonema, reunião) com `contacted_at` (data/hora informada pelo usuário) + `entity_id` (FK para o lead). Essa é a **fonte mais precisa** para "última interação".
- A tabela `crm_history` registra movimentações como texto livre (`"Status do lead X alterado para Y"`), sem colunas estruturadas de `old_status`/`new_status`. **Não é viável filtrar por status específico** sem refatorar esse modelo.
- `ContactLogSection` já está embutida no `LeadDetailModal.tsx` — os dados de interação já são coletados.

### Propostas — situação atual

- Já existem filtros `fromDate`/`toDate`, mas **filtram apenas por `data_emissao`** (data de criação da proposta).
- **Não há rastreamento de quando uma proposta mudou de status.** A tabela `sales_quotation_audit_log` existe no banco com colunas `old_status`, `new_status`, `performed_at` mas **nenhum código do frontend ou backend a alimenta**.
- O campo `updated_at` é sobrescrito a cada alteração (não apenas mudanças de status), portanto não serve como referência confiável.
- `DocumentStatus` atual: `draft`, `negotiating`, `price_survey`, `lost`, `cancelled`, `closed`. **Não existe "Contrato Finalizado"**.

---

## Soluções Propostas

### 1. Filtro por período — Leads

**Estratégia:** Usar a tabela `contact_logs` como fonte de "última interação", que já existe e é alimentada.

Como funciona:
- Cada lead pode ter múltiplos registros em `contact_logs` (um por telefonema/contato).
- A "última interação" de um lead = `MAX(contacted_at)` dentre seus contact_logs.
- O filtro de período seleciona leads cuja última interação cai dentro do range.

**Camada de dados (SQL/Supabase):**
```sql
-- Leads com última interação no período
SELECT l.*
FROM leads l
INNER JOIN (
  SELECT entity_id, MAX(contacted_at) AS last_contact
  FROM contact_logs
  WHERE entity_type = 'lead' AND contacted_at >= $from AND contacted_at <= $to
  GROUP BY entity_id
) c ON l.id = c.entity_id
```

**Alternativa para leads SEM interações registradas:** incluir também leads criados no período (via `leads.created_at` como fallback).

**UI:**
- Adicionar 2 campos de data (`fromDate`/`toDate`) na seção de filtros avançados do `LeadList.tsx`
- Label: "Período (última interação)"
- Aplicar via hook `useCRM` ou query direta no Supabase

**Arquivos a alterar:** `LeadList.tsx`, `useCRM.ts` (ou query inline)

**Risco:** Baixo. `contact_logs` já existe e é populado. Leads sem interações usam `created_at` como fallback.

**Impacto na infra:** Praticamente nulo — `contact_logs` já é consultado em `ContactLogSection`, apenas adicionamos um `GROUP BY` + `MAX` em uma query já existente.

---

### 2. Filtro por período — Propostas

**Estratégia:** Criar um rastreamento leve de mudanças de status usando `sales_quotation_audit_log` (tabela já existe, só não está sendo alimentada) **OU** usar uma abordagem mais simples com uma coluna `status_at` no próprio `sales_quotations`.

**Opção A (recomendada) — Coluna `status_updated_at` na tabela `sales_quotations`:**

```
ALTER TABLE sales_quotations ADD COLUMN status_updated_at TIMESTAMPTZ DEFAULT NOW();
```

- Toda vez que `updateQuotationStatus()` for chamada, gravar `status_updated_at = NOW()` junto com o novo status.
- É **1 coluna adicional** (não uma tabela inteira de auditoria), custo de infra mínimo.
- Para filtrar: `WHERE status = $status AND status_updated_at BETWEEN $from AND $to`.

**Lógica de filtro por status:**
| Status solicitado | Significado do filtro |
|---|---|
| Em negociação | Data em que entrou em `negotiating` |
| Tomada de preço | Data em que entrou em `price_survey` |
| Fechada | Data em que entrou em `closed` |
| Perdida | Data em que entrou em `lost` |
| Cancelada | Data em que entrou em `cancelled` |
| Rascunho | Data de criação (`created_at`) |

**Camada de dados:**

O `listQuotations()` já aceita `fromDate`/`toDate`. Ajustar a lógica para:
- Se `statusFilter` não for `'all'` → filtrar por `status_updated_at`
- Se `statusFilter` for `'all'` → filtrar por `created_at` (comportamento atual) ou `status_updated_at` dependendo da escolha do usuário

**UI:**
- Os campos `fromDate`/`toDate` já existem no `ProposalManagementPage.tsx`
- Adicionar um label/tooltip explicando que o filtro considera a data de entrada no status selecionado
- Quando nenhum status está selecionado, o filtro usa `data_emissao` (comportamento atual)

**Arquivos a alterar:**
- Migration SQL: `ALTER TABLE sales_quotations ADD COLUMN status_updated_at`
- `quotationService.ts`: `updateQuotationStatus()` → incluir `status_updated_at`, `listQuotations()` → lógica condicional de filtro
- `ProposalManagementPage.tsx`: tooltip/label no filtro de data

**Risco:** Baixo. Uma única coluna nova, sem tabela auxiliar. Backfill simples: `UPDATE sales_quotations SET status_updated_at = updated_at WHERE status_updated_at IS NULL`.

---

### 3. Novo status "Contrato Finalizado"

**Estratégia:** Adicionar `'contract_finished'` ao `DocumentStatus`.

```
ALTER TABLE sales_quotations DROP CONSTRAINT sales_quotations_status_check;
ALTER TABLE sales_quotations ADD CONSTRAINT sales_quotations_status_check 
  CHECK (status IN ('draft','negotiating','price_survey','lost','cancelled','closed','contract_finished'));
```

**TypeScript:**
```ts
export type DocumentStatus =
  | 'draft'
  | 'negotiating'
  | 'price_survey'
  | 'lost'
  | 'cancelled'
  | 'closed'
  | 'contract_finished';  // Novo

export const DocumentStatusLabels: Record<DocumentStatus, string> = {
  // ... existentes
  contract_finished: 'Contrato Finalizado',
};

export const DocumentStatusColors: Record<DocumentStatus, string> = {
  // ... existentes
  contract_finished: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200',
};
```

**Arquivos a alterar:**
- `src/modules/quotations/types/proposal.ts` — tipo, labels, cores
- `ProposalManagementPage.tsx` — `STATUS_ORDER`, metric cards
- `Dashboard.tsx` — `formatStatusLabel()`
- Migration SQL

**Risco:** Nulo. Adição de valor em enum sem quebra de existentes.

---

## Plano de Execução

### Fase 1 — Migration SQL (2 alterações, 1 arquivo)

```sql
-- 1. Coluna status_updated_at em sales_quotations
ALTER TABLE sales_quotations ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ DEFAULT NOW();
UPDATE sales_quotations SET status_updated_at = updated_at WHERE status_updated_at IS NULL;

-- 2. Novo status contract_finished
ALTER TABLE sales_quotations DROP CONSTRAINT IF EXISTS sales_quotations_status_check;
ALTER TABLE sales_quotations ADD CONSTRAINT sales_quotations_status_check 
  CHECK (status IN ('draft','negotiating','price_survey','lost','cancelled','closed','contract_finished'));
```

### Fase 2 — Backend (TypeScript types + services)

| # | Ação | Arquivo |
|---|------|---------|
| 2.1 | Adicionar `contract_finished` ao `DocumentStatus`, labels e cores | `types/proposal.ts` |
| 2.2 | Adicionar `contract_finished` ao `STATUS_ORDER` e métricas | `ProposalManagementPage.tsx` |
| 2.3 | `updateQuotationStatus()` → incluir `status_updated_at: NOW()` | `quotationService.ts` |
| 2.4 | `listQuotations()` → quando `statusFilter !== 'all'`, usar `status_updated_at` em vez de `data_emissao` no filtro `fromDate`/`toDate` | `quotationService.ts` |
| 2.5 | Adicionar `contract_finished` ao `formatStatusLabel` | `Dashboard.tsx` |

### Fase 3 — Frontend (UI)

| # | Ação | Arquivo |
|---|------|---------|
| 3.1 | Adicionar `fromDate`/`toDate` ao `LeadList`, label "Período (última interação)" | `LeadList.tsx` |
| 3.2 | Query de leads: `INNER JOIN contact_logs` com `MAX(contacted_at)`, fallback para `leads.created_at` | `useCRM.ts` ou inline |
| 3.3 | Adicionar tooltip no filtro de data do `ProposalManagementPage`: "Filtra pela data de entrada no status selecionado" | `ProposalManagementPage.tsx` |
| 3.4 | Testar filtro de leads: selecionar período → verificar se leads com última interação no range aparecem | Manual |
| 3.5 | Testar filtro de propostas: selecionar status + período → verificar se filtra por `status_updated_at` | Manual |

---

## Fluxo Completo do Filtro por Status em Propostas

```
Usuário seleciona: Status = "Fechada" + Período = "01/07 a 31/07"

SQL gerado:
SELECT * FROM sales_quotations
WHERE status = 'closed'
  AND status_updated_at >= '2026-07-01'
  AND status_updated_at <= '2026-07-31'
```

```
Usuário seleciona: Status = "Todos" + Período = "01/07 a 31/07"

SQL gerado (comportamento atual mantido):
SELECT * FROM sales_quotations
WHERE data_emissao >= '2026-07-01'
  AND data_emissao <= '2026-07-31'
```

---

## Pontos de Atenção

1. **Leads sem contact_logs:** usar `leads.created_at` como fallback. Leads com `contact_logs` MAS com última interação fora do período não aparecem — isso é o comportamento esperado.

2. **`status_updated_at` inicial:** ao criar uma proposta, `status_updated_at` deve ser `NOW()` (mesmo valor de `created_at`). Isso cobre o caso da transição `draft → negotiating` que acontece no mesmo INSERT.

3. **Contrato Finalizado vs Fechada:** `closed` = proposta virou contrato vendido. `contract_finished` = contrato já foi executado e encerrado. São estágios diferentes do ciclo de vida.

4. **Performance:** o `GROUP BY` no `contact_logs` com `MAX` é uma operação leve. Para milhares de registros, um índice em `contact_logs(entity_type, entity_id, contacted_at)` garante performance. Já existe `idx_contact_logs_entity` na migration original.

5. **Alternativa descartada:** alimentar `sales_quotation_audit_log` com trigger de banco foi descartada por complexidade. Uma coluna `status_updated_at` é mais simples e atende ao requisito.

---

## Estimativa de Esforço

| Fase | Complexidade | Arquivos | Tempo |
|------|-------------|----------|-------|
| Migration | Baixa | 1 SQL | 5min |
| Backend types + services | Média | 3 TS | 20min |
| Frontend filtros | Média | 2 TSX | 25min |
| Testes manuais | — | — | 10min |
| **Total** | | **~6 arquivos** | **~1h** |
