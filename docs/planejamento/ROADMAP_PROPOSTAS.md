# Roadmap — Módulo de Propostas (EGEN)

## Diagnóstico Rápido

| Item | Estado Atual | Problema |
|---|---|---|
| **Dados do vendedor** | Hardcoded no preview: nome, email, telefone do `userProfile`. QR Code e avatar do novo módulo RBAC não chegam ao documento. | Proposta não reflete os campos atualizados do perfil (telefone, avatar, QR Code WhatsApp) |
| **Valor total** | Campos `total_geral` e `total_com_desconto` são calculados e exibidos no formulário e no documento. | Cliente quer remover do formulário e do documento impresso |
| **Visão por vendedor** | `ProposalManagementPage` lista todas as propostas sem segmentação. Filtro atual é básico (status, busca textual). | Não é possível filtrar por vendedor responsável |
| **Vendedor responsável** | Campo `created_by` (uuid do criador) existe mas não é usado como "vendedor" — não há select de vendedor no formulário de criação | Propostas não têm vendedor atribuído explicitamente |
| **Status `draft`** | `DocumentStatus` inclui `'draft'` como estado inicial. É usado como default ao criar proposta. | Cliente quer remover — propostas nascem em `negotiating` |
| **Lead → Cliente** | Conversão é manual: botão "Converter em Cliente" no modal de lead. `convertToContract()` não aciona conversão automática. | Deveria ser automático ao finalizar contrato se o documento tem `leadId` |

---

## Task 1 — Atualizar dados do vendedor na proposta

**Status atual:** Os dados do vendedor no preview/PDF são montados em `QuotationPreview.tsx` a partir do `userProfile` logado, mas não incluem avatar, QR Code e telefone/CPF estão incompletos. O `ProposalPrintDocument.tsx` renderiza esses dados no cabeçalho da proposta.

**Dependência:** Task 4 (vendedor responsável) — o vendedor exibido deve ser o `vendedor_id` da proposta, não o usuário logado.

**O que fazer:**

### 1.1 — Backend (banco)
- Adicionar coluna `vendedor_id UUID` em `sales_quotations` (FK → `user_profiles`)
- Criar migration

### 1.2 — Frontend — Tipos
- `SalesQuotation` (`types/proposal.ts`): adicionar `vendedorId?: string`
- `ProposalPrintDocument.tsx`: interface de seller deve incluir `avatar_url`, `qrcode_url`, `telefone` (em vez de `phone`), `email`
- Atualizar props/tipos do documento de impressão

### 1.3 — Frontend — Resolução do vendedor
- `QuotationPreview.tsx` (ou hook `useQuotation`): ao montar o objeto `seller`, buscar o perfil do `vendedor_id` no Supabase se disponível. Fallback: `created_by` ou `userProfile` logado
- Query: `user_profiles(id, name, email, phone, avatar_url, qrcode_url)` pelo `vendedor_id`

### 1.4 — Frontend — Renderização no documento
- `ProposalPrintDocument.tsx`:
  - Adicionar avatar do vendedor no cabeçalho (se `seller.avatar_url`)
  - Adicionar QR Code do vendedor no rodapé ou lateral (se `seller.qrcode_url`)
  - Telefone usar `seller.telefone` em vez de hardcoded
  - Layout: foto + nome + email + telefone + QR Code no canto

**Arquivos envolvidos:**
```
supabase/migrations/YYYYMMDDHHMMSS_add_vendedor_to_sales_quotations.sql
src/modules/quotations/types/proposal.ts
src/modules/quotations/stores/quotationStore.ts
src/modules/quotations/components/proposal/QuotationPreview.tsx
src/modules/quotations/components/proposal/ProposalPrintDocument.tsx
src/modules/quotations/components/proposal/SalesQuotationPage.tsx
```

**Tempo estimado:** 3-4 horas

---

## Task 2 — Remover campo de valor total da proposta

**Status atual:** O `QuotationForm.tsx` exibe totais (`totalPeriodicos`, `totalSpot`, `totalGeral`, `descontoPercent`, `totalComDesconto`) no accordion "Condições Comerciais". O `ProposalPrintDocument.tsx` renderiza tabela de valores com subtotais e total geral.

**O que fazer:**

### 2.1 — Frontend — Formulário
- `QuotationForm.tsx`: remover seção de totais do accordion "Condições Comerciais"
- Remover inputs/display de: `total_geral`, `desconto_percent`, `desconto_valor`, `total_com_desconto`
- Manter apenas totais individuais por item (linha) se necessário

### 2.2 — Frontend — Documento impresso
- `ProposalPrintDocument.tsx`: remover linha de "Valor Total" e "Total com Desconto" da tabela de resumo
- Remover seção de descontos
- Se os itens têm `valorTotal` individual, manter apenas a listagem sem sumarização

### 2.3 — Backend (banco) — opcional
- Colunas `total_geral`, `total_com_desconto`, `desconto_percent`, `desconto_valor` podem permanecer no banco (não quebram nada) ou serem dropadas
- **Recomendação:** manter colunas, apenas parar de preenchê-las no frontend. Se o cliente quiser limpar depois, fazemos em outra migration.

### 2.4 — Tipos
- `SalesQuotation` e `QuotationFormValues`: remover campos de totais ou marcá-los como deprecated (não preencher)

**Arquivos envolvidos:**
```
src/modules/quotations/types/proposal.ts
src/modules/quotations/components/proposal/QuotationForm.tsx
src/modules/quotations/components/proposal/ProposalPrintDocument.tsx
src/modules/quotations/components/proposal/QuotationPreview.tsx
src/modules/quotations/stores/quotationStore.ts
```

**Tempo estimado:** 2-3 horas

---

## Task 3 — Visão de propostas por vendedor + filtros

**Dependência:** Task 4 (vendedor responsável)

**Status atual:** `ProposalManagementPage.tsx` lista propostas com filtro por status e busca textual. Não há segmentação por vendedor.

**O que fazer:**

### 3.1 — Frontend — Filtros no ProposalManagementPage
- Adicionar dropdown "Vendedor" que lista `user_profiles` com `canManageQuotations` (ou todos os vendedores cadastrados)
- Filtrar `sales_quotations` por `vendedor_id`
- Manter filtros existentes: status, busca textual, período
- Layout: barra de filtros horizontal com search + dropdowns + badge de contagem (similar ao novo design do UserManagement)

### 3.2 — Frontend — Visão segmentada
- Opção de agrupamento: "Todos", "Por vendedor", "Por status"
- Cards de métricas por vendedor: quantas propostas, quantas fechadas, valor (se disponível)
- Lista padrão agrupada com headers de seção (ex: "João Silva — 5 propostas")

### 3.3 — Backend — Query otimizada
- `listQuotations()` no `quotationService.ts`: adicionar parâmetro `vendedorId` ao filtro
- Se `userProfile` logado não tem `canManageUsers`, filtrar automaticamente apenas propostas do próprio vendedor

**Arquivos envolvidos:**
```
src/modules/quotations/components/proposal/ProposalManagementPage.tsx
src/modules/quotations/services/quotationService.ts
src/modules/quotations/hooks/useQuotation.ts
```

**Tempo estimado:** 3-4 horas

---

## Task 4 — Adicionar vendedor responsável pela proposta

**Status atual:** `created_by` (uuid) é preenchido automaticamente ao criar, mas não há um campo explícito "Vendedor" selecionável. O preview usa o `userProfile` logado como seller.

**O que fazer:**

### 4.1 — Backend (banco)
- Migration: `ALTER TABLE sales_quotations ADD COLUMN vendedor_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL`
- Índice: `CREATE INDEX idx_sales_quotations_vendedor ON sales_quotations(vendedor_id)`
- Backfill: `UPDATE sales_quotations SET vendedor_id = created_by WHERE vendedor_id IS NULL`

### 4.2 — Frontend — Select de vendedor
- `SalesQuotationPage.tsx` ou `QuotationForm.tsx`: adicionar dropdown "Vendedor Responsável" no topo do formulário
- Popular dropdown com usuários que têm permissão `canManageQuotations` (via `user_profiles` join `custom_roles`)
- Default: usuário logado se ele tem `canManageQuotations`
- Exibir avatar + nome no select (similar ao select de cargo do UserManagement)

### 4.3 — Frontend — Persistência
- `quotationStore.ts`: adicionar campo `vendedorId` ao state e às actions
- `quotationService.ts` (create/update): incluir `vendedor_id` no payload
- `listQuotations()`: join com `user_profiles` para retornar `vendedorNome`, `vendedorEmail`, `vendedorAvatar`, `vendedorQrcode`

### 4.4 — Frontend — Exibição no documento
- `ProposalPrintDocument.tsx`: usar dados do vendedor (nome, telefone, avatar, QR Code) vindos da proposta, não do usuário logado
- Fallback: se `vendedor_id` for null, usar `created_by`

**Arquivos envolvidos:**
```
supabase/migrations/YYYYMMDDHHMMSS_add_vendedor.sql
src/modules/quotations/types/proposal.ts
src/modules/quotations/stores/quotationStore.ts
src/modules/quotations/services/quotationService.ts
src/modules/quotations/components/proposal/SalesQuotationPage.tsx
src/modules/quotations/components/proposal/QuotationForm.tsx
src/modules/quotations/components/proposal/ProposalPrintDocument.tsx
src/modules/quotations/components/proposal/QuotationPreview.tsx
```

**Tempo estimado:** 4-5 horas

---

## Task 5 — Transição automática de draft → negotiating ao salvar

**Status atual:** `DocumentStatus` inclui `'draft'` como estado inicial. O formulário de nova proposta inicializa `status = 'draft'`. O `ProposalManagementPage` usa `draft` como opção de filtro. O status `draft` nunca é alterado automaticamente.

**Objetivo:** Manter `draft` como estado de criação (proposta recém-criada, nunca salva manualmente pelo usuário). Quando o usuário clica em "Salvar" pela primeira vez, o status transita automaticamente para `negotiating`. O filtro de `draft` é removido do `ProposalManagementPage` (rascunhos não aparecem na listagem principal), mas permanece no tipo para controle interno.

**O que fazer:**

### 5.1 — Tipos (manter draft)
- `types/proposal.ts`: **manter** `'draft'` no tipo `DocumentStatus`
- `'draft'` continua sendo o default ao criar nova proposta (não muda)

### 5.2 — Lógica de transição no salvamento
- `quotationService.ts` — função `saveQuotation()` ou `upsertQuotation()`:
  - Se `status === 'draft'` no momento do save → transicionar para `'negotiating'`
  - Se já não é `draft` → manter o status atual
- `quotationStore.ts` — na action de save, aplicar a mesma lógica antes de persistir

### 5.3 — Listagem e filtros
- `ProposalManagementPage.tsx`:
  - **Remover** `'draft'` das opções de filtro de status (rascunhos não aparecem na lista principal)
  - Query de listagem: adicionar filtro `status != 'draft'` por padrão
  - Opcional: adicionar toggle "Mostrar rascunhos" para admin ver propostas não-finalizadas

### 5.4 — Preview / editor
- `QuotationPreview.tsx`: status badge — se `draft`, renderizar "Rascunho" com estilo atenuado (cinza)
- `ProposalManagementPage.tsx`: cards de propostas `draft` com indicador visual diferenciado (borda tracejada, opacidade reduzida)

### 5.5 — Banco (migration)
- **Não necessário.** Coluna `status` já aceita `'draft'`. Nenhum dado precisa ser migrado.
- Opcional: migration futura para limpar rascunhos muito antigos (>30 dias sem edição)

**Resumo do fluxo:**
```
Nova proposta → status: 'draft' (invisível na listagem principal)
     │
     └── Usuário clica "Salvar" → status: 'negotiating' (aparece na listagem)
```

**Arquivos envolvidos:**
```
src/modules/quotations/types/proposal.ts               (manter draft)
src/modules/quotations/services/quotationService.ts     (transição draft→negotiating)
src/modules/quotations/stores/quotationStore.ts         (transição no save)
src/modules/quotations/components/proposal/ProposalManagementPage.tsx  (filtro, ocultar drafts)
src/modules/quotations/components/proposal/QuotationPreview.tsx         (badge rascunho)
```

**Tempo estimado:** 1.5-2 horas

---

## Task 6 — Transformar lead em cliente ao finalizar contrato

**Status atual:** `convertToContract()` em `quotationService.ts` apenas cria o registro de contrato e marca a proposta como `closed`. Não verifica nem converte lead. A conversão lead→cliente é um fluxo separado no módulo CRM (`LeadConvertModal` → `convertLeadToClient()`).

**O que fazer:**

### 6.1 — Lógica de conversão automática
- Em `convertToContract()`, após criar o contrato:
  1. Verificar se `quotation.leadId` existe e `quotation.clientId` é null
  2. Se sim, chamar `convertLeadToClient()` automaticamente:
     - Criar cliente a partir dos dados do lead (nome, documento, contatos)
     - Atualizar `lead.status = 'client_with_demand'`
     - Atualizar `lead.converted_client_id = newClient.id`
     - Atualizar `lead.converted_at = now()`
  3. Atualizar o contrato recém-criado com o `client_id` do novo cliente
  4. Atualizar a proposta original com o `client_id` também

### 6.2 — Adaptação do `convertLeadToClient()`
- A função atual em `useCRM.ts` depende do hook do React (não pode ser chamada de um service puro)
- Criar versão standalone em `quotationService.ts` ou importar a lógica para um helper reutilizável
- Opção A: extrair lógica pura para `services/leadService.ts` que tanto o hook CRM quanto o `convertToContract` possam chamar
- Opção B: `convertToContract` recebe um callback `onLeadConverted` que o componente chamador implementa

**Recomendação: Opção A** — extrair `convertLeadToClient` como função pura assíncrona que recebe `leadId` e `supabase client`, retorna `clientId`.

### 6.3 — Frontend — Feedback
- Após `convertToContract()`:
  - Se lead foi convertido: toast "Lead convertido em cliente e contrato criado"
  - Se já tinha cliente: toast "Contrato criado com sucesso"
- Redirecionar para o contrato recém-criado

**Arquivos envolvidos:**
```
src/modules/quotations/services/quotationService.ts
src/modules/crm/hooks/useCRM.ts (extrair convertLeadToClient)
src/modules/quotations/components/proposal/QuotationPreview.tsx (feedback)
```

**Tempo estimado:** 3-4 horas

---

## Ordem de Execução Recomendada

```
Task 4 (vendedor_id)     ←  pré-requisito para Tasks 1 e 3
   │
   ├── Task 1 (dados do vendedor no preview)
   └── Task 3 (visão por vendedor + filtros)

Task 5 (draft→negotiating) ←  independente

Task 2 (remover valor total) ←  independente

Task 6 (lead→cliente automático) ←  independente
```

| Ordem | Task | Depende de | Horas |
|---|---|---|---|
| 1º | Task 4 — Vendedor responsável | — | 4-5h |
| 2º | Task 1 — Dados do vendedor na proposta | Task 4 | 3-4h |
| 3º | Task 3 — Visão por vendedor + filtros | Task 4 | 3-4h |
| 4º | Task 5 — Transição draft → negotiating ao salvar | — | 1.5-2h |
| 5º | Task 2 — Remover valor total | — | 2-3h |
| 6º | Task 6 — Lead → Cliente automático | — | 3-4h |

**Total estimado:** 16.5-22 horas

---

## Migrations Novas Necessárias

| Arquivo | Task |
|---|---|
| `YYYYMMDDHHMMSS_add_vendedor.sql` | Task 4 — coluna `vendedor_id` em `sales_quotations` |

---

## Referências

| Arquivo | Descrição |
|---|---|
| `src/modules/quotations/types/proposal.ts` | Tipos `SalesQuotation`, `DocumentStatus`, `QuotationFormValues` |
| `src/modules/quotations/stores/quotationStore.ts` | Zustand store da proposta |
| `src/modules/quotations/services/quotationService.ts` | CRUD + `convertToContract()` |
| `src/modules/quotations/components/proposal/ProposalManagementPage.tsx` | Lista de propostas com filtros |
| `src/modules/quotations/components/proposal/QuotationForm.tsx` | Formulário de criação/edição (accordion) |
| `src/modules/quotations/components/proposal/SalesQuotationPage.tsx` | Split-view editor (form + preview) |
| `src/modules/quotations/components/proposal/QuotationPreview.tsx` | Preview + botão converter em contrato |
| `src/modules/quotations/components/proposal/ProposalPrintDocument.tsx` | Documento A4 para impressão |
| `src/modules/crm/hooks/useCRM.ts` | `convertLeadToClient()`, `generateProposalFromLead()` |
| `src/modules/crm/components/LeadConvertModal.tsx` | Modal de conversão lead→cliente |
| `docs/DB.MD` | Schema do banco |
