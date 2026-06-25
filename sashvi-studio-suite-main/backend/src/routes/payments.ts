import express from 'express';
import Razorpay from 'razorpay';
import { supabase } from '../lib/supabase';
import { calculateOrderTotals } from '../lib/checkout';
import { sendEmail, buildOrderConfirmationEmail } from '../lib/email';
import { requireAuth, AuthedRequest } from '../middleware/auth';

export const paymentsRouter = express.Router();

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID || '';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || '';
  if (!key_id || !key_secret) throw new Error('Razorpay keys not configured');
  return new Razorpay({ key_id, key_secret });
}

// ── Create Razorpay order ─────────────────────────────────────────────────────
paymentsRouter.post('/razorpay/create', requireAuth as any, async (req: AuthedRequest, res) => {
  const { orderId, amountType } = req.body;
  if (!orderId) return res.status(400).json({ error: 'orderId required' });

  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (error || !order) return res.status(404).json({ error: 'order not found' });

  const productTotal = Number(order.total_amount) - Number(order.delivery_charge) - Number(order.gateway_charge);
  const totals = calculateOrderTotals(
    productTotal,
    order.payment_status === 'advance_pending' ? 'cod' : 'prepaid'
  );
  const amount = amountType === 'advance' ? totals.advance : totals.total;
  const amountPaise = Math.round(amount * 100);

  try {
    const razor = getRazorpay();
    const rOrder = await razor.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: order.order_id || orderId,
      payment_capture: 1,
    } as any);

    // Save razorpay_order_id
    await supabase.from('orders').update({ razorpay_order_id: rOrder.id }).eq('id', orderId);

    return res.json({ ok: true, razorOrder: rOrder });
  } catch (e: any) {
    console.error('razorpay create error:', e);
    return res.status(500).json({ error: e.message });
  }
});

// ── Verify Razorpay payment ───────────────────────────────────────────────────
paymentsRouter.post('/razorpay/verify', requireAuth as any, async (req: AuthedRequest, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'missing_params' });
  }

  const crypto = await import('crypto');
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
  hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
  const digest = hmac.digest('hex');

  if (digest !== razorpay_signature) {
    return res.status(400).json({ error: 'invalid_signature' });
  }

  if (orderId) {
    const { data: order } = await supabase
      .from('orders')
      .update({ payment_status: 'paid', payment_id: razorpay_payment_id, order_status: 'confirmed' })
      .eq('id', orderId)
      .select('*')
      .maybeSingle();

    // Send confirmation email after payment verified
    if (order) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('quantity, price')
        .eq('order_id', order.order_id);

      const items = (orderItems || []).map((i: any, idx: number) => ({
        name: `Item ${idx + 1}`,
        qty: i.quantity,
        price: i.price,
      }));

      const productTotal = items.reduce((s: number, i: any) => s + i.price * i.qty, 0);

      const html = buildOrderConfirmationEmail({
        customerName: order.customer_name,
        orderId: order.order_id,
        items,
        subtotal: productTotal,
        deliveryCharge: Number(order.delivery_charge),
        gatewayCharge: Number(order.gateway_charge),
        grandTotal: Number(order.total_amount),
        address: order.address,
        mobile: order.mobile,
      });

      sendEmail(
        order.email,
        `Payment Confirmed — ${order.order_id} | Sashvi Studio`,
        html
      ).catch(() => {});
    }
  }

  return res.json({ ok: true });
});
