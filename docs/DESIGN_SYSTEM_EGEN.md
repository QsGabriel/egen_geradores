Design System — EGEN System

Documento de referência visual e UX/UI para o sistema interno da EGEN Geradores.
Versão inicial para implementação no frontend React.

1. Princípios de Design

O design do sistema deve refletir os valores da EGEN:

Energia

Confiabilidade

Tecnologia

Operação industrial

Diretrizes principais:

Interface limpa e objetiva

Layout focado em dados operacionais

Visual moderno com inspiração industrial

Uso predominante de cores fortes com contraste alto

Componentes reutilizáveis

2. Paleta de Cores

A identidade visual do site da empresa utiliza tons de energia elétrica (amarelo) combinados com preto e branco, criando contraste forte e industrial.

Cores Primárias
Cor	Hex	Uso
Amarelo EGEN	#F5C400	Destaques, botões principais
Preto Industrial	#111111	Backgrounds e navbar
Cinza Escuro	#2B2B2B	Cards e containers
Branco	#FFFFFF	Texto e áreas de conteúdo
Cores Secundárias
Cor	Hex	Uso
Cinza Médio	#6B6B6B	Texto secundário
Cinza Claro	#F2F2F2	Backgrounds leves
Verde Sucesso	#2EBD59	Status positivo
Vermelho Alerta	#E5484D	Erros
Amarelo Alerta	#FFB800	Avisos
3. Tipografia

O site utiliza uma tipografia moderna e industrial, similar a fontes utilizadas em interfaces corporativas.

Sugestão para o sistema:

Fonte principal
Inter

Motivos:

Excelente para dashboards

Legível em dados e tabelas

Muito usada em aplicações SaaS

Hierarquia tipográfica
Elemento	Tamanho
Heading 1	32px
Heading 2	24px
Heading 3	20px
Body	16px
Small	14px
Caption	12px

Peso recomendado:

Regular — 400
Medium — 500
Bold — 700
4. Grid e Layout

O sistema seguirá padrão dashboard SaaS.

Grid base
12 colunas

Espaçamento:

Tipo	Valor
XS	4px
SM	8px
MD	16px
LG	24px
XL	32px
5. Estrutura de Layout

Layout padrão do sistema.

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

Altura:

64px

Cor:

#111111
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

Background: #111111

Texto: branco

Item ativo: #F5C400

8. Cards

Os dados do sistema serão exibidos em cards.

Estilo:

background: #FFFFFF
border-radius: 10px
box-shadow: subtle
padding: 24px

Exemplo:

┌──────────────────┐
│ Equipamentos     │
│ Disponíveis: 12  │
└──────────────────┘
9. Botões
Primary Button
background: #F5C400
color: #111
border-radius: 8px
padding: 10px 16px

Uso:

salvar

criar

confirmar

Secondary Button
background: transparent
border: 1px solid #CCC
color: #333
Danger Button
background: #E5484D
color: white
10. Inputs

Estilo padrão:

height: 40px
border-radius: 8px
border: 1px solid #DDD
padding: 8px 12px

Estado focus:

border-color: #F5C400
box-shadow: 0 0 0 2px rgba(245,196,0,0.2)
11. Tabelas

As tabelas são centrais no sistema.

Estilo:

background: white
border-radius: 10px

Colunas:

Cliente
Contrato
Equipamento
Status
Valor
Ações

Status com badge:

Status	Cor
Ativo	Verde
Pendente	Amarelo
Cancelado	Vermelho
12. Badges de Status

Formato:

padding: 4px 8px
border-radius: 6px
font-size: 12px

Exemplo:

Disponível
Locado
Manutenção
13. Dashboard

Cards principais:

Equipamentos disponíveis
Equipamentos locados
Manutenções próximas
Contratos ativos
Faturamento do mês

Layout:

4 cards por linha
14. Ícones

Biblioteca recomendada:

Lucide Icons

Motivo:

leve

compatível com React

moderno

15. Animações

Utilizar animações leves.

Biblioteca recomendada:

Framer Motion

Exemplos:

abertura de modais

loading states

dropdown

16. Responsividade

Breakpoints:

Dispositivo	Width
Mobile	640px
Tablet	768px
Laptop	1024px
Desktop	1280px
17. Componentes Reutilizáveis

Componentes que devem existir no sistema:

Button
Card
Table
Modal
Input
Select
Badge
Alert
Tabs
Drawer
Toast
18. Dark Mode (Opcional)

O sistema pode futuramente suportar modo escuro.

Cores:

Background: #0E0E0E
Card: #1A1A1A
Text: #F2F2F2
Primary: #F5C400
19. Bibliotecas recomendadas para o projeto React

Para acelerar o desenvolvimento:

React
TypeScript
TailwindCSS
Shadcn UI
Lucide Icons
React Query
React Hook Form
Zod
Framer Motion
20. Inspiração visual

O sistema deve lembrar:

dashboards industriais

sistemas ERP modernos

softwares SaaS corporativos

Referências:

Stripe Dashboard

Linear

Vercel Dashboard

Notion