import express from 'express';
import { requireAdmin, AuthedRequest } from '../middleware/auth';
import { supabase } from '../lib/supabase';

export const productsRouter = express.Router();

productsRouter.get('/', async (_req, res) => {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error });
  return res.json(data);
});

productsRouter.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
  if (error) return res.status(500).json({ error });
  if (!data) return res.status(404).json({ error: 'not_found' });
  return res.json(data);
});

productsRouter.post('/', requireAdmin as any, async (req: AuthedRequest, res) => {
  const payload = req.body;
  const { data, error } = await supabase.from('products').insert(payload).select('*').maybeSingle();
  if (error) return res.status(500).json({ error });
  return res.json(data);
});

productsRouter.put('/:id', requireAdmin as any, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('products').update(req.body).eq('id', id).select('*').maybeSingle();
  if (error) return res.status(500).json({ error });
  return res.json(data);
});

productsRouter.delete('/:id', requireAdmin as any, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return res.status(500).json({ error });
  return res.json({ ok: true });
});
