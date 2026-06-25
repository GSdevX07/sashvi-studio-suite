import express from 'express';
import { supabase } from '../lib/supabase';
import { calculateOrderTotals } from '../lib/checkout';
import { sendEmail, buildOrderConfirmationEmail } from '../lib/email';
import { requireAuth, AuthedRequest } from '../middleware/auth';

export const ordersRouter = express.Router();

// Generate a readable order ID  e.g. SS-20260625-XXXXX
function generateOrderId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `SS-${date}-${rand}`;
}

// ── Create order ─────────────────────────────────────────────────────────────
ordersRouter.post('/', requireAuth as any, async (req: AuthedRequest, res) => {
  const { items, shipping, paymentMode } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'no_items' });
  }
  if (!shipping?.address || !shipping?.email || !shipping?.phone) {
    return res.status(400).json({ error: 'missing_shipping' });
  }

  const productTotal = items.reduce((s: number, it: any) => s + it.price * it.qty, 0);
  const totals = calculateOrderTotals(productTotal, paymentMode === 'cod' ? 'cod' : 'prepaid');

  const orderId = generateOrderId();

  // Parse address into parts (best effort — full address goes into address field)
  const addressParts = (shipping.address as string).split(',').map((p: string) => p.trim());
  const city = addressParts[addressParts.length - 2] || 'N/A';
  const state = addressParts[addressParts.length - 1] || 'India';
  const pincode = (shipping.address.match(/\d{6}/) || ['000000'])[0];

  const orderPayload = {
    order_id: orderId,
    user_id: req.user.id,
    customer_name: req.user.name || shipping.name || 'Customer',
    mobile: shipping.phone,
    email: shipping.email,
    address: shipping.address,
    city,
    state,
    pincode,
    total_amount: totals.total,
    gst_amount: 0,
    delivery_charge: totals.delivery,
    weekend_discount: 0,
    gateway_charge: totals.gatewayCharge,
    payment_status: paymentMode === 'cod' ? 'advance_pending' : 'pending',
    order_status: 'pending',
    created_at: new Date().toISOString(),
  };

  const { data: order, error } = await supabase
    .from('orders')
    .insert(orderPayload)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('order insert error:', error);
    return res.status(500).json({ error: 'db_error', detail: error.message });
  }

  // Insert order_items
  const orderItems = items.map((item: any) => ({
    order_id: orderId,
    product_id: item.product_id || null,
    quantity: item.qty,
    price: item.price,
  }));

  await supabase.from('order_items').insert(orderItems);

  // Send order confirmation email (non-blocking)
  const emailItems = items.map((item: any) => ({
    name: item.name || item.product_id || 'Product',
    qty: item.qty,
    price: item.price,
  }));

  const html = buildOrderConfirmationEmail({
    customerName: req.user.name || shipping.name || 'Customer',
    orderId,
    items: emailItems,
    subtotal: productTotal,
    deliveryCharge: totals.delivery,
    gatewayCharge: totals.gatewayCharge,
    grandTotal: totals.total,
    address: shipping.address,
    mobile: shipping.phone,
  });

  sendEmail(
    shipping.email,
    `Order Confirmed — ${orderId} | Sashvi Studio`,
    html
  ).catch((e) => console.warn('order email failed:', e));

  return res.json({ ok: true, order: { id: order?.id, order_id: orderId, total: totals.total } });
});

// ── List user orders ──────────────────────────────────────────────────────────
ordersRouter.get('/', requireAuth as any, async (req: AuthedRequest, res) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: 'db_error' });
  return res.json(data);
});

// ── Get single order ──────────────────────────────────────────────────────────
ordersRouter.get('/:id', requireAuth as any, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) return res.status(500).json({ error: 'db_error' });
  if (!data) return res.status(404).json({ error: 'not_found' });
  if (data.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' });
  }
  return res.json(data);
});
