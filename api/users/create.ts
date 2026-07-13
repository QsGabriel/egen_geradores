/**
 * POST /api/users/create
 *
 * Vercel Serverless Function — Cadastro de novo usuário por admin
 * com permissão canManageUsers. Retorna a senha temporária para
 * entrega manual ao usuário.
 *
 * Authorization: Bearer <access_token> (sessão do admin)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createUserFlow } from '../_lib/createUser.js';

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
    const { status, payload } = await createUserFlow(token, req.body ?? {});
    return res.status(status).json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[users/create] Erro:', message);
    return res.status(500).json({ success: false, error: 'Erro interno.' });
  }
}
