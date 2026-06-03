import React, { Fragment, useEffect, useMemo, useState } from 'react';
import A4Page from './A4Page';
import { formatCurrency, formatDate } from '../../engine';
import { toDataURL } from 'qrcode';
import {
  FranquiaHorasLabels,
  type CondicoesComerciais,
  type DocumentTipo,
  type ProposalHoraExcedente,
  type ProposalItemPeriodico,
  type ProposalItemSpot,
  type SalesQuotation,
} from '../../types/proposal';

interface ProposalPrintDocumentProps {
  quotation: SalesQuotation;
  seller?: ProposalSellerInfo;
}

interface ProposalSellerInfo {
  name?: string;
  email?: string;
  phone?: string;
  roleLabel?: string;
}

interface ScopePageSlice {
  equipmentItems: ProposalItemPeriodico[];
  serviceItems: ProposalItemSpot[];
  equipmentStartIndex: number;
  serviceStartIndex: number;
}

interface ConditionRow {
  code: string;
  label: string;
  value: string;
  breakValue?: boolean;
}

const DOCUMENT_TITLES: Record<DocumentTipo, string> = {
  proposta: 'PROPOSTA DE LOCAÇÃO',
  orcamento: 'ORÇAMENTO',
  contrato: 'CONTRATO DE LOCAÇÃO',
};

const MAX_SCOPE_ROWS_PER_PAGE = 22;
const EQUIPMENT_ROWS_WHEN_BOTH_TABLES = 7;
const SERVICE_ROWS_WHEN_BOTH_TABLES = 5;

const DISPOSITION_PARAGRAPHS = [
  'Este orçamento não garante a reserva dos equipamentos, que somente será confirmada com a assinatura do contrato e pedido de compra.',
  'Horas de utilização excedente serão apuradas da seguinte forma: Horas Excedentes = Ohmímetro Atual – Ohmímetro da Mobilização ou da Última Aferição.',
  'O valor apresentado como \'sob demanda\' será faturado apenas quando a manutenção preventiva for realizada. Caso o equipamento seja devolvido com manutenção pendente ou parcial, o serviço será feito no pátio da locadora e será cobrado apenas o item de preventiva, sem incluir o deslocamento técnico.',
  'Nos casos em que a retirada dos equipamentos for realizada pela Locatária, seja por meio de frota própria ou por intermédio de terceiros, será obrigatória a inspeção conjunta no momento da retirada, entre a Locatária e um representante da Locadora, com base no checklist de entrega ao cliente.',
  'Anotação de Responsabilidade Técnica (ART) e Laudos, emitidos mediante solicitação da locatária ou exigência de fiscalização, com cobrança no primeiro faturamento, sendo contratos até R$ 15.000,00, valor por ART de R$ 165,00 e acima R$ 380,00. Demais laudos ou relatórios deverão ser previamente consultados.',
  'A manutenção preventiva, incluindo inspeção geral e substituição de óleo e filtros, será realizada pela LOCADORA de acordo com as recomendações do fabricante, conforme a execução dos serviços e as condições estabelecidas neste orçamento.',
  'A LOCATÁRIA é responsável pelos custos de manutenção corretiva quando as falhas forem causadas por mau uso, como operação inadequada, falta de combustível, acidentes, vandalismo, sobrecarga e/ou uso de combustível impróprio ou contaminado. Para esses atendimentos será cobrado R$3,90 Km rodado + R$ 380,00 HH + custo repasse das peças trocadas e serviços terceiros se necessário.',
  'A locação será considerada encerrada somente com o retorno dos equipamentos à base da Locadora, acompanhado da respectiva Nota Fiscal de devolução. Enquanto ambos não forem concluídos, a locação continuará vigente.',
  'A não devolução dos equipamentos na data prevista implica na continuidade da locação, sendo aplicada nova cobrança no mesmo valor e condições do período anterior.',
];

const DEFAULT_SELLER: Required<ProposalSellerInfo> = {
  name: 'CAMILA JANSEN',
  email: 'camila.jansen@egengeradores.com.br',
  phone: '(62) 9 9825-5400',
  roleLabel: 'Comercial',
};

function textValue(value: string | null | undefined): string {
  if (!value || !value.trim()) {
    return '-';
  }

  return value;
}

function buildScopePages(
  equipmentItems: ProposalItemPeriodico[],
  serviceItems: ProposalItemSpot[],
): ScopePageSlice[] {
  const pages: ScopePageSlice[] = [];
  let equipmentIndex = 0;
  let serviceIndex = 0;

  while (
    equipmentIndex < equipmentItems.length
    || serviceIndex < serviceItems.length
    || pages.length === 0
  ) {
    const equipmentRemaining = equipmentItems.length - equipmentIndex;
    const serviceRemaining = serviceItems.length - serviceIndex;

    let equipmentTake = 0;
    let serviceTake = 0;

    const totalRemaining = equipmentRemaining + serviceRemaining;

    if (totalRemaining <= MAX_SCOPE_ROWS_PER_PAGE) {
      // All remaining items fit on one page — never split unnecessarily
      equipmentTake = equipmentRemaining;
      serviceTake = serviceRemaining;
    } else if (equipmentRemaining > 0 && serviceRemaining > 0) {
      equipmentTake = Math.min(EQUIPMENT_ROWS_WHEN_BOTH_TABLES, equipmentRemaining);
      // Give any leftover equipment-row budget to the service table
      const serviceSlot = EQUIPMENT_ROWS_WHEN_BOTH_TABLES + SERVICE_ROWS_WHEN_BOTH_TABLES - equipmentTake;
      serviceTake = Math.min(serviceSlot, serviceRemaining);
    } else if (equipmentRemaining > 0) {
      equipmentTake = Math.min(MAX_SCOPE_ROWS_PER_PAGE, equipmentRemaining);
    } else if (serviceRemaining > 0) {
      serviceTake = Math.min(MAX_SCOPE_ROWS_PER_PAGE, serviceRemaining);
    }

    pages.push({
      equipmentItems: equipmentItems.slice(equipmentIndex, equipmentIndex + equipmentTake),
      serviceItems: serviceItems.slice(serviceIndex, serviceIndex + serviceTake),
      equipmentStartIndex: equipmentIndex,
      serviceStartIndex: serviceIndex,
    });

    equipmentIndex += equipmentTake;
    serviceIndex += serviceTake;

    if (equipmentItems.length === 0 && serviceItems.length === 0) {
      break;
    }
  }

  return pages;
}

function buildConditionRows(condicoes: CondicoesComerciais): ConditionRow[] {
  const rows: Array<[string, string]> = [
    ['Local de utilização', textValue(condicoes.localUtilizacao)],
    ['Forma de pagamento', textValue(condicoes.formaPagamento)],
    ['Faturamento', textValue(condicoes.faturamento)],
    ['Prazo de entrega', textValue(condicoes.prazoEntrega)],
    ['Início da cobrança', textValue(condicoes.inicioCobranca)],
    ['Final da cobrança', textValue(condicoes.finalCobranca)],
    ['Período mínimo', textValue(condicoes.periodoMinimo)],
    ['Período orçado', textValue(condicoes.periodoOrcado)],
    ['Tensão', textValue(condicoes.tensao)],
    ['Emissão de ART', textValue(condicoes.emissaoArt)],
    ['Transporte de envio', textValue(condicoes.transporteEnvio)],
    ['Transporte de retirada', textValue(condicoes.transporteRetirada)],
    ['Carga e descarga mobilização', textValue(condicoes.cargaDescargaMobilizacao)],
    ['Carga e descarga desmobilização', textValue(condicoes.cargaDescargaDesmobilizacao)],
    ['Instalação', textValue(condicoes.instalacao)],
    ['Manutenção preventiva', textValue(condicoes.manutencaoPreventiva)],
    ['Combustível', textValue(condicoes.combustivel)],
    ['Seguro', textValue(condicoes.seguro)],
    ['Impostos', textValue(condicoes.impostos)],
    ['Telemetria', textValue(condicoes.telemetria)],
    ['Dimensionamento', textValue(condicoes.dimensionamento)],
    ['Definição de escopo', textValue(condicoes.definicaoEscopo)],
  ];

  return rows.map(([label, value], index) => ({
    code: `1.${index + 1}`,
    label,
    value,
    breakValue: label === 'Local de utilização',
  }));
}

function splitConditionRows(rows: ConditionRow[]): [ConditionRow[], ConditionRow[]] {
  const left: ConditionRow[] = [];
  const right: ConditionRow[] = [];

  rows.forEach((row, index) => {
    if (index % 2 === 0) {
      left.push(row);
    } else {
      right.push(row);
    }
  });

  return [left, right];
}

function formatIssueLine(date: string): string {
  return `Goiania, ${formatDate(date)}`;
}

function buildSellerQrPayload(seller: Required<ProposalSellerInfo>): string {
  const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim();
  const fullName = normalize(seller.name);
  const email = normalize(seller.email);
  const phone = normalize(seller.phone);
  const roleLabel = normalize(seller.roleLabel);

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${fullName};;;;`,
    `FN:${fullName}`,
    'ORG:EGEN GERADORES',
    `TITLE:${roleLabel}`,
    `TEL;TYPE=CELL:${phone}`,
    `EMAIL:${email}`,
    'END:VCARD',
  ];

  return lines.join('\n');
}

function renderPageBreaks(
  pages: Array<{ key: string; content: React.ReactNode }>,
): React.ReactNode {
  return pages.map((page, index) => (
    <Fragment key={page.key}>
      {index > 0 ? <div className="html2pdf__page-break" /> : null}
      {page.content}
    </Fragment>
  ));
}

function ProposalHeader({
  issueLine,
  documentId,
  annexLabel,
  tipo,
}: {
  issueLine: string;
  documentId: string;
  annexLabel?: string;
  tipo: DocumentTipo;
}) {
  const headerLine = annexLabel
    ? annexLabel
    : tipo === 'contrato'
      ? `Contrato de locação nº ${textValue(documentId)}`
      : `Proposta de locação nº ${textValue(documentId)}`;

  return (
    <header className="proposal-master-header">
      <img
        src="/LOGO-DM.png"
        alt="EGEN"
        className="proposal-master-logo"
        onError={(event) => {
          event.currentTarget.style.visibility = 'hidden';
        }}
      />

      <div className="proposal-master-header-right">
        <p>{issueLine}</p>
        <p>{headerLine}</p>
        {annexLabel && <p style={{ fontSize: '7pt', color: '#888' }}>{documentId}</p>}
      </div>
    </header>
  );
}

function ProposalFooter({
  pageNumber,
  totalPages,
}: {
  pageNumber: number;
  totalPages: number;
}) {
  return (
    <footer className="proposal-master-footer">
      <span>@egengeradores</span>
      <span>egengeradores.com.br</span>
      <span>Página {pageNumber} de {totalPages}</span>
    </footer>
  );
}

function ConditionColumns({ rows }: { rows: ConditionRow[] }) {
  const [leftRows, rightRows] = splitConditionRows(rows);

  const renderRow = (row: ConditionRow) => (
    <p key={row.code} className={`proposal-condition-line${row.breakValue ? ' proposal-condition-line--break' : ''}`}>
      <span className="proposal-condition-code">{row.code}</span>
      <span className="proposal-condition-label">{row.label}:</span>
      <span className="proposal-condition-value">{row.value}</span>
    </p>
  );

  return (
    <div className="proposal-conditions-grid">
      <div className="proposal-conditions-column">
        {leftRows.map(renderRow)}
      </div>
      <div className="proposal-conditions-column">
        {rightRows.map(renderRow)}
      </div>
    </div>
  );
}

// ============================================
// CONTRACT BODY RENDERER
// ============================================

function ContractBody({ text }: { text: string }) {
  const lines = text.split('\n');

  const elements: React.ReactNode[] = [];
  let key = 0;
  let inSubsection = false;
  let inSignatureBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line
    if (!trimmed) {
      if (inSubsection) {
        inSubsection = false;
        elements.push(<div key={key++} className="proposal-contract-subsection-end" />);
      }
      continue;
    }

    // Separator line (all ─ or similar)
    if (/^[─═]{5,}$/.test(trimmed)) {
      elements.push(<hr key={key++} className="proposal-contract-separator" />);
      inSubsection = false;
      continue;
    }

    // Main title (first non-separator line)
    if (key === 0 && /CONTRATO DE LOCAÇÃO/.test(trimmed)) {
      elements.push(<h2 key={key++} className="proposal-contract-main-title">{trimmed}</h2>);
      continue;
    }

    // Date line (Goiânia, ... | Contrato ...)
    if (/Goiânia,.*\|.*Contrato/.test(trimmed)) {
      elements.push(<p key={key++} className="proposal-contract-date-line">{trimmed}</p>);
      continue;
    }

    // Section header: "1. PARTES CONTRATANTES E LOCAL"
    if (/^\d+\.\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{5,}$/.test(trimmed) && !trimmed.includes(':')) {
      elements.push(<h3 key={key++} className="proposal-contract-section-title">{trimmed}</h3>);
      inSubsection = false;
      continue;
    }

    // Subsection header: "1.1 LOCADORA:" or "1.2 LOCATÁRIO:"
    if (/^\d+\.\d+\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{3,}:$/.test(trimmed)) {
      if (inSubsection) {
        elements.push(<div key={key++} className="proposal-contract-subsection-end" />);
      }
      inSubsection = true;

      // Signature block
      if (trimmed === 'ASSINATURAS' || trimmed.startsWith('ASSINATURAS')) {
        inSignatureBlock = true;
        elements.push(<h3 key={key++} className="proposal-contract-section-title">{trimmed}</h3>);
        continue;
      }

      elements.push(
        <div key={key++} className="proposal-contract-subsection">
          <h4 className="proposal-contract-subsection-title">{trimmed}</h4>
        </div>
      );
      continue;
    }

    // Body text inside subsection or standalone paragraph
    if (inSubsection) {
      // Key-value pair: "Nome: EGEN GERADORES"
      const kvMatch = trimmed.match(/^([A-Za-zÀ-úçãõ\s]+):\s+(.+)$/);
      if (kvMatch && !trimmed.startsWith('Assinatura:')) {
        elements.push(
          <p key={key++} className="proposal-contract-kv">
            <span className="proposal-contract-kv-key">{kvMatch[1]}:</span>{' '}
            <span className="proposal-contract-kv-value">{kvMatch[2]}</span>
          </p>
        );
        continue;
      }

      // Signature lines
      if (inSignatureBlock && /^(.+):\s_{3,}$/.test(trimmed)) {
        const sigMatch = trimmed.match(/^(.+):\s(_{3,})$/);
        elements.push(
          <p key={key++} className="proposal-contract-signature-line">
            <strong>{sigMatch![1]}:</strong> {sigMatch![2]}
          </p>
        );
        continue;
      }

      if (inSignatureBlock && /^(.+):\s_{3,}\s+(.+):\s_{3,}$/.test(trimmed)) {
        elements.push(
          <p key={key++} className="proposal-contract-signature-line">{trimmed}</p>
        );
        continue;
      }

      elements.push(<p key={key++} className="proposal-contract-body">{trimmed}</p>);
    } else {
      elements.push(<p key={key++} className="proposal-contract-standalone">{trimmed}</p>);
    }
  }

  if (inSubsection) {
    elements.push(<div key={key++} className="proposal-contract-subsection-end" />);
  }

  return <div className="proposal-contract-body-wrapper">{elements}</div>;
}

function ExceedingHoursTable({ rows }: { rows: ProposalHoraExcedente[] }) {
  return (
    <table className="proposal-table proposal-table-hours">
      <thead>
        <tr>
          <th className="col-item">Item</th>
          <th className="col-hours-desc">Valor por hora excedente ao limite de franquia</th>
          <th className="col-hours-unit">Valor Unitário</th>
          <th className="col-hours-note">Observações</th>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td className="proposal-empty-row" colSpan={4}>Valores conforme tabela padrão</td>
          </tr>
        ) : (
          rows.map((row, index) => (
            <tr key={row.id}>
              <td>{index + 1}</td>
              <td>{textValue(row.descricao)}</td>
              <td>{formatCurrency(row.valorUnitario)}</td>
              <td>{textValue(row.observacoes)}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

export default function ProposalPrintDocument({
  quotation,
  seller,
}: ProposalPrintDocumentProps) {
  const sellerInfo = useMemo<Required<ProposalSellerInfo>>(
    () => ({
      name: seller?.name?.trim() || DEFAULT_SELLER.name,
      email: seller?.email?.trim() || DEFAULT_SELLER.email,
      phone: seller?.phone?.trim() || DEFAULT_SELLER.phone,
      roleLabel: seller?.roleLabel?.trim() || DEFAULT_SELLER.roleLabel,
    }),
    [seller?.name, seller?.email, seller?.phone, seller?.roleLabel],
  );
  const [sellerQrCode, setSellerQrCode] = useState<string>('');

  useEffect(() => {
    let active = true;

    toDataURL(buildSellerQrPayload(sellerInfo), {
      margin: 1,
      width: 220,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((dataUrl) => {
        if (active) {
          setSellerQrCode(dataUrl);
        }
      })
      .catch(() => {
        if (active) {
          setSellerQrCode('');
        }
      });

    return () => {
      active = false;
    };
  }, [sellerInfo]);

  const scopePages = useMemo(
    () => buildScopePages(quotation.itensPeriodicos, quotation.itensSpot),
    [quotation.itensPeriodicos, quotation.itensSpot],
  );

  const contractPageChunks = useMemo(() => {
    if (quotation.tipo !== 'contrato' || !quotation.contractText) return [];
    const LINES_PER_PAGE = 55;
    const lines = quotation.contractText.split('\n');
    const chunks: string[][] = [];
    for (let i = 0; i < lines.length; i += LINES_PER_PAGE) {
      chunks.push(lines.slice(i, i + LINES_PER_PAGE));
    }
    return chunks;
  }, [quotation.tipo, quotation.contractText]);

  const issueLine = formatIssueLine(quotation.dataEmissao);
  const conditionRows = buildConditionRows(quotation.condicoes);
  const shouldInlineCommercialSections = false;

  const lastScopeSlice = scopePages[scopePages.length - 1];
  const lastScopeTotalItems = lastScopeSlice
    ? lastScopeSlice.equipmentItems.length + lastScopeSlice.serviceItems.length
    : 0;
  const COMMERCIAL_INLINE_THRESHOLD = 8;
  const showCommercialInline = lastScopeTotalItems < COMMERCIAL_INLINE_THRESHOLD;
  const includeCommercialPage = !showCommercialInline;

  // Dynamic: fewer items → more paragraphs inline → less whitespace
  const inlineParagraphCount = showCommercialInline
    ? Math.min(DISPOSITION_PARAGRAPHS.length, Math.max(2, COMMERCIAL_INLINE_THRESHOLD - lastScopeTotalItems))
    : 0;

  const annexLabel = quotation.isAnnex ? 'ANEXO0001' : undefined;
  const showAsAnnex = quotation.tipo === 'contrato';

  const proposalPageCount = 1 + scopePages.length + (includeCommercialPage ? 1 : 0) + 1;
  const totalPages = showAsAnnex
    ? 1 + contractPageChunks.length + proposalPageCount
    : 1 + proposalPageCount;

  const lastEquipmentPageIndex = scopePages.reduce((last, page, index) => {
    if (page.equipmentItems.length > 0) {
      return index;
    }
    return last;
  }, -1);

  const lastServicePageIndex = scopePages.reduce((last, page, index) => {
    if (page.serviceItems.length > 0) {
      return index;
    }
    return last;
  }, -1);

  const pages: Array<{ key: string; content: React.ReactNode }> = [];

  pages.push({
    key: 'cover',
    content: (
      <A4Page className="proposal-cover-page">
        <img src="/CAPA.png" alt="Capa" className="proposal-cover-background" />
        <div className="proposal-cover-title-strip">
          <h1 className="proposal-cover-title">{DOCUMENT_TITLES[quotation.tipo]}</h1>
        </div>
      </A4Page>
    ),
  });

  if (showAsAnnex) {
    contractPageChunks.forEach((chunk, idx) => {
      pages.push({
        key: `contract-body-${idx}`,
        content: (
          <A4Page className="proposal-standard-page">
            <ProposalHeader issueLine={issueLine} documentId={quotation.documentId} tipo={quotation.tipo} />
            <div className="proposal-standard-body proposal-contract-body-container">
              <ContractBody text={chunk.join('\n')} />
            </div>
            <ProposalFooter pageNumber={idx + 2} totalPages={totalPages} />
          </A4Page>
        ),
      });
    });
  }

  const proposalPageOffset = contractPageChunks.length;
  const proposalAnnexLabel = showAsAnnex ? 'ANEXO0001' : annexLabel;

  pages.push({
    key: 'intro',
    content: (
      <A4Page className="proposal-standard-page">
        <ProposalHeader issueLine={issueLine} documentId={quotation.documentId} tipo={quotation.tipo} annexLabel={proposalAnnexLabel} />

        <div className="proposal-standard-body proposal-intro-page-body">
          <section className="proposal-client-panel">
            <h2 className="proposal-main-title">PROPOSTA COMERCIAL</h2>

            <p className="proposal-client-line"><strong>Locadora:</strong> EGEN GERADORES LTDA</p>
            <p className="proposal-client-line"><strong>CNPJ:</strong> 53.457.416/0001-08</p>
            <p className="proposal-client-line"><strong>Endereco:</strong> GOIANIA | GO - BR 153, KM 3</p>

            <p className="proposal-client-line proposal-client-separator"><strong>Cliente:</strong> {textValue(quotation.cliente.nome)}</p>
            <p className="proposal-client-line"><strong>CPF/CNPJ:</strong> {textValue(quotation.cliente.documento)}</p>
            <p className="proposal-client-line"><strong>Endereço:</strong> {textValue(quotation.cliente.endereco)}</p>
            <p className="proposal-client-line"><strong>Cidade/UF:</strong> {textValue(quotation.cliente.cidadeUf)}</p>

            <div className="proposal-client-contact-row">
              <div className="proposal-client-contact-column">
                <p><strong>Aos cuidados:</strong> {textValue(quotation.cliente.responsavel)}</p>
                <p><strong>Tel.:</strong> {textValue(quotation.cliente.telefone)}</p>
              </div>
              <div className="proposal-client-contact-column">
                <p><strong>E-mail:</strong> {textValue(quotation.cliente.email)}</p>
              </div>
            </div>
          </section>

          <div className="proposal-intro-stack">
            <section className="proposal-intro-panel">
              <h3 className="proposal-blue-section-title">INTRODUÇÃO:</h3>
              <p>
                A EGEN Geradores é especializada em venda e locação de Grupos Geradores de Energia,
                entregando soluções completas e personalizadas para os mais diversos setores,
                como mineração, agronegócio, indústria, construção civil e comércio.
              </p>
              <p>
                Contamos com uma equipe de engenharia altamente capacitada, pronta para dimensionar
                e implementar sistemas de geração de energia com máxima eficiência e segurança.
              </p>
              <p>
                Fazemos parte de um dos maiores grupos do setor, o que nos permite acesso a uma ampla
                frota própria de geradores modernos e de alta performance.
              </p>
              <p>
                Nosso suporte técnico é ágil e atuante, garantindo atendimento rápido e eficaz em
                demandas programadas ou emergenciais. Com foco em qualidade, continuidade operacional
                e transparência, oferecemos energia sob medida para manter sua operação sempre em movimento.
              </p>
            </section>

            <section className="proposal-brand-panel">
              {sellerQrCode ? (
                <img
                  src={sellerQrCode}
                  alt={`QR Code ${sellerInfo.name}`}
                  className="proposal-brand-qr-image"
                />
              ) : (
                <div className="proposal-brand-qr" aria-label="QR CODE" />
              )}
              <div className="proposal-brand-contact">
                <p>
                  <strong>{sellerInfo.name}</strong>
                  {' '}
                  {sellerInfo.roleLabel}
                  {' '}
                  Tel.: {sellerInfo.phone}
                </p>
                <p>Email: {sellerInfo.email}</p>
              </div>
            </section>
          </div>
        </div>

        <img
          src="/GERADOR.png"
          alt="Gerador"
          className="proposal-brand-generator proposal-brand-generator-overlap"
        />
        <ProposalFooter pageNumber={2 + proposalPageOffset} totalPages={totalPages} />
      </A4Page>
    ),
  });

  scopePages.forEach((slice, index) => {
    const isLastScopePage = index === scopePages.length - 1;
    const includeInlineSections = shouldInlineCommercialSections && isLastScopePage;
    const isLastEquipmentPage = index === lastEquipmentPageIndex && lastEquipmentPageIndex >= 0;
    const isLastServicePage = index === lastServicePageIndex && lastServicePageIndex >= 0;
    // Only render a table on continuation pages if it actually has items on this page
    const showEquipmentTable = index === 0 || slice.equipmentItems.length > 0;
    const showServiceTable = index === 0 || slice.serviceItems.length > 0;
    const pageNumber = index + 3 + proposalPageOffset;

    pages.push({
      key: `scope-${index + 1}`,
      content: (
        <A4Page className="proposal-standard-page">
          <ProposalHeader issueLine={issueLine} documentId={quotation.documentId} tipo={quotation.tipo} annexLabel={proposalAnnexLabel} />

          <div className="proposal-standard-body proposal-scope-body">
            {showEquipmentTable ? (
            <section className="proposal-table-block">
              <table className="proposal-table proposal-table-main">
                <thead>
                  <tr>
                    <th className="col-item">Item</th>
                    <th className="col-desc">Descrição</th>
                    <th className="col-qty">Qtd.</th>
                    <th className="col-unit">Valor Unitário</th>
                    <th className="col-total">Valor Total</th>
                    <th className="col-franquia">Franquia</th>
                  </tr>
                </thead>
                <tbody>
                  {slice.equipmentItems.length === 0 ? (
                    <tr>
                      <td className="proposal-empty-row" colSpan={6}>Nenhum item periódico informado</td>
                    </tr>
                  ) : (
                    slice.equipmentItems.map((item, rowIndex) => (
                      <tr key={item.id}>
                        <td>{slice.equipmentStartIndex + rowIndex + 1}</td>
                        <td>{textValue(item.descricao)}</td>
                        <td>{item.quantidade}</td>
                        <td>{formatCurrency(item.valorUnitario)}</td>
                        <td>{formatCurrency(item.valorTotal)}</td>
                        <td>{FranquiaHorasLabels[item.franquiaHoras]}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {isLastEquipmentPage ? (
                  <tfoot>
                    <tr className="proposal-table-subtotal">
                      <td colSpan={6} className="proposal-table-subtotal-value">
                        TOTAL PERIÓDICOS&nbsp;&nbsp;{formatCurrency(quotation.totalPeriodicos)}
                      </td>
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </section>
            ) : null}

            {showServiceTable ? (
            <section className="proposal-table-block">
              <table className="proposal-table proposal-table-main">
                <thead>
                  <tr>
                    <th className="col-item">Item</th>
                    <th className="col-desc">Serviços Spot</th>
                    <th className="col-qty">Qtd.</th>
                    <th className="col-unit">Valor Unitário</th>
                    <th className="col-total">Valor Total</th>
                    <th className="col-franquia"></th>
                  </tr>
                </thead>
                <tbody>
                  {slice.serviceItems.length === 0 ? (
                    <tr>
                      <td className="proposal-empty-row" colSpan={6}>Nenhum serviço informado</td>
                    </tr>
                  ) : (
                    slice.serviceItems.map((item, rowIndex) => (
                      <tr key={item.id}>
                        <td>{slice.serviceStartIndex + rowIndex + 1}</td>
                        <td>{textValue(item.descricao)}</td>
                        <td>{item.quantidade}</td>
                        <td>{formatCurrency(item.valorUnitario)}</td>
                        <td>{formatCurrency(item.valorTotal)}</td>
                        <td></td>
                      </tr>
                    ))
                  )}
                </tbody>
                {isLastServicePage ? (
                  <tfoot>
                    <tr className="proposal-table-subtotal">
                      <td colSpan={6} className="proposal-table-subtotal-value">
                        TOTAL SPOT&nbsp;&nbsp;{formatCurrency(quotation.totalSpot)}
                      </td>
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </section>
            ) : null}

            {isLastScopePage ? (
              <div className="proposal-totals-band">
                <p className="proposal-totals-row">
                  <span>VALOR TOTAL DO ORÇAMENTO</span>
                  <strong>{formatCurrency(quotation.totalGeral)}</strong>
                </p>
              </div>
            ) : null}

            {isLastScopePage ? (
            <section className="proposal-table-block">
              <ExceedingHoursTable rows={quotation.horasExcedentes} />
            </section>
            ) : null}

            {includeInlineSections ? (
              <section className="proposal-inline-commercial-sections">
                <ConditionColumns rows={conditionRows} />

                <div className="proposal-dispositions-inline">
                  <h3 className="proposal-blue-section-title">DISPOSIÇÕES GERAIS:</h3>
                  <p>{DISPOSITION_PARAGRAPHS[0]}</p>
                  <p>{DISPOSITION_PARAGRAPHS[1]}</p>
                </div>
              </section>
            ) : null}

            {isLastScopePage && showCommercialInline ? (
              <>
                <ConditionColumns rows={conditionRows} />
                <div className="proposal-dispositions-inline">
                  <h3 className="proposal-blue-section-title">DISPOSIÇÕES GERAIS:</h3>
                  {DISPOSITION_PARAGRAPHS.slice(0, inlineParagraphCount).map((paragraph, i) => (
                    <p key={`inline-disp-${i}`}>{paragraph}</p>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <ProposalFooter pageNumber={pageNumber} totalPages={totalPages} />
        </A4Page>
      ),
    });
  });

  if (includeCommercialPage) {
    pages.push({
      key: 'commercial',
      content: (
        <A4Page className="proposal-standard-page">
          <ProposalHeader issueLine={issueLine} documentId={quotation.documentId} tipo={quotation.tipo} annexLabel={proposalAnnexLabel} />

          <div className="proposal-standard-body proposal-commercial-body">
            <ConditionColumns rows={conditionRows} />

            <div className="proposal-dispositions-inline">
              <h3 className="proposal-blue-section-title">DISPOSIÇÕES GERAIS:</h3>
              {DISPOSITION_PARAGRAPHS.slice(0, 7).map((paragraph, index) => (
                <p key={`comm-disp-${index}`}>{paragraph}</p>
              ))}
            </div>
          </div>

          <ProposalFooter pageNumber={scopePages.length + 3 + proposalPageOffset} totalPages={totalPages} />
        </A4Page>
      ),
    });
  }

  const acceptanceParagraphs = shouldInlineCommercialSections
    ? DISPOSITION_PARAGRAPHS.slice(2)
    : showCommercialInline
      ? DISPOSITION_PARAGRAPHS.slice(inlineParagraphCount)
      : DISPOSITION_PARAGRAPHS.slice(7);

  pages.push({
    key: 'acceptance',
    content: (
      <A4Page className="proposal-standard-page">
        <ProposalHeader issueLine={issueLine} documentId={quotation.documentId} tipo={quotation.tipo} annexLabel={proposalAnnexLabel} />

        <div className="proposal-standard-body proposal-acceptance-body">
          <section className="proposal-dispositions-final">
            {acceptanceParagraphs.map((paragraph, index) => (
              <p key={`disp-${index}`}>{paragraph}</p>
            ))}
          </section>

          <section className="proposal-accept-section">
            <h3 className="proposal-blue-section-title">ACEITE:</h3>
            <p>
              Declaro estar ciente e concordo com as condições comerciais propostas para a
              contratação dos serviços mencionados.
            </p>

            <p className="proposal-signature-line">ASSINATURA: _______________________________________________</p>
            <p className="proposal-signature-line">NOME COMPLETO: ____________________________________________</p>
            <p className="proposal-signature-line">DATA: _____ / _____ / ________</p>
          </section>
        </div>

        <ProposalFooter pageNumber={totalPages} totalPages={totalPages} />
      </A4Page>
    ),
  });

  return <div className="proposal-print-document">{renderPageBreaks(pages)}</div>;
}
