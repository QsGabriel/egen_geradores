/**
 * Traduz mensagens de erro do Supabase, rede e outros para português compreensível.
 * Centraliza todas as traduções de erro do sistema.
 */

export function translateError(error: unknown): string {
  const raw = extractMessage(error);
  const msg = raw.toLowerCase();

  // ── Supabase Auth ──────────────────────────────────────────────────────────

  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
  }
  if (msg.includes('email not confirmed') || msg.includes('email_not_confirmed')) {
    return 'Confirme seu email antes de fazer login. Verifique sua caixa de entrada e spam.';
  }
  if (msg.includes('password should be at least') || msg.includes('password is too short')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (msg.includes('weak password') || msg.includes('password is too weak')) {
    return 'A senha é muito fraca. Use letras maiúsculas, minúsculas, números e símbolos.';
  }
  if (msg.includes('same_password') || msg.includes('different from the old password')) {
    return 'A nova senha não pode ser igual à senha anterior.';
  }
  if (msg.includes('invalid email') || msg.includes('unable to validate email')) {
    return 'Por favor, insira um endereço de email válido.';
  }
  if (msg.includes('user already registered') || msg.includes('email already registered') || msg.includes('already exists')) {
    return 'Este email já está cadastrado. Tente fazer login ou use outro email.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('request rate limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
  }
  if (msg.includes('user is banned') || msg.includes('account disabled') || msg.includes('user disabled')) {
    return 'Esta conta foi desabilitada. Entre em contato com o administrador.';
  }
  if (msg.includes('signups not allowed') || msg.includes('signup is disabled')) {
    return 'Novos cadastros estão temporariamente desabilitados. Tente novamente mais tarde.';
  }
  if (msg.includes('token expired') || msg.includes('invalid token') || msg.includes('otp has expired') || msg.includes('link expired')) {
    return 'O link expirou. Solicite um novo.';
  }
  if (msg.includes('user not found') || msg.includes('no user found')) {
    return 'Nenhuma conta encontrada com este email.';
  }
  if (msg.includes('refresh_token') || msg.includes('session') || msg.includes('jwt expired') || msg.includes('not authenticated')) {
    return 'Sua sessão expirou. Faça login novamente.';
  }
  if (msg.includes('confirmation') || msg.includes('verify your email')) {
    return 'Verifique seu email para confirmar o cadastro.';
  }
  if (msg.includes('provide') && (msg.includes('email') || msg.includes('password'))) {
    return 'Preencha todos os campos obrigatórios.';
  }

  // ── Supabase Row Level Security (RLS) ──────────────────────────────────────

  if (msg.includes('row-level security') || msg.includes('row level security') || msg.includes('violates row-level')) {
    return 'Você não tem permissão para realizar esta operação. Entre em contato com o administrador.';
  }
  if (msg.includes('permission denied') || msg.includes('policy')) {
    return 'Acesso negado. Você não possui as permissões necessárias.';
  }

  // ── Supabase Database ──────────────────────────────────────────────────────

  if (msg.includes('duplicate key') || msg.includes('unique constraint') || msg.includes('violates unique') || msg.includes('already exists')) {
    if (msg.includes('cargo') || msg.includes('role')) return 'Já existe um cargo com este nome.';
    if (msg.includes('departamento') || msg.includes('department')) return 'Já existe um departamento com este nome.';
    if (msg.includes('category') || msg.includes('categoria')) return 'Esta categoria já existe.';
    if (msg.includes('code') || msg.includes('código')) return 'Já existe um registro com este código.';
    if (msg.includes('email')) return 'Este email já está cadastrado.';
    return 'Já existe um registro com estes dados. Verifique se não há duplicidade.';
  }

  if (msg.includes('foreign key') || msg.includes('violates foreign')) {
    return 'Esta operação não pode ser concluída porque o registro está vinculado a outros dados do sistema.';
  }

  if (msg.includes('not-null') || msg.includes('null value') || msg.includes('cannot be null')) {
    const col = extractColumnName(msg);
    return col ? `O campo "${col}" é obrigatório.` : 'Preencha todos os campos obrigatórios.';
  }

  if (msg.includes('value too long') || msg.includes('character varying')) {
    return 'O valor informado é muito longo. Reduza o texto e tente novamente.';
  }

  if (msg.includes('check constraint') || msg.includes('violates check')) {
    return 'O valor informado não atende aos requisitos do campo. Verifique os dados.';
  }

  // ── Supabase Storage ───────────────────────────────────────────────────────

  if (msg.includes('bucket not found') || msg.includes('bucket')) {
    return 'O local de armazenamento de arquivos não está configurado. Contate o administrador.';
  }
  if (msg.includes('storage') && msg.includes('not found')) {
    return 'Arquivo não encontrado no servidor. Pode ter sido removido.';
  }
  if (msg.includes('file size') || msg.includes('too large')) {
    return 'O arquivo é muito grande. Reduza o tamanho e tente novamente.';
  }

  // ── Rede / Conexão ─────────────────────────────────────────────────────────

  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch') || msg.includes('connection') || msg.includes('timeout') || msg.includes('abort')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }

  if (msg.includes('unexpected token') || msg.includes('json') || msg.includes('unexpected end')) {
    return 'Erro ao processar a resposta do servidor. Tente novamente.';
  }

  if (msg.includes('500') || msg.includes('internal server error')) {
    return 'Erro interno do servidor. Tente novamente em alguns instantes.';
  }

  if (msg.includes('400')) {
    return 'Dados enviados inválidos. Verifique as informações e tente novamente.';
  }

  if (msg.includes('401') || msg.includes('403') || msg.includes('unauthorized')) {
    return 'Acesso não autorizado. Faça login novamente.';
  }

  if (msg.includes('404') || msg.includes('not found')) {
    return 'O recurso solicitado não foi encontrado. Pode ter sido removido.';
  }

  if (msg.includes('409') || msg.includes('conflict')) {
    return 'Conflito ao processar a solicitação. Os dados podem ter sido alterados por outro usuário.';
  }

  // ── Mensagens padrão do sistema em inglês ─────────────────────────────────

  if (msg === 'an error occurred') return 'Ocorreu um erro inesperado. Tente novamente.';
  if (msg === 'failed to add equipment') return 'Não foi possível cadastrar o equipamento.';
  if (msg === 'failed to update equipment') return 'Não foi possível atualizar o equipamento.';
  if (msg === 'failed to add movement') return 'Não foi possível registrar a movimentação.';
  if (msg === 'failed to add request') return 'Não foi possível criar a solicitação.';
  if (msg === 'failed to update request status') return 'Não foi possível atualizar o status da solicitação.';
  if (msg === 'failed to create quotation') return 'Não foi possível criar a cotação.';
  if (msg === 'failed to update quotation item') return 'Não foi possível atualizar o item da cotação.';
  if (msg === 'failed to select quotation winner') return 'Não foi possível selecionar o vencedor da cotação.';
  if (msg === 'failed to write off equipment') return 'Não foi possível dar baixa no equipamento.';
  if (msg === 'failed to request replenishment') return 'Não foi possível solicitar a reposição.';
  if (msg === 'failed to add change log') return 'Não foi possível registrar a alteração.';

  // ── Fallback ───────────────────────────────────────────────────────────────
  // Se a mensagem original parecer ser em inglês, retorna um fallback genérico
  if (/^[a-z\s.,!?;:'"()\-]+$/i.test(raw.trim()) && !/[áàãâéêíóôõúüç]/.test(raw)) {
    return 'Ocorreu um erro inesperado ao processar a operação. Tente novamente.';
  }

  // Se a mensagem já estiver em português, retorna ela mesma
  return raw;
}

/**
 * Extrai a mensagem de texto de qualquer tipo de erro
 */
function extractMessage(error: unknown): string {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null) {
    const e = error as Record<string, unknown>;
    if (typeof e.message === 'string') return e.message;
    if (typeof e.error === 'string') return e.error;
    if (typeof e.error_description === 'string') return e.error_description;
    if (typeof e.details === 'string') return e.details;
    if (typeof e.hint === 'string') return e.hint;
  }
  return String(error);
}

/**
 * Tenta extrair o nome de uma coluna de mensagens de erro do PostgreSQL
 */
function extractColumnName(msg: string): string | null {
  const match = msg.match(/column\s+"([^"]+)"/i) || msg.match(/column\s+'([^']+)'/i) || msg.match(/coluna\s+"([^"]+)"/i);
  if (match) {
    const raw = match[1];
    const labels: Record<string, string> = {
      name: 'Nome',
      email: 'Email',
      code: 'Código',
      password: 'Senha',
      cpf: 'CPF',
      phone: 'Telefone',
      category: 'Categoria',
      quantity: 'Quantidade',
      unit: 'Unidade',
      batch: 'Lote',
      location: 'Localização',
      entry_date: 'Data de Entrada',
      expiration_date: 'Data de Validade',
      unit_price: 'Preço Unitário',
      min_stock: 'Estoque Mínimo',
    };
    return labels[raw] || raw;
  }
  return null;
}

/**
 * Retorna uma mensagem de erro amigável para uma operação específica
 */
export function getOperationFriendlyMessage(
  error: unknown,
  operation: string,
  entity?: string
): string {
  const translated = translateError(error);
  const entityLabel = entity ? ` ${entity}` : '';

  // Se a tradução já for uma frase completa e clara, usar apenas ela
  if (
    translated !== extractMessage(error) ||
    translated.includes('senha') ||
    translated.includes('email') ||
    translated.includes('permissão') ||
    translated.includes('conexão') ||
    translated.includes('sessão')
  ) {
    return translated;
  }

  // Fallback contextual
  return `Não foi possível ${operation}${entityLabel}. ${translated}`;
}
