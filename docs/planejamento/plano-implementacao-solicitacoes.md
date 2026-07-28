# Plano de Implementação — Solicitações EGEN

> **Projeto:** egen_geradores | **Stack:** React 18 + TypeScript + Tailwind 3 + Supabase + Zustand  
> **Elaborado por:** Engenharia Front-end Sênior | **Data:** 22/07/2026

---

## Sumário

1. [Solicitação 1 — Correção da quebra de página do texto de observações](#1-correção-da-quebra-de-página-do-texto-de-observações)
2. [Solicitação 2 — Novas opções de classificação (Leads e Clientes)](#2-novas-opções-de-classificação-leads-e-clientes)
3. [Solicitação 3 — Novos filtros no ranking por vendedor](#3-novos-filtros-no-ranking-por-vendedor)
4. [Solicitação 4 — Permissão segregada para visualização de propostas](#4-permissão-segregada-para-visualização-de-propostas)
5. [Solicitação 5 — Campo de responsável e revisão do formulário de lead](#5-campo-de-responsável-e-revisão-do-formulário-de-lead)

---

## 1. Correção da quebra de página do texto de observações

### Diagnóstico

- **Arquivo:** `src/modules/quotations/components/proposal/ProposalPrintDocument.tsx:913-918`
- **Raiz do problema:** O bloco de observações (`observacoesGerais`) é renderizado ao final da última página de escopo (logo após as tabelas de itens, horas excedentes, condições comerciais e disposições gerais inline). Não existe **estimativa de altura** para esse bloco — o algoritmo atual (`showCommercialInline` + `inlineParagraphCount`) calcula se as condições e disposições cabem, mas **ignora completamente** as observações. Quando o texto é longo, ele ultrapassa o `height: 255mm` do `.proposal-standard-body` e invade o footer.
- **Agravante:** O container `.a4-page` tem `overflow: hidden`, então o conteúdo excedente simplesmente desaparece ou sobrepõe o footer colorido, sem nenhuma indicação visual de truncamento.

### Solução proposta

**Estratégia:** Incorporar a estimativa de altura do bloco de observações no mesmo algoritmo de posicionamento que já existe para condições e disposições. Se o texto não couber, movê-lo para uma nova página dedicada (após a página comercial ou após a acceptance page, a depender do layout).

#### Passos

| # | Ação | Arquivo | Descrição |
|---|------|---------|-----------|
| 1.1 | Criar função `estimateObservationMm(text: string): number` | `ProposalPrintDocument.tsx` | Estimativa conservadora da altura ocupada pelo texto de observações (incluindo o título "Observações:"). Usar a mesma lógica de `estimateDispositionMm()`: `charsPerLine ≈ 95`, `lineMm ≈ 4.7`, `paragraphMarginMm ≈ 2.5`, acrescido de `titleHeightMm ≈ 9`. |
| 1.2 | Adicionar `observationFitsInline` à lógica de posicionamento | `ProposalPrintDocument.tsx` | Após calcular `inlineParagraphCount`, estimar a altura restante e verificar se a observação cabe. Se couber, renderizar inline (como já está). |
| 1.3 | Criar página dedicada de observações (fallback) | `ProposalPrintDocument.tsx` | Se a observação não couber inline, criar uma nova página no array `pages` (antes ou depois da acceptance page) contendo apenas o bloco de observações com header e footer padrão. A lógica deve recalcular `totalPages` adequadamente. |
| 1.4 | Ajustar CSS de segurança | `ProposalPreview.css` | Adicionar `break-inside: avoid` ao `.proposal-observations-block` para evitar que o bloco seja dividido entre páginas durante a impressão. Adicionar `max-height` com `overflow: hidden` como camada extra de defesa contra overflow. |
| 1.5 | Adicionar indicador visual de truncamento (opcional) | `ProposalPrintDocument.tsx` | Se o texto estimado exceder o espaço disponível e for para uma página extra, nenhum indicador é necessário. Se optarmos por truncar, adicionar reticências via CSS `text-overflow: ellipsis`. |

#### Impacto estimado
- **Arquivos alterados:** 2 (`ProposalPrintDocument.tsx`, `ProposalPreview.css`)
- **Risco:** Baixo. A lógica de estimativa de altura já é usada para disposições; estendê-la para observações é uma adição incremental.
- **Testes:** Validar com textos de observações de diferentes comprimentos (curto, médio, 5+ parágrafos) tanto na visualização em tela quanto na exportação PDF.

---

## 2. Novas opções de classificação (Leads e Clientes)

### Diagnóstico

- **Arquivo:** `src/modules/crm/types/index.ts:62-75`
- O array `CLIENT_CLASSIFICATIONS` contém 12 opções atuais. Como `LEAD_CLASSIFICATIONS` (linha 143) é um alias direto (`= CLIENT_CLASSIFICATIONS`), basta alterar a fonte.
- As opções atuais são: `Sistemas de Irrigação`, `Armazéns de Grãos e Sementes`, `Mineração Minerais Metálicos`, `Minerais Não Metálicos`, `Obras Const. Civil`, `Pecuária`, `Agroindústria Energética`, `Indústria de Alimentos`, `Comércio`, `Paradas de Manutenção`, `Hospital`, `Construtora`.
- As novas opções solicitadas são segmentos de mercado diferentes e complementares.

### Solução proposta

**Estratégia:** Adicionar as 11 novas classificações ao array existente, mantendo as atuais (a menos que o PO indique substituição).

#### Passos

| # | Ação | Arquivo | Descrição |
|---|------|---------|-----------|
| 2.1 | Adicionar novas entradas ao array | `src/modules/crm/types/index.ts:62-75` | Inserir as 11 novas classificações no array `CLIENT_CLASSIFICATIONS`. Como o array usa `as const`, a ordem alfabética ou lógica deve ser definida. |
| 2.2 | Verificar impacto em filtros existentes | `CrmPage.tsx`, `ClientList.tsx`, `LeadList.tsx` | Confirmar que os dropdowns de filtro por classificação renderizam dinamicamente a partir do array (não são hardcoded). Atualmente usam `CLIENT_CLASSIFICATIONS`/`LEAD_CLASSIFICATIONS` diretamente — sem impacto. |
| 2.3 | Verificar impacto no dashboard | `useCRMDashboard.ts` | Confirmar que nenhum gráfico ou métrica agrupa por classificação de forma hardcoded. Atualmente as métricas não segmentam por classificação — sem impacto. |
| 2.4 | Verificar impacto em importação/exportação | Pesquisar uso de `classification` | Confirmar que validações de importação Excel não rejeitam valores fora de uma whitelist. |

#### Novas classificações a adicionar

```typescript
'Saneamento',
'Órgãos Públicos',
'Supermercado',
'Eventos',
'Usina',
'Fazenda',
'Frigorífico',
'Laticínios',
'Metalúrgica',
'Calcário',
'Outros',
```

#### Decisão pendente do PO
- **Manter** as classificações atuais + adicionar as novas (total: 23 opções)?
- **Substituir** completamente pelas novas?

#### Impacto estimado
- **Arquivos alterados:** 1 (`src/modules/crm/types/index.ts`)
- **Risco:** Nulo. É uma alteração de dados estáticos. Nenhuma migração de banco necessária (a coluna `classification` é `text`, sem constraint de enum).
- **Migração de dados:** Não necessária. Valores antigos já salvos no banco permanecem válidos. Se o PO optar por substituição, considerar um script de normalização futura.

---

## 3. Novos filtros no ranking por vendedor

### Diagnóstico

- **Arquivos principais:**
  - `src/components/Dashboard.tsx:224-298` — renderização da tabela de ranking
  - `src/hooks/useCRMDashboard.ts:68-74` — interface `VendedorRanking`
  - `src/hooks/useCRMDashboard.ts:121-156` — lógica de cálculo do ranking

- **Estado atual:** O ranking mostra apenas: posição, nome do vendedor, total de propostas, propostas fechadas e valor total. Os dados vêm exclusivamente da tabela `sales_quotations`. Não há nenhuma informação de leads por vendedor.

- **Limitação:** O ranking é protegido pela permissão `canViewSalesRanking` e só aparece para admins/gerentes. Não há filtro de período — sempre mostra o total acumulado de todos os tempos.

### Solução proposta

**Estratégia:** Expandir o hook `useCRMDashboard` para buscar também leads por vendedor (a tabela `leads` tem relacionamento com `user_profiles`?) e enriquecer a interface `VendedorRanking`. Adicionar controles de filtro/toggle no Dashboard.

#### Passos

| # | Ação | Arquivo | Descrição |
|---|------|---------|-----------|
| **3.1 — Backend/Hook** |||
| 3.1.1 | Expandir interface `VendedorRanking` | `useCRMDashboard.ts` | Adicionar campos: `totalLeads`, `leadsConvertidos`, `propostasNegociando`, `propostasPerdidas`, `propostasPesquisa`, `taxaConversao` |
| 3.1.2 | Buscar leads com vendedor vinculado | `useCRMDashboard.ts` | Adicionar query em `leads` filtrando por `vendedor_id` (se existir coluna) ou via tabela de relacionamento. Verificar se há coluna `vendedor_id` na tabela `leads`. Caso não exista, considerar criar. |
| 3.1.3 | Enriquecer cálculo do ranking | `useCRMDashboard.ts` | Agregar dados de leads + propostas por vendedor, calcular taxa de conversão |
| 3.1.4 | Adicionar parâmetro de período | `useCRMDashboard.ts` | Adicionar `periodo?: '30d' \| '90d' \| 'ano' \| 'todos'` ao hook para filtrar por data de emissão/criação |
| **3.2 — UI/Dashboard** |||
| 3.2.1 | Adicionar filtro de período | `Dashboard.tsx` | Select dropdown: "Últimos 30 dias", "Últimos 90 dias", "Este ano", "Todo período" |
| 3.2.2 | Adicionar filtro de ordenação | `Dashboard.tsx` | Botões/dropdown para ordenar por: Valor Total, Qtd. Propostas, Qtd. Fechadas, Taxa de Conversão, Qtd. Leads |
| 3.2.3 | Adicionar toggle de colunas | `Dashboard.tsx` | Permitir expandir/recolher colunas adicionais: Leads captados, Leads convertidos, Taxa conversão, Propostas em negociação, Propostas perdidas |
| 3.2.4 | Adicionar filtro por status de proposta | `Dashboard.tsx` | Checkboxes ou multi-select para filtrar quais status de proposta contar no ranking |
| 3.2.5 | Refatorar tabela de ranking | `Dashboard.tsx` | Extrair para componente próprio (`VendedorRankingTable.tsx`) para melhor organização, já que a tabela vai crescer em complexidade |

#### Nova interface `VendedorRanking`

```typescript
export interface VendedorRanking {
  id: string;
  name: string;
  totalPropostas: number;
  valorTotal: number;
  propostasFechadas: number;
  // Novos campos
  totalLeads: number;
  leadsConvertidos: number;
  propostasNegociando: number;
  propostasPerdidas: number;
  propostasPesquisa: number;
  taxaConversao: number; // leadsConvertidos / totalLeads * 100
}
```

#### Impacto estimado
- **Arquivos alterados:** 2-3 (`useCRMDashboard.ts`, `Dashboard.tsx`, novo `VendedorRankingTable.tsx`)
- **Risco:** Médio. Depende de existir coluna `vendedor_id` na tabela `leads`. Se não existir, será necessário criar migration e preencher retroativamente.
- **Performance:** O hook atual já faz 5 queries paralelas. Adicionar mais 1-2 queries não deve impactar significativamente.

---

## 4. Permissão segregada para visualização de propostas

### Diagnóstico

- **Arquivos principais:**
  - `src/utils/permissions.ts` — definição de permissões e RBAC
  - `src/App.tsx:73-96` — rotas de propostas (todas usam `canManageQuotations`)
  - `src/modules/quotations/components/proposal/ProposalManagementPage.tsx` — listagem (carrega todas as propostas, sem filtro por vendedor)
  - `src/modules/quotations/services/quotationService.ts:301-389` — `listQuotations()` (já suporta filtro `vendedorId`)

- **Estado atual:** Uma única permissão `canManageQuotations` controla tudo (listar, criar, editar, excluir). Qualquer usuário com essa permissão vê **todas** as propostas do sistema. Não há filtro automático por `vendedor_id` ou `created_by`.

- **Problema:** Se um vendedor precisa criar e gerenciar suas próprias propostas, ele automaticamente ganha acesso a ver as propostas de todos os outros vendedores (incluindo valores, margens, clientes de colegas).

### Solução proposta

**Estratégia:** Criar duas novas permissões granulares (`canViewAllProposals` e `canViewOwnProposals`), mantendo `canManageQuotations` como permissão de criação/edição. A listagem de propostas aplicará filtro automático por `vendedor_id` para usuários sem `canViewAllProposals`.

#### Passos

| # | Ação | Arquivo | Descrição |
|---|------|---------|-----------|
| **4.1 — Permissões** |||
| 4.1.1 | Adicionar novas permissões ao dicionário | `src/utils/permissions.ts` | Adicionar `canViewAllProposals` (admin vê tudo) e `canViewOwnProposals` (vendedor vê só as próprias) no array `ALL_PERMISSION_KEYS`, grupo "Propostas" |
| 4.1.2 | Atualizar roles legadas | `src/utils/permissions.ts` | `admin`: incluir `canViewAllProposals`; `operator`: incluir `canViewOwnProposals`; `requester`: não incluir nenhuma |
| 4.1.3 | Atualizar tipagem se necessário | `src/types/index.ts` | Verificar se o tipo de permissão é derivado dinamicamente de `ALL_PERMISSION_KEYS` |
| **4.2 — Listagem de propostas** |||
| 4.2.1 | Aplicar filtro por vendedor na listagem | `ProposalManagementPage.tsx` | Após carregar as permissões do usuário, se NÃO tiver `canViewAllProposals` E tiver `canViewOwnProposals`, setar `vendedorFilter` com o `userProfile.id` do usuário logado e desabilitar o select de filtro por vendedor |
| 4.2.2 | Ocultar seletor de vendedor para usuários restritos | `ProposalManagementPage.tsx` | Se o usuário não tem `canViewAllProposals`, remover o dropdown de filtro por vendedor (ou mostrar apenas o próprio nome como readonly) |
| 4.2.3 | Impedir acesso a propostas de outros via URL direta | `SalesQuotationPage.tsx` | Na página de edição/visualização (`/propostas/:id`), verificar se o `vendedor_id` da proposta corresponde ao usuário logado (se ele não tiver `canViewAllProposals`). Redirecionar ou mostrar "Acesso negado" |
| 4.2.4 | Adicionar filtro `createdBy` ao serviço | `quotationService.ts` | Adicionar suporte ao parâmetro `createdBy` na função `listQuotations()` e na interface `SalesQuotationFilters` |
| **4.3 — Rotas e proteção** |||
| 4.3.1 | Atualizar proteção de rota | `App.tsx` | A rota `/propostas` deve exigir `canManageQuotations` OU `canViewOwnProposals` OU `canViewAllProposals`. A rota `/propostas/nova` deve exigir `canManageQuotations`. |
| 4.3.2 | Atualizar visibilidade no menu | `Layout.tsx` | Verificar se o item de menu "Propostas" está condicionado à permissão correta |
| **4.4 — Dashboard** |||
| 4.4.1 | Ajustar ranking por vendedor | `Dashboard.tsx` | O ranking já é protegido por `canViewSalesRanking`. Adicionar lógica: se o usuário tem `canViewOwnProposals` mas NÃO tem `canViewSalesRanking`, mostrar apenas os próprios dados (não o ranking completo) |
| 4.4.2 | Ajustar métricas do dashboard | `useCRMDashboard.ts` | Passar o `userId` para o hook quando o usuário não tem `canViewSalesRanking`, para filtrar métricas apenas do próprio vendedor |

#### Matriz de permissões

| Permissão | Admin | Gerente | Vendedor | Solicitante |
|-----------|-------|---------|----------|-------------|
| `canManageQuotations` | ✓ | ✓ | ✓ | ✗ |
| `canViewAllProposals` | ✓ | ✓ | ✗ | ✗ |
| `canViewOwnProposals` | ✓ | ✓ | ✓ | ✗ |
| `canDeleteQuotations` | ✓ | ✓ | ✗ | ✗ |
| `canViewSalesRanking` | ✓ | ✓ | ✗ | ✗ |

#### Impacto estimado
- **Arquivos alterados:** 5-6 (`permissions.ts`, `ProposalManagementPage.tsx`, `SalesQuotationPage.tsx`, `App.tsx`, `quotationService.ts`, `Dashboard.tsx`)
- **Risco:** Alto (alterações em permissões afetam segurança dos dados). Necessário testar exaustivamente:
  - Usuário sem permissão não acessa a rota
  - Vendedor só vê as próprias propostas
  - Admin/gerente continua vendo todas
  - Acesso direto por URL (`/propostas/:id`) é bloqueado para propostas de outros vendedores
- **Rollback:** As novas permissões são aditivas. Se algo quebrar, remover os checks de `canViewOwnProposals` restaura o comportamento anterior.
- **Migração:** Usuários existentes com `canManageQuotations` precisarão ter as novas permissões atribuídas via script ou manualmente no painel de cargos customizados.

---

## 5. Campo de responsável e revisão do formulário de lead

### Diagnóstico

- **Arquivos:**
  - `src/modules/crm/types/index.ts:104-141` — interface `Lead`, tipo `LeadFormData`
  - `src/modules/crm/components/LeadList.tsx:329-601` — modal principal de criação/edição de lead
  - `src/modules/crm/components/LeadDetailModal.tsx:345-480` — modal de detalhe/edição inline

- **Análise do formulário atual x interface Lead:**

| Campo | Na interface? | No formulário? | Observação |
|-------|:---:|:---:|------------|
| `name` | ✓ | ✓ | Único campo com validação JS |
| `company` | ✓ | ✓ | |
| `documentNumber` | ✓ | ✓ | Sem máscara/validação |
| `areaCode` | ✓ | ✓ | `maxLength={5}` (excessivo para DDD) |
| `phone` | ✓ | ✓ | Sem máscara/validação |
| `email` | ✓ | ✓ | Só validação nativa do browser |
| `city` | ✓ | ✓ | |
| `state` | ✓ | ✓ | `maxLength={2}` |
| `classification` | ✓ | ✓ | Select de `LEAD_CLASSIFICATIONS` |
| `source` | ✓ | ✓ | Select de `LEAD_SOURCES` |
| `status` | ✓ | ✓ | Select de `LEAD_STATUS_LABELS` |
| `notes` | ✓ | ✓ | `<textarea>` |
| `contacts` | ✓ | ✓ | Lista dinâmica de `ContactPerson` |
| `scheduledAt` | ✓ | ✓ (condicional) | Só aparece p/ `potential_client` e `follow_up`; **não validado** |
| `convertedClientId` | ✓ | — | Gerenciado pelo servidor |
| `convertedAt` | ✓ | — | Gerenciado pelo servidor |
| `createdAt` | ✓ | — | Gerenciado pelo servidor |
| `updatedAt` | ✓ | — | Gerenciado pelo servidor |

- **Conclusão:** Todos os 12 campos editáveis da interface `Lead` estão presentes no formulário. **Não há lacunas de campos ausentes.**

- **Porém não existe campo "responsável":** A interface `Lead` não possui esse campo. Será necessário criá-lo no modelo de dados (interface, tipo do banco, formulário e migration SQL).

- **Problemas identificados no formulário:**

| # | Problema | Gravidade |
|---|----------|-----------|
| A | **Validação frágil** — apenas `name` é validado; email, telefone e data agendada não têm validação JS | Média |
| B | **Código duplicado** — dois formulários quase idênticos (`LeadList.tsx` e `LeadDetailModal.tsx`) com manutenção redundante | Média |
| C | **`scheduledAt` é limpo silenciosamente** ao mudar o status (linha 469 do LeadList) — se o usuário alternar status perde o dado | Baixa |
| D | **Status sazonais sem input de data** — `STATUSES_SEASONAL_SCHEDULE` (`client_no_demand`, `client_with_demand`) estão definidos como exigindo agendamento sazonal, mas o formulário não exibe campo de data para eles | Média |
| E | **DDD com `maxLength={5}`** — no Brasil DDD tem 2 dígitos; o valor 5 permite entradas inválidas | Baixa |
| F | **Sem máscara de telefone/documento** — CNPJ/CPF e telefone aceitam texto livre sem formatação | Baixa |

### Solução proposta

#### 5.1 — Adicionar campo "responsável" ao modelo de Lead

**Estratégia:** Adicionar `responsavel` como campo opcional (`string`) na interface `Lead`, no `LeadFormData`, na tabela `leads` do Supabase e nos dois formulários.

##### Passos

| # | Ação | Arquivo | Descrição |
|---|------|---------|-----------|
| 5.1.1 | Adicionar `responsavel` à interface `Lead` | `src/modules/crm/types/index.ts` | Campo: `responsavel: string` (linha ~107, após `company`) |
| 5.1.2 | Adicionar `responsavel` ao `LeadFormData` | `src/modules/crm/types/index.ts` | Campo: `responsavel: string` (linha ~129) |
| 5.1.3 | Adicionar coluna `responsavel` na tabela `leads` | `supabase/migrations/` | Criar migration SQL: `ALTER TABLE leads ADD COLUMN responsavel TEXT DEFAULT '';` |
| 5.1.4 | Atualizar mapeamento no hook/CRUD | `useCRMDashboard.ts`, serviços de lead | Garantir que a coluna `responsavel` seja lida/escrita em todas as operações de CRUD de leads |
| 5.1.5 | Adicionar campo ao formulário principal | `LeadList.tsx` | Novo `<input>` para "Responsável" no grid do modal de cadastro/edição |
| 5.1.6 | Adicionar campo ao formulário de detalhe | `LeadDetailModal.tsx` | Mesmo campo no formulário de edição inline |
| 5.1.7 | Exibir `responsavel` na tabela de listagem | `LeadList.tsx` | Coluna opcional na tabela de leads (ou tooltip com info adicional) |

#### 5.2 — Correções no formulário existente

##### Passos

| # | Ação | Arquivo | Descrição |
|---|------|---------|-----------|
| 5.2.1 | Adicionar validação de email | `LeadList.tsx` | Regex simples antes do submit; exibir mensagem de erro inline |
| 5.2.2 | Adicionar validação de telefone | `LeadList.tsx` | Verificar se não está vazio quando preenchido; formato mínimo |
| 5.2.3 | Validar `scheduledAt` quando obrigatório | `LeadList.tsx` | Se status for `potential_client` ou `follow_up`, bloquear submit sem data |
| 5.2.4 | Exibir campo de data para status sazonais | `LeadList.tsx` | Quando status for `client_no_demand` ou `client_with_demand`, também mostrar input de agendamento (conforme `STATUSES_SEASONAL_SCHEDULE`) |
| 5.2.5 | Corrigir `maxLength` do DDD | `LeadList.tsx` | Alterar de `5` para `2` |
| 5.2.6 | Preservar `scheduledAt` ao trocar status | `LeadList.tsx` | Remover `scheduledAt: ''` do `setFormData` no onChange do status; limpar só se o novo status não exigir agendamento |
| 5.2.7 | Unificar formulários (opcional — melhoria futura) | `LeadList.tsx` / `LeadDetailModal.tsx` | Extrair o formulário para um componente `LeadFormFields.tsx` reutilizado por ambos os modais |

#### Impacto estimado
- **Arquivos alterados:** 3-4 (`types/index.ts`, `LeadList.tsx`, `LeadDetailModal.tsx`, migration SQL)
- **Risco:** Baixo (adição de campo novo não quebra existentes; validações extras só tornam o sistema mais restritivo)
- **Migration:** Requer `ALTER TABLE` no Supabase. Campo novo com default `''` é seguro.
- **Retrocompatibilidade:** Registros existentes sem `responsavel` terão string vazia (sem quebra).

---

## Ordem de execução recomendada

1. **Solicitação 2** — Classificações (menor risco, menor esforço, sem dependências)
2. **Solicitação 5** — Campo responsável + revisão formulário lead (risco baixo, isolado no CRM; pode incluir a migration de `responsavel` e já deixar a base pronta para a solicitação 3)
3. **Solicitação 1** — Quebra de página (risco baixo, isolado no módulo de propostas)
4. **Solicitação 4** — Permissões (risco alto, requer testes cuidadosos; pré-requisito para o item 3)
5. **Solicitação 3** — Ranking por vendedor (depende conceitualmente do item 4 para respeitar a segregação de visibilidade)

---

## Pontos de atenção

- **Solicitação 1:** A estimativa de altura é inerentemente aproximada (depende da fonte, do browser e do zoom). Considerar adicionar `5mm` de margem de segurança extra.
- **Solicitação 2:** Confirmar com o PO se as classificações atuais devem ser mantidas ou substituídas.
- **Solicitação 3:** Verificar se a tabela `leads` possui coluna `vendedor_id`. Se não, será necessário criar migration SQL e definir como preencher o histórico. Alternativa: usar `created_by` como proxy do vendedor responsável.
- **Solicitação 4:** A atribuição retroativa das novas permissões para usuários existentes com `canManageQuotations` deve ser planejada (script SQL ou migration).
- **Solicitação 5:** O campo `responsavel` é novo — requer migration SQL (`ALTER TABLE leads ADD COLUMN`). A unificação dos dois formulários de lead (`LeadList` e `LeadDetailModal`) em um componente reutilizável é desejável, mas pode ser tratada como melhoria futura para não aumentar o escopo inicial. A validação de `scheduledAt` para status sazonais (`client_no_demand`, `client_with_demand`) deve ser incluída, pois são status já definidos como exigindo agendamento no código.
