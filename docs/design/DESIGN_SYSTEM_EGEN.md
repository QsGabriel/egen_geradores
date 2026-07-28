# Design System — EGEN System

Documento de referência visual e UX/UI para o sistema interno da EGEN Geradores.
Versão inicial para implementação no frontend React.

## 1. Princípios de Design

O design do sistema deve refletir os valores da EGEN:
* Energia
* Confiabilidade
* Tecnologia
* Operação industrial

**Diretrizes principais:**
* Interface limpa e objetiva
* Layout focado em dados operacionais
* Visual corporativo e seguro com a presença da identidade da marca
* Uso estratégico de cores de destaque para ações e status
* Componentes reutilizáveis

## 2. Paleta de Cores

A identidade visual do sistema utiliza o Azul Marinho corporativo da marca como base de ancoragem, o Amarelo como destaque principal, e incorpora os tons de Azul Claro e Verde do símbolo para ações secundárias e de feedback.

**Cores Primárias**

| Cor | Hex | Uso |
| :--- | :--- | :--- |
| Azul Marinho EGEN | `#0D2A59` | Backgrounds de Header e Sidebar, Tipografia principal em botões de destaque |
| Amarelo EGEN | `#F3B229` | Destaques, botões de ação principal (Primary), badges |
| Branco | `#FFFFFF` | Texto em fundos escuros, áreas de conteúdo e cards |
| Cinza Escuro | `#2B2B2B` | Textos padrão e neutros |

**Cores Secundárias e Semânticas**

| Cor | Hex | Uso |
| :--- | :--- | :--- |
| Azul Claro EGEN | `#6A93C7` | Links, botões secundários, ícones informativos |
| Verde EGEN | `#7AC15F` | Status positivo (Sucesso, Ativo, Disponível) |
| Cinza Médio | `#6B6B6B` | Texto secundário, legendas |
| Background Leve | `#F5F7FA` | Fundo principal da aplicação (cinza levemente azulado) |
| Vermelho Alerta | `#E5484D` | Erros e ações destrutivas (Excluir, Cancelar) |

## 3. Tipografia

O site utiliza uma tipografia moderna e corporativa, excelente para leitura de dados.

**Fonte principal:** `Inter`

**Motivos:**
* Excelente para dashboards
* Legível em dados e tabelas
* Muito usada em aplicações SaaS corporativas

**Hierarquia tipográfica:**

| Elemento | Tamanho |
| :--- | :--- |
| Heading 1 | 32px |
| Heading 2 | 24px |
| Heading 3 | 20px |
| Body | 16px |
| Small | 14px |
| Caption | 12px |

**Peso recomendado:**
* Regular — 400
* Medium — 500
* Bold — 700

## 4. Grid e Layout

O sistema seguirá o padrão de dashboard SaaS.

**Grid base:** 12 colunas

**Espaçamento:**

| Tipo | Valor |
| :--- | :--- |
| XS | 4px |
| SM | 8px |
| MD | 16px |
| LG | 24px |
| XL | 32px |

## 5. Estrutura de Layout

Layout padrão do sistema.

```text
┌───────────────────────────────┐
│            HEADER             │
├───────────────┬───────────────┤
│               │               │
│    SIDEBAR    │    CONTENT    │
│               │               │
│               │               │
└───────────────┴───────────────┘
6. Header
Elementos:

Logo EGEN

Busca global

Notificações

Menu de usuário

Altura: 64px
Cor de Fundo: #0D2A59 (Azul Marinho EGEN)
Cor dos Ícones/Texto: #FFFFFF

7. Sidebar
Menu lateral de navegação.

Estrutura:

Dashboard

Clientes

Orçamentos

Equipamentos

Manutenção

Financeiro

Estoque

Usuários

Configurações

Estilo:

Background: #0D2A59 (Azul Marinho EGEN)

Texto: #FFFFFF

Item ativo: Fundo rgba(243, 178, 41, 0.1) com borda ou ícone em #F3B229 (Amarelo EGEN)

8. Cards
Os dados do sistema serão exibidos em cards.

Estilo:

background: #FFFFFF

border-radius: 10px

box-shadow: 0 4px 6px rgba(13, 42, 89, 0.05) (sombra suave puxando para o azul)

padding: 24px

9. Botões
Primary Button

background: #F3B229 (Amarelo EGEN)

color: #0D2A59 (Azul Marinho EGEN)

border-radius: 8px

padding: 10px 16px

Uso: salvar, criar, confirmar

Secondary Button

background: transparent

border: 1px solid #6A93C7 (Azul Claro EGEN)

color: #6A93C7

Danger Button

background: #E5484D

color: #FFFFFF

10. Inputs
Estilo padrão:

height: 40px

border-radius: 8px

border: 1px solid #DDD

padding: 8px 12px

Estado focus:

border-color: #6A93C7 (Azul Claro EGEN)

box-shadow: 0 0 0 2px rgba(106, 147, 199, 0.2)

11. Tabelas
As tabelas são centrais no sistema.

Estilo:

background: #FFFFFF

border-radius: 10px

header background: #F5F7FA

Colunas:

Cliente

Contrato

Equipamento

Status

Valor

Ações

12. Badges de Status
Formato:

padding: 4px 8px

border-radius: 6px

font-size: 12px

font-weight: 500

Cores por Status:

Ativo / Disponível: Fundo verde claro com texto em #7AC15F (Verde EGEN)

Pendente / Manutenção: Fundo amarelo claro com texto em #F3B229 (Amarelo EGEN)

Cancelado / Erro: Fundo vermelho claro com texto em #E5484D

13. Dashboard
Cards principais:

Equipamentos disponíveis

Equipamentos locados

Manutenções próximas

Contratos ativos

Faturamento do mês

Layout: 4 cards por linha

14. Ícones
Biblioteca recomendada: Lucide Icons
Motivo: leve, compatível com React, moderno e combina com a fonte Inter.

15. Animações
Utilizar animações leves para não comprometer a performance e a sensação de "sistema ágil".
Biblioteca recomendada: Framer Motion
Exemplos: abertura de modais, loading states, dropdowns.

16. Responsividade
Breakpoints:

Mobile: 640px

Tablet: 768px

Laptop: 1024px

Desktop: 1280px

17. Componentes Reutilizáveis
Componentes que devem ser implementados na biblioteca UI:

Button

Card

Table

Modal

Input / Select

Badge

Alert / Toast

Tabs

Drawer

18. Dark Mode (Opcional)
Caso o sistema suporte modo escuro, deve utilizar tons escuros do Azul Marinho para manter a identidade da marca, evitando o cinza genérico.

Cores (Dark Mode):

Background: #07152D (Azul Marinho super escuro)

Card / Surfaces: #102140

Text: #F5F7FA

Primary: #F3B229 (Amarelo EGEN)

19. Bibliotecas recomendadas para o projeto React
Para acelerar o desenvolvimento de forma robusta:

React + TypeScript

TailwindCSS (Estilização)

Shadcn UI (Base de componentes)

Lucide Icons (Ícones)

React Query (Gerenciamento de estado do servidor)

React Hook Form + Zod (Formulários e validação)

Framer Motion (Animações)

20. Inspiração visual
O sistema deve transmitir a robustez da EGEN, lembrando:

Sistemas ERP modernos (ex: SAP Fiori atualizado)

Dashboards de gestão de frotas/equipamentos

Softwares SaaS corporativos (Stripe, Vercel, Linear)