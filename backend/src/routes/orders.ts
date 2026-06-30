import express from "express";
import { supabase } from "../lib/supabase";
import { calculateOrderTotals } from "../lib/checkout";
import { sendEmail, buildOrderConfirmationEmail } from "../lib/email";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { reduceStockForOrderItems, restoreStockForOrder, validateAndReserveStock } from "../lib/inventory";
import { calcDiscount } from "./coupons";

export const ordersRouter = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function findOrderByIdOrDisplayId(id: string) {
  const { data: byId } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (byId) return byId;
  const { data: byDisplay } = await supabase.from("orders").select("*").eq("order_id", id).maybeSingle();
  return byDisplay;
}

async function attachStatusHistory(order: Record<string, unknown>) {
  const orderId = String(order.order_id ?? "");
  if (!orderId) return { ...order, status_history: [] };
  const { data: updates } = await supabase
    .from("order_status_updates")
    .select("*")
    .eq("order_id", orderId)
    .order("updated_at", { ascending: true });
  return { ...order, status_history: updates ?? [] };
}

function mapAdminOrder(o: Record<string, unknown>) {
  const items = (o.order_items as Array<Record<string, unknown>>) ?? [];
  const itemSummary =
    items.length > 0
      ? items
          .map((i) => `${String(i.product_name ?? "Item")} x${Number(i.quantity ?? 0)}`)
          .join(", ")
      : "—";
  return {
    id: String(o.order_id ?? ""), // Use display order_id instead of UUID
    uuid: String(o.id ?? ""), // Keep UUID as separate field for internal use
    order_id: String(o.order_id ?? ""),
    customer: String(o.customer_name ?? ""),
    mobile: String(o.mobile ?? ""),
    email: String(o.email ?? ""),
    item: itemSummary,
    total: Number(o.total_amount ?? 0),
    status: String(o.order_status ?? "pending"),
    paymentStatus: String(o.payment_status ?? ""),
    paymentType: String(o.payment_type ?? "Online"),
    deliveryCharges: Number(o.delivery_charge ?? 0),
    gatewayFee: Number(o.gateway_charge ?? 0),
    address: String(o.address ?? ""),
    city: String(o.city ?? ""),
    state: String(o.state ?? ""),
    pincode: String(o.pincode ?? ""),
    orderDate: o.created_at ? String(o.created_at).slice(0, 10) : "",
    order_items: items,
    coupon_code: o.coupon_code ?? null,
    coupon_discount: Number(o.coupon_discount ?? 0),
    advancePaid: Number(o.advance_paid ?? 0),
    totalPaidOnline: Number(o.total_paid_online ?? 0),
    remainingAmount: Number(o.remaining_amount ?? 0),
    notificationSent: Boolean(o.notification_sent ?? false),
  };
}

// Generate a readable order ID  e.g. SS-20260625-XXXXX
function generateOrderId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `SS-${date}-${rand}`;
}

// ── Create order ─────────────────────────────────────────────────────────────
ordersRouter.post("/", requireAuth as any, async (req: AuthedRequest, res) => {
  const { items, shipping, paymentMode, couponCode } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "no_items" });
  }
  if (!shipping?.address || !shipping?.email || !shipping?.phone) {
    return res.status(400).json({ error: "missing_shipping" });
  }

  // Validate and reserve stock availability before proceeding
  const stockValidation = await validateAndReserveStock(items);
  if (!stockValidation.valid) {
    return res.status(400).json({ 
      error: "insufficient_stock",
      detail: stockValidation.error,
      insufficientItems: stockValidation.insufficientItems 
    });
  }

  // Calculate product total from effective prices (after product discount)
  const productTotal = items.reduce((s: number, it: any) => s + it.price * it.qty, 0);

  // Apply coupon discount on effective price (after product discount)
  let couponDiscount = 0;
  let appliedCouponCode: string | null = null;

  if (couponCode) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", String(couponCode).trim().toUpperCase())
      .maybeSingle();

    if (!coupon || !coupon.active) {
      return res.status(400).json({ error: "invalid_coupon" });
    }
    if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
      return res.status(400).json({ error: "coupon_expired" });
    }
    if (coupon.usage_limit > 0 && coupon.usage_count >= coupon.usage_limit) {
      return res.status(400).json({ error: "coupon_limit_reached" });
    }
    couponDiscount = calcDiscount(coupon, productTotal);
    if (couponDiscount <= 0) {
      return res.status(400).json({ error: "minimum_not_met" });
    }
    appliedCouponCode = coupon.code;
    await supabase
      .from("coupons")
      .update({ usage_count: Number(coupon.usage_count ?? 0) + 1 })
      .eq("id", coupon.id);
  }

  const mode = paymentMode === "cod" ? "cod" : "prepaid";
  const totals = calculateOrderTotals(productTotal, mode, couponDiscount);

  console.log('Order calculation debug:', {
    productTotal,
    paymentMode,
    couponDiscount,
    totals,
    deliveryThreshold: 1000
  });

  const orderId = generateOrderId();

  // Parse address into parts (best effort — full address goes into address field)
  const addressParts = (shipping.address as string).split(",").map((p: string) => p.trim());
  const city = addressParts[addressParts.length - 2] || "N/A";
  const state = addressParts[addressParts.length - 1] || "India";
  const pincode = (shipping.address.match(/\d{6}/) || ["000000"])[0];

  // Calculate payment details for COD
  let advancePaid = 0;
  let deliveryForAdvance = 0;
  let codForAdvance = 0;
  let gatewayForAdvance = 0;
  let totalPaidOnline = 0;
  let remainingAmount = 0;

  if (paymentMode === "cod") {
    const discountedProduct = Math.max(0, productTotal - couponDiscount);
    advancePaid = Math.ceil(discountedProduct * 0.10);
    deliveryForAdvance = 0; // Don't include delivery in advance
    codForAdvance = totals.codCharge;
    gatewayForAdvance = 0; // No gateway charge
    totalPaidOnline = advancePaid + codForAdvance + gatewayForAdvance;
    // Remaining amount = product subtotal - advance (only product price, not including service charges)
    remainingAmount = discountedProduct - advancePaid;
  } else {
    advancePaid = totals.total;
    totalPaidOnline = totals.total;
    remainingAmount = 0;
  }

  const orderPayload = {
    order_id: orderId,
    user_id: req.user.id,
    customer_name: req.user.name || shipping.name || "Customer",
    mobile: shipping.phone,
    email: shipping.email,
    address: shipping.address,
    city,
    state,
    pincode,
    total_amount: totals.total,
    gst_amount: 0,
    delivery_charge: totals.delivery,
    cod_charge: totals.codCharge,
    weekend_discount: 0,
    gateway_charge: totals.gatewayCharge,
    coupon_code: appliedCouponCode,
    coupon_discount: couponDiscount,
    advance_paid: advancePaid,
    delivery_for_advance: deliveryForAdvance,
    cod_for_advance: codForAdvance,
    gateway_for_advance: gatewayForAdvance,
    total_paid_online: totalPaidOnline,
    remaining_amount: remainingAmount,
    payment_status: paymentMode === "cod" ? "partially_paid" : "pending",
    payment_type: paymentMode === "cod" ? "COD" : "Online",
    order_status: "pending",
    notification_sent: false,
    created_at: new Date().toISOString(),
  };

  const { data: order, error } = await supabase
    .from("orders")
    .insert(orderPayload)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("order insert error:", error);
    return res.status(500).json({ error: "db_error", detail: error.message, hint: error.hint });
  }

  if (!order) {
    console.error("order insert failed - no order returned");
    return res.status(500).json({ error: "db_error", detail: "Failed to create order" });
  }

  console.log('Order created successfully with id:', order.id);

  // Insert order_items - use a delay to ensure order is committed
  await new Promise(resolve => setTimeout(resolve, 100));

  // Fetch product details for snapshot at time of purchase
  const productIds = items.map((item: any) => item.product_id).filter(Boolean);
  const { data: products } = await supabase
    .from("products")
    .select("id, title, images, tags, slug")
    .in("id", productIds);

  const productMap = new Map((products || []).map((p: any) => [p.id, p]));

  const orderItems = items.map((item: any) => {
    const product = productMap.get(item.product_id);
    const firstImage = product?.images?.[0] || "";
    const firstCategory = product?.tags?.[0] || "";
    const discountAmount = item.discount || 0;
    const finalPrice = item.price - discountAmount;

    return {
      order_id: orderId, // Use the display order_id (SS-20260626-XXXXX) not the internal UUID
      product_id: item.product_id && UUID_RE.test(item.product_id) ? item.product_id : null,
      variant_id: item.variant_id && UUID_RE.test(item.variant_id) ? item.variant_id : null,
      quantity: item.qty,
      price: item.price,
      // Snapshot fields - prioritize database, fallback to frontend data
      product_name: product?.title || item.name || "Product",
      product_image: firstImage || item.image || "",
      sku: item.sku || "",
      variant: item.variant || "",
      category: firstCategory || item.category || "",
      selected_color: item.color || "",
      selected_size: item.size || "",
      discount: discountAmount,
      final_price: finalPrice,
      discount_type: item.discountType || null,
      discount_value: item.discountValue || 0,
    };
  });

  console.log('Inserting order items:', JSON.stringify(orderItems, null, 2));

  const { data: insertedItems, error: itemsError } = await supabase.from("order_items").insert(orderItems).select();
  if (itemsError) {
    console.error("order_items insert error:", itemsError);
    console.error("Error details:", JSON.stringify(itemsError, null, 2));
    // Don't fail the order creation if items fail, but log it
  } else {
    console.log("Order items inserted successfully:", insertedItems);
    // Stock will be reduced after successful payment, not here
  }

  console.log("Order created:", orderId, "coupon:", appliedCouponCode, "discount:", couponDiscount);

  // Email will be sent after successful payment, not here
  // This prevents sending emails for orders that will fail payment

  return res.json({ ok: true, order: { id: order?.id, order_id: orderId, total: totals.total } });
});

// ── List user orders ──────────────────────────────────────────────────────────
ordersRouter.get("/", requireAuth as any, async (req: AuthedRequest, res) => {
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", req.user.id)
    .not("payment_status", "in", "(failed,pending,cancelled)")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("List user orders database error:", error);
    return res.status(500).json({ error: "db_error", details: error });
  }
  
  // Use snapshot data from order_items instead of fetching current product data
  const enrichedOrders = await Promise.all((orders ?? []).map(async (o: any) => {
    const itemsWithSnapshot = (o.order_items || []).map((item: any) => ({
      ...item,
      // Ensure snapshot fields have fallback values
      product_name: item.product_name || "Product",
      product_image: item.product_image || "",
      sku: item.sku || "",
      variant: item.variant || "",
      category: item.category || "",
      selected_color: item.selected_color || "",
      selected_size: item.selected_size || "",
      discount: item.discount || 0,
      final_price: item.final_price || item.price,
      discount_type: item.discount_type || null,
      discount_value: item.discount_value || 0,
    }));
    const withStatusHistory = await attachStatusHistory({ ...o, order_items: itemsWithSnapshot });
    return withStatusHistory;
  }));
  
  return res.json(enrichedOrders);
});

// ── Admin: list all orders ──────────────────────────────────────────────────────────
ordersRouter.get("/admin/all", requireAuth as any, async (req: AuthedRequest, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' });
  }
  
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .not("payment_status", "in", "(failed,pending,cancelled)")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("List all orders database error:", error);
    return res.status(500).json({ error: "db_error", details: error });
  }
  
  // Use snapshot data from order_items instead of fetching current product data
  const enrichedOrders = await Promise.all((orders ?? []).map(async (o: any) => {
    const itemsWithSnapshot = (o.order_items || []).map((item: any) => ({
      ...item,
      // Ensure snapshot fields have fallback values
      product_name: item.product_name || "Product",
      product_image: item.product_image || "",
      sku: item.sku || "",
      variant: item.variant || "",
      category: item.category || "",
      selected_color: item.selected_color || "",
      selected_size: item.selected_size || "",
      discount: item.discount || 0,
      final_price: item.final_price || item.price,
      discount_type: item.discount_type || null,
      discount_value: item.discount_value || 0,
    }));
    return { ...o, order_items: itemsWithSnapshot };
  }));
  
  const mapped = enrichedOrders.map((o) => mapAdminOrder(o as Record<string, unknown>));
  return res.json({ orders: mapped });
});

// ── Get single order ──────────────────────────────────────────────────────────
ordersRouter.get("/:id", requireAuth as any, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const order = await findOrderByIdOrDisplayId(id);

  if (!order) {
    return res.status(404).json({ error: "not_found" });
  }

  // Hide failed, pending, and cancelled payment orders
  if (order.payment_status === "failed" || order.payment_status === "pending" || order.payment_status === "cancelled") {
    return res.status(404).json({ error: "not_found" });
  }

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.order_id);

  if (order.user_id !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "forbidden" });
  }

  // Use snapshot data from order_items instead of fetching current product data
  const itemsWithSnapshot = (orderItems || []).map((item: any) => ({
    ...item,
    // Ensure snapshot fields have fallback values
    product_name: item.product_name || "Product",
    product_image: item.product_image || "",
    sku: item.sku || "",
    variant: item.variant || "",
    category: item.category || "",
    selected_color: item.selected_color || "",
    selected_size: item.selected_size || "",
    discount: item.discount || 0,
    final_price: item.final_price || item.price,
    discount_type: item.discount_type || null,
    discount_value: item.discount_value || 0,
  }));

  const fullOrder = await attachStatusHistory({ ...order, order_items: itemsWithSnapshot });
  return res.json(fullOrder);
});

// ── Admin: update order status ────────────────────────────────────────────────────────
ordersRouter.patch('/:id/status', requireAuth as any, async (req: AuthedRequest, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' });
  }
  const { id } = req.params;
  const { new_status } = req.body;
  if (!new_status) {
    return res.status(400).json({ error: 'missing_status' });
  }
  try {
    const order = await findOrderByIdOrDisplayId(id);
    if (!order) return res.status(404).json({ error: 'order_not_found' });

    const displayOrderId = order.order_id;
    const { error: rpcError } = await supabase.rpc('update_order_status', {
      p_order_id: displayOrderId,
      p_new_status: new_status,
    });
    if (rpcError) {
      console.error('RPC error updating order status:', rpcError);
      return res.status(500).json({ error: 'rpc_error', detail: rpcError.message });
    }

    console.log('Order status updated:', displayOrderId, '->', new_status, 'by', req.user.email);
    return res.json({ ok: true, order_id: displayOrderId, new_status });
  } catch (e) {
    console.error('Unexpected error updating order status:', e);
    return res.status(500).json({ error: 'server_error', detail: (e as Error).message });
  }
});

// ── Admin: delete order ────────────────────────────────────────────────────────────────
ordersRouter.delete('/:id', requireAuth as any, async (req: AuthedRequest, res) => {
  // Only admin can delete orders
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' });
  }
  const { id } = req.params;
  console.log('Delete order request with id:', id);
  try {
    // First try to delete by internal id
    const { error: deleteItemsError } = await supabase.from('order_items').delete().eq('order_id', id);
    const { error } = await supabase.from('orders').delete().eq('id', id);
    
    // If that fails, try by order_id (display id)
    if (error) {
      console.log('Delete by internal id failed, trying by order_id');
      const { data: order } = await supabase.from('orders').select('id').eq('order_id', id).maybeSingle();
      if (order) {
        await supabase.from('order_items').delete().eq('order_id', order.id);
        const { error: deleteError } = await supabase.from('orders').delete().eq('id', order.id);
        if (deleteError) throw deleteError;
        return res.json({ ok: true, order_id: id });
      }
      throw error;
    }
    
    if (deleteItemsError) {
      console.error('Delete order items error:', deleteItemsError);
    }
    return res.json({ ok: true, order_id: id });
  } catch (e) {
    console.error('Unexpected error deleting order:', e);
    return res.status(500).json({ error: 'server_error', detail: (e as any).message });
  }
});

// ── User: cancel order ────────────────────────────────────────────────────────────────
ordersRouter.post('/:id/cancel', requireAuth as any, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const order = await findOrderByIdOrDisplayId(id);
    if (!order) return res.status(404).json({ error: 'order_not_found' });
    if (order.user_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });

    const cancellableStatuses = ['pending', 'confirmed', 'processing'];
    if (!cancellableStatuses.includes(order.order_status)) {
      return res.status(400).json({
        error: 'order_cannot_be_cancelled',
        message: 'Order can only be cancelled when status is pending, confirmed, or processing',
      });
    }

    const { error: rpcError } = await supabase.rpc('update_order_status', {
      p_order_id: order.order_id,
      p_new_status: 'cancelled',
    });
    if (rpcError) {
      console.error('Cancel order RPC error:', rpcError);
      return res.status(500).json({ error: 'rpc_error', detail: rpcError.message });
    }

    const isPrepaid =
      order.payment_status === 'paid' ||
      order.payment_status === 'advance_paid' ||
      order.payment_status === 'paid_online';
    const refundStatus = isPrepaid ? 'refund_pending' : null;

    await supabase
      .from('orders')
      .update({
        cancellation_reason: reason || 'Customer requested cancellation',
        refund_status: refundStatus,
      })
      .eq('id', order.id);

    await restoreStockForOrder(order.id);
    console.log('Order cancelled:', order.order_id, 'refund:', refundStatus);

    return res.json({ ok: true, order_id: order.order_id, status: 'cancelled', refund_status: refundStatus });
  } catch (e) {
    console.error('Unexpected error cancelling order:', e);
    return res.status(500).json({ error: 'server_error', detail: (e as Error).message });
  }
});

// ── User: request return ────────────────────────────────────────────────────────────────
ordersRouter.post('/:id/return', requireAuth as any, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { reason, description } = req.body;
  
  try {
    // Fetch order to verify ownership and check status
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (fetchError || !order) {
      return res.status(404).json({ error: 'order_not_found' });
    }
    
    if (order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'forbidden' });
    }
    
    // Check if order is delivered
    if (order.order_status !== 'delivered') {
      return res.status(400).json({ error: 'order_not_delivered', message: 'Return can only be requested for delivered orders' });
    }
    
    // Check if within 7 days of delivery
    const deliveryDate = new Date(order.updated_at);
    const now = new Date();
    const daysSinceDelivery = (now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 7) {
      return res.status(400).json({ error: 'return_window_expired', message: 'Return window has expired (7 days from delivery)' });
    }
    
    // Update order status to return requested
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        order_status: 'return_requested',
        updated_at: new Date().toISOString(),
        return_reason: reason || 'Customer requested return',
        return_description: description || ''
      })
      .eq('id', id);
    
    if (updateError) {
      console.error('Request return error:', updateError);
      return res.status(500).json({ error: 'db_error', detail: updateError.message });
    }
    
    return res.json({ ok: true, order_id: id, status: 'return_requested' });
  } catch (e) {
    console.error('Unexpected error requesting return:', e);
    return res.status(500).json({ error: 'server_error', detail: (e as any).message });
  }
});

// ── User: request replacement ────────────────────────────────────────────────────────────────
ordersRouter.post('/:id/replacement', requireAuth as any, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const { reason, description } = req.body;

  try {
    const order = await findOrderByIdOrDisplayId(id);
    if (!order) return res.status(404).json({ error: 'order_not_found' });
    if (order.user_id !== req.user.id) return res.status(403).json({ error: 'forbidden' });

    if (order.order_status !== 'delivered') {
      return res.status(400).json({
        error: 'order_not_delivered',
        message: 'Replacement can only be requested for delivered orders',
      });
    }

    const deliveryDate = new Date(order.updated_at);
    const daysSinceDelivery = (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > 7) {
      return res.status(400).json({
        error: 'replacement_window_expired',
        message: 'Replacement window has expired (7 days from delivery)',
      });
    }

    const { error: rpcError } = await supabase.rpc('update_order_status', {
      p_order_id: order.order_id,
      p_new_status: 'replacement_requested',
    });
    if (rpcError) {
      return res.status(500).json({ error: 'rpc_error', detail: rpcError.message });
    }

    await supabase
      .from('orders')
      .update({
        replacement_reason: reason || 'Customer requested replacement',
        replacement_description: description || '',
        notification_sent: false, // Reset notification for replacement requests
      })
      .eq('id', order.id);

    console.log('Replacement requested:', order.order_id);
    return res.json({ ok: true, order_id: order.order_id, status: 'replacement_requested' });
  } catch (e) {
    console.error('Unexpected error requesting replacement:', e);
    return res.status(500).json({ error: 'server_error', detail: (e as Error).message });
  }
});

// Admin: Mark notification as sent
ordersRouter.post('/notifications/mark-sent', requireAuth as any, async (req: AuthedRequest, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });

  const { orderIds } = req.body;
  if (!orderIds || !Array.isArray(orderIds)) {
    return res.status(400).json({ error: 'orderIds required' });
  }

  try {
    await supabase
      .from('orders')
      .update({ notification_sent: true })
      .in('order_id', orderIds);

    console.log('Notifications marked as sent:', orderIds);
    return res.json({ ok: true });
  } catch (e) {
    console.error('Error marking notifications as sent:', e);
    return res.status(500).json({ error: 'server_error', detail: (e as Error).message });
  }
});
