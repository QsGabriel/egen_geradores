/**
 * POST /api/users/delete
 *
 * Vercel Serverless Function — Exclusão de usuário por admin
 * com permissão canDeleteUsers.
 *
 * Authorization: Bearer <access_token> (sessão do admin)
 * Body: { userId: string }
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdminClient } from '../_lib/supabase.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Método não permitido' });
  }

  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  try {
    if (!token) {
      return res.status(401).json({ success: false, error: 'Token de autenticação ausente.' });
    }

    const supabase = getSupabaseAdminClient();

    const { data: caller, error: callerErr } = await supabase.auth.getUser(token);
    if (callerErr || !caller?.user) {
      return res.status(401).json({ success: false, error: 'Sessão inválida ou expirada.' });
    }

    const { data: callerProfile } = await supabase
      .from('user_profiles')
      .select('role, custom_roles(permissions)')
      .eq('id', caller.user.id)
      .single();

    const callerPermissions: string[] =
      ((callerProfile as any)?.custom_roles as any)?.permissions ?? [];
    const authorized =
      callerProfile?.role === 'admin' || callerPermissions.includes('canDeleteUsers');

    if (!authorized) {
      return res.status(403).json({ success: false, error: 'Sem permissão para excluir usuários.' });
    }

    const { userId } = req.body ?? {};
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId é obrigatório.' });
    }

    if (userId === caller.user.id) {
      return res.status(400).json({ success: false, error: 'Não é permitido excluir o próprio usuário.' });
    }

    const { data: targetProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!targetProfile) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
    }

    const { error: profileErr } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', userId);

    if (profileErr) {
      console.error('[users/delete] Erro ao excluir perfil:', profileErr.message);
      return res.status(500).json({ success: false, error: 'Erro ao excluir perfil do usuário.' });
    }

    const { error: authErr } = await supabase.auth.admin.deleteUser(userId);

    if (authErr) {
      console.error('[users/delete] Erro ao excluir auth:', authErr.message);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[users/delete] Erro:', message);
    return res.status(500).json({ success: false, error: 'Erro interno.' });
  }
}
