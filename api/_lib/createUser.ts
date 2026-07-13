// api/_lib/createUser.ts
// Orquestração do cadastro de novo usuário por admin (sem e-mail, sem Workspace).
//
// Fluxo:
//   1. Autoriza chamador (token JWT) → exige canManageUsers ou role=admin.
//   2. Valida entradas e CPF.
//   3. Upsert em user_whitelist.
//   4. auth.admin.createUser (senha temporária) — trigger cria o perfil base.
//   5. UPDATE do perfil com cpf/data_nascimento/cargo/departamento.
//   6. Retorna userId + tempPassword (admin copia e entrega manualmente).

import { randomBytes } from 'node:crypto';
import { getSupabaseAdminClient } from './supabase.js';

export interface CreateUserInput {
  name: string;
  email: string;
  cpf: string;
  dataNascimento?: string; // YYYY-MM-DD
  departmentId: string;
  customRoleId?: string | null;
}

export interface CreateUserFlowResult {
  status: number;
  payload: Record<string, unknown>;
}

function normalizeCPF(v: string): string {
  return v.replace(/\D/g, '').trim();
}

function validateCPF(cpf: string): boolean {
  const d = normalizeCPF(cpf);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const calc = (n: number) => {
    const sum = d.slice(0, n).split('').reduce((acc, x, i) => acc + +x * (n + 1 - i), 0);
    const rem = (sum * 10) % 11;
    return rem === 10 || rem === 11 ? 0 : rem;
  };
  return calc(9) === +d[9] && calc(10) === +d[10];
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';
  const all = upper + lower + digits + symbols;
  const pick = (set: string) => set[randomBytes(1)[0] % set.length];
  const base = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  for (let i = 0; i < 8; i++) base.push(pick(all));
  for (let i = base.length - 1; i > 0; i--) {
    const j = randomBytes(1)[0] % (i + 1);
    [base[i], base[j]] = [base[j], base[i]];
  }
  return base.join('');
}

export async function createUserFlow(
  token: string | null,
  input: Partial<CreateUserInput>,
): Promise<CreateUserFlowResult> {
  const supabase = getSupabaseAdminClient();

  // ── 1. Autorização ──────────────────────────────────────────────────────────
  if (!token) {
    return { status: 401, payload: { success: false, error: 'Token de autenticação ausente.' } };
  }

  const { data: caller, error: callerErr } = await supabase.auth.getUser(token);
  if (callerErr || !caller?.user) {
    return { status: 401, payload: { success: false, error: 'Sessão inválida ou expirada.' } };
  }

  const { data: callerProfile } = await supabase
    .from('user_profiles')
    .select('role, custom_roles(permissions)')
    .eq('id', caller.user.id)
    .single();

  const callerPermissions: string[] =
    ((callerProfile as any)?.custom_roles as any)?.permissions ?? [];
  const authorized =
    callerProfile?.role === 'admin' || callerPermissions.includes('canManageUsers');

  if (!authorized) {
    return {
      status: 403,
      payload: { success: false, error: 'Sem permissão para cadastrar usuários.' },
    };
  }

  // ── 2. Validação de entradas ─────────────────────────────────────────────────
  const name = (input.name ?? '').trim();
  const email = (input.email ?? '').trim().toLowerCase();
  const dataNascimento = (input.dataNascimento ?? '').trim();
  const departmentId = (input.departmentId ?? '').trim();
  const customRoleId = input.customRoleId || null;
  const normalizedCpf = normalizeCPF(input.cpf ?? '');

  if (!name || !email || !departmentId) {
    return {
      status: 400,
      payload: { success: false, error: 'Campos obrigatórios: nome, email, departamento.' },
    };
  }
  if (!isValidEmail(email)) {
    return { status: 400, payload: { success: false, error: 'Endereço de email inválido.' } };
  }
  if (!validateCPF(normalizedCpf)) {
    return { status: 400, payload: { success: false, error: 'CPF inválido.' } };
  }

  // 2a. Validar que o departamento existe
  const { data: department } = await supabase
    .from('departments')
    .select('id, name')
    .eq('id', departmentId)
    .single();

  if (!department) {
    return { status: 400, payload: { success: false, error: 'Departamento não encontrado.' } };
  }

  // 2b. Validar que o cargo existe (se informado)
  if (customRoleId) {
    const { data: role } = await supabase
      .from('custom_roles')
      .select('id')
      .eq('id', customRoleId)
      .single();
    if (!role) {
      return { status: 400, payload: { success: false, error: 'Cargo não encontrado.' } };
    }
  }

  // ── 3. Whitelist (upsert, necessário pela FK cpf → whitelist) ───────────────
  const { error: whitelistErr } = await supabase
    .from('user_whitelist')
    .upsert({ cpf: normalizedCpf, name, activity: true }, { onConflict: 'cpf' });

  if (whitelistErr) {
    console.error('[createUser] Erro whitelist:', whitelistErr.message);
    return {
      status: 500,
      payload: { success: false, error: 'Erro ao registrar CPF na whitelist.' },
    };
  }

  // ── 4. Criar usuário no Auth (não afeta sessão do admin) ─────────────────────
  const tempPassword = generateTempPassword();
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name, department: department.name },
  });

  if (createErr || !created?.user) {
    const msg = createErr?.message ?? 'Erro desconhecido';
    const alreadyExists = /already|exists|registered/i.test(msg);
    console.error('[createUser] Erro auth:', msg);
    return {
      status: alreadyExists ? 409 : 500,
      payload: {
        success: false,
        error: alreadyExists
          ? 'Já existe um usuário com este email.'
          : 'Erro ao criar a conta de acesso.',
      },
    };
  }

  const userId = created.user.id;

  // ── 5. Completar perfil (trigger já criou linha base) ───────────────────────
  const profilePatch: Record<string, unknown> = {
    name,
    department: department.name,
    cpf: normalizedCpf,
    data_nascimento: dataNascimento || null,
    updated_at: new Date().toISOString(),
  };
  if (customRoleId) profilePatch.custom_role_id = customRoleId;

  const { data: updated, error: profileErr } = await supabase
    .from('user_profiles')
    .update(profilePatch)
    .eq('id', userId)
    .select('id');

  // Fallback: se trigger não criou, insere manual
  if (!profileErr && (!updated || updated.length === 0)) {
    const { error: insertErr } = await supabase.from('user_profiles').insert({
      id: userId,
      email,
      name,
      role: 'requester',
      department: department.name,
      cpf: normalizedCpf,
      data_nascimento: dataNascimento || null,
      ...(customRoleId ? { custom_role_id: customRoleId } : {}),
    });
    if (insertErr) {
      console.error('[createUser] Erro insert fallback:', insertErr.message);
    }
  } else if (profileErr) {
    console.error('[createUser] Erro update perfil:', profileErr.message);
  }

  return {
    status: 201,
    payload: {
      success: true,
      userId,
      tempPassword,
    },
  };
}
