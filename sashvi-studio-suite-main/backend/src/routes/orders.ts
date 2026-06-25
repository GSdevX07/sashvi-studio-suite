import express from 'express';
import { supabase } from '../lib/supabase';
import { calculateOrderTotals } from '../lib/checkout';
import { sendEmail } from '../lib/email';
import { requireAuth, AuthedRequest } from '../middleware/auth';

export const ordersRouter = express.Router();

ordersRouter.post('/', requireAuth as any, async (req: AuthedRequest, res) => {
  const { items, shipping, paymentMode } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'no_items' });

  // items: [{ product_id, qty, price }]
  const productTotal = items.reduce((s: number, it: any) => s + (it.price * it.qty), 0);
  const totals = calculateOrderTotals(productTotal, paymentMode === 'cod' ? 'cod' : 'prepaid');

  const orderPayload: any = {
    user_id: req.user.id,
    items,
    shipping: shipping || {},
    payment_mode: paymentMode,
    product_total: productTotal,
    delivery: totals.delivery,
    cod_charge: totals.codCharge,
    gateway_charge: totals.gatewayCharge,
    total: totals.total,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('orders').insert(orderPayload).select('*').maybeSingle();
  if (error) return res.status(500).json({ error });

  // send confirmation email
  try {
    await sendEmail(req.user.email, `Order ${data.id} received`, `<p>Thanks for your order. Order id: ${data.id}</p><p>Total: ₹${data.total}</p>`);
  } catch (e) {
    // ignore
  }

  return res.json({ ok: true, order: data });
});

ordersRouter.get('/', requireAuth as any, async (req: AuthedRequest, res) => {
  const { data, error } = await supabase.from('orders').select('*').eq('user_id', req.user.id).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error });
  return res.json(data);
});

ordersRouter.get('/:id', requireAuth as any, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
  if (error) return res.status(500).json({ error });
  if (!data) return res.status(404).json({ error: 'not_found' });
  if (data.user_id !== req.user.id && !req.user.is_admin) return res.status(403).json({ error: 'forbidden' });
  return res.json(data);
});

// Admin: list all orders
ordersRouter.get('/admin/all', requireAuth as any, async (req: AuthedRequest, res) => {
  if (!req.user?.is_admin) return res.status(403).json({ error: 'forbidden' });
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error });
  return res.json(data);
});

// Admin: update order status
ordersRouter.put('/admin/:id/status', requireAuth as any, async (req: AuthedRequest, res) => {
  if (!req.user?.is_admin) return res.status(403).json({ error: 'forbidden' });
  const { id } = req.params;
  const { status } = req.body;
  const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select('*').maybeSingle();
  if (error) return res.status(500).json({ error });
  return res.json(data);
});
