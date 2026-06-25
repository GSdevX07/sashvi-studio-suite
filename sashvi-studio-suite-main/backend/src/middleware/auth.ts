import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { supabase } from '../lib/supabase';

export interface AuthedRequest extends Request {
  user?: any;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization?.split(' ');
  if (!auth || auth[0] !== 'Bearer' || !auth[1]) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const payload = verifyToken(auth[1]);
  if (!payload || typeof payload !== 'object' || !('sub' in payload)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const userId = (payload as any).sub;
  const { data } = await supabase
    .from('users')
    .select('id, name, email, role')
    .eq('id', userId)
    .maybeSingle();
  if (!data) return res.status(401).json({ error: 'unauthorized' });
  req.user = data;
  return next();
}

export async function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  await requireAuth(req, res, async () => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    return next();
  });
}
