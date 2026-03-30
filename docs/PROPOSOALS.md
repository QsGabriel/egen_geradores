# Guia Completo de Migração: Proposals Page → React

## 📋 Índice

1. [Visão Geral da Arquitetura Atual](#visão-geral-da-arquitetura-atual)
2. [Stack Tecnológica Recomendada para React](#stack-tecnológica-recomendada-para-react)
3. [Estrutura de Pastas React](#estrutura-de-pastas-react)
4. [Modelagem de Estado (State)](#modelagem-de-estado-state)
5. [Componentes React](#componentes-react)
6. [Services e API Layer](#services-e-api-layer)
7. [Hooks Customizados](#hooks-customizados)
8. [Sistema de Estilos](#sistema-de-estilos)
9. [Implementação Detalhada](#implementação-detalhada)
10. [Funcionalidades Específicas](#funcionalidades-específicas)
11. [Testes](#testes)
12. [Deploy](#deploy)

---

## 1. Visão Geral da Arquitetura Atual

### Arquivos Originais Analisados

| Arquivo | Função |
|---------|--------|
| `proposals.html` | Estrutura da página com formulário e preview |
| `css/proposals.css` | ~1400 linhas com design system completo (glassmorphism, variáveis CSS) |
| `js/proposals.js` | ~1400 linhas de lógica vanilla JS |
| `js/services/documentService.js` | Camada de serviço com integração Supabase + localStorage fallback |

### Padrão Arquitetural Atual

```
┌─────────────────────────────────────────────────────────────┐
│                    proposals.html                           │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │   Form Panel        │    │   Preview Panel             │ │
│  │   (Accordion)       │    │   (Live PDF)                │ │
│  │                     │    │                             │ │
│  │ • Identificação     │    │ ┌─────────────────────────┐ │ │
│  │ • Dados Cliente     │◀──▶│ │  Documento Preview      │ │ │
│  │ • Escopo/Itens      │    │ │  (Renderização HTML)    │ │ │
│  │ • Condições         │    │ └─────────────────────────┘ │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    ProposalState (Object)                   │
│  documentId, tipo, dataEmissao, validade, cliente,          │
│  projeto (entregaveis[]), itens[], condicoes                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DocumentService                          │
│  save(), getById(), getAll(), delete(), updateStatus()      │
│  Supabase + localStorage fallback                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Stack Tecnológica Recomendada para React

### Dependências Principais

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "@supabase/supabase-js": "^2.39.0",
    "zustand": "^4.5.0",
    "react-hook-form": "^7.50.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "date-fns": "^3.3.0",
    "react-to-print": "^2.15.0",
    "jspdf": "^2.5.1",
    "html2canvas": "^1.4.1",
    "lucide-react": "^0.330.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "vite": "^5.1.0",
    "@types/react": "^18.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.56.0",
    "vitest": "^1.2.0",
    "@testing-library/react": "^14.2.0"
  }
}
```

### Justificativas

| Lib | Justificativa |
|-----|---------------|
| **Zustand** | Estado global mais simples que Redux, perfeito para formulários complexos |
| **React Hook Form** | Performance otimizada para formulários grandes e validação |
| **Zod** | Schema validation type-safe |
| **date-fns** | Manipulação de datas (emissão, validade) |
| **react-to-print** | Geração de PDF via print dialog |
| **Lucide React** | Ícones modernos (substitui Font Awesome) |

---

## 3. Estrutura de Pastas React

```
src/
├── app/
│   ├── layout.tsx                    # Layout principal
│   ├── page.tsx                      # Home page
│   └── proposals/
│       └── page.tsx                  # Página de Propostas
│
├── components/
│   ├── ui/                           # Componentes base reutilizáveis
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   └── index.ts
│   │   ├── Input/
│   │   ├── Select/
│   │   ├── Textarea/
│   │   ├── Modal/
│   │   ├── Toast/
│   │   ├── Spinner/
│   │   └── Accordion/
│   │
│   ├── proposals/                    # Componentes específicos da página
│   │   ├── Header/
│   │   │   └── ProposalsHeader.tsx
│   │   ├── FormPanel/
│   │   │   ├── FormPanel.tsx
│   │   │   ├── sections/
│   │   │   │   ├── DocumentIdentification.tsx
│   │   │   │   ├── ClientData.tsx
│   │   │   │   ├── ScopeAndItems.tsx
│   │   │   │   └── CommercialConditions.tsx
│   │   │   └── index.ts
│   │   ├── PreviewPanel/
│   │   │   ├── PreviewPanel.tsx
│   │   │   ├── DocumentPreview.tsx
│   │   │   └── index.ts
│   │   ├── ItemsTable/
│   │   │   └── ItemsTable.tsx
│   │   ├── DeliverablesEditor/
│   │   │   ├── DeliverablesEditor.tsx
│   │   │   ├── DeliverableCard.tsx
│   │   │   ├── SubitemInput.tsx
│   │   │   └── TextFormatButtons.tsx
│   │   ├── DraftsModal/
│   │   │   ├── DraftsModal.tsx
│   │   │   └── DraftCard.tsx
│   │   └── ActionsBar/
│   │       └── ActionsBar.tsx
│   │
│   └── layout/
│       ├── AppHeader.tsx
│       └── ToastContainer.tsx
│
├── hooks/
│   ├── useProposalForm.ts            # Hook para formulário
│   ├── useDocuments.ts               # Hook para CRUD de documentos
│   ├── usePreview.ts                 # Hook para preview
│   ├── useToast.ts                   # Hook para notificações
│   ├── useDebounce.ts                # Hook para debounce
│   └── useLocalStorage.ts            # Hook para localStorage
│
├── stores/
│   ├── proposalStore.ts              # Zustand store principal
│   └── toastStore.ts                 # Store para toasts
│
├── services/
│   ├── documentService.ts            # Service layer (Supabase + localStorage)
│   ├── supabaseClient.ts             # Configuração Supabase
│   └── api.ts                        # Configuração base API
│
├── types/
│   ├── proposal.ts                   # Tipos TypeScript
│   ├── document.ts
│   └── client.ts
│
├── utils/
│   ├── formatters.ts                 # formatCurrency, formatDate, etc
│   ├── generators.ts                 # generateDocumentId
│   ├── validators.ts                 # Schemas Zod
│   └── textFormatting.ts             # Bold, italic, code rendering
│
├── constants/
│   ├── defaultTexts.ts               # Textos padrão do documento
│   ├── documentTypes.ts              # Tipos de documento
│   └── deliverableTypes.ts           # Tipos de entregáveis
│
├── styles/
│   ├── globals.css                   # Reset e variáveis CSS
│   ├── variables.css                 # CSS Custom Properties
│   ├── animations.css                # Keyframes
│   └── print.css                     # Estilos de impressão
│
└── lib/
    └── cn.ts                         # Utilitário classNames (clsx + tailwind-merge)
```

---

## 4. Modelagem de Estado (State)

### Types/Interfaces (TypeScript)

```typescript
// types/proposal.ts

export interface Client {
  nome: string;
  responsavel: string;
  email: string;
  documento: string;  // CPF ou CNPJ
  endereco: string;
}

export type DeliverableType = 'feature' | 'functional' | 'non-functional' | 'task';

export type SubitemType = 'functional' | 'non-functional' | 'note';

export interface Subitem {
  texto: string;
  tipo: SubitemType;
}

export interface Deliverable {
  titulo: string;
  tipo: DeliverableType;
  subitens: Subitem[];
}

export interface Item {
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

export interface Conditions {
  prazo: string;
  formaPagamento: string;
  condicoesAdicionais: string;
  garantias: string;
}

export interface Project {
  descricao: string;
  entregaveis: Deliverable[];
}

export type DocumentType = 'proposta' | 'orcamento' | 'contrato';

export type DocumentStatus = 'rascunho' | 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';

export interface ProposalState {
  documentId: string;
  tipo: DocumentType;
  dataEmissao: string;
  validade: string;
  cliente: Client;
  projeto: Project;
  itens: Item[];
  condicoes: Conditions;
}

export interface Document {
  id: string;
  tipo: DocumentType;
  dados_cliente: Client;
  conteudo: {
    descricao: string;
    entregaveis: Deliverable[];
    itens: Item[];
    prazo: string;
    formaPagamento: string;
    condicoesAdicionais: string;
    garantias: string;
  };
  valor_total: number;
  data_emissao: string;
  data_validade: string | null;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
}
```

### Zustand Store

```typescript
// stores/proposalStore.ts

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { generateDocumentId } from '@/utils/generators';
import { formatDate, addDays } from '@/utils/formatters';
import type { 
  ProposalState, 
  Client, 
  Deliverable, 
  Subitem, 
  Item, 
  Conditions,
  DocumentType 
} from '@/types/proposal';

interface ProposalStore extends ProposalState {
  // Ações de Documento
  setTipo: (tipo: DocumentType) => void;
  setDataEmissao: (data: string) => void;
  setValidade: (data: string) => void;
  
  // Ações de Cliente
  updateCliente: (field: keyof Client, value: string) => void;
  setCliente: (cliente: Client) => void;
  
  // Ações de Projeto
  setDescricaoProjeto: (descricao: string) => void;
  
  // Ações de Entregáveis
  addDeliverable: () => void;
  removeDeliverable: (index: number) => void;
  updateDeliverable: (index: number, field: keyof Deliverable, value: any) => void;
  addSubitem: (deliverableIndex: number) => void;
  removeSubitem: (deliverableIndex: number, subitemIndex: number) => void;
  updateSubitem: (deliverableIndex: number, subitemIndex: number, field: keyof Subitem, value: any) => void;
  
  // Ações de Itens
  addItem: () => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, field: keyof Item, value: any) => void;
  
  // Ações de Condições
  updateCondicoes: (field: keyof Conditions, value: string) => void;
  
  // Computed
  getTotal: () => number;
  
  // Reset
  resetForm: () => void;
  loadDocument: (doc: any) => void;
}

const initialState: ProposalState = {
  documentId: generateDocumentId(),
  tipo: 'proposta',
  dataEmissao: formatDate(new Date()),
  validade: formatDate(addDays(new Date(), 30)),
  cliente: {
    nome: '',
    responsavel: '',
    email: '',
    documento: '',
    endereco: ''
  },
  projeto: {
    descricao: '',
    entregaveis: [{ titulo: '', tipo: 'feature', subitens: [] }]
  },
  itens: [{ descricao: '', quantidade: 1, valorUnitario: 0 }],
  condicoes: {
    prazo: '',
    formaPagamento: '',
    condicoesAdicionais: '',
    garantias: ''
  }
};

export const useProposalStore = create<ProposalStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // === AÇÕES DE DOCUMENTO ===
        setTipo: (tipo) => set({ tipo }),
        setDataEmissao: (dataEmissao) => set({ dataEmissao }),
        setValidade: (validade) => set({ validade }),

        // === AÇÕES DE CLIENTE ===
        updateCliente: (field, value) =>
          set((state) => ({
            cliente: { ...state.cliente, [field]: value }
          })),
        
        setCliente: (cliente) => set({ cliente }),

        // === AÇÕES DE PROJETO ===
        setDescricaoProjeto: (descricao) =>
          set((state) => ({
            projeto: { ...state.projeto, descricao }
          })),

        // === AÇÕES DE ENTREGÁVEIS ===
        addDeliverable: () =>
          set((state) => ({
            projeto: {
              ...state.projeto,
              entregaveis: [
                ...state.projeto.entregaveis,
                { titulo: '', tipo: 'feature', subitens: [] }
              ]
            }
          })),

        removeDeliverable: (index) =>
          set((state) => {
            if (state.projeto.entregaveis.length <= 1) return state;
            return {
              projeto: {
                ...state.projeto,
                entregaveis: state.projeto.entregaveis.filter((_, i) => i !== index)
              }
            };
          }),

        updateDeliverable: (index, field, value) =>
          set((state) => ({
            projeto: {
              ...state.projeto,
              entregaveis: state.projeto.entregaveis.map((d, i) =>
                i === index ? { ...d, [field]: value } : d
              )
            }
          })),

        addSubitem: (deliverableIndex) =>
          set((state) => ({
            projeto: {
              ...state.projeto,
              entregaveis: state.projeto.entregaveis.map((d, i) =>
                i === deliverableIndex
                  ? { ...d, subitens: [...d.subitens, { texto: '', tipo: 'functional' }] }
                  : d
              )
            }
          })),

        removeSubitem: (deliverableIndex, subitemIndex) =>
          set((state) => ({
            projeto: {
              ...state.projeto,
              entregaveis: state.projeto.entregaveis.map((d, i) =>
                i === deliverableIndex
                  ? { ...d, subitens: d.subitens.filter((_, si) => si !== subitemIndex) }
                  : d
              )
            }
          })),

        updateSubitem: (deliverableIndex, subitemIndex, field, value) =>
          set((state) => ({
            projeto: {
              ...state.projeto,
              entregaveis: state.projeto.entregaveis.map((d, i) =>
                i === deliverableIndex
                  ? {
                      ...d,
                      subitens: d.subitens.map((s, si) =>
                        si === subitemIndex ? { ...s, [field]: value } : s
                      )
                    }
                  : d
              )
            }
          })),

        // === AÇÕES DE ITENS ===
        addItem: () =>
          set((state) => ({
            itens: [...state.itens, { descricao: '', quantidade: 1, valorUnitario: 0 }]
          })),

        removeItem: (index) =>
          set((state) => {
            if (state.itens.length <= 1) return state;
            return { itens: state.itens.filter((_, i) => i !== index) };
          }),

        updateItem: (index, field, value) =>
          set((state) => ({
            itens: state.itens.map((item, i) =>
              i === index ? { ...item, [field]: value } : item
            )
          })),

        // === AÇÕES DE CONDIÇÕES ===
        updateCondicoes: (field, value) =>
          set((state) => ({
            condicoes: { ...state.condicoes, [field]: value }
          })),

        // === COMPUTED ===
        getTotal: () => {
          const state = get();
          return state.itens.reduce(
            (sum, item) => sum + item.quantidade * item.valorUnitario,
            0
          );
        },

        // === UTILITÁRIOS ===
        resetForm: () => set({ ...initialState, documentId: generateDocumentId() }),

        loadDocument: (doc) =>
          set({
            documentId: doc.id,
            tipo: doc.tipo || 'proposta',
            dataEmissao: doc.data_emissao || formatDate(new Date()),
            validade: doc.data_validade || formatDate(addDays(new Date(), 30)),
            cliente: doc.dados_cliente || initialState.cliente,
            projeto: {
              descricao: doc.conteudo?.descricao || '',
              entregaveis: doc.conteudo?.entregaveis?.length 
                ? doc.conteudo.entregaveis 
                : initialState.projeto.entregaveis
            },
            itens: doc.conteudo?.itens?.length 
              ? doc.conteudo.itens 
              : initialState.itens,
            condicoes: {
              prazo: doc.conteudo?.prazo || '',
              formaPagamento: doc.conteudo?.formaPagamento || '',
              condicoesAdicionais: doc.conteudo?.condicoesAdicionais || '',
              garantias: doc.conteudo?.garantias || ''
            }
          })
      }),
      {
        name: 'proposal-storage',
        partialize: (state) => ({
          documentId: state.documentId,
          tipo: state.tipo,
          cliente: state.cliente,
          projeto: state.projeto,
          itens: state.itens,
          condicoes: state.condicoes
        })
      }
    )
  )
);

// Seletores para otimização de re-renders
export const selectCliente = (state: ProposalStore) => state.cliente;
export const selectProjeto = (state: ProposalStore) => state.projeto;
export const selectItens = (state: ProposalStore) => state.itens;
export const selectCondicoes = (state: ProposalStore) => state.condicoes;
```

---

## 5. Componentes React

### 5.1 Componente Principal da Página

```tsx
// app/proposals/page.tsx

'use client';

import { ProposalsHeader } from '@/components/proposals/Header/ProposalsHeader';
import { FormPanel } from '@/components/proposals/FormPanel';
import { PreviewPanel } from '@/components/proposals/PreviewPanel';
import { DraftsModal } from '@/components/proposals/DraftsModal';
import { ToastContainer } from '@/components/layout/ToastContainer';
import { useDocuments } from '@/hooks/useDocuments';
import { useState } from 'react';
import styles from './proposals.module.css';

export default function ProposalsPage() {
  const [isDraftsModalOpen, setDraftsModalOpen] = useState(false);
  const { documents, isLoading, saveDocument, deleteDocument, loadDocument } = useDocuments();

  return (
    <div className={styles.proposalsPage}>
      <ProposalsHeader 
        onOpenDrafts={() => setDraftsModalOpen(true)} 
      />

      <main className={styles.main}>
        <FormPanel />
        <PreviewPanel />
      </main>

      <DraftsModal
        isOpen={isDraftsModalOpen}
        onClose={() => setDraftsModalOpen(false)}
        documents={documents}
        isLoading={isLoading}
        onLoadDocument={loadDocument}
        onDeleteDocument={deleteDocument}
      />

      <ToastContainer />
    </div>
  );
}
```

### 5.2 FormPanel com Seções Colapsáveis

```tsx
// components/proposals/FormPanel/FormPanel.tsx

'use client';

import { useState } from 'react';
import { DocumentIdentification } from './sections/DocumentIdentification';
import { ClientData } from './sections/ClientData';
import { ScopeAndItems } from './sections/ScopeAndItems';
import { CommercialConditions } from './sections/CommercialConditions';
import { ActionsBar } from '../ActionsBar';
import { Accordion, AccordionItem } from '@/components/ui/Accordion';
import { 
  FileText, 
  UserCircle, 
  ListTodo, 
  Handshake 
} from 'lucide-react';
import styles from './FormPanel.module.css';

export function FormPanel() {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'identification',
    'client',
    'scope',
    'conditions'
  ]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <div className={styles.formPanel}>
      <Accordion 
        type="multiple" 
        value={expandedSections}
        onValueChange={setExpandedSections}
      >
        <AccordionItem 
          value="identification"
          icon={<FileText />}
          title="Identificação do Documento"
        >
          <DocumentIdentification />
        </AccordionItem>

        <AccordionItem 
          value="client"
          icon={<UserCircle />}
          title="Dados do Cliente"
        >
          <ClientData />
        </AccordionItem>

        <AccordionItem 
          value="scope"
          icon={<ListTodo />}
          title="Escopo e Itens"
        >
          <ScopeAndItems />
        </AccordionItem>

        <AccordionItem 
          value="conditions"
          icon={<Handshake />}
          title="Condições Comerciais"
        >
          <CommercialConditions />
        </AccordionItem>
      </Accordion>

      <ActionsBar />
    </div>
  );
}
```

### 5.3 Seção de Identificação do Documento

```tsx
// components/proposals/FormPanel/sections/DocumentIdentification.tsx

'use client';

import { useProposalStore } from '@/stores/proposalStore';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import styles from './sections.module.css';

const documentTypeOptions = [
  { value: 'proposta', label: 'Proposta Comercial' },
  { value: 'orcamento', label: 'Orçamento' },
  { value: 'contrato', label: 'Contrato' }
];

export function DocumentIdentification() {
  const { 
    documentId, 
    tipo, 
    dataEmissao, 
    validade,
    setTipo,
    setDataEmissao,
    setValidade
  } = useProposalStore();
  
  const { showToast } = useToast();

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(documentId);
      showToast('ID copiado para a área de transferência!', 'success');
    } catch {
      showToast('Erro ao copiar ID', 'error');
    }
  };

  return (
    <div className={styles.sectionContent}>
      {/* ID do Documento */}
      <div className={styles.documentId}>
        <span className={styles.documentIdLabel}>ID:</span>
        <span className={styles.documentIdValue}>{documentId}</span>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleCopyId}
          title="Copiar ID"
        >
          <Copy size={14} />
        </Button>
      </div>

      <div className={styles.formRow}>
        <Select
          label="Tipo de Documento"
          required
          value={tipo}
          onChange={(e) => setTipo(e.target.value as any)}
          options={documentTypeOptions}
        />

        <Input
          type="date"
          label="Data de Emissão"
          required
          value={dataEmissao}
          onChange={(e) => setDataEmissao(e.target.value)}
        />

        <Input
          type="date"
          label="Validade"
          required
          value={validade}
          onChange={(e) => setValidade(e.target.value)}
        />
      </div>
    </div>
  );
}
```

### 5.4 Editor de Entregáveis com Subitens

```tsx
// components/proposals/DeliverablesEditor/DeliverablesEditor.tsx

'use client';

import { useProposalStore } from '@/stores/proposalStore';
import { DeliverableCard } from './DeliverableCard';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import styles from './DeliverablesEditor.module.css';

export function DeliverablesEditor() {
  const { projeto, addDeliverable } = useProposalStore();

  return (
    <div className={styles.deliverablesEditor}>
      <div className={styles.header}>
        <span className={styles.label}>Entregáveis e Requisitos</span>
        <p className={styles.hint}>
          Adicione funcionalidades e seus requisitos funcionais (RF) ou não funcionais (RNF). 
          Use **texto** para negrito, _texto_ para itálico e `texto` para código.
        </p>
      </div>

      <div className={styles.deliverablesList}>
        {projeto.entregaveis.map((deliverable, index) => (
          <DeliverableCard
            key={index}
            deliverable={deliverable}
            index={index}
          />
        ))}
      </div>

      <Button
        variant="dashed"
        onClick={addDeliverable}
        className={styles.addButton}
      >
        <Plus size={16} />
        Adicionar Entregável
      </Button>
    </div>
  );
}
```

### 5.5 Card de Entregável Individual

```tsx
// components/proposals/DeliverablesEditor/DeliverableCard.tsx

'use client';

import { useProposalStore } from '@/stores/proposalStore';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { SubitemInput } from './SubitemInput';
import { Plus, Trash2 } from 'lucide-react';
import type { Deliverable } from '@/types/proposal';
import styles from './DeliverablesEditor.module.css';

interface DeliverableCardProps {
  deliverable: Deliverable;
  index: number;
}

const deliverableTypeOptions = [
  { value: 'feature', label: '🧊 Funcionalidade' },
  { value: 'functional', label: '✅ Req. Funcional' },
  { value: 'non-functional', label: '🛡️ Req. Não Funcional' },
  { value: 'task', label: '📋 Tarefa' }
];

export function DeliverableCard({ deliverable, index }: DeliverableCardProps) {
  const { 
    updateDeliverable, 
    removeDeliverable, 
    addSubitem 
  } = useProposalStore();

  return (
    <div className={styles.deliverableCard}>
      <div className={styles.deliverableHeader}>
        <Select
          value={deliverable.tipo}
          onChange={(e) => updateDeliverable(index, 'tipo', e.target.value)}
          options={deliverableTypeOptions}
          size="sm"
          className={styles.typeSelect}
        />

        <Input
          value={deliverable.titulo}
          onChange={(e) => updateDeliverable(index, 'titulo', e.target.value)}
          placeholder="Título do entregável"
          className={styles.titleInput}
        />

        <div className={styles.deliverableActions}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => addSubitem(index)}
            title="Adicionar subitem"
          >
            <Plus size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => removeDeliverable(index)}
            title="Remover"
            className={styles.deleteButton}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      {deliverable.subitens.length > 0 && (
        <div className={styles.subitemsList}>
          {deliverable.subitens.map((subitem, subIndex) => (
            <SubitemInput
              key={subIndex}
              subitem={subitem}
              deliverableIndex={index}
              subitemIndex={subIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### 5.6 Input de Subitem com Formatação

```tsx
// components/proposals/DeliverablesEditor/SubitemInput.tsx

'use client';

import { useRef } from 'react';
import { useProposalStore } from '@/stores/proposalStore';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { TextFormatButtons } from './TextFormatButtons';
import { X } from 'lucide-react';
import type { Subitem } from '@/types/proposal';
import styles from './DeliverablesEditor.module.css';

interface SubitemInputProps {
  subitem: Subitem;
  deliverableIndex: number;
  subitemIndex: number;
}

const subitemTypeOptions = [
  { value: 'functional', label: 'RF' },
  { value: 'non-functional', label: 'RNF' },
  { value: 'note', label: 'Nota' }
];

export function SubitemInput({ 
  subitem, 
  deliverableIndex, 
  subitemIndex 
}: SubitemInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateSubitem, removeSubitem } = useProposalStore();

  const handleFormat = (format: 'bold' | 'italic' | 'code') => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const text = input.value;
    const selectedText = text.substring(start, end);

    if (selectedText.length === 0) return;

    const formatMap = {
      bold: `**${selectedText}**`,
      italic: `_${selectedText}_`,
      code: `\`${selectedText}\``
    };

    const formattedText = formatMap[format];
    const newValue = text.substring(0, start) + formattedText + text.substring(end);

    updateSubitem(deliverableIndex, subitemIndex, 'texto', newValue);

    // Restaurar foco e seleção
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start, start + formattedText.length);
    }, 0);
  };

  return (
    <div className={styles.subitem}>
      <Select
        value={subitem.tipo}
        onChange={(e) => updateSubitem(deliverableIndex, subitemIndex, 'tipo', e.target.value)}
        options={subitemTypeOptions}
        size="xs"
        className={styles.subitemTypeSelect}
      />

      <Input
        ref={inputRef}
        value={subitem.texto}
        onChange={(e) => updateSubitem(deliverableIndex, subitemIndex, 'texto', e.target.value)}
        placeholder="Descrição do requisito..."
        size="sm"
        className={styles.subitemInput}
      />

      <TextFormatButtons onFormat={handleFormat} />

      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => removeSubitem(deliverableIndex, subitemIndex)}
        className={styles.removeSubitemButton}
      >
        <X size={14} />
      </Button>
    </div>
  );
}
```

### 5.7 Tabela de Itens e Valores

```tsx
// components/proposals/ItemsTable/ItemsTable.tsx

'use client';

import { useProposalStore } from '@/stores/proposalStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import styles from './ItemsTable.module.css';

export function ItemsTable() {
  const { itens, addItem, removeItem, updateItem, getTotal } = useProposalStore();

  return (
    <div className={styles.itemsTableContainer}>
      <table className={styles.itemsTable}>
        <thead>
          <tr>
            <th style={{ width: '45%' }}>Descrição</th>
            <th style={{ width: '15%' }}>Qtd</th>
            <th style={{ width: '20%' }}>Valor Unit.</th>
            <th style={{ width: '15%' }}>Total</th>
            <th style={{ width: '5%' }}></th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item, index) => {
            const itemTotal = item.quantidade * item.valorUnitario;
            return (
              <tr key={index}>
                <td>
                  <Input
                    value={item.descricao}
                    onChange={(e) => updateItem(index, 'descricao', e.target.value)}
                    placeholder="Descrição do item"
                  />
                </td>
                <td>
                  <Input
                    type="number"
                    min={1}
                    value={item.quantidade}
                    onChange={(e) => updateItem(index, 'quantidade', parseInt(e.target.value) || 0)}
                    className={styles.qtyInput}
                  />
                </td>
                <td>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={item.valorUnitario}
                    onChange={(e) => updateItem(index, 'valorUnitario', parseFloat(e.target.value) || 0)}
                    className={styles.priceInput}
                  />
                </td>
                <td className={styles.itemTotal}>
                  {formatCurrency(itemTotal)}
                </td>
                <td>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeItem(index)}
                    className={styles.removeButton}
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Button
        variant="dashed"
        onClick={addItem}
        className={styles.addButton}
      >
        <Plus size={16} />
        Adicionar Item
      </Button>

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>VALOR TOTAL</span>
        <span className={styles.totalValue}>{formatCurrency(getTotal())}</span>
      </div>
    </div>
  );
}
```

### 5.8 Preview do Documento

```tsx
// components/proposals/PreviewPanel/PreviewPanel.tsx

'use client';

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { DocumentPreview } from './DocumentPreview';
import { Button } from '@/components/ui/Button';
import { Eye, Printer } from 'lucide-react';
import styles from './PreviewPanel.module.css';

export function PreviewPanel() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Documento',
    pageStyle: `
      @page { size: A4; margin: 20mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `
  });

  return (
    <aside className={styles.previewPanel}>
      <div className={styles.previewWrapper}>
        <div className={styles.previewHeader}>
          <h3 className={styles.previewTitle}>
            <Eye size={18} />
            Preview do Documento
          </h3>
          <div className={styles.previewActions}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrint}
              title="Imprimir"
            >
              <Printer size={18} />
            </Button>
          </div>
        </div>

        <div className={styles.previewContent}>
          <div ref={printRef}>
            <DocumentPreview />
          </div>
        </div>
      </div>
    </aside>
  );
}
```

### 5.9 Renderização do Documento

```tsx
// components/proposals/PreviewPanel/DocumentPreview.tsx

'use client';

import { useProposalStore } from '@/stores/proposalStore';
import { formatCurrency, formatDateDisplay } from '@/utils/formatters';
import { renderFormattedText } from '@/utils/textFormatting';
import { DEFAULT_TEXTS } from '@/constants/defaultTexts';
import { DOCUMENT_TYPE_LABELS } from '@/constants/documentTypes';
import styles from './DocumentPreview.module.css';

export function DocumentPreview() {
  const { 
    documentId, 
    tipo, 
    dataEmissao, 
    validade, 
    cliente, 
    projeto, 
    itens, 
    condicoes,
    getTotal 
  } = useProposalStore();

  const total = getTotal();

  return (
    <div className={styles.document}>
      {/* Cabeçalho */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>GQ</div>
          <div className={styles.logoText}>Gabriel Queiroz</div>
        </div>
        <div className={styles.info}>
          <div className={styles.type}>{DOCUMENT_TYPE_LABELS[tipo]}</div>
          <div className={styles.id}>{documentId}</div>
          <div className={styles.date}>
            Emissão: {formatDateDisplay(dataEmissao)} | Validade: {formatDateDisplay(validade)}
          </div>
        </div>
      </header>

      {/* Apresentação */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Apresentação</h2>
        <p className={styles.text}>{DEFAULT_TEXTS.apresentacao}</p>
      </section>

      {/* Dados do Cliente */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Dados do Cliente</h2>
        <div className={styles.clientInfo}>
          <div className={styles.clientRow}>
            <span className={styles.clientLabel}>Nome:</span>
            <span className={styles.clientValue}>{cliente.nome || '—'}</span>
          </div>
          <div className={styles.clientRow}>
            <span className={styles.clientLabel}>CPF/CNPJ:</span>
            <span className={styles.clientValue}>{cliente.documento || '—'}</span>
          </div>
          <div className={styles.clientRow}>
            <span className={styles.clientLabel}>Responsável:</span>
            <span className={styles.clientValue}>{cliente.responsavel || '—'}</span>
          </div>
          <div className={styles.clientRow}>
            <span className={styles.clientLabel}>E-mail:</span>
            <span className={styles.clientValue}>{cliente.email || '—'}</span>
          </div>
          {cliente.endereco && (
            <div className={styles.clientRowFull}>
              <span className={styles.clientLabel}>Endereço:</span>
              <span className={styles.clientValue}>{cliente.endereco}</span>
            </div>
          )}
        </div>
      </section>

      {/* Descrição do Projeto */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Descrição do Projeto</h2>
        <p className={styles.text}>{projeto.descricao || DEFAULT_TEXTS.escopo}</p>
      </section>

      {/* Escopo e Entregáveis */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Escopo e Entregáveis</h2>
        <div className={styles.deliverablesContainer}>
          {projeto.entregaveis.filter(e => e.titulo?.trim()).map((entregavel, index) => (
            <div 
              key={index} 
              className={`${styles.deliverable} ${styles[`deliverable_${entregavel.tipo}`]}`}
            >
              <div className={styles.deliverableHeader}>
                <span className={styles.deliverableBadge}>
                  {getDeliverableTypeLabel(entregavel.tipo)}
                </span>
                <span className={styles.deliverableTitle}>{entregavel.titulo}</span>
              </div>
              {entregavel.subitens.filter(s => s.texto?.trim()).length > 0 && (
                <ul className={styles.subitems}>
                  {entregavel.subitens.filter(s => s.texto?.trim()).map((sub, subIndex) => (
                    <li key={subIndex}>
                      <span className={`${styles.subitemTag} ${styles[`tag_${sub.tipo}`]}`}>
                        {getSubitemTypeLabel(sub.tipo)}
                      </span>
                      <span 
                        dangerouslySetInnerHTML={{ 
                          __html: renderFormattedText(sub.texto) 
                        }} 
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {projeto.entregaveis.filter(e => e.titulo?.trim()).length === 0 && (
            <p className={styles.emptyText}>Nenhum entregável definido</p>
          )}
        </div>
      </section>

      {/* Valores */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Valores</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '50%' }}>Descrição</th>
              <th style={{ width: '15%', textAlign: 'center' }}>Qtd</th>
              <th style={{ width: '17%', textAlign: 'right' }}>Valor Unit.</th>
              <th style={{ width: '18%' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {itens.filter(item => item.descricao?.trim()).map((item, index) => (
              <tr key={index}>
                <td>{item.descricao}</td>
                <td style={{ textAlign: 'center' }}>{item.quantidade}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.valorUnitario)}</td>
                <td>{formatCurrency(item.quantidade * item.valorUnitario)}</td>
              </tr>
            ))}
            {itens.filter(item => item.descricao?.trim()).length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>
                  Nenhum item adicionado
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className={styles.totalRow}>
          <div className={styles.total}>
            <span className={styles.totalLabel}>VALOR TOTAL:</span>
            <span className={styles.totalValue}>{formatCurrency(total)}</span>
          </div>
        </div>
      </section>

      {/* Condições Comerciais */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Condições Comerciais</h2>
        <div className={styles.clause}>
          <h3 className={styles.clauseTitle}>Prazo de Execução</h3>
          <p className={styles.clauseText}>{condicoes.prazo || DEFAULT_TEXTS.prazo}</p>
        </div>
        <div className={styles.clause}>
          <h3 className={styles.clauseTitle}>Forma de Pagamento</h3>
          <p className={styles.clauseText}>{condicoes.formaPagamento || DEFAULT_TEXTS.pagamento}</p>
        </div>
        {condicoes.condicoesAdicionais && (
          <div className={styles.clause}>
            <h3 className={styles.clauseTitle}>Condições Adicionais</h3>
            <p className={styles.clauseText}>{condicoes.condicoesAdicionais}</p>
          </div>
        )}
        <div className={styles.clause}>
          <h3 className={styles.clauseTitle}>Garantia e Suporte</h3>
          <p className={styles.clauseText}>{condicoes.garantias || DEFAULT_TEXTS.suporte}</p>
        </div>
      </section>

      {/* Cláusulas Contratuais */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Cláusulas Contratuais</h2>
        <div className={styles.clause}>
          <h3 className={styles.clauseTitle}>Propriedade Intelectual</h3>
          <p className={styles.clauseText}>{DEFAULT_TEXTS.propriedadeIntelectual}</p>
        </div>
        <div className={styles.clause}>
          <h3 className={styles.clauseTitle}>Confidencialidade</h3>
          <p className={styles.clauseText}>{DEFAULT_TEXTS.confidencialidade}</p>
        </div>
        <div className={styles.clause}>
          <h3 className={styles.clauseTitle}>Rescisão</h3>
          <p className={styles.clauseText}>{DEFAULT_TEXTS.rescisao}</p>
        </div>
      </section>

      {/* Assinaturas */}
      <div className={styles.signatures}>
        <div className={styles.signature}>
          <div className={styles.signatureLine}>
            <div className={styles.signatureName}>{cliente.nome || 'CONTRATANTE'}</div>
            <div className={styles.signatureRole}>Contratante</div>
          </div>
        </div>
        <div className={styles.signature}>
          <div className={styles.signatureLine}>
            <div className={styles.signatureName}>Gabriel Queiroz de Souza</div>
            <div className={styles.signatureRole}>Contratada</div>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <footer className={styles.footer}>
        <span>Gabriel Queiroz | Desenvolvimento de Software</span>
        <span>{documentId}</span>
        <span>Página 1 de 1</span>
      </footer>
    </div>
  );
}

// Helpers
function getDeliverableTypeLabel(tipo: string) {
  const labels: Record<string, string> = {
    feature: 'Funcionalidade',
    functional: 'Requisito Funcional',
    'non-functional': 'Requisito Não Funcional',
    task: 'Tarefa'
  };
  return labels[tipo] || 'Item';
}

function getSubitemTypeLabel(tipo: string) {
  const labels: Record<string, string> = {
    functional: 'RF',
    'non-functional': 'RNF',
    note: 'Nota'
  };
  return labels[tipo] || tipo;
}
```

---

## 6. Services e API Layer

### 6.1 Configuração Supabase

```typescript
// services/supabaseClient.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[Supabase] Credenciais não configuradas, usando localStorage');
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  return supabaseClient;
}

export function isSupabaseAvailable(): boolean {
  return getSupabaseClient() !== null;
}
```

### 6.2 Document Service

```typescript
// services/documentService.ts

import { getSupabaseClient, isSupabaseAvailable } from './supabaseClient';
import type { Document, DocumentStatus } from '@/types/proposal';

const LOCAL_STORAGE_KEY = 'gq_documents';

// === HELPERS ===
function getLocalDocuments(): Document[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalDocuments(documents: Document[]): void {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(documents));
}

// === SERVICE ===
export const documentService = {
  async save(documentData: Partial<Document>): Promise<Document> {
    const document: Document = {
      id: documentData.id || generateDocumentId(),
      tipo: documentData.tipo || 'proposta',
      dados_cliente: documentData.dados_cliente || {
        nome: '',
        responsavel: '',
        email: '',
        documento: '',
        endereco: ''
      },
      conteudo: documentData.conteudo || {
        descricao: '',
        entregaveis: [],
        itens: [],
        prazo: '',
        formaPagamento: '',
        condicoesAdicionais: '',
        garantias: ''
      },
      valor_total: documentData.valor_total || 0,
      data_emissao: documentData.data_emissao || new Date().toISOString().split('T')[0],
      data_validade: documentData.data_validade || null,
      status: documentData.status || 'rascunho',
      created_at: documentData.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const client = getSupabaseClient();
    
    if (client) {
      try {
        const { data, error } = await client
          .from('documentos')
          .upsert({
            id: document.id,
            tipo: document.tipo,
            dados_cliente: document.dados_cliente,
            conteudo: document.conteudo,
            valor_total: document.valor_total,
            status: document.status,
            data_emissao: document.data_emissao,
            data_validade: document.data_validade
          })
          .select()
          .single();

        if (error) throw error;
        console.log('[DocumentService] Salvo no Supabase:', document.id);
        return data;
      } catch (error) {
        console.error('[DocumentService] Erro Supabase:', error);
      }
    }

    // Fallback: localStorage
    const documents = getLocalDocuments();
    const existingIndex = documents.findIndex(d => d.id === document.id);

    if (existingIndex >= 0) {
      documents[existingIndex] = document;
    } else {
      documents.push(document);
    }

    saveLocalDocuments(documents);
    console.log('[DocumentService] Salvo localmente:', document.id);
    return document;
  },

  async getById(id: string): Promise<Document | null> {
    const client = getSupabaseClient();

    if (client) {
      try {
        const { data, error } = await client
          .from('documentos')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('[DocumentService] Erro ao buscar:', error);
      }
    }

    // Fallback: localStorage
    const documents = getLocalDocuments();
    return documents.find(d => d.id === id) || null;
  },

  async getAll(): Promise<Document[]> {
    const client = getSupabaseClient();

    if (client) {
      try {
        const { data, error } = await client
          .from('documentos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('[DocumentService] Erro ao listar:', error);
      }
    }

    // Fallback: localStorage
    return getLocalDocuments().sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async delete(id: string): Promise<void> {
    const client = getSupabaseClient();

    if (client) {
      try {
        const { error } = await client
          .from('documentos')
          .delete()
          .eq('id', id);

        if (error) throw error;
        console.log('[DocumentService] Deletado do Supabase:', id);
        return;
      } catch (error) {
        console.error('[DocumentService] Erro ao deletar:', error);
      }
    }

    // Fallback: localStorage
    const documents = getLocalDocuments().filter(d => d.id !== id);
    saveLocalDocuments(documents);
    console.log('[DocumentService] Deletado localmente:', id);
  },

  async updateStatus(id: string, status: DocumentStatus): Promise<Document | null> {
    const document = await this.getById(id);
    if (!document) return null;
    
    document.status = status;
    document.updated_at = new Date().toISOString();
    return await this.save(document);
  }
};

// Helper
function generateDocumentId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DOC-${timestamp}-${random}`;
}
```

---

## 7. Hooks Customizados

### 7.1 useDocuments Hook

```typescript
// hooks/useDocuments.ts

import { useState, useEffect, useCallback } from 'react';
import { documentService } from '@/services/documentService';
import { useProposalStore } from '@/stores/proposalStore';
import { useToast } from './useToast';
import type { Document } from '@/types/proposal';

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const { loadDocument: loadDocumentToStore, resetForm } = useProposalStore();

  // Carregar todos os documentos
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const docs = await documentService.getAll();
      setDocuments(docs);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
      showToast('Erro ao carregar documentos', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Salvar documento atual
  const saveDocument = useCallback(async () => {
    const state = useProposalStore.getState();
    
    try {
      const documentData = {
        id: state.documentId,
        tipo: state.tipo,
        dados_cliente: state.cliente,
        conteudo: {
          descricao: state.projeto.descricao,
          entregaveis: state.projeto.entregaveis.filter(e => e.titulo?.trim()),
          itens: state.itens,
          prazo: state.condicoes.prazo,
          formaPagamento: state.condicoes.formaPagamento,
          condicoesAdicionais: state.condicoes.condicoesAdicionais,
          garantias: state.condicoes.garantias
        },
        valor_total: state.getTotal(),
        data_emissao: state.dataEmissao,
        data_validade: state.validade
      };

      await documentService.save(documentData);
      showToast('Documento salvo com sucesso!', 'success');
      await fetchDocuments();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      showToast('Erro ao salvar documento', 'error');
    }
  }, [fetchDocuments, showToast]);

  // Carregar documento
  const loadDocument = useCallback(async (id: string) => {
    try {
      const doc = await documentService.getById(id);
      if (!doc) {
        showToast('Documento não encontrado', 'error');
        return;
      }
      loadDocumentToStore(doc);
      showToast('Documento carregado com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao carregar:', error);
      showToast('Erro ao carregar documento', 'error');
    }
  }, [loadDocumentToStore, showToast]);

  // Deletar documento
  const deleteDocument = useCallback(async (id: string) => {
    try {
      await documentService.delete(id);
      showToast('Documento excluído com sucesso', 'success');
      await fetchDocuments();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      showToast('Erro ao excluir documento', 'error');
    }
  }, [fetchDocuments, showToast]);

  // Criar novo documento
  const createNewDocument = useCallback(() => {
    resetForm();
    showToast('Novo documento criado', 'success');
  }, [resetForm, showToast]);

  // Carregar ao montar
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    isLoading,
    saveDocument,
    loadDocument,
    deleteDocument,
    createNewDocument,
    refreshDocuments: fetchDocuments
  };
}
```

### 7.2 useToast Hook

```typescript
// hooks/useToast.ts

import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));

    // Auto-remove após 3 segundos
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, 3000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }))
}));

export function useToast() {
  const { toasts, addToast, removeToast } = useToastStore();

  return {
    toasts,
    showToast: addToast,
    hideToast: removeToast
  };
}
```

### 7.3 useDebounce Hook

```typescript
// hooks/useDebounce.ts

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 8. Sistema de Estilos

### 8.1 Variáveis CSS (Design Tokens)

```css
/* styles/variables.css */

:root {
  /* === CORES BASE === */
  --pp-deep-black: #030A1A;
  --pp-navy-intense: #071B34;
  --pp-blue-medium: #0A2E5A;
  --pp-blue-glow: #7AB7FF;
  --pp-blue-accent: #155AAE;
  
  /* === TEXTO === */
  --pp-text-soft: #F5F8FF;
  --pp-text-muted: rgba(245, 248, 255, 0.7);
  --pp-text-dim: rgba(245, 248, 255, 0.5);
  
  /* === GLASSMORPHISM === */
  --pp-glass-bg: rgba(7, 27, 52, 0.45);
  --pp-glass-border: rgba(255, 255, 255, 0.05);
  --pp-glass-hover: rgba(122, 183, 255, 0.35);
  
  /* === GRADIENTES === */
  --pp-gradient-bg: radial-gradient(circle at 30% 20%, #0A2E5A 0%, #071B34 40%, #030A1A 100%);
  --pp-gradient-btn: linear-gradient(90deg, #0A2E5A, #155AAE);
  --pp-gradient-title: linear-gradient(135deg, #F5F8FF 0%, #7AB7FF 100%);
  
  /* === GLOW === */
  --pp-glow-primary: 0 0 18px rgba(122, 183, 255, 0.25);
  --pp-glow-text: 0 0 12px rgba(122, 183, 255, 0.35);
  
  /* === LAYOUT === */
  --pp-radius: 12px;
  --pp-radius-sm: 8px;
  --pp-transition: 0.3s ease;
  
  /* === TIPOGRAFIA === */
  --pp-font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --pp-font-heading: 'Poppins', sans-serif;
  
  /* === CORES DE STATUS === */
  --pp-success: #10a37f;
  --pp-error: #ff6b6b;
  --pp-warning: #f59e0b;
  --pp-info: #6366f1;
}
```

### 8.2 Estilos Globais

```css
/* styles/globals.css */

@import './variables.css';

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: var(--pp-gradient-bg);
  color: var(--pp-text-soft);
  font-family: var(--pp-font-primary);
  line-height: 1.6;
}

/* Reset de listas */
ul, ol {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* Reset de botões */
button {
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
}

/* Reset de inputs */
input, textarea, select {
  font-family: inherit;
}

/* Focus visible */
:focus-visible {
  outline: 2px solid var(--pp-blue-glow);
  outline-offset: 2px;
}

/* Scrollbar customizada */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--pp-deep-black);
}

::-webkit-scrollbar-thumb {
  background: var(--pp-blue-medium);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--pp-blue-glow);
}
```

### 8.3 Estilos de Impressão

```css
/* styles/print.css */

@media print {
  .no-print,
  .pp-header,
  .pp-form-panel,
  .pp-preview-header,
  .pp-actions-bar,
  .pp-toast-container {
    display: none !important;
  }

  body {
    background: white;
    color: #1a1a2e;
    font-size: 11px;
  }

  .pp-main {
    display: block;
    padding: 0;
  }

  .pp-preview-panel {
    position: static;
    max-height: none;
  }

  .pp-preview-wrapper {
    border: none;
    background: none;
  }

  .pp-preview-content {
    padding: 0;
    background: white;
  }

  .pp-document {
    box-shadow: none;
    padding: 0;
  }

  @page {
    size: A4;
    margin: 20mm;
  }
}
```

---

## 9. Utilitários

### 9.1 Formatadores

```typescript
// utils/formatters.ts

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
```

### 9.2 Gerador de ID

```typescript
// utils/generators.ts

export function generateDocumentId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DOC-${timestamp}-${random}`;
}
```

### 9.3 Formatação de Texto (Markdown-like)

```typescript
// utils/textFormatting.ts

export function escapeHtml(text: string): string {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function renderFormattedText(text: string): string {
  if (!text) return '';
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')  // **bold**
    .replace(/_(.+?)_/g, '<em>$1</em>')                // _italic_
    .replace(/`(.+?)`/g, '<code>$1</code>');           // `code`
}
```

### 9.4 ClassNames Utility

```typescript
// lib/cn.ts

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 10. Constantes

### 10.1 Textos Padrão

```typescript
// constants/defaultTexts.ts

export const DEFAULT_TEXTS = {
  apresentacao: `Esta proposta tem como objetivo a prestação de serviços de desenvolvimento de software e/ou soluções tecnológicas, conforme escopo descrito abaixo, visando atender às necessidades específicas do contratante.`,
  
  escopo: `O presente projeto contempla o desenvolvimento de soluções digitais, incluindo planejamento, design, implementação, testes e entrega, conforme especificações acordadas entre as partes.`,
  
  prazo: `O prazo de execução terá início após a aprovação formal desta proposta e cumprimento das condições comerciais estabelecidas.`,
  
  pagamento: `Os valores descritos serão pagos conforme cronograma acordado, podendo ser parcelados ou condicionados a marcos de entrega.`,
  
  propriedadeIntelectual: `Os direitos de uso do software desenvolvido serão transferidos ao contratante após a quitação integral dos valores acordados, exceto bibliotecas de terceiros.`,
  
  suporte: `Será oferecido suporte técnico por período previamente definido, limitado a correções de defeitos relacionados ao escopo original.`,
  
  confidencialidade: `Ambas as partes comprometem-se a manter sigilo sobre informações técnicas, comerciais e estratégicas compartilhadas durante a execução do projeto.`,
  
  rescisao: `O contrato poderá ser rescindido por qualquer das partes mediante aviso prévio, respeitando os valores proporcionais aos serviços já executados.`
};
```

### 10.2 Tipos de Documento

```typescript
// constants/documentTypes.ts

export const DOCUMENT_TYPES = ['proposta', 'orcamento', 'contrato'] as const;

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  proposta: 'Proposta Comercial',
  orcamento: 'Orçamento',
  contrato: 'Contrato de Prestação de Serviços'
};

export const DOCUMENT_TYPE_ICONS: Record<string, string> = {
  proposta: 'FileText',
  orcamento: 'Calculator',
  contrato: 'FileSignature'
};
```

### 10.3 Tipos de Entregáveis

```typescript
// constants/deliverableTypes.ts

export const DELIVERABLE_TYPES = ['feature', 'functional', 'non-functional', 'task'] as const;

export const DELIVERABLE_TYPE_LABELS: Record<string, string> = {
  feature: 'Funcionalidade',
  functional: 'Requisito Funcional',
  'non-functional': 'Requisito Não Funcional',
  task: 'Tarefa'
};

export const DELIVERABLE_TYPE_COLORS: Record<string, string> = {
  feature: '#0A2E5A',
  functional: '#10a37f',
  'non-functional': '#f59e0b',
  task: '#6366f1'
};

export const SUBITEM_TYPES = ['functional', 'non-functional', 'note'] as const;

export const SUBITEM_TYPE_LABELS: Record<string, string> = {
  functional: 'RF',
  'non-functional': 'RNF',
  note: 'Nota'
};
```

---

## 11. Testes

### 11.1 Teste do Store

```typescript
// stores/__tests__/proposalStore.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { useProposalStore } from '../proposalStore';

describe('ProposalStore', () => {
  beforeEach(() => {
    useProposalStore.getState().resetForm();
  });

  it('deve adicionar um entregável', () => {
    const store = useProposalStore.getState();
    const initialCount = store.projeto.entregaveis.length;
    
    store.addDeliverable();
    
    expect(store.projeto.entregaveis.length).toBe(initialCount + 1);
  });

  it('deve calcular o total corretamente', () => {
    const store = useProposalStore.getState();
    
    store.updateItem(0, 'quantidade', 2);
    store.updateItem(0, 'valorUnitario', 100);
    
    expect(store.getTotal()).toBe(200);
  });

  it('deve atualizar dados do cliente', () => {
    const store = useProposalStore.getState();
    
    store.updateCliente('nome', 'Empresa Teste');
    
    expect(store.cliente.nome).toBe('Empresa Teste');
  });
});
```

### 11.2 Teste de Componente

```tsx
// components/proposals/__tests__/ItemsTable.test.tsx

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ItemsTable } from '../ItemsTable/ItemsTable';

describe('ItemsTable', () => {
  it('deve renderizar a tabela com cabeçalhos', () => {
    render(<ItemsTable />);
    
    expect(screen.getByText('Descrição')).toBeInTheDocument();
    expect(screen.getByText('Qtd')).toBeInTheDocument();
    expect(screen.getByText('Valor Unit.')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('deve ter botão de adicionar item', () => {
    render(<ItemsTable />);
    
    expect(screen.getByText('Adicionar Item')).toBeInTheDocument();
  });
});
```

---

## 12. Deploy

### 12.1 Variáveis de Ambiente

```env
# .env.local

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 12.2 Configuração Vercel

```json
// vercel.json

{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "regions": ["gru1"],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

### 12.3 Script de Build

```json
// package.json scripts

{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

## 13. Checklist de Migração

- [ ] Configurar projeto React/Next.js
- [ ] Instalar dependências
- [ ] Criar estrutura de pastas
- [ ] Implementar types TypeScript
- [ ] Criar Zustand store
- [ ] Migrar CSS para CSS Modules ou Tailwind
- [ ] Criar componentes UI base (Button, Input, Select, etc.)
- [ ] Implementar FormPanel com seções
- [ ] Implementar PreviewPanel
- [ ] Criar DocumentService com Supabase
- [ ] Implementar hooks customizados
- [ ] Criar modal de rascunhos
- [ ] Implementar sistema de toasts
- [ ] Testar funcionalidade de PDF/impressão
- [ ] Escrever testes
- [ ] Deploy

---

## 14. Resumo das Diferenças Principais

| Aspecto | Original (Vanilla) | React |
|---------|-------------------|-------|
| Estado | Object global `ProposalState` | Zustand store com actions |
| Binding | `addEventListener` manual | Props e estado reativo |
| Rendering | `innerHTML` templates | JSX componentes |
| Formulário | IDs e `document.getElementById` | Controlled components |
| Validação | Manual | Zod + React Hook Form |
| Estilos | CSS global isolado | CSS Modules ou Tailwind |
| Service | Objeto global | Módulo importável |
| Persistência | localStorage + Supabase | Mesmo, via service |

---

## 15. Arquitetura Final

```
┌─────────────────────────────────────────────────────────────────┐
│                         React App                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐     ┌─────────────────────────────────┐   │
│  │   Components    │◀───▶│      Zustand Store              │   │
│  │                 │     │  (useProposalStore)             │   │
│  │ • FormPanel     │     │                                 │   │
│  │ • PreviewPanel  │     │  Estado:                        │   │
│  │ • DraftsModal   │     │  • documentId, tipo, datas      │   │
│  │ • ItemsTable    │     │  • cliente {}                   │   │
│  │ • Deliverables  │     │  • projeto { entregaveis[] }    │   │
│  └─────────────────┘     │  • itens[]                      │   │
│          │               │  • condicoes {}                 │   │
│          │               │                                 │   │
│          │               │  Actions:                       │   │
│          ▼               │  • setTipo, updateCliente...    │   │
│  ┌─────────────────┐     │  • addDeliverable, addItem...   │   │
│  │   Custom Hooks  │     │  • getTotal, resetForm...       │   │
│  │                 │     └─────────────────────────────────┘   │
│  │ • useDocuments  │                    │                      │
│  │ • useToast      │                    │                      │
│  │ • useDebounce   │                    ▼                      │
│  └─────────────────┘     ┌─────────────────────────────────┐   │
│          │               │      Document Service           │   │
│          │               │                                 │   │
│          ▼               │  • save(doc)                    │   │
│  ┌─────────────────┐     │  • getById(id)                  │   │
│  │   UI Components │     │  • getAll()                     │   │
│  │                 │     │  • delete(id)                   │   │
│  │ • Button        │     │                                 │   │
│  │ • Input         │     │  ┌───────────┐ ┌────────────┐   │   │
│  │ • Select        │     │  │ Supabase  │ │ localStorage│   │   │
│  │ • Modal         │     │  │ (primary) │ │ (fallback) │   │   │
│  │ • Toast         │     │  └───────────┘ └────────────┘   │   │
│  └─────────────────┘     └─────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Este documento fornece todos os detalhes técnicos necessários para recriar a página de propostas em React, mantendo a mesma funcionalidade e design visual do projeto original em Vanilla JavaScript.
