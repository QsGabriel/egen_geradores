# Plano de Modernização & Polimento de UI — EGEN Geradores

**Data:** 2026-07-20
**Autor:** Engenharia Front-end
**Status:** ✅ Implementado (2026-07-20) — validado via build do Vite + verificação visual (Edge headless, claro/escuro)
**Natureza:** Polimento premium (NÃO é refactor/rewrite)

---

## 1. Objetivo & Princípios

Elevar o acabamento visual do sistema a um nível "premium", corrigindo estilos padrão de navegador, inconsistências de design tokens e falta de responsividade em elementos pontuais — **mantendo o design system atual** (paleta `egen`, Inter, cantos arredondados, glass/blur, framer-motion).

Além disso, entregar o item de maior impacto de UX: **sidebar flutuante com modo colapsável**, inspirada no padrão do FlowLab (`FlowLab/src/components/Layout.tsx`), **adaptada à identidade visual da EGEN** (navy + amarelo), para otimizar espaço de tela — crítico no módulo de Propostas.

### Princípios inegociáveis

1. **Polir, não reescrever.** A maior parte dos ganhos vem de uma **camada global de design system** (CSS + config Tailwind), que melhora dezenas de telas sem tocar em cada componente.
2. **Zero mudança de lógica/negócio.** Nenhuma alteração em hooks, services, permissões, queries ou fluxo de dados.
3. **Marca em primeiro lugar.** Ao portar a mecânica do FlowLab, mantemos a identidade EGEN (navy `#0D2A59` + amarelo `#F3B229`), não as cores do FlowLab (azul/branco).
4. **Sem novas dependências.** Tudo já está no projeto: Tailwind 3.4, framer-motion 12, lucide-react.
5. **Dark mode e responsividade** tratados como cidadãos de primeira classe em toda alteração.

---

## 2. Diagnóstico (baseado em evidências do código)

### 2.1 Design tokens existem, mas são subutilizados
- `tailwind.config.js` define uma paleta de marca completa (`egen.navy`, `egen.yellow`, `egen.blue`, `egen.green`, `egen.red`, superfícies dark, `shadow-card`, `rounded-card`).
- Na prática, os componentes misturam tokens de marca com Tailwind genérico. Exemplo concreto: `Select.tsx` usa `egen-navy`/`egen-yellow`, mas `FilterSelect.tsx` usa `yellow-500`. O foco (`focus:ring-*`) aparece **210 vezes em 39 arquivos**, com cores misturadas: `blue`, `yellow`, `egen`, `indigo`, `purple`, `gray`.
- **Consequência:** o "amarelo de foco" e o "azul de ação" variam de tela para tela. É a inconsistência mais visível e a de correção mais barata.

### 2.2 Estilos padrão de navegador vazando (form controls)
- **63 `<select>` nativos em 26 arquivos**, mas apenas **14 `appearance-none` em 4 arquivos**. Ou seja, a grande maioria dos selects exibe a seta e o dropdown nativos do SO — quebrando o dark mode e a consistência visual.
- Existe um `Select.tsx` customizado (excelente) no módulo de cotações, mas ele **não** é usado na maioria das telas. Trocar todos os selects seria refactor — **fora de escopo**. A solução correta é uma **camada CSS global** que estiliza o `<select>` nativo (seta custom, borda, padding, dark mode) sem tocar nos componentes.
- Checkboxes, radios e inputs de data/número nativos também não têm tratamento de marca global.

### 2.3 Base CSS global é forte, mas tem lacunas
`src/index.css` já traz uma base rica: animações, scrollbar custom, `focus-visible`, `prefers-reduced-motion`, safe-area insets, `dvh`, transições de tema. Lacunas identificadas:
- `<select>` nativo não tratado globalmente (ver 2.2).
- `input:focus` global usa `egen-blue`, mas `select`/`textarea`/checkbox/radio nativos não recebem o mesmo tratamento de marca.
- A classe `.custom-scrollbar` é **referenciada** (Layout) mas **não está definida** — hoje é um no-op que depende do scrollbar global. Baixo impacto, mas é um débito.
- Estados genéricos: spinner de loading em `App.tsx` usa `border-blue-600` (não é a marca); "Acesso Negado" usa vermelho genérico.

### 2.4 Sidebar atual vs. objetivo
- **Atual** (`src/components/Layout.tsx`): barra navy sólida, altura total, largura fixa `lg:w-64`, **sem** colapso, **sem** visual flutuante, submenu por `max-height` (funcional, mas menos fluido).
- **Objetivo** (mecânica do FlowLab): card **flutuante** (`top-4 bottom-4 left-4`, `rounded-3xl`, glass/blur, `shadow-2xl`), com **modo colapsado** (rail de ícones `w-20`, tooltips, flyout de submenu via portal) e persistência em `localStorage`.
- A EGEN tem apenas **1 item com subitens** (Comercial → Clientes / Leads / Propostas), então o flyout colapsado é simples de portar.

---

## 3. Escopo — o que NÃO faremos

- ❌ Não reescrever componentes de página nem extrair uma biblioteca de primitivos (`Button`, `Input`, `Card`).
- ❌ Não substituir os 63 `<select>` nativos por componente React (isso é refactor).
- ❌ Não trocar libs, roteamento, gerenciamento de estado ou lógica de permissões.
- ❌ Não portar o "Editor de Categorias" + drag-and-drop do FlowLab (a EGEN não precisa — apenas 5 itens de menu). A navegação permanece plana.
- ❌ Não mexer no renderizador de proposta (`ProposalPrintDocument.tsx` / `ProposalPreview.css`) — território sensível e fora do tema deste polimento.

---

## 4. Plano por Fases

Ordenado por **relação impacto/risco**. As Fases 1–2 são "camada global" (alto alcance, baixo risco). A Fase 3 é o item-estrela (sidebar).

### Fase 1 — Camada global de form controls *(maior alcance, risco baixo)*
Adicionar ao `src/index.css` (e, quando fizer sentido, plugin utilitário no Tailwind) um tratamento consistente para controles nativos. **Sem tocar em nenhum componente.**

- `<select>` nativo: `appearance: none` + seta SVG custom (chevron) via `background-image`, borda/padding/raio de marca, estados hover/focus, cores dark mode. Aplicar com escopo seguro (ex.: não afetar o `Select.tsx` custom, que usa `<button>`, então não há colisão).
- `input[type=checkbox]` / `input[type=radio]`: `accent-color: var(--egen-yellow)` (ou navy), para checagem na cor da marca de forma nativa e barata.
- `input[type=date/time/number]`, `textarea`: harmonizar borda, foco (já parcialmente global) e dark mode.
- Placeholder, `:disabled`, `:read-only`: estados consistentes.

**Entregável:** bloco `@layer base`/`@layer components` novo em `index.css`. Ganho imediato em ~26 telas com selects nativos.

### Fase 2 — Foco & estados unificados *(alcance alto, risco baixo)*
- Consolidar o **anel de foco** em um único token de marca via `:focus-visible` global (hoje já é `blue-500` genérico → mudar para `egen-blue`/`egen-yellow` conforme contexto claro/escuro).
- Definir de fato a classe `.custom-scrollbar` (hoje ausente) para o comportamento pretendido na sidebar/áreas de navegação.
- Padronizar spinner/loading e a tela "Acesso Negado" para tokens de marca (2 pontos pontuais em `App.tsx`).
- **Opcional (a decidir):** varredura de find/replace conservadora trocando `focus:ring-blue-*`/`focus:ring-yellow-*` avulsos por um token único — só se aprovado, pois toca vários arquivos (é seguro, mas amplo).

### Fase 3 — Sidebar flutuante + colapsável *(item-estrela)*
Reescrita **isolada** de `src/components/Layout.tsx`, portando a mecânica do FlowLab e **adaptando à identidade EGEN**. Detalhes na seção 5.

- Novo componente auxiliar `src/components/CollapsedFlyoutMenu.tsx` (portado do FlowLab, recolorido para a marca) para o submenu "Comercial" no estado colapsado.
- Persistência do estado colapsado em `localStorage` (`egen_sidebar_collapsed`).
- Ajuste do padding do conteúdo (`lg:pl-*`) conforme colapso, preservando o full-bleed já existente de `/` e `/propostas/...`.

### Fase 4 — Polimento fino *(cosmético, risco baixo)*
- Consistência de raios/sombras usando `shadow-card`/`rounded-card` da config onde hoje há valores avulsos.
- Micro-transições e hover states coerentes (aproveitando utilitários já existentes: `hover-lift`, `card-interactive`, `transition-smooth`).
- Tipografia: escala e pesos consistentes em títulos de página/cards (sem redesenhar layouts).
- Revisão de contraste dark mode em superfícies secundárias.

---

## 5. Detalhamento da Sidebar (Fase 3)

### 5.1 Adaptação de marca (o ponto mais importante do port)
| Aspecto | FlowLab (origem) | EGEN (destino) |
|---|---|---|
| Superfície | `bg-white/70` glass | `bg-egen-navy/80` + `backdrop-blur-2xl` (glass navy) |
| Borda | `border-white/60` | `border-white/10` |
| Item ativo | gradiente azul | `bg-egen-yellow/10 text-egen-yellow` + acento amarelo (mantém padrão atual da EGEN) |
| Accent/hover | azul | `hover:bg-white/5 hover:text-white` |
| Logo | logos LAB | logos EGEN (`/LOGO-HOR-DM.png` expandida, ícone quadrado no colapsado) |

### 5.2 Estados e comportamento
- **Expandido (desktop):** card flutuante `lg:top-4 lg:bottom-4 lg:left-4`, `w-64`, `rounded-3xl`, `shadow-2xl`. Navegação plana (sem categorias), com submenu "Comercial" expansível (animado com framer-motion, substituindo o `max-height` atual).
- **Colapsado (desktop):** `w-20`, rail de ícones centralizados, **tooltip** ao hover em cada ícone, e **flyout via portal** para o submenu "Comercial". Rodapé colapsado: avatar + theme toggle + logout empilhados com tooltip.
- **Toggle de colapso:** botão no rodapé, com chevron rotativo e persistência em `localStorage`. Reidrata no load (sem "flash").
- **Mobile:** mantém o drawer atual (overlay + slide-in), apenas reharmonizado ao novo visual navy/flutuante. O colapso é um recurso desktop (`lg:`).

### 5.3 Impacto no conteúdo
- Wrapper do conteúdo passa a ter padding condicional: `lg:pl-24` (colapsado) / `lg:pl-64` (expandido), com `transition-[padding]`.
- **Preservar** o full-bleed já existente para `/` e `/propostas/...` (o `main` continua sem `py/px` nessas rotas). O ganho de ~180px na horizontal com a sidebar colapsada beneficia diretamente o editor de propostas.

### 5.4 Acessibilidade
- Tooltips com `aria-label` nos ícones colapsados; alvos de toque ≥ 44px (já garantido pelo `@media (pointer: coarse)` global).
- Foco visível respeitando o token unificado da Fase 2.
- `prefers-reduced-motion` já é respeitado globalmente — animações de colapso/flyout ficam curtas.

---

## 6. Riscos & Mitigações

| Risco | Mitigação |
|---|---|
| CSS global de `<select>` afetar dropdowns customizados | Os customizados (`Select.tsx`, `FilterSelect.tsx`, `ComboBox.tsx`) usam `<button>`, não `<select>` — sem colisão. Testar visualmente as telas com select nativo. |
| Regressão de layout ao mexer no `Layout.tsx` | Alteração isolada; o `Layout` é autocontido e wrappa as rotas. Verificar padding do conteúdo em cada breakpoint. |
| "Flash" de estado colapsado no load | Ler `localStorage` no `useState` inicializador (padrão já usado no FlowLab). |
| Varredura de focus-ring tocar muitos arquivos | Manter como **opcional/aprovável à parte**; o ganho principal vem do `:focus-visible` global. |
| Full-bleed das propostas quebrar | Preservar exatamente a condição de rota atual; validar `/propostas/nova` e `/propostas/:id`. |

---

## 7. Critérios de Aceite / Verificação

- [ ] Nenhum `<select>` exibindo seta/dropdown nativo do SO (claro e escuro).
- [ ] Anel de foco visualmente idêntico em inputs, selects, botões e links em toda a app.
- [ ] Sidebar colapsa/expande com persistência entre reloads e sem flash.
- [ ] Flyout do submenu "Comercial" funciona no estado colapsado (posicionado via portal, sem clipping).
- [ ] Conteúdo reflui corretamente ao colapsar (desktop) em `lg`/`xl`; editor de propostas ganha largura.
- [ ] Mobile drawer intacto e reharmonizado.
- [ ] Zero mudança de comportamento funcional (navegação, permissões, dados).
- [ ] Verificação visual em claro/escuro nas telas-chave: Dashboard, CRM (Clientes/Leads), Propostas (lista + editor), Equipamentos, Usuários.

> Observação de verificação: para o editor de propostas, seguir o método já documentado (harness de screenshot com o CSS real; a app exige auth/dados).

---

## 8. Ordem de Execução Sugerida

1. **Fase 1** (form controls globais) — entrega valor visível imediato, risco mínimo.
2. **Fase 2** (foco/estados) — consolida a consistência.
3. **Fase 3** (sidebar) — item-estrela; validar em desktop e mobile.
4. **Fase 4** (polimento fino) — passada final de acabamento.

Cada fase é independentemente commitável e reversível. Sugiro validar visualmente ao fim de cada fase antes de seguir.

---

## 9. Arquivos previstos (impacto)

| Arquivo | Fase | Tipo de mudança |
|---|---|---|
| `src/index.css` | 1, 2, 4 | Adição de camadas globais (form controls, foco, scrollbar, tokens) |
| `tailwind.config.js` | 1, 4 | (Opcional) tokens semânticos / utilitário de foco |
| `src/components/Layout.tsx` | 3 | Reescrita isolada da sidebar (flutuante + colapso) |
| `src/components/CollapsedFlyoutMenu.tsx` | 3 | **Novo** — flyout de submenu colapsado (marca EGEN) |
| `src/App.tsx` | 2 | 2 ajustes pontuais (spinner, "Acesso Negado") |
| *(opcional)* telas com `focus:ring-*` avulso | 2 | Find/replace conservador — **somente se aprovado** |

---

### Decisões confirmadas (2026-07-20)
1. ✅ **Cor do anel de foco: contextual** — amarelo (`egen-yellow`) sobre superfícies escuras/navy; navy/azul (`egen-navy` claro, `egen-blue` escuro) sobre superfícies claras. Priorizando contraste.
2. ✅ **Focus rings: apenas consolidação global** via `:focus-visible`. Não haverá varredura find/replace nos ~39 arquivos — os `ring-*` inline permanecem, coerentes com o token global. Baixo risco.
3. ✅ **Colapso da sidebar: persistência pura** — respeita sempre a última escolha do usuário via `localStorage`. Sem auto-colapso por rota.
```
