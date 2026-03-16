EGEN System — Arquitetura do Sistema

Documento técnico simplificado de arquitetura — MVP

1. Visão Geral

O EGEN System é um sistema web desenvolvido para gerenciar o processo de locação de geradores, centralizando operações comerciais, controle de equipamentos, manutenção e faturamento.

O objetivo do sistema é substituir processos realizados em planilhas e consolidar todas as operações em uma única plataforma.

Principais objetivos:

Gestão de clientes e leads

Geração de propostas e contratos

Controle de equipamentos locados

Gestão de manutenção de geradores

Controle financeiro básico

Monitoramento operacional via dashboard

2. Arquitetura do Sistema

Arquitetura baseada em aplicação web moderna com separação entre frontend, backend e banco de dados.

┌─────────────────────────────────────┐
│             FRONTEND                │
│      React + TypeScript (SPA)      │
├─────────────────────────────────────┤
│             BACKEND                 │
│        API REST (Node / Python)     │
├─────────────────────────────────────┤
│            DATABASE                 │
│            PostgreSQL               │
└─────────────────────────────────────┘
3. Stack Tecnológica
3.1 Frontend
Tecnologia	Propósito
React	Interface da aplicação
TypeScript	Tipagem estática
Vite	Build e desenvolvimento
TailwindCSS	Estilização
React Router	Rotas da aplicação
3.2 Backend
Tecnologia	Propósito
Node.js / Python	API do sistema
Express / FastAPI	Framework da API
JWT	Autenticação
REST API	Comunicação com frontend
3.3 Banco de Dados
Tecnologia	Propósito
PostgreSQL	Banco relacional
Storage	Armazenamento de arquivos
Migrations	Controle de versões do banco
4. Estrutura de Diretórios

Estrutura sugerida para o sistema.

egen-system/

├── docs
│
├── frontend
│   ├── public
│   └── src
│       ├── App.tsx
│       ├── main.tsx
│       │
│       ├── components
│       │
│       ├── pages
│       │   ├── Dashboard
│       │   ├── Clientes
│       │   ├── Orçamentos
│       │   ├── Equipamentos
│       │   ├── Manutenções
│       │   ├── Financeiro
│       │   ├── Estoque
│       │   └── Usuários
│       │
│       ├── services
│       │
│       ├── hooks
│       │
│       ├── types
│       │
│       └── utils
│
├── backend
│   ├── controllers
│   ├── services
│   ├── repositories
│   ├── routes
│   ├── middlewares
│   └── models
│
└── database
    ├── migrations
    └── seeds
5. Arquitetura de Módulos

O sistema será dividido em módulos independentes.

APP

├── Dashboard
│
├── Comercial / CRM
│   ├── Clientes
│   └── Leads
│
├── Orçamentos e Contratos
│
├── Equipamentos
│
├── Manutenção
│
├── Financeiro
│
├── Estoque
│
└── Usuários
6. Módulos do Sistema
6.1 CRM / Comercial

Responsável pela gestão de clientes e leads.

Funcionalidades:

Cadastro de clientes

Cadastro de leads

Atualização de status

Histórico de informações

Associação com contratos

Associação com orçamentos

6.2 Orçamentos e Contratos

Responsável pela criação e gestão de propostas.

Funcionalidades:

Gerar propostas comerciais

Gerar contratos de locação

Parametrizar valores de locação

Associar clientes

Associar equipamentos

Gerenciar tabela de preços

Armazenar contratos

6.3 Equipamentos

Gestão dos geradores da empresa.

Funcionalidades:

Cadastro de equipamentos

Controle de status

Associação com contratos

Definição de valores de locação

Histórico de locações

Status possíveis:

Disponível
Locado
Em manutenção
Indisponível
6.4 Manutenção

Controle de manutenção preventiva e corretiva.

Funcionalidades:

Registrar manutenção

Agendar manutenção preventiva

Alertas de manutenção

Histórico de manutenções

Upload de ordens de serviço

Exportação de relatórios

6.5 Financeiro

Controle básico de faturamento.

Funcionalidades:

Registro de valores a receber

Associação com contratos

Calendário de faturamento

Fluxo de caixa básico

Importação de planilhas do Protheus

Exportação de relatórios financeiros

6.6 Estoque

Controle de peças e itens utilizados na operação.

Funcionalidades:

Entrada de itens

Movimentação de estoque

Associação com manutenção

Associação com equipamentos

Relatório de itens em baixa

6.7 Usuários

Gestão de usuários e permissões.

Funcionalidades:

Cadastro de usuários

Controle de acesso

Definição de perfis

Gestão de permissões

Cálculo de comissões

Relatórios de comissões

Perfis previstos:

Perfil	Acesso
Administrador	Acesso total
Operacional	Operações do sistema
Financeiro	Faturamento
7. Dashboard

O dashboard apresenta indicadores operacionais do sistema.

Indicadores principais:

Equipamentos disponíveis

Equipamentos locados

Manutenções próximas

Contratos ativos

Faturamento previsto

Tarefas pendentes

8. Modelo de Dados (Simplificado)

Entidades principais do sistema.

CLIENTES
CONTRATOS
ORÇAMENTOS
EQUIPAMENTOS
MANUTENÇÕES
FATURAMENTOS
USUÁRIOS
ESTOQUE

Relacionamentos principais:

Cliente
  │
  ├── Contratos
  │      │
  │      └── Equipamentos
  │
  └── Orçamentos

Equipamentos
  │
  └── Manutenções

Contratos
  │
  └── Faturamentos
9. Sistema de Autenticação

Autenticação baseada em login e senha.

Fluxo:

Usuário
  ↓
Login
  ↓
Validação
  ↓
Token JWT
  ↓
Acesso ao sistema
10. Requisitos Não Funcionais
Segurança

Senhas armazenadas com hash seguro

Autenticação via token

Controle de acesso por perfil

Comunicação via HTTPS

Desempenho

Resposta de operações em até 2 segundos

Processos pesados executados de forma assíncrona

Estrutura preparada para crescimento de usuários

Arquitetura

Boas práticas adotadas:

Arquitetura em camadas

API REST

Código modular

Separação entre frontend e backend

Usabilidade

Interface simples para usuários operacionais

Feedback visual de ações

Layout consistente

Responsividade para desktop e tablet

11. Escopo do MVP

O MVP do sistema incluirá:

CRM básico

Gestão de equipamentos

Gestão de contratos

Controle de manutenção

Financeiro básico

Dashboard operacional

Controle de usuários

Prazo estimado de entrega:

Até 45 dias