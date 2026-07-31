/**
 * Mensagens de erro padronizadas para operações do sistema.
 * Organizadas por tipo de operação e entidade.
 */

// ── Operações CRUD ──────────────────────────────────────────────────────────

export const CREATE_ERROR = (entity: string) =>
  `Não foi possível criar ${entity}. Tente novamente.`;

export const UPDATE_ERROR = (entity: string) =>
  `Não foi possível atualizar ${entity}. Tente novamente.`;

export const DELETE_ERROR = (entity: string) =>
  `Não foi possível excluir ${entity}. Tente novamente.`;

export const LOAD_ERROR = (entity: string) =>
  `Não foi possível carregar ${entity}. Verifique a conexão.`;

export const SAVE_ERROR = (entity: string) =>
  `Não foi possível salvar ${entity}. Tente novamente.`;

// ── Entidades ────────────────────────────────────────────────────────────────

export const ENTITY = {
  EQUIPMENT: 'o equipamento',
  EQUIPMENTS: 'os equipamentos',
  STOCK: 'o estoque',
  MOVEMENT: 'a movimentação',
  LEAD: 'o lead',
  CLIENT: 'o cliente',
  PROPOSAL: 'a proposta',
  PROPOSALS: 'as propostas',
  QUOTATION: 'a cotação',
  REQUEST: 'a solicitação',
  MAINTENANCE: 'a ordem de manutenção',
  PAYMENT: 'o pedido de pagamento',
  USER: 'o usuário',
  USERS: 'os usuários',
  ROLE: 'o cargo',
  DEPARTMENT: 'o departamento',
  CATEGORY: 'a categoria',
  PERIOD: 'o período',
  MESSAGE: 'a mensagem',
  STATUS: 'o status',
  FILE: 'o arquivo',
  IMAGE: 'a imagem',
  DATA: 'os dados',
  SETTINGS: 'as configurações',
} as const;

// ── Validação ────────────────────────────────────────────────────────────────

export const VALIDATION = {
  REQUIRED_FIELDS: 'Preencha todos os campos obrigatórios.',
  INVALID_EMAIL: 'Email inválido.',
  INVALID_CPF: 'CPF inválido.',
  INVALID_CNPJ: 'CNPJ inválido.',
  INVALID_CPF_CNPJ: 'Digite um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.',
  INVALID_DATE: 'Data inválida.',
  INVALID_BIRTH: 'Data de nascimento inválida.',
  SELECT_DEPARTMENT: 'Selecione o departamento.',
  SELECT_ROLE: 'Selecione o cargo.',
  NO_CHANGES: 'Nenhuma alteração foi feita.',
  NO_ITEMS: 'Adicione pelo menos um item antes de continuar.',
  NO_EQUIPMENT_SELECTED: 'Adicione pelo menos um equipamento à solicitação.',
  EMPTY_NAME: 'Informe o nome.',
  EMPTY_CATEGORY: 'Digite um nome para a nova categoria.',
  DUPLICATE_CATEGORY: 'Esta categoria já existe.',
  DUPLICATE_EQUIPMENT: 'Equipamento já adicionado à solicitação.',
  INVALID_EQUIPMENT_NAME: 'Nome do equipamento inválido.',
  PASSWORD_MISMATCH: 'As senhas não coincidem.',
  PASSWORD_SHORT: 'A senha deve ter pelo menos 6 caracteres.',
  SIGNATURE_REQUIRED: 'A assinatura é obrigatória.',
  RECEIVER_NAME_REQUIRED: 'Informe o nome de quem está recebendo.',
  NO_ITEMS_TO_WITHDRAW: 'Não há itens disponíveis para processar a retirada.',
  COOLDOWN: 'Aguarde alguns segundos antes de tentar novamente.',
} as const;

// ── Arquivo ─────────────────────────────────────────────────────────────────

export const FILE = {
  INVALID_TYPE: (fileName: string) =>
    `"${fileName}": apenas PDF, PNG e JPEG são permitidos.`,
  TOO_LARGE: (fileName: string) =>
    `"${fileName}" excede 10MB. Reduza o tamanho do arquivo.`,
  IMAGE_INVALID_TYPE: 'Use PNG, JPG ou WebP.',
  IMAGE_TOO_LARGE: 'A imagem deve ter no máximo 5MB.',
  IMPORT_MISSING_FIELDS: 'O arquivo contém registros com campos obrigatórios faltando.',
  IMPORT_ERROR: 'Erro ao importar os dados do arquivo.',
  PROCESS_ERROR: 'Erro ao processar o arquivo.',
} as const;

// ── Autenticação ─────────────────────────────────────────────────────────────

export const AUTH = {
  SESSION_EXPIRED: 'Sessão expirada. Faça login novamente.',
  USER_NOT_AUTHENTICATED: 'Você precisa estar logado para realizar esta operação.',
  ACCESS_DENIED: 'Você não tem permissão para acessar este recurso.',
} as const;

// ── Status ──────────────────────────────────────────────────────────────────

export const STATUS = {
  UNSAVED_CHANGES: 'Salve as alterações antes de continuar.',
  ACTION_NOT_PERMITTED: 'Ação não permitida neste momento.',
  PROPOSAL_NOT_SAVED: 'Salve a proposta antes de alterar o status.',
} as const;

// ── Operações completas (título + mensagem) ──────────────────────────────────

export const OPERATION = {
  createEquipment: {
    success: 'Equipamento cadastrado com sucesso!',
    error: 'Não foi possível cadastrar o equipamento.',
  },
  updateEquipment: {
    success: 'Equipamento atualizado com sucesso!',
    error: 'Não foi possível atualizar o equipamento.',
  },
  deleteEquipment: {
    success: 'Equipamento excluído com sucesso!',
    error: 'Não foi possível excluir o equipamento.',
  },
  addStock: {
    success: 'Estoque atualizado com sucesso!',
    error: 'Não foi possível adicionar estoque.',
  },
  createMovement: {
    success: 'Movimentação registrada com sucesso!',
    error: 'Não foi possível registrar a movimentação.',
  },
  writeOff: {
    success: 'Baixa registrada com sucesso!',
    error: 'Não foi possível dar baixa no equipamento.',
  },
  requestReplenishment: {
    success: 'Solicitação de reposição enviada com sucesso!',
    error: 'Não foi possível solicitar a reposição.',
  },
  createLead: {
    success: 'Lead cadastrado com sucesso!',
    error: 'Não foi possível salvar o lead.',
  },
  deleteLead: {
    success: 'Lead excluído com sucesso!',
    error: 'Não foi possível excluir o lead.',
  },
  convertLead: {
    success: 'Lead convertido em cliente com sucesso!',
    error: 'Não foi possível converter o lead.',
  },
  generateProposal: {
    success: 'Proposta gerada com sucesso!',
    error: 'Não foi possível gerar a proposta.',
  },
  updateLeadStatus: {
    success: 'Status do lead atualizado!',
    error: 'Não foi possível atualizar o status do lead.',
  },
  createClient: {
    success: 'Cliente cadastrado com sucesso!',
    error: 'Não foi possível salvar o cliente.',
  },
  deleteClient: {
    success: 'Cliente excluído com sucesso!',
    error: 'Não foi possível excluir o cliente.',
  },
  createMaintenance: {
    success: 'Ordem de manutenção criada com sucesso!',
    error: 'Não foi possível salvar a ordem de manutenção.',
  },
  deleteMaintenance: {
    success: 'Ordem de manutenção excluída!',
    error: 'Não foi possível excluir a ordem de manutenção.',
  },
  updateMaintenanceStatus: {
    success: 'Status da manutenção atualizado!',
    error: 'Não foi possível atualizar o status.',
  },
  createPayment: {
    success: 'Pedido de pagamento criado com sucesso!',
    error: 'Não foi possível criar o pedido de pagamento.',
  },
  approvePayment: {
    success: 'Pedido aprovado com sucesso!',
    error: 'Não foi possível aprovar o pedido.',
  },
  rejectPayment: {
    success: 'Pedido rejeitado.',
    error: 'Não foi possível rejeitar o pedido.',
  },
  markPaid: {
    success: 'Pedido marcado como pago!',
    error: 'Não foi possível atualizar o pedido.',
  },
  deletePayment: {
    success: 'Pedido excluído com sucesso!',
    error: 'Não foi possível excluir o pedido.',
  },
  createRequest: {
    success: 'Solicitação criada com sucesso!',
    error: 'Não foi possível criar a solicitação.',
  },
  approveRequest: {
    success: 'Solicitação aprovada!',
    error: 'Não foi possível aprovar a solicitação.',
  },
  rejectRequest: {
    success: 'Solicitação rejeitada.',
    error: 'Não foi possível rejeitar a solicitação.',
  },
  completeRequest: {
    success: 'Solicitação finalizada com sucesso!',
    error: 'Não foi possível finalizar a solicitação.',
  },
  updateUser: {
    success: 'Usuário atualizado com sucesso!',
    error: 'Não foi possível salvar os dados do usuário.',
  },
  deleteUser: {
    success: 'Usuário excluído com sucesso!',
    error: 'Não foi possível excluir o usuário.',
  },
  createRole: {
    success: 'Cargo criado com sucesso!',
    error: 'Não foi possível salvar o cargo.',
  },
  updateRole: {
    success: 'Cargo atualizado com sucesso!',
    error: 'Não foi possível salvar o cargo.',
  },
  deleteRole: {
    success: 'Cargo excluído!',
    error: 'Não foi possível excluir o cargo.',
  },
  createDepartment: {
    success: 'Departamento criado com sucesso!',
    error: 'Não foi possível salvar o departamento.',
  },
  updateDepartment: {
    success: 'Departamento atualizado com sucesso!',
    error: 'Não foi possível salvar o departamento.',
  },
  toggleDepartment: {
    success: 'Status do departamento alterado.',
    error: 'Não foi possível alterar o status do departamento.',
  },
  saveProposal: {
    success: 'Proposta salva com sucesso!',
    error: 'Não foi possível salvar a proposta.',
  },
  deleteProposal: {
    success: 'Proposta excluída com sucesso!',
    error: 'Não foi possível excluir a proposta.',
  },
  duplicateProposal: {
    success: 'Proposta duplicada com sucesso!',
    error: 'Não foi possível duplicar a proposta.',
  },
  updateBulkStatus: {
    success: 'Status das propostas atualizado!',
    error: 'Não foi possível atualizar o status das propostas.',
  },
  sendMessage: {
    success: 'Mensagem enviada!',
    error: 'Não foi possível enviar a mensagem.',
  },
  loadMessages: {
    error: 'Não foi possível carregar as mensagens.',
  },
  savePeriod: {
    success: 'Período salvo com sucesso!',
    error: 'Não foi possível salvar o período.',
  },
  saveCategory: {
    success: 'Categoria adicionada com sucesso!',
    error: 'Não foi possível adicionar a categoria.',
  },
  importEquipments: {
    success: 'Importação concluída com sucesso!',
    error: 'Não foi possível importar os equipamentos.',
  },
  loadUsers: {
    error: 'Não foi possível carregar a lista de usuários.',
  },
  checkRequest: {
    error: 'Não foi possível verificar a solicitação.',
  },
} as const;
