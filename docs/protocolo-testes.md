# Protocolo de Testes — EGEN Geradores

> Executar item a item. Marcar ✓ em cada passo validado.

---

## 1. Classificações (Leads e Clientes)

| # | Teste | Resultado |
|---|-------|-----------|
| 1.1 | Abrir cadastro de **Lead** → campo Classificação → dropdown exibe **todas as 23 opções** (12 antigas + 11 novas) |
| 1.2 | Abrir cadastro de **Cliente** → campo Classificação → mesmas 23 opções |
| 1.3 | Cadastrar lead com classificação "Frigorífico" → salvar → reabrir → classificação mantida |
| 1.4 | Cadastrar cliente com classificação "Usina" → salvar → reabrir → classificação mantida |

---

## 2. Campo Responsável no Lead

| # | Teste | Resultado |
|---|-------|-----------|
| 2.1 | Modal "Novo Lead" → campo **Responsável** visível entre Empresa e CNPJ/CPF |
| 2.2 | Preencher responsável "João Silva" → salvar → reabrir lead → campo preenchido |
| 2.3 | Clicar em lead na listagem (abre detail modal) → **modo visualização** mostra responsável |
| 2.4 | No detail modal → clicar Editar → campo Responsável editável |
| 2.5 | Importar planilha com coluna "Responsável" → valor importado corretamente |
| 2.6 | Baixar template de importação → coluna "Responsável" presente no CSV |

---

## 3. Correções no Formulário de Lead

| # | Teste | Resultado |
|---|-------|-----------|
| 3.1 | DDD → campo limitado a **2 dígitos** (não mais 5) |
| 3.2 | Status "Cliente potencial" → campo **Data de Agendamento** aparece → tentar salvar **sem data** → submit **bloqueado** |
| 3.3 | Status "Retomar contato" → campo Data aparece → tentar salvar sem data → bloqueado |
| 3.4 | Status "Cliente com demanda" → campo Data de Agendamento **agora aparece** |
| 3.5 | Preencher data de agendamento → mudar status para "A contatar" → voltar para "Cliente potencial" → **data NÃO foi apagada** |

---

## 4. Responsável na Proposta (lead → proposta)

| # | Teste | Resultado |
|---|-------|-----------|
| 4.1 | Criar lead com responsável "Maria" → botão "Gerar Proposta" → abrir proposta → campo "Aos cuidados" **preenchido com "Maria"** |
| 4.2 | Criar lead SEM responsável → gerar proposta → "Aos cuidados" preenchido com **nome do lead** (fallback) |
| 4.3 | Criar lead com DDD "11" e telefone "99999-0000" → gerar proposta → telefone aparece como **(11) 99999-0000** (sem parênteses duplicados) |

---

## 5. Quebra de Página — Observações

| # | Teste | Resultado |
|---|-------|-----------|
| 5.1 | Abrir proposta com itens → preencher observações com **texto curto** (1 linha) → preview → observações aparecem **no final da última página de escopo**, sem invadir footer |
| 5.2 | Preencher observações com **texto longo** (10+ linhas) → preview → observações vão para **página própria**, sem invadir footer |
| 5.3 | Exportar PDF → observar que observações longas **não cortam** nem sobrepõem rodapé |

---

## 6. Permissões de Propostas

| # | Teste | Resultado |
|---|-------|-----------|
| 6.1 | **Admin**: Gerenciar Cargos → editar cargo "Administrador" → checkbox **"Ver Todas as Propostas"** marcado → salvar → página recarrega permissões automaticamente |
| 6.2 | **Admin**: ir para /propostas → vê **todas** as propostas de todos os vendedores |
| 6.3 | **Admin**: filtro de vendedor mostra dropdown com "Todos os vendedores" |
| 6.4 | **Admin**: abrir proposta de outro vendedor pela URL direta → carrega normalmente |
| 6.5 | Criar cargo "Vendedor" com apenas **"Ver Próprias Propostas"** (sem "Ver Todas") → atribuir a um usuário |
| 6.6 | **Vendedor**: ir para /propostas → vê **apenas** propostas onde é o vendedor |
| 6.7 | **Vendedor**: filtro de vendedor mostra **"Minhas propostas"** (não dropdown) |
| 6.8 | **Vendedor**: tentar abrir proposta de outro vendedor via URL direta → redirecionado com "Acesso negado" |
| 6.9 | **Admin**: excluir uma proposta → proposta **removida** da listagem (não fica como "Cancelada") |

---

## 7. Ranking de Vendedores (Dashboard)

| # | Teste | Resultado |
|---|-------|-----------|
| 7.1 | Dashboard → seção "Ranking de Vendedores" visível para admin |
| 7.2 | Filtro "Todo período" → ranking mostra dados acumulados |
| 7.3 | Filtro "Últimos 30 dias" → dados filtrados por data de emissão |
| 7.4 | Ordenar por "Valor Total" → ranking reordenado |
| 7.5 | Ordenar por "Qtd. Propostas" → ranking reordenado |
| 7.6 | Ordenar por "Fechadas" → ranking reordenado |
| 7.7 | Checkbox "Detalhado" → colunas extras aparecem (Negociação, Perdidas, Pesquisa, Tx. Conversão) |
| 7.8 | Desmarcar "Detalhado" → colunas extras somem |
| 7.9 | Seletores de filtro usam **componente customizado** (não selects nativos do navegador) |

---

## 8. Navegação CRM

| # | Teste | Resultado |
|---|-------|-----------|
| 8.1 | Sidebar → clicar "Leads" → página CRM abre na **aba Leads** |
| 8.2 | Sidebar → clicar "Clientes" → página CRM abre na **aba Clientes** |
| 8.3 | Home → card "Leads" → abre /crm/leads corretamente |
| 8.4 | Clicar nas tabs internas do CRM → URL atualiza (ex: /crm/pipeline) |

---

## 9. Franquia Personalizada (Gerador)

| # | Teste | Resultado |
|---|-------|-----------|
| 9.1 | Nova proposta → adicionar gerador → campo Franquia é **ComboBox** (permite digitar) |
| 9.2 | Selecionar "Stand-By (4h/mês)" → valor preenchido e preço calculado automaticamente |
| 9.3 | Digitar franquia personalizada "200h" → valor aceito → **preço NÃO calculado** (preencher manualmente) |
| 9.4 | Salvar proposta com franquia personalizada → preview/PDF mostra "200h" no lugar da franquia |

---

## 10. Regressão Geral

| # | Teste | Resultado |
|---|-------|-----------|
| 10.1 | Dashboard carrega sem erros no console |
| 10.2 | Página de Clientes → CRUD funciona |
| 10.3 | Página de Propostas → criar, editar e visualizar funciona |
| 10.4 | Preview de proposta → todas as páginas renderizam sem warnings de key duplicada |
| 10.5 | Exportar PDF → sem erros |
| 10.6 | Login/logout funciona |
| 10.7 | Temas claro/escuro funcionam |

---

## Check de Console

| Verificação | Status |
|-------------|--------|
| Nenhum erro vermelho no console |  |
| Nenhum warning de key duplicada `1.23` |  |
| Nenhum erro 401/403 nas chamadas Supabase |  |

---

## Resultado Final

- [ ] **APROVADO** — Commitar
- [ ] **REPROVADO** — Corrigir itens: _______________
