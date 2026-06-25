import express from 'express';
import Razorpay from 'razorpay';
import { supabase } from '../lib/supabase';
import { calculateOrderTotals } from '../lib/checkout';

export const paymentsRouter = express.Router();

const razor = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID || '', key_secret: process.env.RAZORPAY_KEY_SECRET || '' });

paymentsRouter.post('/razorpay/create', async (req, res) => {
  const { orderId, amountType } = req.body; // amountType: 'full' or 'advance'
  if (!orderId) return res.status(400).json({ error: 'orderId required' });
  const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
  if (!order) return res.status(404).json({ error: 'order not found' });

  const totals = calculateOrderTotals(order.product_total, order.payment_mode === 'cod' ? 'cod' : 'prepaid');
  const amount = amountType === 'advance' && order.payment_mode === 'cod' ? totals.advance : totals.total;
  const amountPaise = amount * 100;

  const opts = { amount: amountPaise, currency: 'INR', receipt: `${orderId}`, payment_capture: 1 };
  try {
    const rOrder = await razor.orders.create(opts as any);
    return res.json({ ok: true, razorOrder: rOrder });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

paymentsRouter.post('/razorpay/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ error: 'missing' });

  // verify signature
  const crypto = await import('crypto');
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
  hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
  const digest = hmac.digest('hex');
  if (digest !== razorpay_signature) return res.status(400).json({ error: 'invalid_signature' });

  // mark order paid
  if (orderId) {
    await supabase.from('orders').update({ status: 'paid', razorpay_payment_id }).eq('id', orderId);
  }

  return res.json({ ok: true });
});
