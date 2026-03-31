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
  ProposalEquipamento,
  ProposalServico,
  ProposalHoraExcedente,
  DEFAULT_CLIENTE_SNAPSHOT,
  DEFAULT_CONDICOES,
  createEmptyEquipamento,
  createEmptyServico,
  createEmptyHoraExcedente,
  generateDocumentId,
  calculateEquipamentoTotal,
  calculateServicoTotal,
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
  
  // Cliente
  setCliente: (cliente: ClienteSnapshot) => void;
  updateCliente: <K extends keyof ClienteSnapshot>(field: K, value: ClienteSnapshot[K]) => void;
  setClientId: (clientId: string | null) => void;
  setLeadId: (leadId: string | null) => void;
  
  // Equipamentos
  addEquipamento: (equipamento?: Partial<ProposalEquipamento>) => void;
  updateEquipamento: (id: string, updates: Partial<ProposalEquipamento>) => void;
  removeEquipamento: (id: string) => void;
  clearEquipamentos: () => void;
  
  // Serviços
  addServico: (servico?: Partial<ProposalServico>) => void;
  updateServico: (id: string, updates: Partial<ProposalServico>) => void;
  removeServico: (id: string) => void;
  clearServicos: () => void;
  
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
  getTotalEquipamentos: () => number;
  getTotalServicos: () => number;
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
    equipamentos: [createEmptyEquipamento()],
    servicos: [],
    horasExcedentes: [],
    condicoes: { ...DEFAULT_CONDICOES },
    totalEquipamentos: 0,
    totalServicos: 0,
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

        // ========== EQUIPAMENTOS ==========
        
        addEquipamento: (equipamento) => {
          set((state) => {
            if (!state.current) return state;
            const newEquipamento = {
              ...createEmptyEquipamento(),
              ...equipamento,
            };
            return {
              current: {
                ...state.current,
                equipamentos: [...state.current.equipamentos, newEquipamento],
              },
              isDirty: true,
            };
          });
          get().recalculateTotals();
        },

        updateEquipamento: (id, updates) => {
          set((state) => {
            if (!state.current) return state;
            const equipamentos = state.current.equipamentos.map(eq => {
              if (eq.id !== id) return eq;
              const updated = { ...eq, ...updates };
              updated.valorTotal = calculateEquipamentoTotal(updated);
              return updated;
            });
            return {
              current: { ...state.current, equipamentos },
              isDirty: true,
            };
          });
          get().recalculateTotals();
        },

        removeEquipamento: (id) => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: {
                ...state.current,
                equipamentos: state.current.equipamentos.filter(eq => eq.id !== id),
              },
              isDirty: true,
            };
          });
          get().recalculateTotals();
        },

        clearEquipamentos: () => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: { ...state.current, equipamentos: [] },
              isDirty: true,
            };
          });
          get().recalculateTotals();
        },

        // ========== SERVIÇOS ==========
        
        addServico: (servico) => {
          set((state) => {
            if (!state.current) return state;
            const newServico = {
              ...createEmptyServico(),
              ...servico,
            };
            return {
              current: {
                ...state.current,
                servicos: [...state.current.servicos, newServico],
              },
              isDirty: true,
            };
          });
          get().recalculateTotals();
        },

        updateServico: (id, updates) => {
          set((state) => {
            if (!state.current) return state;
            const servicos = state.current.servicos.map(serv => {
              if (serv.id !== id) return serv;
              const updated = { ...serv, ...updates };
              updated.valorTotal = calculateServicoTotal(updated);
              return updated;
            });
            return {
              current: { ...state.current, servicos },
              isDirty: true,
            };
          });
          get().recalculateTotals();
        },

        removeServico: (id) => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: {
                ...state.current,
                servicos: state.current.servicos.filter(s => s.id !== id),
              },
              isDirty: true,
            };
          });
          get().recalculateTotals();
        },

        clearServicos: () => {
          set((state) => {
            if (!state.current) return state;
            return {
              current: { ...state.current, servicos: [] },
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

            const totalEquipamentos = state.current.equipamentos.reduce(
              (sum, eq) => sum + calculateEquipamentoTotal(eq),
              0
            );

            const totalServicos = state.current.servicos.reduce(
              (sum, serv) => sum + calculateServicoTotal(serv),
              0
            );

            const totalGeral = totalEquipamentos + totalServicos;
            const descontoValor = totalGeral * (state.current.descontoPercent / 100);
            const totalComDesconto = totalGeral - descontoValor;

            return {
              current: {
                ...state.current,
                totalEquipamentos,
                totalServicos,
                totalGeral,
                descontoValor,
                totalComDesconto,
              },
            };
          });
        },

        getTotalEquipamentos: () => {
          const { current } = get();
          if (!current) return 0;
          return current.equipamentos.reduce(
            (sum, eq) => sum + calculateEquipamentoTotal(eq),
            0
          );
        },

        getTotalServicos: () => {
          const { current } = get();
          if (!current) return 0;
          return current.servicos.reduce(
            (sum, serv) => sum + calculateServicoTotal(serv),
            0
          );
        },

        getTotalGeral: () => {
          const { current } = get();
          if (!current) return 0;
          return get().getTotalEquipamentos() + get().getTotalServicos();
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
export const selectEquipamentos = (state: QuotationStore) => state.current?.equipamentos ?? EMPTY_ARRAY;
export const selectServicos = (state: QuotationStore) => state.current?.servicos ?? EMPTY_ARRAY;
export const selectHorasExcedentes = (state: QuotationStore) => state.current?.horasExcedentes ?? EMPTY_ARRAY;
export const selectCondicoes = (state: QuotationStore) => state.current?.condicoes;
// Note: selectTotals returns a new object reference - use individual selectors or useShallow instead
export const selectTotals = (state: QuotationStore) => ({
  equipamentos: state.current?.totalEquipamentos ?? 0,
  servicos: state.current?.totalServicos ?? 0,
  geral: state.current?.totalGeral ?? 0,
  desconto: state.current?.descontoValor ?? 0,
  final: state.current?.totalComDesconto ?? 0,
});
export const selectIsDirty = (state: QuotationStore) => state.isDirty;
export const selectPreviewMode = (state: QuotationStore) => state.previewMode;

// Export types for external use
export type { QuotationStoreState as QuotationState, QuotationStoreActions as QuotationActions };
