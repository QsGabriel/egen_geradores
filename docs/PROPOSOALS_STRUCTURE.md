# Doc Preview CODE

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { generateDocumentId } from '@/utils/generators';
import { formatDate, addDays } from '@/utils/formatters';

// ==========================================
// 1. TIPAGENS (Pode ser movido para types/proposal.ts futuramente)
// ==========================================

export type DocumentType = 'proposta' | 'orcamento' | 'contrato';

export interface Client {
  nome: string;
  responsavel: string;
  email: string;
  telefone: string;
  documento: string; // CPF ou CNPJ
  endereco: string;
  cidadeUf: string;
}

export interface Equipamento {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  franquia: string;
  observacoes: string;
}

export interface Servico {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  observacoes: string;
}

export interface HoraExcedente {
  id: string;
  descricao: string;
  valorUnitario: number;
  observacoes: string;
}

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

// ==========================================
// 2. ESTADO INICIAL (Com padrões EGEN)
// ==========================================

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
    { id: crypto.randomUUID(), descricao: '', quantidade: 1, valorUnitario: 0, franquia: '35hrs/mês', observacoes: '' }
  ],
  servicos: [],
  horasExcedentes: [],
  // Textos padrões baseados nos PDFs da EGEN 
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

// ==========================================
// 3. STORE ZUSTAND
// ==========================================

interface ProposalStore extends ProposalState {
  setTipo: (tipo: DocumentType) => void;
  setDataEmissao: (data: string) => void;
  setValidade: (data: string) => void;
  
  updateCliente: (field: keyof Client, value: string) => void;
  
  // Ações para Equipamentos
  addEquipamento: () => void;
  removeEquipamento: (id: string) => void;
  updateEquipamento: (id: string, field: keyof Equipamento, value: any) => void;

  // Ações para Serviços
  addServico: () => void;
  removeServico: (id: string) => void;
  updateServico: (id: string, field: keyof Servico, value: any) => void;

  // Ações para Horas Excedentes
  addHoraExcedente: () => void;
  removeHoraExcedente: (id: string) => void;
  updateHoraExcedente: (id: string, field: keyof HoraExcedente, value: any) => void;

  updateCondicoes: (field: keyof CondicoesComerciais, value: string) => void;
  
  getTotalEquipamentos: () => number;
  getTotalServicos: () => number;
  getTotalGeral: () => number;
  
  resetForm: () => void;
  loadDocument: (doc: any) => void;
}

export const useProposalStore = create<ProposalStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setTipo: (tipo) => set({ tipo }),
        setDataEmissao: (dataEmissao) => set({ dataEmissao }),
        setValidade: (validade) => set({ validade }),

        updateCliente: (field, value) =>
          set((state) => ({ cliente: { ...state.cliente, [field]: value } })),

        // --- Equipamentos ---
        addEquipamento: () => set((state) => ({
          equipamentos: [...state.equipamentos, { id: crypto.randomUUID(), descricao: '', quantidade: 1, valorUnitario: 0, franquia: '', observacoes: '' }]
        })),
        removeEquipamento: (id) => set((state) => ({
          equipamentos: state.equipamentos.filter(e => e.id !== id)
        })),
        updateEquipamento: (id, field, value) => set((state) => ({
          equipamentos: state.equipamentos.map(e => e.id === id ? { ...e, [field]: value } : e)
        })),

        // --- Serviços Inclusos ---
        addServico: () => set((state) => ({
          servicos: [...state.servicos, { id: crypto.randomUUID(), descricao: '', quantidade: 1, valorUnitario: 0, observacoes: '' }]
        })),
        removeServico: (id) => set((state) => ({
          servicos: state.servicos.filter(s => s.id !== id)
        })),
        updateServico: (id, field, value) => set((state) => ({
          servicos: state.servicos.map(s => s.id === id ? { ...s, [field]: value } : s)
        })),

        // --- Horas Excedentes ---
        addHoraExcedente: () => set((state) => ({
          horasExcedentes: [...state.horasExcedentes, { id: crypto.randomUUID(), descricao: '', valorUnitario: 0, observacoes: 'por equipamento' }]
        })),
        removeHoraExcedente: (id) => set((state) => ({
          horasExcedentes: state.horasExcedentes.filter(h => h.id !== id)
        })),
        updateHoraExcedente: (id, field, value) => set((state) => ({
          horasExcedentes: state.horasExcedentes.map(h => h.id === id ? { ...h, [field]: value } : h)
        })),

        // --- Condições ---
        updateCondicoes: (field, value) =>
          set((state) => ({ condicoes: { ...state.condicoes, [field]: value } })),

        // --- Totais ---
        getTotalEquipamentos: () => get().equipamentos.reduce((sum, e) => sum + (e.quantidade * e.valorUnitario), 0),
        getTotalServicos: () => get().servicos.reduce((sum, s) => sum + (s.quantidade * s.valorUnitario), 0),
        getTotalGeral: () => get().getTotalEquipamentos() + get().getTotalServicos(),

        resetForm: () => set({ ...initialState, documentId: generateDocumentId() }),

        loadDocument: (doc) => set({
          documentId: doc.id,
          tipo: doc.tipo || 'proposta',
          dataEmissao: doc.data_emissao || formatDate(new Date()),
          validade: doc.data_validade || formatDate(addDays(new Date(), 15)), // Padrão EGEN 
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

# DocumentPreview.tsx
import { DOCUMENT_TYPE_LABELS } from '@/constants/documentTypes';

// ... dentro do componente DocumentPreview:

      {/* ================= PÁGINA 1: CAPA ================= */}
      <section className={`${styles.page} ${styles.coverPage}`}>
        <img src="/CAPA.png" alt="Fundo da Capa" className={styles.coverBackground} />
        
        <div className={styles.coverContent}>
          {/* Título dinâmico no topo, em maiúsculas */}
          <h1 className={styles.coverDynamicTitle}>
            {tipo === 'proposta' ? 'PROPOSTA DE LOCAÇÃO' : DOCUMENT_TYPE_LABELS[tipo].toUpperCase()}
          </h1>
        </div>
      </section>

      {/* ================= PÁGINA 2: INTRODUÇÃO ================= */}
      <section className={`${styles.page} ${styles.contentPage}`}>
        {/* ... cabeçalho e dados do cliente mantidos iguais ... */}

        <div className={styles.introSection}>
          <h4>INTRODUÇÃO:</h4>
          <p>A <strong>EGEN Geradores</strong> é especializada <strong>venda e locação</strong> de Grupos Geradores de Energia, entregando soluções completas e personalizadas para os mais diversos setores, como <strong>mineração</strong>, <strong>agronegócio</strong>, <strong>indústria</strong>, <strong>construção civil</strong> e <strong>comércio</strong>.</p>
          <p>Contamos com uma equipe de engenharia altamente capacitada, pronta para dimensionar e implementar sistemas de geração de energia com máxima eficiência e segurança.</p>
          <p>Fazemos parte de um dos maiores grupos do setor, o que nos permite acesso a uma ampla frota própria de geradores modernos e de alta performance.</p>
        </div>
        
        {/* Container do Gerador com sobreposição */}
        <div className={styles.generatorImageWrapper}>
          <img src="/GERADOR.png" alt="Gerador EGEN" className={styles.generatorImage} />
        </div>

        <div className={styles.introContinuation}>
          <p>Nosso suporte técnico é ágil e atuante, garantindo atendimento rápido e eficaz em demandas programadas ou emergenciais.</p>
          <p>Com foco em qualidade, continuidade operacional e transparência, oferecemos energia sob medida para manter sua operação sempre em movimento.</p>
        </div>

        {/* ... restante da página mantido igual ... */}
      </section>

# DOC PREVIEW STYLE

/* DocumentPreview.module.css */

.document {
  font-family: 'Inter', sans-serif;
  color: #111111;
  background: white;
  /* Largura padrão A4 em pixels para preview na tela */
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  position: relative;
}

/* === REGRAS GERAIS DE PÁGINA === */
.page {
  position: relative;
  width: 100%;
  height: 297mm; /* Força a altura de 1 página A4 */
  overflow: hidden;
  box-sizing: border-box;
  page-break-after: always;
}

/* Evita quebra de página sobrando na última */
.page:last-child {
  page-break-after: auto;
}

.contentPage {
  padding: 20mm;
}

/* === CAPA === */
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
  object-fit: cover; /* Garante que a capa preencha tudo sem distorcer */
  z-index: 1;
}

.coverContent {
  position: relative;
  z-index: 2;
  width: 100%;
  padding-top: 15mm; /* Ajuste conforme o espaçamento do topo da sua CAPA.png */
  text-align: center;
}

.coverDynamicTitle {
  color: #FFFFFF;
  font-size: 28pt;
  font-weight: 700;
  letter-spacing: 2px;
  margin: 0;
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.5); /* Ajuda na leitura caso o fundo seja claro */
}

/* === INTRODUÇÃO E GERADOR SOBREPOSTO === */
.introSection {
  margin-top: 10mm;
  position: relative;
  z-index: 2; /* Fica abaixo do gerador */
}

.introSection h4 {
  color: #0D2A59; /* Azul EGEN */
  font-size: 14pt;
  margin-bottom: 5mm;
}

.introSection p, .introContinuation p {
  font-size: 11pt;
  line-height: 1.6;
  text-align: justify;
  margin-bottom: 3mm;
}

/* O TRUQUE DO GERADOR VAZADO */
.generatorImageWrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 10;
  /* Margens negativas para puxar a imagem para cima do texto anterior e texto seguinte */
  margin-top: -15mm; 
  margin-bottom: -15mm;
}

.generatorImage {
  max-width: 85%; /* Ajuste o tamanho do gerador aqui */
  height: auto;
  filter: drop-shadow(0 20px 20px rgba(0, 0, 0, 0.15)); /* Sombra realista no PNG vazado */
}

.introContinuation {
  position: relative;
  z-index: 2;
}

/* === REGRAS DE IMPRESSÃO (CRÍTICO PARA O PDF) === */
@media print {
  .document {
    width: 100%;
    box-shadow: none;
    margin: 0;
  }

  .page {
    /* Reseta a altura fixa na impressão para o browser lidar melhor com a mídia física */
    height: 100vh; 
    page-break-after: always;
  }

  /* Garante que imagens de fundo (como a capa) sejam impressas */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}