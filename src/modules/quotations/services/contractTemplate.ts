/**
 * EGEN System - Contract Template
 *
 * Modelo estruturado do "CONTRATO DE LOCAÇÃO GERADORES", fiel ao protótipo
 * fornecido pelo cliente (docs/HTML contract formatting (1)/Contrato EGEN.dc.html).
 *
 * O contrato é representado como uma lista de blocos tipados (ContractBlock[]),
 * com formatação inline (negrito, quebras de linha) preservada. A partir dessa
 * estrutura:
 *   - buildContractBlocks(vars)  → blocos com variáveis interpoladas (renderização)
 *   - paginateContractBlocks()   → agrupa blocos em páginas A4 (paginação lógica)
 *   - renderContractText(vars)    → serialização em texto puro (persistência/compat)
 *
 * Para editar o contrato: altere CONTRACT_STATIC_BLOCKS abaixo. Dados dinâmicos
 * (LOCATÁRIA, local, data) usam placeholders {{VARIAVEL}} resolvidos por variável.
 */
import type { SalesQuotation } from '../types/proposal';
import { formatCurrency } from '../engine';

// ============================================
// TEMPLATE VARS
// ============================================

export interface ContractTemplateVars {
  CONTRATO_NUMERO: string;        // Ex.: "CONT-2026-0003"
  DATA_EMISSAO_EXTENSO: string;   // Ex.: "28 de maio de 2026"
  LOCATARIO_NOME: string;         // Razão social / nome do cliente
  LOCATARIO_CNPJ: string;         // CNPJ ou CPF
  LOCATARIO_ENDERECO: string;     // Endereço da empresa locatária
  LOCATARIO_RESPONSAVEL: string;  // Nome do responsável / contato
  LOCAL_UTILIZACAO: string;       // Onde o equipamento será usado
  PROPOSTA_REF: string;           // ID da proposta original (ex.: "PROP-2026-0001")
  PERIODO_INICIO: string;         // Início da cobrança / locação
  PERIODO_FIM: string;            // Final da cobrança / locação
  PERIODO_MINIMO: string;         // Prazo mínimo contratado
  PERIODO_ORCADO: string;         // Período total orçado
  FORMA_PAGAMENTO: string;        // Forma de pagamento (ex.: "Boleto")
  PRAZO_PAGAMENTO: string;        // Prazo (ex.: "30 dias")
  FATURAMENTO: string;            // Ciclo de faturamento
  VALOR_TOTAL: string;            // Valor total formatado em reais
}

// ============================================
// MODELO DE BLOCOS
// ============================================

/** Nó de conteúdo inline (texto corrido, negrito ou quebra de linha). */
export type ContractInline =
  | { t: 'text'; value: string }
  | { t: 'b'; value: string }
  | { t: 'br' };

/**
 * Um bloco do contrato. Cada bloco vira exatamente um elemento na renderização
 * e é a unidade mínima de paginação (nunca é quebrado no meio).
 */
export type ContractBlock =
  /** Título centralizado em negrito ("CONTRATO DE LOCAÇÃO GERADORES"). */
  | { kind: 'doc-title'; text: string }
  /** Cabeçalho de cláusula em negrito ("2. OBJETO DO CONTRATO E DOCUMENTOS"). */
  | { kind: 'section'; content: ContractInline[]; keepWithNext?: boolean }
  /** Parágrafo (cláusula/subcláusula ou bloco de partes), com alinhamento. */
  | { kind: 'clause'; content: ContractInline[]; align: 'justify' | 'left'; keepWithNext?: boolean }
  /** Parágrafo "§" recuado, opcionalmente em itálico. */
  | { kind: 'note'; content: ContractInline[]; italic: boolean; indentMm: number }
  /** Lista recuada (anexos com marcador "-" ou alíneas "a) b) c)"). */
  | { kind: 'list'; items: ContractInline[][]; indentMm: number }
  /** Data de fechamento alinhada à direita. */
  | { kind: 'closing-date'; text: string; keepWithNext?: boolean }
  /** Marcador do bloco de assinaturas (renderização mantida do layout atual). */
  | { kind: 'signatures'; locatarioNome: string };

// ============================================
// HELPERS DE CONSTRUÇÃO DE INLINE
// ============================================

const PT_TO_MM = 0.3528;

/** Converte marcação leve `**negrito**` em nós inline. */
function md(str: string): ContractInline[] {
  const nodes: ContractInline[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(str)) !== null) {
    if (m.index > last) nodes.push({ t: 'text', value: str.slice(last, m.index) });
    nodes.push({ t: 'b', value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < str.length) nodes.push({ t: 'text', value: str.slice(last) });
  return nodes;
}

/** Cláusula justificada com número em negrito: bold(num) + texto (com **markup**). */
function clause(num: string, text: string, keepWithNext = false): ContractBlock {
  return {
    kind: 'clause',
    align: 'justify',
    content: [{ t: 'b', value: `${num} ` }, ...md(text)],
    keepWithNext,
  };
}

/** Cabeçalho de cláusula numerada (negrito, caixa alta), mantido junto ao próximo. */
function section(text: string): ContractBlock {
  return { kind: 'section', content: md(text), keepWithNext: true };
}

/** Bloco de partes (LOCADORA/LOCATÁRIA/LOCAL) — alinhado à esquerda, com <br>. */
function partyBlock(lines: ContractInline[][]): ContractBlock {
  const content: ContractInline[] = [];
  lines.forEach((line, idx) => {
    if (idx > 0) content.push({ t: 'br' });
    content.push(...line);
  });
  return { kind: 'clause', align: 'left', content, keepWithNext: true };
}

// ============================================
// BLOCOS ESTÁTICOS — texto fiel ao protótipo do cliente.
// Placeholders {{...}} são resolvidos em buildContractBlocks().
// ============================================

function staticBlocks(): ContractBlock[] {
  return [
    { kind: 'doc-title', text: 'CONTRATO DE LOCAÇÃO GERADORES' },

    // ── 1. PARTES ──
    {
      kind: 'clause',
      align: 'justify',
      content: md('**1.** Pelo presente instrumento particular de contrato de locação, das partes'),
      keepWithNext: true,
    },
    partyBlock([
      [{ t: 'b', value: '1.1 LOCADORA:' }],
      md('NOME: EGEN GERADORES LTDA'),
      md('CNPJ: 53.457.416/0001-08'),
      md('ENDEREÇO: ROD. BR 153, S/N, QUADRACH 07 LOTE 20 SALA 03 KM 03– CHACARÁ RETIRO, GOIÂNIA / GO – CEP: 74.620-425'),
      md('RESPONSÁVEL: EMMERSON DE JESUS CALDEIRA'),
      md('FONE: (62) 9 8470 -3985'),
    ]),
    partyBlock([
      [{ t: 'b', value: '1.2 LOCATÁRIA:' }],
      md('**NOME:** {{LOCATARIO_NOME}}'),
      md('**CNPJ:** {{LOCATARIO_CNPJ}}'),
      md('**ENDEREÇO:** {{LOCATARIO_ENDERECO}}'),
      md('**RESPONSÁVEL:** {{LOCATARIO_RESPONSAVEL}}'),
    ]),
    partyBlock([
      md('**1.3 LOCAL DE UTILIZAÇÃO:**'),
      md('{{LOCAL_UTILIZACAO}}'),
    ]),
    clause('1.4', 'As partes acima identificadas têm, entre si, justo e acertado o presente **Contrato de Locação de Geradores de Energia a Diesel**, incluindo acessórios, que se regerá pelas cláusulas e condições deste contrato devidamente assinado pelas partes.'),

    // ── 2. OBJETO ──
    section('2. OBJETO DO CONTRATO E DOCUMENTOS'),
    clause('2.1', 'O presente contrato tem por objeto a locação os equipamentos relacionados no Anexo I – Proposta de Locação.'),
    {
      kind: 'note',
      italic: false,
      indentMm: 35 * PT_TO_MM,
      content: md('§ O Anexo I deste Contrato especifica os equipamentos, acessórios, preços, prazos e condições acordados na data de sua celebração. Propostas e orçamentos adicionais não serão incorporados a este Contrato. Qualquer alteração no escopo ou nos valores exigirá a formalização de um aditivo contratual.'),
    },
    clause('2.2', 'Os anexos listados abaixo são parte integrante deste Contrato:'),
    {
      kind: 'list',
      indentMm: 15 * PT_TO_MM,
      items: [
        md('- **Anexo I** – Proposta técnica comercial.'),
        md('- **Anexo II** – Checklist de entrega ao cliente.'),
        md('- **Anexo III** – Romaneio de acessórios entregues ou NF de remessa.'),
        md('- **Anexo IV** – Nota fiscal de remessa.'),
        md('- **Anexo VI** – Checklist devolução a locadora.'),
        md('- **Anexo VII** – Romaneio de acessórios devolvidos.'),
        md('- **Anexo VIII** – Nota fiscal de remessa de devolução.'),
      ],
    },
    clause('2.3', 'Os equipamentos locados deverão ser utilizados no local indicado neste contrato no item 1.3. A transferência ou relocação para outro endereço só poderá ser realizada com autorização por escrito da LOCADORA, sob pena de inadimplemento contratual.'),

    // ── 3. PRAZO ──
    section('3. PRAZO DA LOCAÇÃO'),
    clause('3.1', 'O prazo de locação e data de início e término é definida na proposta comercial, integrante deste documento como ANEXO I.'),
    clause('3.2', 'O Contrato será renovado por prazo indeterminado caso a LOCATÁRIA continue na posse dos bens locados, sem oposição da LOCADORA.'),
    clause('3.3', 'Caso uma das partes não deseje dar continuidade à locação, deverá notificar a outra com, no mínimo, 7 (sete) dias de antecedência. Uma vez notificada a LOCADORA sobre a devolução, deverá ser observada as condições de desinstalação, frete e demais itens negociados no Anexo I, podendo, em caso de acordo mútuo, ser objeto de nova negociação entre as partes.'),
    clause('3.4', 'A cobrança do período de locação será encerrada no dia seguinte à data em que a LOCADORA retomar a posse dos equipamentos locados. O preposto da LOCATÁRIA deverá estar presente para formalizar a devolução, tomar ciência de eventuais danos ou ausência de componentes e assinar a documentação correspondente nos Anexos VI, VII e VIII.'),
    clause('3.5', 'Na ausência das notas fiscais de devolução de remessa, a cobrança da locação permanecerá válida até o recebimento da documentação fiscal correta pela LOCADORA, salvo nos casos em que a LOCATÁRIA não seja contribuinte do ICMS. Nesses casos, poderá ser emitida pela LOCADORA a nota fiscal de remessa de retorno, desde que a LOCATÁRIA assine a recusa de emissão no verso da nota fiscal de remessa da locação, concluindo a operação fiscal.'),
    clause('3.6', 'As partes concordam que a ausência da LOCATÁRIA ou de seu preposto, conforme previsto anteriormente, será considerada como aceitação dos termos inspecionados no “Checklist de devolução à LOCADORA” e no “romaneio de acessórios devolvidos”.'),
    clause('3.7', 'Após a devolução, os equipamentos serão vistoriados por um preposto da LOCADORA. Se forem constatadas falhas de manutenções, ausência ou danos em peças, acessórios ou componentes, por responsabilidade da LOCATÁRIA, esta arcará com os custos de reposição, serviços e aluguéis pelo período de paralisação para reparo. O valor das peças será baseado no preço de mercado para peças originais na data da devolução.'),
    clause('3.8', 'A LOCADORA reserva-se o direito de, no prazo de até 30 (trinta) dias após a devolução, verificar danos ocultos que não puderam ser constatados no momento da entrega. Caso sejam identificados e comprovados por meio de ordem de serviço, fotos e laudos, a LOCATÁRIA será responsável pelo ressarcimento das despesas com reparos, incluindo serviços, peças e aluguéis durante o período em que o equipamento permanecer inoperante.'),

    // ── 4. VALOR E FORMA DE PAGAMENTO ──
    section('4. VALOR E FORMA DE PAGAMENTO'),
    clause('4.1', 'A LOCATÁRIA pagará à LOCADORA os valores indicados no Anexo I deste Contrato, sendo o pagamento efetuado mediante apresentação de nota fiscal, demonstrativo ou outra forma de pagamento aceita. No caso de pagamentos à vista, os valores deverão ser depositados na conta corrente da LOCADORA e confirmados antes da execução dos serviços.'),
    clause('4.2', 'Se o vencimento coincidir com sábado, domingo ou feriado, o pagamento do aluguel deverá ser efetuado no primeiro dia útil subsequente.'),
    clause('4.3', 'Os valores referentes à medição de horas de utilização, horas excedentes e/ou energia gerada serão faturados por período de aferição e/ou ao final do período de locação, conforme descrito no Anexo I.'),
    {
      kind: 'note',
      italic: true,
      indentMm: 42 * PT_TO_MM,
      content: md('§ O valor do horímetro a ser considerado será o RUN ABSOLUTE; para os equipamentos eletrônicos, o valor a ser considerado será o OPERATION). O horímetro inicial será informado nas observações da nota fiscal de locação. As leituras deverão ser enviadas pelo CLIENTE antes do fim de cada período.'),
    },
    clause('4.4', 'A prorrogação do contrato não implica na obrigação da LOCADORA de manter o valor original da locação, permitindo-lhe reajustar os valores, inclusive com a aplicação de correção conforme o índice IGPM/FGV, desde que positivo e acumulado no período.'),
    clause('4.5', 'Durante a vigência da locação, caso a LOCATÁRIA solicite a devolução parcial dos bens locados antes do término do prazo estipulado no Anexo I, ela será responsável por todos os custos relacionados à desmobilização, além de arcar com o valor integral do período locado.'),

    // ── 5. OBRIGAÇÕES DA LOCADORA ──
    section('5. OBRIGAÇÕES DA LOCADORA'),
    clause('5.1', 'Entregar os bens e acessórios locados à LOCATÁRIA em condições perfeitas de funcionamento, devidamente testados e inspecionados, conforme os critérios estabelecidos no Anexo II – Checklist de Entrega ao Cliente.'),
    clause('5.2', 'Garantir o uso pacífico do objeto locado, enquanto a LOCATÁRIA cumprir os termos estabelecidos neste contrato.'),
    clause('5.3', 'Acompanhar e realizar a manutenção dos equipamentos locados conforme estabelecido no Anexo I.'),
    clause('5.4', 'Fornecer as informações técnicas necessárias para assegurar o adequado funcionamento e operação dos equipamentos locados.'),
    clause('5.5', 'Substituir ou reparar qualquer componente do equipamento locado que apresente defeito de fabricação.'),
    clause('5.6', 'Substituir o equipamento em caso de falhas que não possam ser solucionadas pela manutenção no local de utilização, conforme a disponibilidade de equipamento equivalente no pátio da LOCADORA.'),

    // ── 6. OBRIGAÇÕES DA LOCATÁRIA ──
    section('6. OBRIGAÇÕES DA LOCATÁRIA'),
    clause('6.1', 'Testar e inspecionar os equipamentos no momento do recebimento, atestando sua conformidade por meio da assinatura do Anexo II – Checklist de Entrega ao Cliente. A referida assinatura deverá ser obrigatoriamente realizada por pessoa devidamente designada pela LOCATÁRIA, que se encontrará presente no local para receber os equipamentos e acessórios locados, sendo que a LOCATÁRIA reconhece, desde já, que a assinatura dessa pessoa será considerada como suficiente para representá-la no ato de recebimento.'),
    clause('6.2', 'A LOCATÁRIA, por meio da assinatura dos Anexos II, III, IV e V no momento do recebimento, declara que os equipamentos se encontram em perfeito estado de uso, e que foi devidamente informada sobre sua correta utilização e operação. Compromete-se, assim, a devolvê-los nas mesmas condições de uso, funcionamento e segurança, ao término do período de locação.'),
    clause('6.3', 'Conservar os equipamentos locados na forma como o recebeu, ressalvando apenas desgaste natural decorrente de uso regular, sendo expressamente vedado a LOCATÁRIA realizar qualquer modificação ou adaptação nos bens locados.'),
    clause('6.4', 'A LOCATÁRIA compromete-se a notificar a LOCADORA imediatamente, assim que identificar a necessidade de manutenções preventivas ou corretivas. Fica expressamente vedada a realização de qualquer intervenção nos equipamentos pela LOCATÁRIA sem a devida aprovação formal da LOCADORA.'),
    clause('6.5', 'Repassar à LOCADORA todas as informações comerciais e técnicas necessárias para a instalação e operação dos equipamentos, priorizando a segurança e o uso adequado, em estrito cumprimento das especificações técnicas de cada equipamento locado.'),
    clause('6.6', 'Efetuar, pontualmente, o pagamento do valor da locação e seus encargos durante toda a vigência do contrato, sendo expressamente vedada a interrupção do pagamento, por qualquer motivo que seja.'),
    clause('6.7', 'É de inteira responsabilidade da LOCATÁRIA os encargos sociais, fiscais e trabalhistas decorrentes da contratação de pessoal para o manuseio e operação dos bens locados. Ademais, a LOCATÁRIA se compromete a permitir, a qualquer tempo e durante toda a vigência da locação, a livre inspeção dos equipamentos locados por representantes devidamente autorizados da LOCADORA.'),
    clause('6.8', 'Compromete-se igualmente a LOCATÁRIA a informar imediatamente a LOCADORA qualquer dano ou avaria ocasionado por seus prepostos ou ainda roubo, furto ou extravio do equipamento locado, acionando a Contratada através dos contatos disponibilizados, para a avaliação e elaboração de Laudo Técnico com apuração dos prejuízos ocasionados, respondendo a Contratante por perdas e danos nos termos do artigo 402, 403, 404, 405, 569 e 570 todos do Código Civil. O pagamento da locação será devido até que os bens sejam restaurados, substituídos ou devolvidos em perfeitas condições de uso e conservação.'),
    clause('6.9', 'É vedado à LOCATÁRIA ceder, emprestar, arrendar, sublocar ou transferir os bens locados para outro local sem a devida autorização prévia e por escrito da LOCADORA.'),
    clause('6.10', 'A LOCATÁRIA declara ter ciência de que os equipamentos não possuem seguro, sendo de sua responsabilidade a contratação e manutenção do seguro durante toda a vigência deste contrato. As apólices deverão cobrir todos os riscos inerentes ao uso dos equipamentos e a responsabilidade civil perante terceiros, com a LOCATÁRIA arcando com o pagamento do prêmio em caso de sinistro.'),
    clause('6.11', 'No caso de qualquer apólice perder validade, não ser renovada ou sofrer alterações que comprometam sua eficácia, a LOCATÁRIA será responsável pelo pagamento integral ou complementar de todos os danos que seriam cobertos pelas apólices. A não constituição do seguro e a não apresentação à LOCADORA, por escrito, implicarão na total responsabilidade da LOCATÁRIA em caso de sinistro.'),

    // ── 7. MANUTENÇÕES E SUPORTE ──
    section('7. MANUTENÇÕES E SUPORTE'),
    clause('7.1', 'A manutenção preventiva dos equipamentos será realizada a cada 250 horas de funcionamento ou a cada 6 meses. Os itens essenciais a serem considerados nas manutenções incluem: a substituição do óleo lubrificante, do filtro de óleo lubrificante, do filtro de combustível, a inspeção e eventual substituição do filtro de ar, a verificação de contatos elétricos e conexões, a inspeção do sistema de admissão de ar, a verificação do estado mecânico de partes móveis e fixas, e a complementação ou troca do líquido de arrefecimento.'),
    clause('7.2', 'Serviços diversos, incluindo, mas não se limitando a limpeza de radiador, tanque de combustível, alternadores, disjuntores, ou quaisquer outros serviços que se tornem necessários em decorrência do acúmulo de sujeira proveniente do local de utilização do equipamento, não serão considerados como parte integrante da manutenção preventiva. Tais serviços serão de responsabilidade da LOCATÁRIA, que arcará com os custos correspondentes, conforme orçamento previamente elaborado e aprovado.'),
    clause('7.3', 'A LOCATÁRIA reconhece que a responsabilidade pelos custos da manutenção corretiva recairá sobre si em casos de falhas decorrentes de má operação, falta de combustível, mau uso, vandalismo, acidente, imperícia, negligência, imprudência, uso de combustível inadequado, sobrecarga e outros eventos que configuram mau uso.'),
    clause('7.4', 'A LOCATÁRIA é responsável pela aquisição de Diesel de qualidade e por danos causados no sistema de injeção. Caso seja constatada má qualidade do combustível, arcará com os custos de laudos, hora técnica, reparos e quaisquer outros custos necessários.'),
    clause('7.5', 'A LOCATÁRIA reconhece estar ciente de que ambientes hostis, com partículas em suspensão, umidade excessiva, poeira e vapores corrosivos, podem acelerar o desgaste anormal dos equipamentos e componentes, caracterizando mau uso.'),
    clause('7.6', 'Durante a utilização do gerador, deverá ser desconectada do circuito qualquer carga que adiante o fator de potência, como UPS, bancos de capacitores e outros dispositivos similares.'),
    clause('7.7', 'Para atendimentos decorrentes de mau uso, não se limitando às hipóteses especificadas neste contrato, a LOCADORA fornecerá ordem de serviço, documentação fotográfica e relatório detalhado com os custos envolvidos. Os valores apresentados deverão ser reembolsados pela LOCATÁRIA, de forma integral a LOCADORA.'),

    // ── 8. INADIMPLEMENTO ──
    section('8. DO INADIMPLEMENTO'),
    clause('8.1', 'Em caso de atraso no pagamento, será aplicada multa de 2%.'),
    clause('8.2', 'Juros de 1% ao mês serão calculados sobre o valor em atraso.'),
    clause('8.3', 'Haverá atualização monetária conforme índice aplicável.'),

    // ── 9. RESCISÃO ──
    section('9. RESCISÃO DA LOCAÇÃO'),
    clause('9.1', 'A locadora poderá recolher os equipamentos sem aviso prévio caso ocorra:', true),
    {
      kind: 'list',
      indentMm: 39 * PT_TO_MM,
      items: [
        md('a) inadimplência superior a 30 dias;'),
        md('b) uso indevido ou em desacordo com as condições acordadas'),
        md('c) mudança do local de instalação sem autorização.'),
      ],
    },
    clause('9.2', 'Após o prazo mínimo contratado (conforme Anexo I), qualquer parte poderá encerrar a locação mediante aviso por escrito com, no mínimo, 07 (sete) dias de antecedência. Penalidades, se houver, seguirão o que for previsto no anexo.'),
    clause('9.3', 'Em caso de rescisão, a locatária deverá devolver os equipamentos e quitar eventuais valores em aberto, incluindo encargos. Caso não devolva os bens em até 72 horas após notificação, a locadora poderá retirá-los diretamente, sendo a locatária responsável pelos custos envolvidos.'),
    clause('9.4', 'A Locatária se compromete a arcar integralmente com todos os custos inerentes à retirada dos equipamentos, em caso de falta de pagamento ou descumprimento de qualquer das cláusulas deste contrato que estejam sob sua responsabilidade.'),
    clause('9.5', 'O contrato poderá ser encerrado de imediato, sem aviso ou multa, caso uma das partes entre em falência, recuperação judicial, ou seja, dissolvida, arcando com eventuais custos e prejuízos.'),

    // ── 10. DISPOSIÇÕES GERAIS ──
    section('10. DISPOSIÇÕES GERAIS'),
    clause('10.1', 'Qualquer alteração neste contrato deverá ser feita por meio de aditivo assinado por ambas as partes.'),
    clause('10.2', 'O não exercício imediato de qualquer direito previsto neste contrato, por qualquer das partes, não será considerado como renúncia ou desistência desses direitos, que poderão ser exigidos a qualquer tempo.'),

    // ── 11. FORO ──
    section('11. FORO'),
    clause('11.1', 'Fica estabelecido o foro da comarca de Goiânia/GO como o único competente para resolver quaisquer controvérsias decorrentes deste contrato.'),

    // ── Fechamento + assinaturas ──
    { kind: 'closing-date', text: 'Goiânia, {{DATA_EMISSAO_EXTENSO}}', keepWithNext: true },
    { kind: 'signatures', locatarioNome: '{{LOCATARIO_NOME}}' },
  ];
}

// ============================================
// INTERPOLAÇÃO
// ============================================

function interpolate(value: string, vars: ContractTemplateVars): string {
  return (Object.keys(vars) as (keyof ContractTemplateVars)[]).reduce(
    (text, key) => text.split(`{{${key}}}`).join(vars[key]),
    value,
  );
}

function interpolateInline(nodes: ContractInline[], vars: ContractTemplateVars): ContractInline[] {
  return nodes.map((node) =>
    node.t === 'br' ? node : { ...node, value: interpolate(node.value, vars) },
  );
}

/**
 * Constrói os blocos do contrato com as variáveis já interpoladas — pronto para
 * renderização. É a fonte de verdade usada pelo ProposalPrintDocument.
 */
export function buildContractBlocks(vars: ContractTemplateVars): ContractBlock[] {
  return staticBlocks().map((block): ContractBlock => {
    switch (block.kind) {
      case 'doc-title':
        return { ...block, text: interpolate(block.text, vars) };
      case 'section':
        return { ...block, content: interpolateInline(block.content, vars) };
      case 'clause':
        return { ...block, content: interpolateInline(block.content, vars) };
      case 'note':
        return { ...block, content: interpolateInline(block.content, vars) };
      case 'list':
        return { ...block, items: block.items.map((item) => interpolateInline(item, vars)) };
      case 'closing-date':
        return { ...block, text: interpolate(block.text, vars) };
      case 'signatures':
        return { ...block, locatarioNome: interpolate(block.locatarioNome, vars) };
    }
  });
}

// ============================================
// ESTIMATIVA DE ALTURA + PAGINAÇÃO
// ============================================
//
// A prévia usa páginas A4 discretas com overflow:hidden (conteúdo que
// transborda é cortado), portanto a paginação precisa ser calculada em JS.
// Cada bloco tem sua altura estimada em mm (conservadora, para nunca cortar)
// e os blocos são empacotados sequencialmente respeitando o orçamento útil.

/**
 * Orçamento de altura (estimada) por página. A área útil real do corpo do
 * contrato é ~239mm (padding base reduzido em .proposal-contract-body-container);
 * como a estimativa é ~1.14× a altura real, este valor pode ser maior que 239
 * sem cortar conteúdo — as páginas ficam bem preenchidas (altura real resultante
 * ~230mm, ainda com folga contra o clipping).
 */
export const CONTRACT_PAGE_BUDGET_MM = 275;

const CONTRACT_BODY_WIDTH_MM = 186;
const CONTRACT_LINE_MM = 3.9; // ≈ 9.5pt × line-height 1.16 (calibrado com render real)

function inlineText(nodes: ContractInline[]): string {
  return nodes.map((n) => (n.t === 'br' ? '\n' : n.value)).join('');
}

/** Estima a altura (mm) de um parágrafo dado o texto, largura e margens. */
function estimateParagraphMm(
  text: string,
  widthMm: number,
  marginBottomMm: number,
  fontMm = 3.35,
): number {
  const charWidthMm = fontMm * 0.47; // aproximação para Calibri (calibrado com render real)
  const charsPerLine = Math.max(20, Math.floor(widthMm / charWidthMm));
  // Considera quebras explícitas (\n de <br>) e wrap por comprimento.
  const explicitLines = text.split('\n');
  let lines = 0;
  for (const seg of explicitLines) {
    lines += Math.max(1, Math.ceil(seg.length / charsPerLine));
  }
  return lines * CONTRACT_LINE_MM + marginBottomMm;
}

/** Estima a altura de um bloco (mm). Deliberadamente conservadora. */
export function estimateContractBlockMm(block: ContractBlock): number {
  switch (block.kind) {
    case 'doc-title':
      return CONTRACT_LINE_MM + 3.4; // linha (12pt) + margem base 3.4mm
    case 'section':
      return CONTRACT_LINE_MM + 3.4 + 2.1; // margem topo 3.4mm + linha + margem base 2.1mm
    case 'clause':
      return estimateParagraphMm(inlineText(block.content), CONTRACT_BODY_WIDTH_MM, 2.3);
    case 'note':
      return estimateParagraphMm(
        inlineText(block.content),
        CONTRACT_BODY_WIDTH_MM - block.indentMm,
        2.3,
      );
    case 'list': {
      const width = CONTRACT_BODY_WIDTH_MM - block.indentMm;
      const itemsMm = block.items.reduce(
        (sum, item) => sum + estimateParagraphMm(inlineText(item), width, 0.6),
        0,
      );
      return itemsMm + 2.3;
    }
    case 'closing-date':
      return CONTRACT_LINE_MM + 3.4 + 4.5; // linha + margens (topo 3.4mm / base 4.5mm)
    case 'signatures':
      // Barra "ASSINATURAS" + 4 linhas (2 assinatura + 2 testemunha) + margens.
      return 8 + 4 * 8.5 + 6;
  }
}

function hasKeepWithNext(block: ContractBlock): boolean {
  return 'keepWithNext' in block && Boolean(block.keepWithNext);
}

/**
 * Altura (mm) a reservar após um bloco com "keepWithNext": soma toda a cadeia
 * de blocos encadeados (título → cláusula → lista) até o primeiro bloco que
 * encerra a cadeia (inclusive). Assim um título nunca fica órfão ainda que a
 * cláusula seguinte também precise permanecer junto do próprio bloco dela.
 */
function reservedAfterMm(blocks: ContractBlock[], index: number): number {
  let sum = 0;
  for (let j = index + 1; j < blocks.length; j++) {
    sum += estimateContractBlockMm(blocks[j]);
    if (!hasKeepWithNext(blocks[j])) break;
  }
  return sum;
}

/**
 * Empacota os blocos em páginas respeitando o orçamento vertical. Mantém
 * cabeçalhos de seção (e a data de fechamento) junto ao bloco seguinte para
 * evitar títulos órfãos no rodapé.
 */
export function paginateContractBlocks(
  blocks: ContractBlock[],
  budgetMm: number = CONTRACT_PAGE_BUDGET_MM,
): ContractBlock[][] {
  const pages: ContractBlock[][] = [];
  let current: ContractBlock[] = [];
  let height = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockMm = estimateContractBlockMm(block);

    // "keepWithNext" reserva a altura de toda a cadeia seguinte (título +
    // cláusula + lista/assinaturas) para não deixar um título sozinho no rodapé.
    const nextMm = hasKeepWithNext(block) ? reservedAfterMm(blocks, i) : 0;

    if (current.length > 0 && height + blockMm + nextMm > budgetMm) {
      pages.push(current);
      current = [];
      height = 0;
    }

    current.push(block);
    height += blockMm;
  }

  if (current.length > 0) {
    pages.push(current);
  }

  return pages;
}

// ============================================
// HELPERS DE DATA / VARS
// ============================================

const MONTHS_PT = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/**
 * Converte "2026-05-28" → "28 de maio de 2026".
 * Adiciona T12:00:00 para evitar bug de fuso UTC±1.
 */
function formatDateExtenso(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return `${d.getDate()} de ${MONTHS_PT[d.getMonth()]} de ${d.getFullYear()}`;
}

/**
 * Constrói o objeto de variáveis a partir dos dados da proposta.
 * @param quotation  Proposta original (antes da conversão)
 * @param contractDocumentId  ID do novo contrato (ex.: "CONT-2026-0001")
 */
export function buildContractVars(
  quotation: SalesQuotation,
  contractDocumentId: string,
): ContractTemplateVars {
  const total =
    quotation.totalComDesconto > 0 ? quotation.totalComDesconto : quotation.totalGeral;

  return {
    CONTRATO_NUMERO: contractDocumentId,
    DATA_EMISSAO_EXTENSO: formatDateExtenso(quotation.dataEmissao || new Date().toISOString()),
    LOCATARIO_NOME: quotation.cliente.nome || '-',
    LOCATARIO_CNPJ: quotation.cliente.documento || '-',
    LOCATARIO_ENDERECO:
      quotation.cliente.endereco || quotation.condicoes?.localUtilizacao || '-',
    LOCATARIO_RESPONSAVEL: quotation.cliente.responsavel || '-',
    LOCAL_UTILIZACAO: quotation.condicoes?.localUtilizacao || '-',
    PROPOSTA_REF: quotation.documentId,
    PERIODO_INICIO: quotation.condicoes?.inicioCobranca || '-',
    PERIODO_FIM: quotation.condicoes?.finalCobranca || '-',
    PERIODO_MINIMO: quotation.condicoes?.periodoMinimo || '-',
    PERIODO_ORCADO: quotation.condicoes?.periodoOrcado || '-',
    FORMA_PAGAMENTO: quotation.condicoes?.formaPagamento || '-',
    PRAZO_PAGAMENTO: quotation.condicoes?.prazoPagamento || '-',
    FATURAMENTO: quotation.condicoes?.faturamento || '-',
    VALOR_TOTAL: formatCurrency(total),
  };
}

// ============================================
// SERIALIZAÇÃO EM TEXTO PURO (persistência / compat)
// ============================================

/**
 * Serializa os blocos do contrato em texto puro. Usado para persistir
 * `contractText` no banco (compatibilidade e busca); a renderização visual
 * usa os blocos estruturados, não este texto.
 */
export function renderContractText(vars: ContractTemplateVars): string {
  const blocks = buildContractBlocks(vars);
  const lines: string[] = [];

  for (const block of blocks) {
    switch (block.kind) {
      case 'doc-title':
        lines.push(block.text, '');
        break;
      case 'section':
        lines.push('', inlineText(block.content));
        break;
      case 'clause':
        lines.push(inlineText(block.content));
        break;
      case 'note':
        lines.push(inlineText(block.content));
        break;
      case 'list':
        block.items.forEach((item) => lines.push(inlineText(item)));
        break;
      case 'closing-date':
        lines.push('', block.text);
        break;
      case 'signatures':
        lines.push(
          '',
          'ASSINATURAS',
          `Locadora: EGEN GERADORES LTDA || Assinatura: ______________________________________`,
          `Locatária: ${block.locatarioNome} || Assinatura: ______________________________________`,
          `Testemunha 1: Nome: _________________________ || CPF: _________________________`,
          `Testemunha 2: Nome: _________________________ || CPF: _________________________`,
        );
        break;
    }
  }

  return lines.join('\n');
}
