import React, { Fragment, useEffect, useMemo, useState } from 'react';
import A4Page from './A4Page';
import { formatDate } from '../../engine';
import { toDataURL } from 'qrcode';
import {
  FranquiaHorasLabels,
  PeriodoLocacaoLabels,
  type CondicoesComerciais,
  type DocumentTipo,
  type ProposalHoraExcedente,
  type ProposalItemPeriodico,
  type ProposalItemSpot,
  type SalesQuotation,
} from '../../types/proposal';
import type { ProposalCoverConfig } from '../../../../hooks/useAppSettings';
import {
  buildContractBlocks,
  buildContractVars,
  paginateContractBlocks,
  type ContractBlock,
  type ContractInline,
} from '../../services/contractTemplate';

interface ProposalPrintDocumentProps {
  quotation: SalesQuotation;
  seller?: ProposalSellerInfo;
  coverConfig?: ProposalCoverConfig | null;
}

interface ProposalSellerInfo {
  name?: string;
  email?: string;
  phone?: string;
  roleLabel?: string;
  avatarUrl?: string;
  qrcodeUrl?: string;
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

const MAX_SCOPE_ROWS_PER_PAGE = 24;
const EQUIPMENT_ROWS_WHEN_BOTH_TABLES = 12;
const SERVICE_ROWS_WHEN_BOTH_TABLES = 10;

function getPeriodTotalLabel(periodoOrcado: string): string {
  const map: Record<string, string> = {
    'Diária': 'VALOR DIÁRIO',
    'Semanal': 'VALOR SEMANAL',
    'Quinzenal': 'VALOR QUINZENAL',
    'Mensal': 'VALOR MENSAL',
    'Anual': 'VALOR ANUAL',
  };
  return map[periodoOrcado] || 'VALOR MENSAL';
}

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

const CURRENCY_AMOUNT_FORMATTER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Accounting-style currency cell: "R$" pinned to the left edge and the
 * numeric value pinned to the right edge, mirroring the reference proposal.
 */
function CurrencyCell({ value }: { value: number | null | undefined }) {
  return (
    <span className="proposal-currency-cell">
      <span className="proposal-currency-symbol">R$</span>
      <span className="proposal-currency-amount">
        {CURRENCY_AMOUNT_FORMATTER.format(value ?? 0)}
      </span>
    </span>
  );
}

/**
 * Conservative height estimate (mm) of a DISPOSIÇÕES paragraph as rendered on
 * a scope page — used to decide how many paragraphs fit inline under the
 * conditions grid without overflowing the A4 page.
 */
function estimateDispositionMm(text: string): number {
  const CHARS_PER_LINE = 95;
  const LINE_MM = 4.7;
  const PARAGRAPH_MARGIN_MM = 2.5;
  const lines = Math.max(1, Math.ceil(text.length / CHARS_PER_LINE));
  return lines * LINE_MM + PARAGRAPH_MARGIN_MM;
}

/**
 * Conservative height estimate (mm) of the observation block
 * (title + body text), matching the proposal-observations-block styles.
 */
function estimateObservationMm(text: string): number {
  const CHARS_PER_LINE = 95;
  const LINE_MM = 4.7;
  const PARAGRAPH_MARGIN_MM = 2.5;
  const TITLE_MM = 9;
  const lines = Math.max(1, Math.ceil(text.length / CHARS_PER_LINE));
  return TITLE_MM + lines * LINE_MM + PARAGRAPH_MARGIN_MM;
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
    ['Prazo de pagamento', textValue(condicoes.prazoPagamento)],
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
  const mid = Math.ceil(rows.length / 2);
  const left: ConditionRow[] = rows.slice(0, mid);
  const right: ConditionRow[] = rows.slice(mid);

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
  return pages.map((page) => (
    <Fragment key={page.key}>{page.content}</Fragment>
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
        src="/LOGO FULL.png"
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

function renderInline(nodes: ContractInline[]): React.ReactNode {
  return nodes.map((node, idx) => {
    if (node.t === 'br') return <br key={idx} />;
    if (node.t === 'b') return <strong key={idx}>{node.value}</strong>;
    return <React.Fragment key={idx}>{node.value}</React.Fragment>;
  });
}

/**
 * Signature block — kept from the previous layout by explicit request: a blue
 * "ASSINATURAS" bar followed by flex rows (Locadora / Locatária + witnesses).
 */
function ContractSignatureBlock({ locatarioNome }: { locatarioNome: string }) {
  return (
    <div className="proposal-contract-signatures">
      <h3 className="proposal-contract-section-title">ASSINATURAS</h3>

      <div className="contract-signature-row">
        <div className="contract-signature-left"><strong>Locadora:</strong> EGEN GERADORES LTDA</div>
        <div className="contract-signature-right">Assinatura: ______________________________________</div>
      </div>
      <div className="contract-signature-row">
        <div className="contract-signature-left"><strong>Locatária:</strong> {locatarioNome}</div>
        <div className="contract-signature-right">Assinatura: ______________________________________</div>
      </div>
      <div className="contract-witness-row">
        <div className="contract-witness-left"><strong>Testemunha 1:</strong> Nome: ______________________</div>
        <div className="contract-witness-right">CPF: ________________________</div>
      </div>
      <div className="contract-witness-row">
        <div className="contract-witness-left"><strong>Testemunha 2:</strong> Nome: ______________________</div>
        <div className="contract-witness-right">CPF: ________________________</div>
      </div>
    </div>
  );
}

/** Renders a single paginated page of contract blocks. */
function ContractBlocks({ blocks }: { blocks: ContractBlock[] }) {
  return (
    <div className="proposal-contract-body-wrapper">
      {blocks.map((block, idx) => {
        switch (block.kind) {
          case 'doc-title':
            return <h2 key={idx} className="proposal-contract-main-title">{block.text}</h2>;
          case 'section':
            return (
              <p key={idx} className="proposal-contract-heading">
                {renderInline(block.content)}
              </p>
            );
          case 'clause':
            return (
              <p
                key={idx}
                className={`proposal-contract-clause proposal-contract-clause--${block.align}`}
              >
                {renderInline(block.content)}
              </p>
            );
          case 'note':
            return (
              <p
                key={idx}
                className={`proposal-contract-note${block.italic ? ' proposal-contract-note--italic' : ''}`}
                style={{ paddingLeft: `${block.indentMm}mm` }}
              >
                {renderInline(block.content)}
              </p>
            );
          case 'list':
            return (
              <div
                key={idx}
                className="proposal-contract-list"
                style={{ paddingLeft: `${block.indentMm}mm` }}
              >
                {block.items.map((item, i) => (
                  <div key={i} className="proposal-contract-list-item">
                    {renderInline(item)}
                  </div>
                ))}
              </div>
            );
          case 'closing-date':
            return <p key={idx} className="proposal-contract-closing-date">{block.text}</p>;
          case 'signatures':
            return <ContractSignatureBlock key={idx} locatarioNome={block.locatarioNome} />;
        }
      })}
    </div>
  );
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
              <td><CurrencyCell value={row.valorUnitario} /></td>
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
  coverConfig,
}: ProposalPrintDocumentProps) {
  const sellerInfo = useMemo<Required<ProposalSellerInfo>>(
    () => ({
      name: seller?.name?.trim() || DEFAULT_SELLER.name,
      email: seller?.email?.trim() || DEFAULT_SELLER.email,
      phone: seller?.phone?.trim() || DEFAULT_SELLER.phone,
      roleLabel: seller?.roleLabel?.trim() || DEFAULT_SELLER.roleLabel,
      avatarUrl: seller?.avatarUrl || '',
      qrcodeUrl: seller?.qrcodeUrl || '',
    }),
    [seller?.name, seller?.email, seller?.phone, seller?.roleLabel, seller?.avatarUrl, seller?.qrcodeUrl],
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

  const contractPages = useMemo(() => {
    if (quotation.tipo !== 'contrato') return [];
    const vars = buildContractVars(quotation, quotation.documentId);
    return paginateContractBlocks(buildContractBlocks(vars));
  }, [quotation]);

  const issueLine = formatIssueLine(quotation.dataEmissao);
  const conditionRows = buildConditionRows(quotation.condicoes);
  if (quotation.validade) {
    conditionRows.push({
      code: '1.24',
      label: 'Validade da proposta',
      value: formatDate(quotation.validade),
    });
  }
  const shouldInlineCommercialSections = false;

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

  // ── Height-aware commercial placement ──
  // Estimate how much vertical space the tables consume on the last scope
  // page, then fit the conditions grid (and as many DISPOSIÇÕES paragraphs as
  // possible) directly beneath them instead of pushing everything to a nearly
  // empty extra page. Falls back to a dedicated commercial page only when the
  // tables leave no room for the conditions grid. Estimates are intentionally
  // conservative so the page never overflows (content is clipped otherwise).
  const SCOPE_BODY_USABLE_MM = 248;
  const SCOPE_SAFETY_MM = 6;
  const TABLE_HEADER_MM = 8.5;
  const TABLE_ROW_MM = 8;
  const TABLE_SUBTOTAL_MM = 7.5;
  const TABLE_BLOCK_GAP_MM = 3;
  const TOTALS_BAND_MM = 10.5;
  const SCOPE_TITLE_BLOCK_MM = 18;
  const DISPOSITION_TITLE_MM = 9;

  const lastScopeSlice = scopePages[scopePages.length - 1];
  const lastScopePageIndex = scopePages.length - 1;
  const lastEqRows = lastScopeSlice?.equipmentItems.length ?? 0;
  const lastSvcRows = lastScopeSlice?.serviceItems.length ?? 0;
  const lastShowsEquipment = lastScopePageIndex === 0 || lastEqRows > 0;
  const lastShowsService = lastScopePageIndex === 0 || lastSvcRows > 0;
  const lastHasEqSubtotal = lastScopePageIndex === lastEquipmentPageIndex && lastEquipmentPageIndex >= 0;
  const lastHasSvcSubtotal = lastScopePageIndex === lastServicePageIndex && lastServicePageIndex >= 0;

  let scopeTablesHeightMm = lastScopePageIndex === 0 ? SCOPE_TITLE_BLOCK_MM : 0;
  if (lastShowsEquipment) {
    scopeTablesHeightMm += TABLE_HEADER_MM + Math.max(lastEqRows, 1) * TABLE_ROW_MM
      + (lastHasEqSubtotal ? TABLE_SUBTOTAL_MM : 0) + TABLE_BLOCK_GAP_MM;
  }
  if (lastShowsService) {
    scopeTablesHeightMm += TABLE_HEADER_MM + Math.max(lastSvcRows, 1) * TABLE_ROW_MM
      + (lastHasSvcSubtotal ? TABLE_SUBTOTAL_MM : 0) + TABLE_BLOCK_GAP_MM;
  }
  scopeTablesHeightMm += TOTALS_BAND_MM;
  scopeTablesHeightMm += TABLE_HEADER_MM
    + Math.max(quotation.horasExcedentes.length, 1) * TABLE_ROW_MM
    + TABLE_BLOCK_GAP_MM;

  const commercialAvailableMm = SCOPE_BODY_USABLE_MM - scopeTablesHeightMm - SCOPE_SAFETY_MM;
  const conditionsHeightMm = Math.ceil(conditionRows.length / 2) * 6.7 + 5 + 3.5;
  const showCommercialInline = commercialAvailableMm >= conditionsHeightMm;
  const includeCommercialPage = !showCommercialInline;

  let inlineParagraphCount = 0;
  let dispositionsRemainingMm = 0;
  if (showCommercialInline) {
    dispositionsRemainingMm = commercialAvailableMm - conditionsHeightMm - DISPOSITION_TITLE_MM;
    for (const paragraph of DISPOSITION_PARAGRAPHS) {
      const paragraphMm = estimateDispositionMm(paragraph);
      if (dispositionsRemainingMm - paragraphMm < 0) {
        break;
      }
      dispositionsRemainingMm -= paragraphMm;
      inlineParagraphCount += 1;
    }
  }

  let observationFitsInline = false;
  if (quotation.observacoesGerais?.trim()) {
    const obsAvailableMm = showCommercialInline
      ? dispositionsRemainingMm
      : commercialAvailableMm;
    const obsHeight = estimateObservationMm(quotation.observacoesGerais);
    observationFitsInline = obsAvailableMm >= obsHeight;
  }
  const observationOnSeparatePage = !!quotation.observacoesGerais?.trim() && !observationFitsInline;

  const annexLabel = quotation.isAnnex ? 'ANEXO0001' : undefined;
  const showAsAnnex = quotation.tipo === 'contrato';

  const proposalPageCount = 1 + scopePages.length + (includeCommercialPage ? 1 : 0) + (observationOnSeparatePage ? 1 : 0) + 1;
  const totalPages = showAsAnnex
    ? 1 + contractPages.length + proposalPageCount
    : 1 + proposalPageCount;

  const coverTitleColor = coverConfig?.textColor || '#ffffff';
  const coverTitleBg = coverConfig?.textBgColor || null;
  const coverUrl = coverConfig?.capaUrl || '/CAPA.png';

  const pages: Array<{ key: string; content: React.ReactNode }> = [];

  pages.push({
    key: 'cover',
    content: (
      <A4Page className="proposal-cover-page">
        <img src={coverUrl} alt="Capa" className="proposal-cover-background" />
        <div className="proposal-cover-title-strip">
          <h1
            className={`proposal-cover-title${coverTitleBg ? ' proposal-cover-title-bg' : ''}`}
            style={{
              color: coverTitleColor,
              ...(coverTitleBg ? { backgroundColor: coverTitleBg } : {}),
            }}
          >
            {DOCUMENT_TITLES[quotation.tipo]}
          </h1>
        </div>
      </A4Page>
    ),
  });

  if (showAsAnnex && contractPages.length > 0) {
    contractPages.forEach((blocks, idx) => {
      pages.push({
        key: `contract-body-${idx}`,
        content: (
          <A4Page className="proposal-standard-page">
            <ProposalHeader issueLine={issueLine} documentId={quotation.documentId} tipo={quotation.tipo} />
            <div className="proposal-standard-body proposal-contract-body-container">
              <ContractBlocks blocks={blocks} />
            </div>
            <ProposalFooter pageNumber={idx + 2} totalPages={totalPages} />
          </A4Page>
        ),
      });
    });
  }

  const proposalPageOffset = contractPages.length;
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

            <div className="proposal-client-headrow proposal-client-separator">
              <div className="proposal-client-headrow-main">
                <p className="proposal-client-line"><strong>Cliente:</strong> {textValue(quotation.cliente.nome)}</p>
                <p className="proposal-client-line"><strong>CPF/CNPJ:</strong> {textValue(quotation.cliente.documento)}</p>
                <p className="proposal-client-line"><strong>Endereço:</strong> {textValue(quotation.cliente.endereco)}</p>
              </div>
              <div className="proposal-client-headrow-aside">
                <p className="proposal-client-line"><strong>Cidade/UF:</strong> {textValue(quotation.cliente.cidadeUf)}</p>
              </div>
            </div>

            <div className="proposal-client-contact-block">
              <p className="proposal-client-line"><strong>Aos cuidados:</strong> {textValue(quotation.cliente.responsavel)}</p>
              <div className="proposal-client-contact-inline">
                <p className="proposal-client-line"><strong>Tel.:</strong> {textValue(quotation.cliente.telefone)}</p>
                <p className="proposal-client-line"><strong>E-mail:</strong> {textValue(quotation.cliente.email)}</p>
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
              {sellerInfo.qrcodeUrl ? (
                <img
                  src={sellerInfo.qrcodeUrl}
                  alt="QR Code WhatsApp"
                  className="proposal-brand-qr-image"
                />
              ) : sellerQrCode ? (
                <img
                  src={sellerQrCode}
                  alt={`QR Code ${sellerInfo.name}`}
                  className="proposal-brand-qr-image"
                />
              ) : (
                <div className="proposal-brand-qr" aria-label="QR CODE" />
              )}
              <div className="proposal-brand-contact">
                {sellerInfo.avatarUrl && (
                  <img
                    src={sellerInfo.avatarUrl}
                    alt={sellerInfo.name}
                    className="w-14 h-14 rounded-xl object-cover mb-2"
                  />
                )}
                <p className="proposal-brand-contact-name">{sellerInfo.name}</p>
                <p className="proposal-brand-contact-role">{sellerInfo.roleLabel}</p>
                <p>Tel.: {sellerInfo.phone}</p>
                <p className="proposal-brand-contact-email">Email: {sellerInfo.email}</p>
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
            {index === 0 ? (
              <>
                <h2 className="proposal-scope-title">ESCOPO DE FORNECIMENTO:</h2>
                <p className="proposal-scope-subtitle">1.0 Preços e condições comerciais de equipamentos e serviços:</p>
              </>
            ) : null}

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
                    <th className="col-periodo">Período</th>
                  </tr>
                </thead>
                <tbody>
                  {slice.equipmentItems.length === 0 ? (
                    <tr>
                      <td className="proposal-empty-row" colSpan={7}>Nenhum item periódico informado</td>
                    </tr>
                  ) : (
                    slice.equipmentItems.map((item, rowIndex) => (
                      <tr key={item.id}>
                        <td>{slice.equipmentStartIndex + rowIndex + 1}</td>
                        <td>{textValue(item.descricao)}</td>
                        <td>{item.quantidade}</td>
                        <td><CurrencyCell value={item.valorUnitario} /></td>
                        <td><CurrencyCell value={item.valorTotal} /></td>
                        <td>{FranquiaHorasLabels[item.franquiaHoras] || item.franquiaHoras}</td>
                        <td>{PeriodoLocacaoLabels[item.periodoLocacao] || item.periodoLocacao}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {isLastEquipmentPage ? (
                  <tfoot>
                    <tr className="proposal-table-subtotal">
                      <td colSpan={5} className="proposal-table-subtotal-label">{getPeriodTotalLabel(quotation.condicoes.periodoOrcado)}</td>
                      <td className="proposal-table-subtotal-value">
                        <CurrencyCell value={quotation.totalPeriodicos} />
                      </td>
                      <td className="proposal-table-subtotal-empty" />
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
                    <th className="col-obs">Observações</th>
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
                        <td><CurrencyCell value={item.valorUnitario} /></td>
                        <td><CurrencyCell value={item.valorTotal} /></td>
                        <td>{textValue(item.observacoes)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {isLastServicePage ? (
                  <tfoot>
                    <tr className="proposal-table-subtotal">
                      <td colSpan={4} className="proposal-table-subtotal-label">VALOR SOB DEMANDA</td>
                      <td className="proposal-table-subtotal-value">
                        <CurrencyCell value={quotation.totalSpot} />
                      </td>
                      <td className="proposal-table-subtotal-empty" />
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </section>
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
                {inlineParagraphCount > 0 ? (
                  <div className="proposal-dispositions-inline">
                    <h3 className="proposal-blue-section-title">DISPOSIÇÕES GERAIS:</h3>
                    {DISPOSITION_PARAGRAPHS.slice(0, inlineParagraphCount).map((paragraph, i) => (
                      <p key={`inline-disp-${i}`}>{paragraph}</p>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}

            {isLastScopePage && quotation.observacoesGerais?.trim() && observationFitsInline ? (
              <section className="proposal-observations-block">
                <h3 className="proposal-blue-section-title">Observações:</h3>
                <p className="proposal-observations-text">{quotation.observacoesGerais}</p>
              </section>
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

  if (observationOnSeparatePage) {
    const obsPageNum = scopePages.length + 3 + proposalPageOffset + (includeCommercialPage ? 1 : 0);
    pages.push({
      key: 'observations',
      content: (
        <A4Page className="proposal-standard-page">
          <ProposalHeader issueLine={issueLine} documentId={quotation.documentId} tipo={quotation.tipo} annexLabel={proposalAnnexLabel} />

          <div className="proposal-standard-body proposal-acceptance-body">
            <section className="proposal-observations-block">
              <h3 className="proposal-blue-section-title">Observações:</h3>
              <p className="proposal-observations-text">{quotation.observacoesGerais}</p>
            </section>
          </div>

          <ProposalFooter pageNumber={obsPageNum} totalPages={totalPages} />
        </A4Page>
      ),
    });
  }

  const acceptanceParagraphs = shouldInlineCommercialSections
    ? DISPOSITION_PARAGRAPHS.slice(2)
    : showCommercialInline
      ? DISPOSITION_PARAGRAPHS.slice(inlineParagraphCount)
      : DISPOSITION_PARAGRAPHS.slice(7);

  // If the conditions grid was inlined on the scope page but no disposition
  // paragraph fit beneath it, the "DISPOSIÇÕES GERAIS:" heading has not been
  // shown yet — render it on the acceptance page above the paragraphs.
  const acceptanceShowsDispositionsHeading = showCommercialInline && inlineParagraphCount === 0;

  pages.push({
    key: 'acceptance',
    content: (
      <A4Page className="proposal-standard-page">
        <ProposalHeader issueLine={issueLine} documentId={quotation.documentId} tipo={quotation.tipo} annexLabel={proposalAnnexLabel} />

        <div className="proposal-standard-body proposal-acceptance-body">
          {acceptanceShowsDispositionsHeading ? (
            <div className="proposal-dispositions-inline">
              <h3 className="proposal-blue-section-title">DISPOSIÇÕES GERAIS:</h3>
            </div>
          ) : null}
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
