# Estrutura do Sistema de Propostas EGEN

> Documentação completa da arquitetura, estrutura de dados e componentes do módulo de propostas comerciais.

## Índice

1. [Arquitetura Geral](#arquitetura-geral)
2. [Estrutura de Arquivos](#estrutura-de-arquivos)
3. [Tipagens e Interfaces](#tipagens-e-interfaces)
4. [Store Zustand](#store-zustand)
5. [Componentes](#componentes)
6. [Estilos e Layout](#estilos-e-layout)
7. [Fluxo de Dados](#fluxo-de-dados)

---

## Arquitetura Geral

O sistema de propostas EGEN utiliza:

- **Estado Global**: Zustand com persistência local
- **Tipos**: TypeScript para type-safety
- **UI**: React + TailwindCSS + CSS Modules
- **PDF**: Geração via HTML2PDF com layout A4
- **Padrões EGEN**: Valores default baseados nos processos da empresa

---

## Estrutura de Arquivos

```
src/
├── modules/
│   └── quotations/
│       ├── types/
│       │   └── proposal.ts          # Tipagens TypeScript
│       ├── stores/
│       │   └── proposalStore.ts     # Store Zustand
│       ├── components/
│       │   ├── ProposalForm.tsx     # Formulário de edição
│       │   ├── DocumentPreview.tsx  # Preview do documento
│       │   └── DocumentPreview.module.css
│       └── services/
│           └── proposalService.ts   # Integração com Supabase
├── utils/
│   ├── generators.ts                # Funções auxiliares (IDs, etc)
│   └── formatters.ts                # Formatação de datas/valores
└── constants/
    └── documentTypes.ts             # Labels de tipos de documento
```

---

## Tipagens e Interfaces

### `src/modules/quotations/types/proposal.ts`

/**
 * Tipos de documentos suportados pelo sistema
 */
export type DocumentType = 'proposta' | 'orcamento' | 'contrato';

/**
 * Dados do cliente
 */
export interface Client {
  nome: string;
  responsavel: string;
  email: string;
  telefone: string;
  documento: string; // CPF ou CNPJ
  endereco: string;
  cidadeUf: string;
}

/**
 * Item de equipamento na proposta
 * Representa geradores, grupos geradores, etc.
 */
export interface Equipamento {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  franquia: string;        // Ex: "35hrs/mês"
  observacoes: string;
}

/**
 * Serviço incluso na proposta
 * Ex: Instalação, manutenção, transporte
 */
export interface Servico {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  observacoes: string;
}

/**
 * Tabela de horas excedentes
 * Valores cobrados quando ultrapassar a franquia
 */
export interface HoraExcedente {
  id: string;
  descricao: string;       // Ex: "Hora Excedente Equipamento X"
  valorUnitario: number;
  observacoes: string;     // Ex: "por equipamento"
}

/**
 * Condições comerciais da proposta
 * Valores padrão baseados nos processos EGEN
 */
export interface CondicoesComerciais {
  localUtilizacao: string;
  formaPagamento: string;
  faturamento: string;
  prazoEntrega: string;
  validadeProposta: string;
  inicioCobranca: string;
  finalCobranca: string;
  periodoMinimo: string;
  periodoOrcado: string;
  tensao: string;
  emissaoArt: string;
  transporteEnvio: string;
  transporteRetirada: string;
  cargaDescargaMobilizacao: string;
  cargaDescargaDesmobilizacao: string;
  instalacao: string;
  manutencaoPreventiva: string;
  combustivel: string;
  seguro: string;
  impostos: string;
  telemetria: string;
  dimensionamento: string;
  definicaoEscopo: string;
}

/**
 * Estado completo de uma proposta
 */
export interface ProposalState {
  documentId: string;
  tipo: DocumentType;
  dataEmissao: string;
  validade: string;
  cliente: Client;
  equipamentos: Equipamento[];
  servicos: Servico[];
  horasExcedentes: HoraExcedente[];
  condicoes: CondicoesComerciais;
}
```

---

## Store Zustand

### `src/modules/quotations/stores/proposalStore.ts`

```typescript
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { generateDocumentId } from '@/utils/generators';
import { formatDate, addDays } from '@/utils/formatters';
import type { 
  ProposalState, 
  DocumentType, 
  Client, 
  Equipamento, 
  Servico, 
  HoraExcedente,
  CondicoesComerciais 
} from '../types/proposal';

/**
 * Estado inicial com valores padrão EGEN
 */
const initialState: ProposalState = {
  documentId: generateDocumentId(),
  tipo: 'proposta',
  dataEmissao: formatDate(new Date()),
  validade: formatDate(addDays(new Date(), 15)), // Padrão EGEN: 15 dias
  
  cliente: {
    nome: '',
    responsavel: '',
    email: '',
    telefone: '',
    documento: '',
    endereco: '',
    cidadeUf: '',
  },
  
  equipamentos: [
    { 
      id: crypto.randomUUID(), 
      descricao: '', 
      quantidade: 1, 
      valorUnitario: 0, 
      franquia: '35hrs/mês', // Padrão EGEN
      observacoes: '' 
    }
  ],
  
  servicos: [],
  horasExcedentes: [],
  
  // Condições comerciais padrão baseadas nos processos EGEN
  condicoes: {
    localUtilizacao: '',
    formaPagamento: 'Boleto - 15 dias',
    faturamento: 'Data da saída do pátio',
    prazoEntrega: 'à combinar',
    validadeProposta: '15 dias',
    inicioCobranca: 'Data da saída dos equipamentos',
    finalCobranca: 'Data do retorno',
    periodoMinimo: '30 dias',
    periodoOrcado: 'Mensal',
    tensao: '380/220V',
    emissaoArt: 'Não incluso',
    transporteEnvio: 'Orçado',
    transporteRetirada: 'Orçado',
    cargaDescargaMobilizacao: 'Orçado',
    cargaDescargaDesmobilizacao: 'Não orçado',
    instalacao: 'Sim',
    manutencaoPreventiva: 'Orçado sob demanda',
    combustivel: 'Não Incluso',
    seguro: 'Incluso',
    impostos: 'Incluso',
    telemetria: 'Não incluso',
    dimensionamento: 'Locatária',
    definicaoEscopo: 'Locatária'
  }
};


interface ProposalStore extends ProposalState {
  // Metadados do documento
  setTipo: (tipo: DocumentType) => void;
  setDataEmissao: (data: string) => void;
  setValidade: (data: string) => void;
  
  // Cliente
  updateCliente: (field: keyof Client, value: string) => void;
  
  // Equipamentos
  addEquipamento: () => void;
  removeEquipamento: (id: string) => void;
  updateEquipamento: (id: string, field: keyof Equipamento, value: any) => void;

  // Serviços
  addServico: () => void;
  removeServico: (id: string) => void;
  updateServico: (id: string, field: keyof Servico, value: any) => void;

  // Horas Excedentes
  addHoraExcedente: () => void;
  removeHoraExcedente: (id: string) => void;
  updateHoraExcedente: (id: string, field: keyof HoraExcedente, value: any) => void;

  // Condições Comerciais
  updateCondicoes: (field: keyof CondicoesComerciais, value: string) => void;
  
  // Cálculos
  getTotalEquipamentos: () => number;
  getTotalServicos: () => number;
  getTotalGeral: () => number;
  
  // Controle
  resetForm: () => void;
  loadDocument: (doc: any) => void;
}

/**
 * Store principal de propostas com Zustand
 * - Persiste no localStorage
 * - DevTools habilitado para debug
 */

export const useProposalStore = create<ProposalStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Metadados
        setTipo: (tipo) => set({ tipo }),
        setDataEmissao: (dataEmissao) => set({ dataEmissao }),
        setValidade: (validade) => set({ validade }),

        // Cliente
        updateCliente: (field, value) =>
          set((state) => ({ cliente: { ...state.cliente, [field]: value } })),

        // Equipamentos
        addEquipamento: () => set((state) => ({
          equipamentos: [
            ...state.equipamentos, 
            { 
              id: crypto.randomUUID(), 
              descricao: '', 
              quantidade: 1, 
              valorUnitario: 0, 
              franquia: '35hrs/mês', 
              observacoes: '' 
            }
          ]
        })),
        removeEquipamento: (id) => set((state) => ({
          equipamentos: state.equipamentos.filter(e => e.id !== id)
        })),
        updateEquipamento: (id, field, value) => set((state) => ({
          equipamentos: state.equipamentos.map(e => 
            e.id === id ? { ...e, [field]: value } : e
          )
        })),

        // Serviços
        addServico: () => set((state) => ({
          servicos: [
            ...state.servicos, 
            { 
              id: crypto.randomUUID(), 
              descricao: '', 
              quantidade: 1, 
              valorUnitario: 0, 
              observacoes: '' 
            }
          ]
        })),
        removeServico: (id) => set((state) => ({
          servicos: state.servicos.filter(s => s.id !== id)
        })),
        updateServico: (id, field, value) => set((state) => ({
          servicos: state.servicos.map(s => 
            s.id === id ? { ...s, [field]: value } : s
          )
        })),

        // Horas Excedentes
        addHoraExcedente: () => set((state) => ({
          horasExcedentes: [
            ...state.horasExcedentes, 
            { 
              id: crypto.randomUUID(), 
              descricao: '', 
              valorUnitario: 0, 
              observacoes: 'por equipamento' 
            }
          ]
        })),
        removeHoraExcedente: (id) => set((state) => ({
          horasExcedentes: state.horasExcedentes.filter(h => h.id !== id)
        })),
        updateHoraExcedente: (id, field, value) => set((state) => ({
          horasExcedentes: state.horasExcedentes.map(h => 
            h.id === id ? { ...h, [field]: value } : h
          )
        })),

        // Condições
        updateCondicoes: (field, value) =>
          set((state) => ({ condicoes: { ...state.condicoes, [field]: value } })),

        // Cálculos
        getTotalEquipamentos: () => 
          get().equipamentos.reduce((sum, e) => sum + (e.quantidade * e.valorUnitario), 0),
        getTotalServicos: () => 
          get().servicos.reduce((sum, s) => sum + (s.quantidade * s.valorUnitario), 0),
        getTotalGeral: () => 
          get().getTotalEquipamentos() + get().getTotalServicos(),

        // Controle
        resetForm: () => set({ 
          ...initialState, 
          documentId: generateDocumentId() 
        }),
        
        loadDocument: (doc) => set({
          documentId: doc.id,
          tipo: doc.tipo || 'proposta',
          dataEmissao: doc.data_emissao || formatDate(new Date()),
          validade: doc.data_validade || formatDate(addDays(new Date(), 15)),
          cliente: doc.dados_cliente || initialState.cliente,
          equipamentos: doc.conteudo?.equipamentos || [],
          servicos: doc.conteudo?.servicos || [],
          horasExcedentes: doc.conteudo?.horasExcedentes || [],
          condicoes: { ...initialState.condicoes, ...(doc.conteudo?.condicoes || {}) }
        })
      }),
      {
        name: 'egen-proposal-storage',
        partialize: (state) => ({
          documentId: state.documentId,
          tipo: state.tipo,
          cliente: state.cliente,
          equipamentos: state.equipamentos,
          servicos: state.servicos,
          horasExcedentes: state.horasExcedentes,
          condicoes: state.condicoes
        })
      }
    )
  )
);
```

**Uso do Store:**

```typescript
// Em qualquer componente
import { useProposalStore } from '@/modules/quotations/stores/proposalStore';

function ProposalForm() {
  const { cliente, updateCliente, addEquipamento } = useProposalStore();
  
  return (
    <input
      value={cliente.nome}
      onChange={(e) => updateCliente('nome', e.target.value)}
    />
  );
}
```

---

## Componentes

### DocumentPreview.tsx

Componente responsável pela visualização e exportação do documento em formato PDF.

#### Estrutura de Páginas

```tsx
          equipamentos: state.equipamentos,
          servicos: state.servicos,
          horasExcedentes: state.horasExcedentes,
          condicoes: state.condicoes
        })
      }
    )
  )
);

import { DOCUMENT_TYPE_LABELS } from '@/constants/documentTypes';
import { useProposalStore } from '@/modules/quotations/stores/proposalStore';
import styles from './DocumentPreview.module.css';

function DocumentPreview() {
  const { tipo, cliente, equipamentos, servicos, horasExcedentes, condicoes } = useProposalStore();

  return (
    <div className={styles.document}>
      {/* =============== PÁGINA 1: CAPA =============== */}
      <section className={`${styles.page} ${styles.coverPage}`}>
        <img 
          src="/CAPA.png" 
          alt="Fundo da Capa" 
          className={styles.coverBackground} 
        />
        
        <div className={styles.coverContent}>
          <h1 className={styles.coverDynamicTitle}>
            {tipo === 'proposta' 
              ? 'PROPOSTA DE LOCAÇÃO' 
              : DOCUMENT_TYPE_LABELS[tipo].toUpperCase()
            }
          </h1>
        </div>
      </section>

      {/* =============== PÁGINA 2: INTRODUÇÃO =============== */}
      <section className={`${styles.page} ${styles.contentPage}`}>
        {/* Cabeçalho com dados do cliente */}
        <header className={styles.header}>
          <div className={styles.clientInfo}>
            <h2>{cliente.nome}</h2>
            <p>At.: {cliente.responsavel}</p>
            <p>{cliente.email} | {cliente.telefone}</p>
          </div>
        </header>

        {/* Introdução EGEN */}
        <div className={styles.introSection}>
          <h4>INTRODUÇÃO:</h4>
          <p>
            A <strong>EGEN Geradores</strong> é especializada em <strong>venda e locação</strong> de 
            Grupos Geradores de Energia, entregando soluções completas e personalizadas para os mais 
            diversos setores, como <strong>mineração</strong>, <strong>agronegócio</strong>, 
            <strong>indústria</strong>, <strong>construção civil</strong> e <strong>comércio</strong>.
          </p>
          <p>
            Contamos com uma equipe de engenharia altamente capacitada, pronta para dimensionar e 
            implementar sistemas de geração de energia com máxima eficiência e segurança.
          </p>
          <p>
            Fazemos parte de um dos maiores grupos do setor, o que nos permite acesso a uma ampla 
            frota própria de geradores modernos e de alta performance.
          </p>
        </div>
        
        {/* Imagem do gerador sobreposta ao texto */}
        <div className={styles.generatorImageWrapper}>
          <img 
            src="/GERADOR.png" 
            alt="Gerador EGEN" 
            className={styles.generatorImage} 
          />
        </div>

        {/* Continuação da introdução */}
        <div className={styles.introContinuation}>
          <p>
            Nosso suporte técnico é ágil e atuante, garantindo atendimento rápido e eficaz em 
            demandas programadas ou emergenciais.
          </p>
          <p>
            Com foco em qualidade, continuidade operacional e transparência, oferecemos energia 
            sob medida para manter sua operação sempre em movimento.
          </p>
        </div>
      </section>

      {/* =============== PÁGINAS SEGUINTES =============== */}
      {/* Tabelas de equipamentos, serviços, condições comerciais, etc. */}
    </div>
  );
}
```

---

## Estilos e Layout

### DocumentPreview.module.css

CSS Modules para estilização do documento com padrão A4.

```css
/**
 * Container principal do documento
 * Simula uma página A4 (210mm x 297mm)
 */
.document {
  font-family: 'Inter', sans-serif;
  color: #111111;
  background: white;
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  position: relative;
}

/**
 * Regras gerais de página
 * Cada página tem altura fixa de 297mm (A4)
 */
.page {
  position: relative;
  width: 100%;
  height: 297mm;
  overflow: hidden;
  box-sizing: border-box;
  page-break-after: always;
}

.page:last-child {
  page-break-after: auto;
}

.contentPage {
  padding: 20mm;
}

/* ==================== CAPA ==================== */

.coverPage {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
}

.coverBackground {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 1;
}

.coverContent {
  position: relative;
  z-index: 2;
  width: 100%;
  padding-top: 15mm;
  text-align: center;
}

.coverDynamicTitle {
  color: #FFFFFF;
  font-size: 28pt;
  font-weight: 700;
  letter-spacing: 2px;
  margin: 0;
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
}

/* ==================== INTRODUÇÃO ==================== */

.introSection {
  margin-top: 10mm;
  position: relative;
  z-index: 2;
}

.introSection h4 {
  color: #0D2A59; /* Azul EGEN */
  font-size: 14pt;
  margin-bottom: 5mm;
  font-weight: 700;
}

.introSection p,
.introContinuation p {
  font-size: 11pt;
  line-height: 1.6;
  text-align: justify;
  margin-bottom: 3mm;
}

/* ==================== GERADOR SOBREPOSTO ==================== */

/**
 * Técnica de sobreposição com z-index
 * A imagem do gerador fica "flutuando" sobre o texto
 */
.generatorImageWrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 10;
  /* Margens negativas puxam a imagem sobre o texto anterior e seguinte */
  margin-top: -15mm;
  margin-bottom: -15mm;
}

.generatorImage {
  max-width: 85%;
  height: auto;
  /* Sombra realista em PNG transparente */
  filter: drop-shadow(0 20px 20px rgba(0, 0, 0, 0.15));
}

.introContinuation {
  position: relative;
  z-index: 2;
}

/* ==================== IMPRESSÃO / PDF ==================== */

@media print {
  .document {
    width: 100%;
    box-shadow: none;
    margin: 0;
  }

  .page {
    height: 100vh;
    page-break-after: always;
  }

  /* CRÍTICO: Garante impressão de backgrounds */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
```

**Principais técnicas de layout:**

1. **Páginas A4**: Dimensões fixas de 210mm x 297mm
2. **Z-index layering**: Imagem do gerador sobreposta ao texto
3. **Margens negativas**: Efeito de flutuação da imagem
4. **Print styles**: Garantem fidelidade na exportação PDF
5. **Drop shadow**: Sombra realista em PNG transparente

---

## Fluxo de Dados

### 1. Criação de Proposta

```
Usuário → ProposalForm → useProposalStore → localStorage
                                          ↓
                                    DocumentPreview (preview em tempo real)
```

### 2. Salvamento no Banco

```
useProposalStore → proposalService → Supabase
                                        ↓
                        Tabela: sales_quotations
                        {
                          id: string
                          tipo: DocumentType
                          dados_cliente: Client
                          conteudo: {
                            equipamentos[]
                            servicos[]
                            horasExcedentes[]
                            condicoes
                          }
                        }
```

### 3. Carregamento de Proposta

```
Supabase → proposalService → loadDocument() → useProposalStore
                                                      ↓
                                              UI atualizada
```

### 4. Exportação em PDF

```
DocumentPreview → html2pdf.js → Blob → Download
```

---

## Integração com Supabase

### Tabela: `sales_quotations`

```sql
CREATE TABLE sales_quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(20) CHECK (tipo IN ('proposta', 'orcamento', 'contrato')),
  numero_documento VARCHAR(50) UNIQUE,
  data_emissao DATE NOT NULL,
  data_validade DATE,
  
  -- Dados do cliente
  dados_cliente JSONB NOT NULL,
  
  -- Conteúdo da proposta
  conteudo JSONB NOT NULL,
  
  -- Valores calculados (para facilitar queries)
  valor_total DECIMAL(12,2),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Status
  status VARCHAR(20) DEFAULT 'rascunho'
);
```

### Service: `proposalService.ts`

```typescript
import { supabase } from '@/lib/supabase';
import type { ProposalState } from '../types/proposal';

export const proposalService = {
  /**
   * Salva uma proposta no banco
   */
  async save(proposal: ProposalState) {
    const { data, error } = await supabase
      .from('sales_quotations')
      .insert({
        numero_documento: proposal.documentId,
        tipo: proposal.tipo,
        data_emissao: proposal.dataEmissao,
        data_validade: proposal.validade,
        dados_cliente: proposal.cliente,
        conteudo: {
          equipamentos: proposal.equipamentos,
          servicos: proposal.servicos,
          horasExcedentes: proposal.horasExcedentes,
          condicoes: proposal.condicoes
        },
        valor_total: calculateTotal(proposal)
      });

    if (error) throw error;
    return data;
  },

  /**
   * Carrega uma proposta do banco
   */
  async load(id: string) {
    const { data, error } = await supabase
      .from('sales_quotations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Lista todas as propostas
   */
  async list() {
    const { data, error } = await supabase
      .from('sales_quotations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

function calculateTotal(proposal: ProposalState): number {
  return proposal.equipamentos.reduce(
    (sum, e) => sum + (e.quantidade * e.valorUnitario), 
    0
  ) + proposal.servicos.reduce(
    (sum, s) => sum + (s.quantidade * s.valorUnitario), 
    0
  );
}
```

---

## Utilidades

### `utils/generators.ts`

```typescript
/**
 * Gera ID único para documento
 * Formato: PROP-YYYYMMDD-XXXX
 */
export function generateDocumentId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `PROP-${year}${month}${day}-${random}`;
}
```

### `utils/formatters.ts`

```typescript
/**
 * Formata data para DD/MM/YYYY
 */
export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Adiciona dias a uma data
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}
```

---

## Checklist de Implementação

- [ ] Criar tipos em `types/proposal.ts`
- [ ] Implementar store Zustand em `stores/proposalStore.ts`
- [ ] Criar componente `ProposalForm.tsx`
- [ ] Criar componente `DocumentPreview.tsx`
- [ ] Adicionar estilos `DocumentPreview.module.css`
- [ ] Implementar `proposalService.ts`
- [ ] Criar migration da tabela `sales_quotations`
- [ ] Adicionar utilitários (`generators.ts`, `formatters.ts`)
- [ ] Configurar html2pdf para exportação
- [ ] Testar persistência localStorage
- [ ] Testar salvamento no Supabase
- [ ] Testar exportação PDF

---

## Próximos Passos

1. **Assinatura Digital**: Integrar assinatura eletrônica nos documentos
2. **Versionamento**: Controlar versões de propostas alteradas
3. **Templates**: Permitir múltiplos templates de documento
4. **Aprovação**: Workflow de aprovação de propostas
5. **Email**: Envio automático de propostas por email
6. **Analytics**: Rastreamento de visualizações e conversões

---

**Última atualização:** Maio 2026  
**Versão:** 2.0