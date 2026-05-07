# Módulo de Propostas — Documentação Técnica

> **Escopo:** `src/modules/quotations/`  
> **Banco de dados:** tabela `sales_quotations` (Supabase/PostgreSQL)  
> **Migration:** `supabase/migrations/20260316120000_sales_quotations.sql`

---

## 1. Visão Geral

O módulo de propostas é um **bounded context** independente responsável pela criação, edição, ciclo de vida e geração de documentos PDF de propostas comerciais de locação de geradores.

Ele convive com um segundo contexto de "cotações de fornecedores" (`useQuotation` / `QuotationManagementPage`) que trata o processo de compra/cotação interna. Este documento foca exclusivamente no fluxo de **propostas ao cliente final** (`SalesQuotation`).

---

## 2. Estrutura de Diretórios

```
src/modules/quotations/
├── index.ts                        — Re-exports públicos do módulo
├── types/
│   ├── index.ts                    — Tipos do workflow de cotação interna
│   └── proposal.ts                 — Tipos centrais das propostas ao cliente
├── stores/
│   └── quotationStore.ts           — Zustand store (estado global do editor)
├── services/
│   └── quotationService.ts         — CRUD via Supabase
├── hooks/
│   └── useQuotation.ts             — Hook para cotações internas (fornecedores)
├── workflow/
│   └── stateMachine.ts             — Máquina de estados e guardas de transição
├── engine/
│   ├── index.ts
│   ├── templateEngine.ts           — Placeholders + templates HTML das seções
│   └── renderEngine.ts             — Substituição de placeholders + formatadores
└── components/
    ├── QuotationManagementPage.tsx  — Gestão de cotações internas
    ├── QuotationList.tsx
    ├── QuotationDrawer.tsx
    ├── CreateQuotationModal.tsx
    ├── AddProposalModal.tsx
    ├── ProposalComparison.tsx
    ├── MetricsDashboard.tsx
    ├── ApprovalTimeline.tsx
    ├── AuditLogTimeline.tsx
    ├── StatusStepper.tsx
    └── proposal/                   — Submódulo de propostas ao cliente
        ├── SalesQuotationPage.tsx  — Página principal (editor + preview)
        ├── QuotationForm.tsx       — Formulário em abas/accordion
        ├── QuotationPreview.tsx    — Preview A4 com zoom e download PDF
        ├── ClientSelector.tsx      — Seletor integrado ao CRM
        ├── EquipmentSelector.tsx   — Seletor de equipamentos c/ tabela de preços
        ├── ServiceSelector.tsx     — Seletor de serviços
        ├── ConditionsEditor.tsx    — Condições comerciais
        └── ProposalPreview.css     — Estilos de impressão A4
```

---

## 3. Modelo de Dados

### 3.1 Tabela `sales_quotations` (PostgreSQL)

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID PK | Identificador interno |
| `document_id` | VARCHAR(50) UNIQUE | Código legível (ex: `PROP-2026-4321`) |
| `client_id` | UUID FK → `crm_clients` | Cliente vinculado (nullable) |
| `lead_id` | UUID FK → `crm_leads` | Lead vinculado (nullable) |
| `tipo` | VARCHAR | `proposta` \| `orcamento` \| `contrato` |
| `status` | VARCHAR | Ver seção 4 |
| `data_emissao` | DATE | Data de emissão |
| `validade` | DATE | Data de validade |
| `conteudo` | JSONB | Snapshot completo: cliente, equipamentos, serviços, condições |
| `total_equipamentos` | DECIMAL(15,2) | Subtotal equipamentos (desnormalizado) |
| `total_servicos` | DECIMAL(15,2) | Subtotal serviços (desnormalizado) |
| `total_geral` | DECIMAL(15,2) | Total bruto |
| `desconto_percent` | DECIMAL(5,2) | Desconto em % |
| `desconto_valor` | DECIMAL(15,2) | Desconto em R$ |
| `total_com_desconto` | DECIMAL(15,2) | Total líquido |
| `notas_internas` | TEXT | Notas visíveis apenas internamente |
| `version` | INTEGER | Versão (auto-incrementa a cada `update`) |
| `parent_id` | UUID FK (self) | Referência à proposta original em revisões |
| `created_by` / `updated_by` | UUID | Auditoria de usuário |
| `created_at` / `updated_at` | TIMESTAMPTZ | Auditoria de tempo (trigger automático) |

**Índices:** `status`, `tipo`, `client_id`, `lead_id`, `data_emissao`, `created_at DESC`, `document_id`, `conteudo` (GIN para busca JSONB).

**RLS:** Leitura, inserção e atualização liberadas para usuários autenticados (`TO authenticated`).

**Tabela auxiliar:** `sales_quotation_audit_log` — registra cada ação com `old_status`, `new_status`, `changed_by` e `metadata JSONB`.

---

### 3.2 Modelo TypeScript — `SalesQuotation`

```
SalesQuotation
├── id, documentId, tipo, status
├── clientId, leadId
├── dataEmissao, validade
├── cliente: ClienteSnapshot           — snapshot gravado no momento da criação
│     nome, responsavel, email, telefone, documento, endereco, cidadeUf
├── equipamentos: ProposalEquipamento[]
│     id, descricao, potenciaKva, quantidade
│     franquiaHoras: FranquiaHoras     — standby | 120h | 240h | 360h | continuo
│     periodoLocacao: PeriodoLocacao   — semanal | quinzenal | mensal
│     valorUnitario, valorTotal
│     incluiCabo380v, valorCabo380v
│     incluiCabo220v, valorCabo220v
│     incluiManutencao, valorManutencao
│     observacoes
├── servicos: ProposalServico[]
│     id, codigo, descricao, quantidade, valorUnitario, valorTotal, observacoes
├── horasExcedentes: ProposalHoraExcedente[]
│     id, descricao, potenciaKva, valorUnitario, observacoes
├── condicoes: CondicoesComerciais      — 20+ campos de condições comerciais
├── totalEquipamentos, totalServicos, totalGeral
├── descontoPercent, descontoValor, totalComDesconto
├── version, parentId                  — versionamento
└── notasInternas
```

---

## 4. Ciclo de Vida (Status)

### 4.1 `DocumentStatus` — Propostas ao Cliente

```
draft ──────────────────────────────────────────► cancelled
  │                                                   ▲
  ▼                                                   │
pending_review ──────────────────────────────────────►│
  │                                                   │
  ▼                                                   │
pending_approval ────────────────────────────────────►│
  │                                                   │
  ├──► approved ──► sent_to_client ──► accepted       │
  │                                    │              │
  │                                    ▼              │
  │                          converted_to_contract    │
  │                                                   │
  ├──► rejected                                       │
  └──► expired                                        │
```

| Status | Label |
|---|---|
| `draft` | Rascunho |
| `pending_review` | Em Revisão |
| `pending_approval` | Aguardando Aprovação |
| `sent` | Enviado |
| `sent_to_client` | Enviado ao Cliente |
| `approved` | Aprovado |
| `accepted` | Aceito |
| `rejected` | Rejeitado |
| `converted_to_contract` | Convertido em Contrato |
| `expired` | Expirado |
| `cancelled` | Cancelado |

---

## 5. Zustand Store — `useQuotationStore`

Gerencia o **estado global do editor** de propostas. Persiste rascunhos localmente via `persist` middleware do Zustand.

### Estado

| Campo | Tipo | Descrição |
|---|---|---|
| `current` | `SalesQuotation \| null` | Proposta em edição |
| `drafts` | `SalesQuotation[]` | Rascunhos salvos localmente |
| `isDirty` | `boolean` | Há alterações não salvas |
| `isLoading` | `boolean` | Operação assíncrona em andamento |
| `error` | `string \| null` | Último erro |
| `previewMode` | `'edit' \| 'preview' \| 'split'` | Modo de visualização do editor |

### Principais Ações

| Ação | Descrição |
|---|---|
| `createNew(tipo?)` | Cria nova proposta em branco com defaults e `document_id` gerado |
| `loadQuotation(q)` | Carrega uma proposta existente no editor |
| `saveDraft()` | Salva localmente no array `drafts` (sem persistência no servidor) |
| `setCliente(c)` | Atualiza snapshot do cliente |
| `updateCliente(field, value)` | Atualização pontual de um campo do cliente |
| `setClientId(id)` / `setLeadId(id)` | Víncula ao CRM |
| `addEquipamento()` | Adiciona equipamento vazio |
| `updateEquipamento(id, updates)` | Atualiza campos de um equipamento |
| `removeEquipamento(id)` | Remove equipamento |
| `addServico()` / `updateServico()` / `removeServico()` | CRUD de serviços |
| `addHoraExcedente()` / `updateHoraExcedente()` / `removeHoraExcedente()` | CRUD de horas excedentes |
| `updateCondicoes(field, value)` | Atualização pontual das condições comerciais |
| `setDescontoPercent(n)` | Define desconto e recalcula totais |
| `recalculateTotals()` | Recalcula `totalEquipamentos`, `totalServicos`, `totalGeral`, `totalComDesconto` |
| `setPreviewMode(mode)` | Alterna entre `edit`, `preview` e `split` |

### Cálculo de Totais

```typescript
// Por equipamento:
total = valorUnitario × quantidade
      + (incluiCabo380v ? valorCabo380v × quantidade : 0)
      + (incluiCabo220v ? valorCabo220v × quantidade : 0)
      + (incluiManutencao ? valorManutencao × quantidade : 0)

// Por serviço:
total = valorUnitario × quantidade

// Totais gerais:
totalEquipamentos = Σ eq.valorTotal
totalServicos     = Σ serv.valorTotal
totalGeral        = totalEquipamentos + totalServicos
descontoValor     = totalGeral × (descontoPercent / 100)
totalComDesconto  = totalGeral - descontoValor
```

---

## 6. Serviço de Persistência — `quotationService`

Camada de acesso ao Supabase. Todos os dados do `conteudo` (cliente, equipamentos, serviços, condições) são serializados em uma única coluna JSONB.

### Funções

| Função | Descrição |
|---|---|
| `createQuotation(q, userId?)` | INSERT em `sales_quotations`, retorna a entidade criada |
| `updateQuotation(q, userId?)` | UPDATE, incrementa `version` automaticamente |
| `getQuotationById(id)` | SELECT por UUID |
| `getQuotationByDocumentId(docId)` | SELECT por código legível |
| `listQuotations(filters?)` | SELECT com filtros opcionais de status, tipo e cliente |
| `updateStatus(id, status)` | PATCH somente do campo `status` |
| `duplicate(id)` | Copia a proposta com novo `document_id`, status `draft` e `parentId` apontando para o original |
| `deleteQuotation(id)` | DELETE (soft delete não implementado — deleção física) |

### Mapeamento ORM Manual

O mapeador `quotationToRow` serializa para snake_case do banco; `rowToQuotation` desserializa de volta para camelCase do TypeScript, com fallbacks para campos ausentes.

---

## 7. Motor de Documentos (Engine)

### 7.1 Template Engine — `templateEngine.ts`

Define os **placeholders mustache** e os **templates HTML** de cada seção do documento impresso:

| Seção | Template | Descrição |
|---|---|---|
| Capa | `TEMPLATE_COVER` | Página 1 com imagem de fundo `/CAPA.png` e título do documento |
| Cabeçalho | `TEMPLATE_HEADER` | Logo + número do documento + data (reutilizado em todas as páginas) |
| Introdução | `TEMPLATE_INTRO` | Dados do cliente + texto institucional EGEN + imagem do gerador |
| Equipamentos | `TEMPLATE_EQUIPAMENTOS` | Tabela: Descrição / Qtd / Franquia / Período / Valor Unit. / Valor Total |
| Serviços | `TEMPLATE_SERVICOS` | Tabela: Descrição / Qtd / Valor Unit. / Valor Total |
| Horas Excedentes | `TEMPLATE_HORAS_EXCEDENTES` | Tabela: Descrição / Valor Unit. / Observação |
| Totais | `TEMPLATE_TOTAIS` | Subtotais + desconto + total final |
| Condições | `TEMPLATE_CONDICOES` | Grid de 20+ campos de condições comerciais |

Cada tipo de documento (`proposta`, `orcamento`, `contrato`) pode ter configurações de template diferentes via `getTemplateForType(tipo): TemplateConfig`.

**Formato dos placeholders:**
```
{{documento.id}}
{{cliente.nome}}
{{equipamentos.table}}
{{totais.final}}
{{condicoes.formaPagamento}}
```

### 7.2 Render Engine — `renderEngine.ts`

Substitui os placeholders por valores reais de uma `SalesQuotation`:

1. **Extração de valores** — `extractPlaceholderValues(quotation)` monta um mapa `placeholder → valor string`.
2. **Render de tabelas** — `renderEquipamentosTable`, `renderServicosTable`, `renderHorasExcedentesTable` constroem o HTML das linhas `<tr>` incluindo adicionais (cabos, manutenção) e observações.
3. **Substituição** — percorre o template HTML e substitui cada placeholder pelo valor mapeado.
4. **Opções de render:**
   - `includeStyles: true` — injeta o CSS embutido (para impressão e PDF)
   - `printMode: true` — adiciona classes para formatação A4

**Formatadores utilitários:**

| Função | Descrição |
|---|---|
| `formatCurrency(value)` | Formata como `R$ 1.234,56` via `Intl.NumberFormat` |
| `formatDate(dateStr)` | Converte `YYYY-MM-DD` para `DD/MM/YYYY` |
| `formatNumber(value)` | Formata número com separador de milhar |

---

## 8. Componentes de UI

### 8.1 `SalesQuotationPage`

Página principal acessada via `/propostas/nova` ou `/propostas/:id`.

- Lê o parâmetro de rota `:id` via `useParams`
- Se `:id` presente: carrega a proposta existente via `quotationService.getById()`
- Se `:id` ausente: cria nova via `store.createNew('proposta')`
- Controla o modo de visualização (`form | preview | split`)
- Oferece ações: **Salvar**, **Alterar Status**, **Duplicar**, **Imprimir**

### 8.2 `QuotationForm`

Formulário em seções **accordion** (abertura/fechamento animado via Framer Motion):

| Seção | Componente filho |
|---|---|
| Dados do Documento | campos de tipo, status, datas |
| Cliente | `ClientSelector` |
| Equipamentos | `EquipmentSelector` |
| Serviços | `ServiceSelector` |
| Horas Excedentes | campos inline |
| Condições Comerciais | `ConditionsEditor` |
| Desconto | campo numérico com recálculo automático |
| Notas Internas | textarea |

### 8.3 `ClientSelector`

- Integrado ao `useCRM()` — lista clientes e leads do módulo CRM
- Busca por nome, documento ou empresa
- Tabs "Clientes" / "Leads"
- Na seleção: converte `Client` ou `Lead` em `ClienteSnapshot` e atualiza o store
- Armazena também `clientId` ou `leadId` para manter o vínculo relacional

### 8.4 `EquipmentSelector`

- Integrado ao `usePricing()` do módulo de pricing
- Ao selecionar **Potência + Período + Franquia**, busca automaticamente o preço na tabela de preços e preenche `valorUnitario`, `valorCabo380v`, `valorCabo220v`, `valorManutencao`
- Suporta checkboxes para incluir/excluir cabos e manutenção preventiva
- Recalcula totais do store após cada alteração

### 8.5 `QuotationPreview`

- Renderiza o HTML gerado pelo `RenderEngine` dentro de um `<div>` escalável
- Controles de zoom (+/−/reset)
- **Imprimir:** abre `window.open()` com HTML completo + CSS embutido e chama `window.print()`
- **Download PDF:** usa `html2pdf.js` (importação dinâmica) com escala 2x para alta resolução, formato A4, quebra de página antes de cada `.page`

### 8.6 `ConditionsEditor`

Editor de grade para os 20+ campos de `CondicoesComerciais`. Cada campo é um `<input type="text">` ligado ao `store.updateCondicoes()`. Os valores default cobrem os padrões comerciais da EGEN.

---

## 9. Geração do `document_id`

```typescript
function generateDocumentId(tipo: DocumentTipo): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000; // 4 dígitos

  const prefix = { proposta: 'PROP', orcamento: 'ORC', contrato: 'CONT' }[tipo];
  return `${prefix}-${year}-${random}`;
  // Exemplos: PROP-2026-4821, ORC-2026-1234, CONT-2026-9001
}
```

> **Nota:** A unicidade é garantida pelo constraint `UNIQUE` na coluna `document_id`. Em caso de colisão (raro, ~0.01%), o INSERT falha e deve ser retentado com novo ID gerado.

---

## 10. Versionamento e Revisões

Cada `updateQuotation()` incrementa o campo `version`. Para criar uma **revisão formal** (nova proposta derivada), usa-se `duplicate(id)`, que:

1. Copia todos os dados da proposta original
2. Gera novo `document_id`
3. Define `status = 'draft'`
4. Preenche `parent_id` com o UUID da original
5. Reseta `version = 1`

Isso permite rastrear a árvore de revisões via `parent_id`.

---

## 11. Condições Comerciais — Defaults

Os defaults da EIGEN aplicados automaticamente em toda nova proposta:

| Campo | Default |
|---|---|
| Forma de Pagamento | Boleto - 15 dias |
| Faturamento | Data da saída do pátio |
| Prazo de Entrega | A combinar |
| Validade da Proposta | 15 dias |
| Início da Cobrança | Data da saída dos equipamentos |
| Final da Cobrança | Data do retorno |
| Período Mínimo | 30 dias |
| Tensão | 380/220V |
| Emissão ART | Não incluso |
| Transporte (Envio) | Orçado |
| Transporte (Retirada) | Orçado |
| Carga/Descarga Mobilização | Orçado |
| Instalação | Sim |
| Manutenção Preventiva | Orçado sob demanda |
| Combustível | Não Incluso |
| Seguro | Incluso |
| Impostos | Incluso |
| Telemetria | Não incluso |

---

## 12. Integração com Outros Módulos

| Módulo | Tipo de Integração |
|---|---|
| **CRM** (`src/modules/crm`) | `ClientSelector` consome `useCRM()` para listar clientes e leads; vínculo via `client_id` / `lead_id` na tabela |
| **Pricing** (`src/modules/pricing`) | `EquipmentSelector` consome `usePricing()` para preenchimento automático de preços por potência/período/franquia |
| **Auth** (`src/hooks/useAuth`) | `SalesQuotationPage` e `quotationService` usam `userId` para auditar `created_by` / `updated_by` |

---

## 13. Fluxo de Dados Resumido

```
Usuário
  │
  ▼
SalesQuotationPage
  │  useParams(:id) → quotationService.getById()  ou  store.createNew()
  ▼
useQuotationStore (Zustand + persist)
  ├── current: SalesQuotation   ◄── todas as mutações
  └── drafts[]                  ◄── saveDraft() (local)
  │
  ├──► QuotationForm
  │       ClientSelector  ──► useCRM()
  │       EquipmentSelector ─► usePricing()
  │       ConditionsEditor
  │       (cada campo chama store.update*() + recalculateTotals())
  │
  └──► QuotationPreview
           RenderEngine.render(current)
             templateEngine: monta HTML com placeholders
             renderEngine: substitui placeholders → HTML final
           ┌── Imprimir → window.open() + window.print()
           └── Download → html2pdf.js → arquivo .pdf
  │
  ▼
handleSave()
  └── quotationService.create() / .update()
        └── supabase.from('sales_quotations').insert/update
```

---

## 14. Arquivos de Referência

| Arquivo | Papel |
|---|---|
| [src/modules/quotations/types/proposal.ts](../src/modules/quotations/types/proposal.ts) | Todos os tipos, enums, defaults e helpers de cálculo |
| [src/modules/quotations/stores/quotationStore.ts](../src/modules/quotations/stores/quotationStore.ts) | Store Zustand completo |
| [src/modules/quotations/services/quotationService.ts](../src/modules/quotations/services/quotationService.ts) | CRUD Supabase + mappers |
| [src/modules/quotations/engine/templateEngine.ts](../src/modules/quotations/engine/templateEngine.ts) | Placeholders + templates HTML por seção |
| [src/modules/quotations/engine/renderEngine.ts](../src/modules/quotations/engine/renderEngine.ts) | Motor de substituição + formatadores |
| [src/modules/quotations/components/proposal/SalesQuotationPage.tsx](../src/modules/quotations/components/proposal/SalesQuotationPage.tsx) | Página principal do editor |
| [src/modules/quotations/components/proposal/QuotationForm.tsx](../src/modules/quotations/components/proposal/QuotationForm.tsx) | Formulário em accordion |
| [src/modules/quotations/components/proposal/QuotationPreview.tsx](../src/modules/quotations/components/proposal/QuotationPreview.tsx) | Preview A4 + download PDF |
| [src/modules/quotations/components/proposal/EquipmentSelector.tsx](../src/modules/quotations/components/proposal/EquipmentSelector.tsx) | Seletor de equipamentos com auto-preço |
| [src/modules/quotations/components/proposal/ClientSelector.tsx](../src/modules/quotations/components/proposal/ClientSelector.tsx) | Seletor integrado ao CRM |
| [supabase/migrations/20260316120000_sales_quotations.sql](../supabase/migrations/20260316120000_sales_quotations.sql) | Schema do banco de dados |
