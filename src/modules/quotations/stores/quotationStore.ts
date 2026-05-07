/**
 * EGEN System - Sales Quotation Store
 * Zustand store para gerenciamento de propostas comerciais
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  SalesQuotation,
  DocumentTipo,
  DocumentStatus,
  ClienteSnapshot,
  CondicoesComerciais,
  ProposalItemPeriodico,
  ProposalItemSpot,
  ProposalHoraExcedente,
  DEFAULT_CLIENTE_SNAPSHOT,
  DEFAULT_CONDICOES,
  createEmptyItemPeriodico,
  createEmptyItemSpot,
  createEmptyHoraExcedente,
  generateDocumentId,
  calculateItemPeriodicoTotal,
  calculateItemSpotTotal,
} from '../types/proposal';

// ============================================
// STORE STATE
// ============================================

interface QuotationStoreState {
  // Current quotation being edited
  current: SalesQuotation | null;
  
  // Draft list (saved locally)
  drafts: SalesQuotation[];
  
  // UI state
  isDirty: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Preview state
  previewMode: 'edit' | 'preview' | 'split';
}

interface QuotationStoreActions {
  // Document lifecycle
  createNew: (tipo?: DocumentTipo) => void;
  loadQuotation: (quotation: SalesQuotation) => void;
  saveDraft: () => void;
  deleteDraft: (id: string) => void;
  clearCurrent: () => void;
  
  // Document properties
  setTipo: (tipo: DocumentTipo) => void;
  setStatus: (status: DocumentStatus) => void;
  setDataEmissao: (data: string) => void;
  setValidade: (data: string) => void;
  setNotasInternas: (notas: string) => void;
  setObservacoesGerais: (obs: string) => void;
  setExibirTotaisPorTabela: (value: boolean) => void;
  
  // Cliente
  setCliente: (cliente: ClienteSnapshot) => void;
  updateCliente: <K extends keyof ClienteSnapshot>(field: K, value: ClienteSnapshot[K]) => void;
  setClientId: (clientId: string | null) => void;
  setLeadId: (leadId: string | null) => void;
  
  // Itens Periódicos
  addItemPeriodico: (item?: Partial<ProposalItemPeriodico>) => void;
  updateItemPeriodico: (id: string, updates: Partial<ProposalItemPeriodico>) => void;
  removeItemPeriodico: (id: string) => void;
  clearItensPeriodicos: () => void;
  
  // Itens Spot
  addItemSpot: (item?: Partial<ProposalItemSpot>) => void;
  updateItemSpot: (id: string, updates: Partial<ProposalItemSpot>) => void;
  removeItemSpot: (id: string) => void;
  clearItensSpot: () => void;
  
  // Horas Excedentes
  addHoraExcedente: (hora?: Partial<ProposalHoraExcedente>) => void;
  updateHoraExcedente: (id: string, updates: Partial<ProposalHoraExcedente>) => void;
  removeHoraExcedente: (id: string) => void;
  clearHorasExcedentes: () => void;
  
  // Condições
  setCondicoes: (condicoes: CondicoesComerciais) => void;
  updateCondicoes: <K extends keyof CondicoesComerciais>(field: K, value: CondicoesComerciais[K]) => void;
  
  // Desconto
  setDescontoPercent: (percent: number) => void;
  
  // Calculations
  recalculateTotals: () => void;
  getTotalPeriodicos: () => number;
  getTotalSpot: () => number;
  getTotalGeral: () => number;
  
  // UI
  setPreviewMode: (mode: 'edit' | 'preview' | 'split') => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

type QuotationStore = QuotationStoreState & QuotationStoreActions;

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function createEmptyQuotation(tipo: DocumentTipo = 'proposta'): SalesQuotation {
  const now = new Date();
  
  return {
    id: crypto.randomUUID(),
    documentId: generateDocumentId(tipo),
    clientId: null,
    leadId: null,
    tipo,
    status: 'draft',
    dataEmissao: formatDate(now),
    validade: formatDate(addDays(now, 15)),
    cliente: { ...DEFAULT_CLIENTE_SNAPSHOT },
    itensPeriodicos: [createEmptyItemPeriodico('gerador')],
    itensSpot: [],
    horasExcedentes: [],
    condicoes: { ...DEFAULT_CONDICOES },
    observacoesGerais: '',
    exibirTotaisPorTabela: false,
    totalPeriodicos: 0,
    totalSpot: 0,
    totalGeral: 0,
    descontoPercent: 0,
    descontoValor: 0,
    totalComDesconto: 0,
    createdBy: null,
    updatedBy: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    version: 1,
    parentId: null,
    notasInternas: '',
  };
}

// ============================================
// STORE IMPLEMENTATION
// ============================================

export const useQuotationStore = create<QuotationStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        current: null,
        drafts: [],
        isDirty: false,
        isLoading: false,
        error: null,
        previewMode: 'split',

        // ========== DOCUMENT LIFECYCLE ==========
        
        createNew: (tipo: DocumentTipo = 'proposta') => {
          const newQuotation = createEmptyQuotation(tipo);
          set({ 
            current: newQuotation, 
            isDirty: false,
            error: null,
          });
        },

        loadQuotation: (quotation) => {
          set({ 
            current: { ...quotation }, 
            isDirty: false,
            error: null,
          });
        },

        saveDraft: () => {
          const { current, drafts } = get();
          if (!current) return;

          const updatedCurrent = {
            ...current,
            updatedAt: new Date().toISOString(),
          };

          const existingIndex = drafts.findIndex(d => d.id === current.id);
          let newDrafts: SalesQuotation[];

          if (existingIndex >= 0) {
            newDrafts = [...drafts];
            newDrafts[existingIndex] = updatedCurrent;
          } else {
            newDrafts = [updatedCurrent, ...drafts];
          }

          set({ 
            current: updatedCurrent,
            drafts: newDrafts,
            isDirty: false,
          });
        },

        deleteDraft: (id) => {
          set((state) => ({
            drafts: state.drafts.filter(d => d.id !== id),
            current: state.current?.id === id ? null : state.current,
          }));
        },

        clearCurrent: () => {
          set({ current: null, isDirty: false, error: null });
        },

        // ========== DOCUMENT PROPERTIES ==========
        
        setTipo: (tipo) => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: {
                ...state.current,
                tipo,
                documentId: generateDocumentId(tipo),
              },
              isDirty: true,
            };
          });
        },

        setStatus: (status) => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: { ...state.current, status },
              isDirty: true,
            };
          });
        },

        setDataEmissao: (dataEmissao) => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: { ...state.current, dataEmissao },
              isDirty: true,
            };
          });
        },

        setValidade: (validade) => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: { ...state.current, validade },
              isDirty: true,
            };
          });
        },

        setNotasInternas: (notasInternas) => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: { ...state.current, notasInternas },
              isDirty: true,
            };
          });
        },

        setObservacoesGerais: (observacoesGerais) => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: { ...state.current, observacoesGerais },
              isDirty: true,
            };
          });
        },

        setExibirTotaisPorTabela: (exibirTotaisPorTabela) => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: { ...state.current, exibirTotaisPorTabela },
              isDirty: true,
            };
          });
        },

        // ========== CLIENTE ==========
        
        setCliente: (cliente) => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: { ...state.current, cliente },
              isDirty: true,
            };
          });
        },

        updateCliente: (field, value) => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: {
                ...state.current,
                cliente: { ...state.current.cliente, [field]: value },
              },
              isDirty: true,
            };
          });
        },

        setClientId: (clientId) => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: { ...state.current, clientId },
              isDirty: true,
            };
          });
        },

        setLeadId: (leadId) => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: { ...state.current, leadId },
              isDirty: true,
            };
          });
        },

        // ========== ITENS PERIÓDICOS ==========
        
        addItemPeriodico: (item) => {
          set((state) => {
            if (!state.current) return state;
            const newItem = {
              ...createEmptyItemPeriodico('gerador'),
              ...item,
            };
            return {
              current: {
                ...state.current,
                itensPeriodicos: [...state.current.itensPeriodicos, newItem],
              },
              isDirty: true,
            };
          });
          get().recalculateTotals();
        },

        updateItemPeriodico: (id, updates) => {
          set((state) => {
            if (!state.current) return state;
            const itensPeriodicos = state.current.itensPeriodicos.map(item => {
              if (item.id !== id) return item;
              const updated = { ...item, ...updates };
              updated.valorTotal = calculateItemPeriodicoTotal(updated);
              return updated;
            });
            return {
              current: { ...state.current, itensPeriodicos },
              isDirty: true,
            };
          });
          get().recalculateTotals();
        },

        removeItemPeriodico: (id) => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: {
                ...state.current,
                itensPeriodicos: state.current.itensPeriodicos.filter(item => item.id !== id),
              },
              isDirty: true,
            };
          });
          get().recalculateTotals();
        },

        clearItensPeriodicos: () => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: { ...state.current, itensPeriodicos: [] },
              isDirty: true,
            };
          });
          get().recalculateTotals();
        },

        // ========== ITENS SPOT ==========
        
        addItemSpot: (item) => {
          set((state) => {
            if (!state.current) return state;
            const newItem = {
              ...createEmptyItemSpot('personalizado'),
              ...item,
            };
            return {
              current: {
                ...state.current,
                itensSpot: [...state.current.itensSpot, newItem],
              },
              isDirty: true,
            };
          });
          get().recalculateTotals();
        },

        updateItemSpot: (id, updates) => {
          set((state) => {
            if (!state.current) return state;
            const itensSpot = state.current.itensSpot.map(item => {
              if (item.id !== id) return item;
              const updated = { ...item, ...updates };
              updated.valorTotal = calculateItemSpotTotal(updated);
              return updated;
            });
            return {
              current: { ...state.current, itensSpot },
              isDirty: true,
            };
          });
          get().recalculateTotals();
        },

        removeItemSpot: (id) => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: {
                ...state.current,
                itensSpot: state.current.itensSpot.filter(item => item.id !== id),
              },
              isDirty: true,
            };
          });
          get().recalculateTotals();
        },

        clearItensSpot: () => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: { ...state.current, itensSpot: [] },
              isDirty: true,
            };
          });
          get().recalculateTotals();
        },

        // ========== HORAS EXCEDENTES ==========
        
        addHoraExcedente: (hora) => {
          set((state) => {
            if (!state.current) return state;
            const newHora = {
              ...createEmptyHoraExcedente(),
              ...hora,
            };
            return {
              current: {
                ...state.current,
                horasExcedentes: [...state.current.horasExcedentes, newHora],
              },
              isDirty: true,
            };
          });
        },

        updateHoraExcedente: (id, updates) => {
          set((state) => {
            if (!state.current) return state;
            const horasExcedentes = state.current.horasExcedentes.map(h => 
              h.id === id ? { ...h, ...updates } : h
            );
            return {
              current: { ...state.current, horasExcedentes },
              isDirty: true,
            };
          });
        },

        removeHoraExcedente: (id) => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: {
                ...state.current,
                horasExcedentes: state.current.horasExcedentes.filter(h => h.id !== id),
              },
              isDirty: true,
            };
          });
        },

        clearHorasExcedentes: () => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: { ...state.current, horasExcedentes: [] },
              isDirty: true,
            };
          });
        },

        // ========== CONDIÇÕES ==========
        
        setCondicoes: (condicoes) => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: { ...state.current, condicoes },
              isDirty: true,
            };
          });
        },

        updateCondicoes: (field, value) => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: {
                ...state.current,
                condicoes: { ...state.current.condicoes, [field]: value },
              },
              isDirty: true,
            };
          });
        },

        // ========== DESCONTO ==========
        
        setDescontoPercent: (descontoPercent) => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: { ...state.current, descontoPercent },
              isDirty: true,
            };
          });
          get().recalculateTotals();
        },

        // ========== CALCULATIONS ==========
        
        recalculateTotals: () => {
          set((state) => {
            if (!state.current) return state;

            const totalPeriodicos = state.current.itensPeriodicos.reduce(
              (sum, item) => sum + calculateItemPeriodicoTotal(item),
              0
            );

            const totalSpot = state.current.itensSpot.reduce(
              (sum, item) => sum + calculateItemSpotTotal(item),
              0
            );

            const totalGeral = totalPeriodicos + totalSpot;
            const descontoValor = totalGeral * (state.current.descontoPercent / 100);
            const totalComDesconto = totalGeral - descontoValor;

            return {
              current: {
                ...state.current,
                totalPeriodicos,
                totalSpot,
                totalGeral,
                descontoValor,
                totalComDesconto,
              },
            };
          });
        },

        getTotalPeriodicos: () => {
          const { current } = get();
          if (!current) return 0;
          return current.itensPeriodicos.reduce(
            (sum, item) => sum + calculateItemPeriodicoTotal(item),
            0
          );
        },

        getTotalSpot: () => {
          const { current } = get();
          if (!current) return 0;
          return current.itensSpot.reduce(
            (sum, item) => sum + calculateItemSpotTotal(item),
            0
          );
        },

        getTotalGeral: () => {
          const { current } = get();
          if (!current) return 0;
          return get().getTotalPeriodicos() + get().getTotalSpot();
        },

        // ========== UI ==========
        
        setPreviewMode: (previewMode) => {
          set({ previewMode });
        },

        setError: (error) => {
          set({ error });
        },

        setLoading: (isLoading) => {
          set({ isLoading });
        },
      }),
      {
        name: 'egen-quotation-storage',
        partialize: (state) => ({
          drafts: state.drafts,
          previewMode: state.previewMode,
        }),
      }
    ),
    { name: 'QuotationStore' }
  )
);

// ============================================
// SELECTORS
// ============================================

// Cached empty arrays to avoid infinite re-renders
const EMPTY_ARRAY: never[] = [];

export const selectCurrent = (state: QuotationStore) => state.current;
export const selectDrafts = (state: QuotationStore) => state.drafts;
export const selectCliente = (state: QuotationStore) => state.current?.cliente;
export const selectItensPeriodicos = (state: QuotationStore) => state.current?.itensPeriodicos ?? EMPTY_ARRAY;
export const selectItensSpot = (state: QuotationStore) => state.current?.itensSpot ?? EMPTY_ARRAY;
export const selectHorasExcedentes = (state: QuotationStore) => state.current?.horasExcedentes ?? EMPTY_ARRAY;
export const selectCondicoes = (state: QuotationStore) => state.current?.condicoes;
export const selectTotals = (state: QuotationStore) => ({
  periodicos: state.current?.totalPeriodicos ?? 0,
  spot: state.current?.totalSpot ?? 0,
  geral: state.current?.totalGeral ?? 0,
  desconto: state.current?.descontoValor ?? 0,
  final: state.current?.totalComDesconto ?? 0,
});
export const selectIsDirty = (state: QuotationStore) => state.isDirty;
export const selectPreviewMode = (state: QuotationStore) => state.previewMode;

// Backward-compat selectors
/** @deprecated Use selectItensPeriodicos */
export const selectEquipamentos = selectItensPeriodicos;
/** @deprecated Use selectItensSpot */
export const selectServicos = selectItensSpot;

// Export types for external use
export type { QuotationStoreState as QuotationState, QuotationStoreActions as QuotationActions };
