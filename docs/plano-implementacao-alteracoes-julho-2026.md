# Plano de Implementação — Alterações Solicitadas (Julho/2026)

> **Documento para aprovação do Product Owner**
>
> Projeto: EGEN Geradores — Sistema de Gestão de Propostas e CRM  
> Versão: 1.0 — 20/07/2026  
> Engenheiro de Requisitos: IA Senior

---

## Índice

1. [Resumo das Solicitações](#1-resumo-das-solicitações)
2. [Análise Detalhada por Solicitação](#2-análise-detalhada-por-solicitação)
3. [Roadmap de Implementação](#3-roadmap-de-implementação)
4. [Plano de Tarefas](#4-plano-de-tarefas)
5. [Alterações no Banco de Dados](#5-alterações-no-banco-de-dados)
6. [Estimativa de Esforço](#6-estimativa-de-esforço)
7. [Riscos e Dependências](#7-riscos-e-dependências)

---

## 1. Resumo das Solicitações

| # | Solicitação | Complexidade | Prioridade |
|---|---|---|---|
| 1 | Reordenar: Itens → Condições → Observações → Disposições | Baixa | Média |
| 2 | Condições em colunas sequenciais verticais (ordem cardeal) | Baixa | Média |
| **3** | **Ordenação por colunas em todas as tabelas + filtros premium na gestão de propostas** | **Alta** | **Alta** |
| 4 | Justificar texto da proposta (text-align: justify) | Baixa | Baixa |
| 5 | Permissões para excluir usuários e propostas | Média | Alta |
| 6 | Prazos pagamento: 7/15/21/30/Anual+/custom + período locação visível | Média | Alta |
| 7 | DDD + contato lead aparecendo corretamente na proposta | Média | Alta |
| 8 | Filtros: data emissão + ações em lote na listagem | Baixa | Média |
| 9 | Dashboard com acompanhamento por colaborador (vendedor) | Alta | Média |
| 10 | Período de locação editável manualmente (combo box custom) | Média | Alta |
| 11 | Campo contato Lead + DDD vinculado na proposta | Média | Alta |

---

## 2. Análise Detalhada por Solicitação

### 2.1 Reordenar seções da proposta

**Situação atual:**  
No `ProposalPrintDocument.tsx`, as Observações Gerais são renderizadas ANTES das Condições Comerciais (itens ordinais 1.1, 1.2...). Ordem atual: Itens (tabelas) → **Observações** → Condições → Disposições.

**Solicitado:**  
Ordem correta: Itens (tabelas) → **Condições (1.1, 1.2...)** → Observações Gerais → Disposições Gerais.

**Solução:**
- Mover bloco de `observacoesGerais` para depois do `ConditionColumns` em `ProposalPrintDocument.tsx`.
- Ajustar cálculo de espaço (`commercialAvailableMm`, `inlineParagraphCount`) para incluir observações.
- Atualizar `TEMPLATE_ESCOPO` no `templateEngine.ts` se aplicável.

**Arquivos:** `ProposalPrintDocument.tsx`, `templateEngine.ts`

---

### 2.2 Condições em colunas com ordem sequencial vertical (ordem cardeal)

**Situação atual:**  
`splitConditionRows` distribui itens alternadamente: coluna esquerda (1.1, 1.3, 1.5...) / coluna direita (1.2, 1.4, 1.6...). A leitura salta entre colunas.

**Solicitado:**  
Ordem cardeal topo-abaixo: esquerda (1.1, 1.2, 1.3, ..., 1.11) / direita (1.12, 1.13, ..., 1.22).

**Solução:**
- Reescrever `splitConditionRows`: dividir o array ao meio com `Math.ceil(rows.length / 2)`.

**Arquivos:** `ProposalPrintDocument.tsx`

---

### 2.3 Ordenação por colunas em todas as tabelas + filtros premium na gestão de propostas

**Situação atual:**

| Tabela | Ordenação | Filtros existentes |
|---|---|---|
| **Propostas** (`ProposalManagementPage`) | **NENHUMA** — cabeçalhos não são clicáveis, sem estado de sort | Status (cards), Vendedor (select), Busca textual, limite 100 registros |
| **Clientes** (`ClientList`) | 4 de 7 colunas ordenáveis (cliente, classificação, cidade/UF, status) | Busca, Status, Cidade, Estado, Classificação — client-side, sem paginação |
| **Leads** (`LeadList`) | 6 de 9 colunas ordenáveis (nome, empresa, localização, classificação, origem, status) | Busca, Status, Cidade, Estado, Classificação, Origem — client-side, com paginação 25/pág |

**Problemas identificados:**
- A tabela de **propostas** é a mais importante do sistema e não tem **nenhuma ordenação**.
- Faltam filtros avançados na gestão de propostas (tipo, faixa de valor, período).
- A tabela de clientes não possui paginação nem loading/error states.
- A tabela de leads já é razoável, mas pode receber melhorias incrementais.

**Solicitado:**  
Ordenação clicável em TODAS as colunas das 3 tabelas + filtros premium na gestão de propostas para entregar UX de alto nível.

**Solução:**

#### Parte A — Propostas (`ProposalManagementPage.tsx`) — FOCO PRINCIPAL

**A1. Ordenação por colunas (server-side):**
- Tornar TODOS os cabeçalhos clicáveis com indicador de sort (↑/↓/⇅).
- Colunas ordenáveis: Nº Proposta (`document_id`), Cliente (`conteudo->cliente->nome`), Vendedor (resolver nome do `vendedor_id`), Data Emissão (`data_emissao`), Status (`status`), Valor Total (`total_com_desconto`).
- Adicionar `sortField` e `sortDir` ao estado, passar para `quotationService.list()` como parâmetros de query (`.order(sortField, { ascending: sortDir === 'asc' })`).
- Ordenação server-side para consistência com os filtros já server-side.

**A2. Novos filtros avançados:**
- **Tipo de documento:** dropdown (Proposta Comercial, Orçamento, Contrato de Locação) → `quotationService.list({ tipo })`.
- **Faixa de valor:** inputs min/max de valor (R$) → `gte('total_com_desconto', min)` / `lte('total_com_desconto', max)`.
- **Período data emissão:** inputs date de/até → já suportado no service (`fromDate`/`toDate`), apenas expor na UI (também atende solicitação #8).
- **Painel de filtros expansível** (estilo "Filtros" com badge de ativos, botão "Limpar") — consistente com ClientList/LeadList.

**A3. Paginação:**
- Substituir limite fixo de 100 por paginação real (ex: 25 por página).
- Controles de navegação (anterior, próximo, páginas numeradas com ellipsis) — mesmo padrão do LeadList.

**A4. Melhorias UX adicionais:**
- Indicador de loading na tabela durante fetch (já existe com skeleton).
- Toolbar de ações em massa (seleção múltipla) — já planejado em #8.
- Contador visível: "Mostrando 1-25 de 150 propostas".
- Exportar lista filtrada para Excel (usando lib `xlsx` já presente no projeto).

#### Parte B — Clientes (`ClientList.tsx`)

**B1. Completar ordenação:**
- Adicionar sort nas colunas que faltam: Documento, Contato.
- Total de 6 de 7 colunas ordenáveis (Ações não é ordenável).

**B2. Paginação:**
- Adicionar paginação (25/pág) seguindo mesmo padrão do LeadList.

**B3. Loading/Error/Empty states:**
- Adicionar skeleton loading, banner de erro, empty state dedicado.

#### Parte C — Leads (`LeadList.tsx`)

**C1. Completar ordenação:**
- Adicionar sort nas colunas que faltam: Documento, Contatos.
- Total de 8 de 9 colunas ordenáveis.

**C2. Filtros adicionais:**
- **Período de criação:** inputs date de/até para filtrar leads por `created_at`.

**Arquivos alterados:**
- `src/modules/quotations/components/proposal/ProposalManagementPage.tsx` (principal)
- `src/modules/quotations/services/quotationService.ts` (adicionar sort params)
- `src/modules/crm/components/ClientList.tsx` (pagination, sort completo, loading/empty)
- `src/modules/crm/components/LeadList.tsx` (sort completo, filtro data)

---

### 2.4 Justificar texto da proposta

**Situação atual:**  
Texto da proposta usa alinhamento padrão (esquerda).

**Solicitado:**  
Texto justificado (`text-align: justify`).

**Solução:**
- Adicionar `text-align: justify` nos seletores CSS de parágrafos da proposta.

**Arquivos:** `ProposalPreview.css`

---

### 2.5 Permissões para excluir usuários e propostas

**Situação atual:**
- Não existe botão de exclusão de usuários no `UserManagement.tsx`.
- Exclusão de propostas usa `canManageQuotations` (genérico); é soft-delete (status → cancelled).

**Solicitado:**  
Criar permissões específicas `canDeleteUsers` e `canDeleteQuotations`. Implementar exclusão de usuários.

**Solução:**
- Adicionar chaves em `permissions.ts` + migration SQL.
- Botão "Excluir usuário" condicionado à `canDeleteUsers`.
- Endpoint API para deletar `auth.users` (service_role).
- Botão "Excluir proposta" condicionado à `canDeleteQuotations`.

**Arquivos:** `permissions.ts`, `UserManagement.tsx`, `ProposalManagementPage.tsx`, `quotationService.ts`, nova migration, novo endpoint `api/users/delete.ts`

---

### 2.6 Prazos de pagamento (7/15/21/30/Anual+/custom) + mostrar período locação

**Situação atual:**
- `prazoPagamento` tem opções: À vista, 01, 14, 21, 30, 60, 90, 120 dias.
- `prazoPagamento` **não aparece** na proposta impressa (`buildConditionRows` omite).
- `periodoLocacao` por item **não aparece** na tabela de equipamentos.

**Solicitado:**
1. Opções: 7, 15, 21, 30 dias + Anual + custom (combo box).
2. Período de locação visível na proposta.

**Solução:**
- Alterar select para ComboBox em `ConditionsEditor.tsx`.
- Adicionar `prazoPagamento` ao `buildConditionRows`.
- Adicionar coluna "Período" na tabela de equipamentos do print.

**Arquivos:** `ConditionsEditor.tsx`, `ProposalPrintDocument.tsx`, `templateEngine.ts`, novo `ComboBox.tsx`

---

### 2.7 DDD + contato no lead aparecendo na proposta

**Situação atual:**  
Lead já tem `areaCode` e `phone` separados. Ao gerar proposta, `telefone` recebe **apenas** `lead.phone` — sem DDD.

**Solicitado:**  
DDD concatenado ao telefone na proposta: `"(62) 99825-5400"`.

**Solução:**
- Em `generateProposalFromLead`: concatenar `(${areaCode}) ${phone}`.
- Também preencher `documento`, `cidadeUf` que hoje vão vazios.

**Arquivos:** `useCRM.ts`, `ClientSelector.tsx`

---

### 2.8 Filtros: data emissão + ações em lote na listagem

**Situação atual:**  
Serviço `listQuotations` suporta `fromDate`/`toDate` mas não estão na UI. Sem ações em lote.

**Solicitado:**  
Filtro por período de data + ações (em lote) na listagem.

**Solução:**
- Inputs date "de/até" na barra de filtros (também coberto por #2.3).
- Checkboxes de seleção múltipla + barra de ações (alterar status, excluir selecionados).

> **Nota:** Esta solicitação está parcialmente sobreposta com #2.3 (filtros premium). Os filtros de data serão implementados como parte do painel de filtros avançados de #2.3.

**Arquivos:** `ProposalManagementPage.tsx`

---

### 2.9 Dashboard com acompanhamento por colaborador

**Situação atual:**  
Dashboard mostra métricas agregadas de todo o sistema. `sales_quotations` já possui `vendedor_id`.

**Solicitado:**  
Filtrar Dashboard por colaborador/vendedor. Ranking comparativo.

**Solução:**
- Seletor de vendedor no Dashboard.
- `useCRMDashboard` aceitar `vendedorId` como filtro.
- Seção "Ranking de Vendedores" (gráfico barras: propostas/valor por vendedor).

**Arquivos:** `Dashboard.tsx`, `useCRMDashboard.ts`

---

### 2.10 Período de locação editável manualmente (combo box)

**Situação atual:**  
`periodoLocacao` é union type fixo: `'semanal' | 'quinzenal' | 'mensal' | 'anual'`. Select simples.

**Solicitado:**  
Combo box: selecionar opção existente OU digitar valor livre.

**Solução:**
- Alterar tipo para `string`.
- Substituir `<select>` por `<ComboBox>` no `EquipmentSelector.tsx`.
- Sugestões: Semanal, Quinzenal, Mensal, Anual + input livre.

**Arquivos:** `proposal.ts`, `EquipmentSelector.tsx`, `ProposalPrintDocument.tsx`

---

### 2.11 Campo contato em Leads + DDD vinculado

**Situação atual:**  
`generateProposalFromLead` mapeia `lead.name` → `responsavel` e `lead.company` → `nome` corretamente. Porém `documento`, `cidadeUf` e DDD não são preenchidos.

**Solicitado:**  
Garantir que contato, DDD, documento e cidade/UF do lead sejam corretamente transferidos para a proposta.

**Solução:**
- Corrigir mapeamento em `generateProposalFromLead`:
  - `telefone`: concatenar DDD
  - `documento`: preencher com `lead.documentNumber`
  - `cidadeUf`: preencher com `city/state`

**Arquivos:** `useCRM.ts`

---

## 3. Roadmap de Implementação

### Fase 1 — Críticas (Prioridade Alta)

| Ordem | Solicitações | Descrição | Esforço |
|---|---|---|---|
| 1 | #5 | Permissões para excluir usuários e propostas | 5h |
| 2 | **#3** | **Ordenação em todas as tabelas + filtros premium em propostas** | **10h** |
| 3 | #6 + #10 | Prazo pagamento custom combo + período visível na proposta | 6h |
| 4 | #7 + #11 | DDD + contato na proposta + mapeamento lead→proposta | 4h |

### Fase 2 — Interface (Prioridade Média)

| Ordem | Solicitações | Descrição | Esforço |
|---|---|---|---|
| 5 | #1 | Reordenar: Itens → Condições → Observações → Disposições | 2h |
| 6 | #2 | Condições em colunas sequenciais cardeais | 1h |
| 7 | #8 | Ações em lote na listagem de propostas | 3h |

### Fase 3 — Novas funcionalidades (Prioridade Média/Baixa)

| Ordem | Solicitações | Descrição | Esforço |
|---|---|---|---|
| 8 | #9 | Dashboard com acompanhamento por colaborador | 6h |
| 9 | #4 | Justificar texto da proposta | 0.5h |

**Total estimado:** ~37.5 horas

---

## 4. Plano de Tarefas Detalhado

### Tarefa 1: Permissões para exclusão de usuários e propostas (#5)

1.1 Adicionar `canDeleteUsers` e `canDeleteQuotations` em `ALL_PERMISSION_KEYS` (`src/utils/permissions.ts`)  
1.2 Criar migration SQL `20260720_add_delete_permissions.sql` atualizando roles Admin e Operador  
1.3 Adicionar botão "Excluir" na tabela de usuários (`UserManagement.tsx`) com diálogo de confirmação  
1.4 Implementar `handleDeleteUser`: chamar `DELETE` no `user_profiles` + endpoint API para `auth.users`  
1.5 Criar `api/users/delete.ts` (Vercel Function) usando service_role para deletar do auth  
1.6 Condicionar botão "Excluir proposta" à permissão `canDeleteQuotations`  
1.7 Atualizar seed `sync_system_roles_permissions.sql`

**Validação:** Admin consegue excluir usuário e proposta. Operador não vê botão de excluir usuário.

---

### Tarefa 2: Ordenação + Filtros Premium + Paginação (#3) — PRINCIPAL

#### 2A — Propostas (`ProposalManagementPage.tsx`)

2A.1 Adicionar estado `sortField` / `sortDir` com indicadores visuais (⇅/↑/↓ amarelo) nos cabeçalhos  
2A.2 Tornar clicáveis todas as colunas: Nº Proposta, Cliente, Vendedor, Data Emissão, Status, Valor  
2A.3 Passar `sortField`/`sortDir` para `quotationService.list()` → gerar `.order()` dinâmico no Supabase  
2A.4 Adicionar painel de filtros expansível (botão "Filtros" com badge de ativos, "Limpar")  
2A.5 Novos filtros no painel:
    - **Tipo de documento:** checkboxes (Proposta, Orçamento, Contrato)  
    - **Faixa de valor:** inputs min/max (R$)  
    - **Período emissão:** inputs date de/até (atende também #8)  
2A.6 Implementar paginação (25/pág) com controles: Anterior, Próximo, páginas numeradas  
2A.7 Adicionar contador "Mostrando X-Y de Z propostas"  
2A.8 Botão "Exportar Excel" da lista filtrada (usar lib `xlsx` já existente)  
2A.9 Atualizar `quotationService.list()` para suportar `sortField`, `sortDir`, `tipo`, `minValue`, `maxValue`, paginação com `count`

#### 2B — Clientes (`ClientList.tsx`)

2B.1 Adicionar sort nas colunas faltantes: Documento, Contato  
2B.2 Implementar paginação (25/pág) com controles, mesmo padrão do LeadList  
2B.3 Adicionar estados de loading (skeleton), error (banner), empty state dedicado  

#### 2C — Leads (`LeadList.tsx`)

2C.1 Adicionar sort nas colunas faltantes: Documento, Contatos  
2C.2 Adicionar filtro de período de criação (inputs date de/até)

**Validação:** Clicar cabeçalhos alterna ordenação. Filtros combinados funcionam. Paginação navega corretamente.

---

### Tarefa 3: Prazo pagamento customizado + período locação visível (#6 + #10)

3.1 Criar componente `ComboBox.tsx` reutilizável (dropdown filtrável + input text, suporte teclado)  
3.2 `ConditionsEditor.tsx`: trocar `<Select>` de `prazoPagamento` por `<ComboBox>` com opções `7 dias`, `15 dias`, `21 dias`, `30 dias`, `Anual` + input livre  
3.3 `EquipmentSelector.tsx`: trocar `<select>` de `periodoLocacao` por `<ComboBox>` com sugestões Semanal/Quinzenal/Mensal/Anual + input livre  
3.4 Alterar tipo `PeriodoLocacao` para `string` em `proposal.ts`; `PeriodoLocacaoLabels` com fallback para valor cru  
3.5 Adicionar `'Prazo de pagamento'` em `buildConditionRows` no `ProposalPrintDocument.tsx`  
3.6 Adicionar coluna "Período" na tabela de equipamentos do print  
3.7 Atualizar `TEMPLATE_ESCOPO` no `templateEngine.ts` com coluna de período  

**Validação:** Selecionar/digitar prazo customizado. Período visível na proposta impressa.

---

### Tarefa 4: DDD + contato vinculado corretamente na proposta (#7 + #11)

4.1 Corrigir `generateProposalFromLead` em `useCRM.ts`:
    - `telefone`: `` lead.areaCode ? `(${lead.areaCode}) ${lead.phone}` : lead.phone ``
    - `documento`: `lead.documentNumber || ''`
    - `cidadeUf`: `[lead.city, lead.state].filter(Boolean).join('/')`
4.2 No `ClientSelector.tsx`, verificar se telefone do cliente inclui DDD ao popular snapshot

**Validação:** Criar lead com DDD (62), gerar proposta → telefone aparece `(62) 99825-5400`, documento e cidade/UF preenchidos.

---

### Tarefa 5: Reordenar seções da proposta (#1)

5.1 Em `ProposalPrintDocument.tsx`, mover bloco `observacoesGerais` para depois de `ConditionColumns`  
5.2 Ajustar lógica de altura (`commercialAvailableMm`, `inlineParagraphCount`) para incluir observações  
5.3 Atualizar `TEMPLATE_ESCOPO` no `templateEngine.ts` se aplicável  

**Validação:** Preview mostra: Itens → Condições → Observações → Disposições.

---

### Tarefa 6: Condições em colunas sequenciais cardeais (#2)

6.1 Reescrever `splitConditionRows`: dividir array ao meio com `Math.ceil(rows.length / 2)`  

**Validação:** Esquerda 1.1-1.11, direita 1.12-1.22.

---

### Tarefa 7: Ações em lote na listagem (#8)

7.1 Adicionar checkboxes de seleção múltipla na tabela de propostas  
7.2 Barra de ações flutuante ao selecionar itens: "Alterar status" (dropdown) e "Excluir selecionados"  
7.3 Implementar bulk update no `quotationService` (`.in('id', ids)`)  

**Validação:** Selecionar 3 propostas, alterar status para "Fechada" em lote.

---

### Tarefa 8: Dashboard por colaborador (#9)

8.1 Adicionar seletor de vendedor no topo do `Dashboard.tsx`  
8.2 Modificar `useCRMDashboard` para aceitar `vendedorId` e filtrar queries  
8.3 Adicionar seção "Ranking de Vendedores" com gráfico de barras horizontais (propostas/valor por vendedor)  

**Validação:** Selecionar vendedor → métricas filtradas. Ranking exibe todos comparativamente.

---

### Tarefa 9: Justificar texto (#4)

9.1 Em `ProposalPreview.css`, adicionar `text-align: justify` nos seletores:  
    `.proposal-intro-panel p`, `.proposal-dispositions-final p`, `.proposal-dispositions-inline p`, `.proposal-observations-text`, `.proposal-accept-section p`

**Validação:** Preview com texto justificado.

---

## 5. Alterações no Banco de Dados

### 5.1 Nova Migration: Permissões de Exclusão

```sql
-- migration: 20260720_add_delete_permissions.sql

UPDATE custom_roles
SET permissions = permissions || '["canDeleteUsers", "canDeleteQuotations"]'::jsonb,
    updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000001';

UPDATE custom_roles
SET permissions = permissions || '["canDeleteQuotations"]'::jsonb,
    updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000002';
```

### 5.2 Ajustes no `quotationService.list()`

Novos parâmetros no `SalesQuotationFilters`:

```ts
interface SalesQuotationFilters {
  // ... existentes
  sortField?: string;        // coluna para ordenar
  sortDir?: 'asc' | 'desc';  // direção
  tipo?: DocumentTipo;       // filtro por tipo
  minValue?: number;         // valor mínimo
  maxValue?: number;         // valor máximo
  page?: number;             // página (1-indexed)
  pageSize?: number;         // itens por página (default 25)
}
```

**Nenhuma nova coluna ou tabela necessária no schema.**

---

## 6. Estimativa de Esforço

| Fase | Tarefas | Horas |
|---|---|---|
| Fase 1 | #5, **#3**, #6+#10, #7+#11 | **25h** |
| Fase 2 | #1, #2, #8 | 6h |
| Fase 3 | #9, #4 | 6.5h |
| **Total** | | **37.5h** |

---

## 7. Riscos e Dependências

| Risco | Mitigação |
|---|---|
| Ordenação server-side em campo JSONB (`conteudo->cliente->nome`) pode ter performance ruim | Criar índice GIN ou avaliar ordenação client-side como fallback |
| Exclusão de `auth.users` requer service_role no Supabase | Criar endpoint Vercel Function dedicado, similar ao `api/users/create.ts` |
| Alteração `PeriodoLocacao` de union para `string` pode quebrar TypeScript | Buscar todas as referências; manter compatibilidade retroativa |
| Combo box acessível (teclado) | Implementar Arrow/Enter/Escape no componente |
| Dashboard com filtro pode ter performance ruim carregando todos os dados | Filtrar na query SQL, não no frontend |

---

> **Status:** Aguardando aprovação do Product Owner.
