/**
 * EGEN System - Contract Template
 * Template de contrato com placeholders {{VARIAVEL}} para interpolação dinâmica.
 * Baseado em docs/CONTRACT.md — dados estáticos da LOCADORA já preenchidos.
 *
 * Para adicionar/remover campos: edite ContractTemplateVars + CONTRACT_TEMPLATE + buildContractVars.
 */
import type { SalesQuotation } from '../types/proposal';
import { formatCurrency } from '../engine';

// ============================================
// TEMPLATE VARS
// Cada chave mapeia 1:1 ao placeholder {{CHAVE}} dentro de CONTRACT_TEMPLATE.
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
// TEMPLATE — copiar/editar aqui para atualizar o modelo de contrato.
// Mantém a estrutura de docs/CONTRACT.md; apenas os campos variáveis
// foram substituídos por {{PLACEHOLDER}}.
// ============================================

export const CONTRACT_TEMPLATE = `\
CONTRATO DE LOCAÇÃO DE GERADORES DE ENERGIA A DIESEL

Goiânia, {{DATA_EMISSAO_EXTENSO}} | Contrato de Locação nº {{CONTRATO_NUMERO}}

─────────────────────────────────────────────────────────────────────────────
1. PARTES CONTRATANTES E LOCAL
─────────────────────────────────────────────────────────────────────────────

1.1 LOCADORA:
Nome:        EGEN GERADORES LTDA
CNPJ:        06.987.533/0001-95
Endereço:    ROD. BR 153, S/N, QUADRACH 07 LOTE 20 SALA 03 KM 03 - CHACARÁ RETIRO,
             GOIÂNIA / GO - CEP: 74.620-425
Responsável: EMMERSON DE JESUS CALDEIRA
Fone:        (62) 9 8470-3985

1.2 LOCATÁRIO:
Nome:        {{LOCATARIO_NOME}}
CNPJ/CPF:    {{LOCATARIO_CNPJ}}
Endereço:    {{LOCATARIO_ENDERECO}}
Responsável: {{LOCATARIO_RESPONSAVEL}}

1.3 LOCAL DE UTILIZAÇÃO:
Endereço:    {{LOCAL_UTILIZACAO}}

As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de
Locação de Geradores de Energia a Diesel, incluindo acessórios, que se regerá pelas
cláusulas e condições devidamente assinadas pelas partes.

─────────────────────────────────────────────────────────────────────────────
2. OBJETO DO CONTRATO E DOCUMENTOS
─────────────────────────────────────────────────────────────────────────────

2.1  Objeto: Locação dos equipamentos relacionados no Anexo I ({{PROPOSTA_REF}}). Propostas
     adicionais não serão incorporadas, exigindo-se aditivo contratual para alterações.

2.2  Anexos Integrantes:
     - ANEXO I   : Proposta técnica comercial ({{PROPOSTA_REF}})
     - ANEXO II  : Checklist de entrega ao cliente
     - ANEXO III : Romaneio de acessórios entregues ou NF de remessa
     - ANEXO IV  : Nota fiscal de remessa
     - ANEXO VI  : Checklist devolução a locadora
     - ANEXO VII : Romaneio de acessórios devolvidos
     - ANEXO VIII: Nota fiscal de remessa de devolução

2.3  Restrição de Local: O uso deve ocorrer no local indicado (item 1.3), sendo a
     transferência permitida apenas com autorização por escrito da Locadora.

─────────────────────────────────────────────────────────────────────────────
3. PRAZO DA LOCAÇÃO
─────────────────────────────────────────────────────────────────────────────

3.1  Início e Término:      {{PERIODO_INICIO}} a {{PERIODO_FIM}}.
3.2  Período mínimo:        {{PERIODO_MINIMO}}.
3.3  Período orçado:        {{PERIODO_ORCADO}}.
3.4  Renovação:             Prazo indeterminado se a Locatária mantiver a posse sem oposição.
3.5  Encerramento Voluntário: Exige notificação com no mínimo 7 (sete) dias de antecedência,
     observando as regras do Anexo I.
3.6  Cobrança e Devolução:  A cobrança encerra um dia após a retomada da posse pela
     Locadora. Na ausência de NF de devolução, a cobrança se mantém.
3.7  Vistorias e Danos:     A ausência de preposto da Locatária na devolução implica aceite
     do checklist da Locadora. A Locatária arcará com custos de reposição por mau uso,
     tendo a Locadora até 30 dias para atestar danos ocultos.

─────────────────────────────────────────────────────────────────────────────
4. VALOR E FORMA DE PAGAMENTO
─────────────────────────────────────────────────────────────────────────────

4.1  Valor Total:       {{VALOR_TOTAL}}
4.2  Forma de Pagamento: {{FORMA_PAGAMENTO}}
4.3  Prazo de Pagamento: {{PRAZO_PAGAMENTO}}
4.4  Faturamento:        {{FATURAMENTO}}
4.5  Vencimento:         Prorrogado para o primeiro dia útil seguinte se coincidir com
     finais de semana ou feriados.
4.6  Medição de Horas:   Faturamento por período de aferição (horímetro RUN ABSOLUTE ou
     OPERATION), cujas leituras devem ser enviadas pelo cliente.
4.7  Reajuste:           Aplicação de correção pelo IGPM/FGV em caso de prorrogação.
4.8  Devolução Antecipada: A Locatária arca com os custos de desmobilização e o valor
     integral do período contratado.

─────────────────────────────────────────────────────────────────────────────
5. OBRIGAÇÕES DA LOCADORA
─────────────────────────────────────────────────────────────────────────────

5.1  Entrega:        Fornecer bens em perfeitas condições, testados e inspecionados.
5.2  Suporte Técnico: Garantir o uso pacífico e fornecer informações técnicas para operação.
5.3  Manutenção:     Realizar as manutenções previstas no Anexo I e substituir/reparar
     defeitos de fabricação ou trocar equipamentos inoperantes mediante disponibilidade.

─────────────────────────────────────────────────────────────────────────────
6. OBRIGAÇÕES DA LOCATÁRIA
─────────────────────────────────────────────────────────────────────────────

6.1  Recebimento e Devolução: Testar no recebimento, assinar os Anexos e devolver o
     equipamento nas mesmas condições de funcionamento.
6.2  Conservação:    Manter a originalidade do equipamento; vedada qualquer modificação.
6.3  Notificações:   Avisar imediatamente sobre necessidade de manutenções, sem intervir.
6.4  Pagamentos:     Manter pontualidade financeira e assumir total responsabilidade por
     encargos trabalhistas, sociais e fiscais dos operadores.
6.5  Sinistros:      Informar perdas, roubos ou danos, arcando com os prejuízos e o
     aluguel até a restauração do bem.
6.6  Vedação de Cessão: É proibido ceder, arrendar ou sublocar sem autorização.
6.7  Seguro:         Responsabilidade integral da Locatária em contratar seguro total,
     arcando financeiramente em caso de ausência de apólice válida.

─────────────────────────────────────────────────────────────────────────────
7. MANUTENÇÕES E SUPORTE
─────────────────────────────────────────────────────────────────────────────

7.1  Manutenção Preventiva: A cada 250 horas ou 6 meses (troca de óleo, filtros, etc.).
7.2  Limpeza:        Custos com limpeza por acúmulo de sujeira do local são da Locatária.
7.3  Mau Uso:        Custos por má operação, combustível adulterado ou ambientes hostis
     são responsabilidade da Locatária.
7.4  Restrição Elétrica: Obrigatório desconectar cargas que adiantem fator de potência
     (ex.: no-breaks, bancos de capacitores).

─────────────────────────────────────────────────────────────────────────────
8. DO INADIMPLEMENTO
─────────────────────────────────────────────────────────────────────────────

8.1  Multa:     2% sobre o valor em atraso.
8.2  Juros:     1% ao mês.
8.3  Correção:  Atualização monetária aplicável.

─────────────────────────────────────────────────────────────────────────────
9. RESCISÃO DA LOCAÇÃO
─────────────────────────────────────────────────────────────────────────────

9.1  Sem Aviso Prévio:  Pode ocorrer por inadimplência (> 30 dias), uso indevido ou
     mudança de local sem autorização.
9.2  Com Aviso Prévio:  Rescisão solicitada com 7 dias de antecedência (após prazo
     mínimo estipulado no Anexo I).
9.3  Obrigações Finais: Restituição do bem em até 72 horas, sob pena de recolhimento
     forçado às custas da Locatária.
9.4  Encerramento Imediato: Aplicável em cenário de falência ou recuperação judicial.

─────────────────────────────────────────────────────────────────────────────
10. DISPOSIÇÕES GERAIS E FORO
─────────────────────────────────────────────────────────────────────────────

10.1 Formalidades:  Alterações contratuais exigem aditivo formal assinado.
10.2 Direitos:      O não exercício imediato de um direito não acarreta em sua renúncia.
11.1 Competência:   Fica estabelecido o foro de Goiânia/GO para resolução de controvérsias.

─────────────────────────────────────────────────────────────────────────────
ASSINATURAS

Locadora: EGEN GERADORES LTDA || Assinatura: _______________________________________________________________________

Locatária: {{LOCATARIO_NOME}} || Assinatura: _______________________________________________________________________

Testemunha 1: Nome: _________________________ || CPF: _________________________

Testemunha 2: Nome: _________________________ || CPF: _________________________
`;

// ============================================
// HELPERS
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

// ============================================
// BUILD VARS FROM QUOTATION
// ============================================

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
// RENDER — substitui todos os {{PLACEHOLDER}}
// ============================================

/**
 * Renderiza o template substituindo cada {{CHAVE}} pelo valor correspondente.
 * Retorna o texto final pronto para exibição/PDF.
 */
export function renderContractText(vars: ContractTemplateVars): string {
  return (Object.keys(vars) as (keyof ContractTemplateVars)[]).reduce(
    (text, key) => text.replaceAll(`{{${key}}}`, vars[key]),
    CONTRACT_TEMPLATE,
  );
}
