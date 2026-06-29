import express from "express";
import Razorpay from "razorpay";
import { supabase } from "../lib/supabase";
import { calculateOrderTotals } from "../lib/checkout";
import { sendEmail, buildOrderConfirmationEmail } from "../lib/email";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { reduceStockForOrderItems } from "../lib/inventory";

export const paymentsRouter = express.Router();

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID || "";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "";
  if (!key_id || !key_secret) throw new Error("Razorpay keys not configured");
  return new Razorpay({ key_id, key_secret });
}

// New endpoint to provide Razorpay public key to client
paymentsRouter.get("/razorpay/key", requireAuth as any, (req: AuthedRequest, res) => {
  const key_id = process.env.RAZORPAY_KEY_ID || "";
  if (!key_id) return res.status(500).json({ error: "Razorpay key not configured" });
  res.json({ key: key_id });
});
paymentsRouter.post("/razorpay/create", requireAuth as any, async (req: AuthedRequest, res) => {
  const { orderId, amountType } = req.body;
  if (!orderId) return res.status(400).json({ error: "orderId required" });

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) return res.status(404).json({ error: "order not found" });

  // Use total_paid_online for COD advance, total_amount for full payment
  const amount = amountType === "advance"
    ? Number(order.total_paid_online || order.total_amount)
    : Number(order.total_amount);
  const amountPaise = Math.round(amount * 100);

  console.log('Razorpay payment creation debug:', {
    orderId,
    amountType,
    orderTotal: order.total_amount,
    orderTotalPaidOnline: order.total_paid_online,
    calculatedAmount: amount,
    amountPaise,
    paymentType: order.payment_type
  });

  try {
    const razor = getRazorpay();
    const rOrder = await razor.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: order.order_id || orderId,
      payment_capture: 1,
    } as any);

    // Save razorpay_order_id
    await supabase.from("orders").update({ razorpay_order_id: rOrder.id }).eq("id", orderId);

    return res.json({ ok: true, razorOrder: rOrder });
  } catch (e: any) {
    console.error("razorpay create error:", e);
    return res.status(500).json({ error: e.message });
  }
});

// ── Verify Razorpay payment ───────────────────────────────────────────────────
paymentsRouter.post("/razorpay/verify", requireAuth as any, async (req: AuthedRequest, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, failed } = req.body;
  
  // Handle payment failure
  if (failed === true) {
    if (orderId) {
      await supabase
        .from("orders")
        .update({
          payment_status: "failed",
          order_status: "cancelled",
        })
        .eq("id", orderId);
      console.log("Payment failed for order:", orderId);
    }
    return res.json({ ok: true, failed: true });
  }

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "missing_params" });
  }

  const crypto = await import("crypto");
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "");
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const digest = hmac.digest("hex");

  if (digest !== razorpay_signature) {
    return res.status(400).json({ error: "invalid_signature" });
  }

  if (orderId) {
    // First get current order to check if it's COD
    const { data: currentOrder } = await supabase
      .from("orders")
      .select("payment_status, payment_type")
      .eq("id", orderId)
      .maybeSingle();

    // For COD orders, keep status as partially_paid after advance payment
    // For prepaid orders, change status to paid
    const newPaymentStatus =
      currentOrder?.payment_type === "COD" ? "partially_paid" : "paid";

    const { data: order } = await supabase
      .from("orders")
      .update({
        payment_status: newPaymentStatus,
        payment_id: razorpay_payment_id,
        order_status: "confirmed",
      })
      .eq("id", orderId)
      .select("*")
      .maybeSingle();

    // Reduce stock after successful payment
    if (order) {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", order.order_id);

      if (orderItems && orderItems.length > 0) {
        const items = orderItems.map((item: any) => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          qty: item.quantity,
        }));
        await reduceStockForOrderItems(items);
        console.log("Stock reduced for order:", order.order_id);
      }
    }

    // Send confirmation email after payment verified
    if (order) {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("quantity, price, product_id, product_name")
        .eq("order_id", order.order_id);

      // Fetch product titles for the email
      const productIds = (orderItems || []).map((i: any) => i.product_id).filter(Boolean);
      let productTitles: Record<string, string> = {};
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("id, title")
          .in("id", productIds);
        productTitles = Object.fromEntries((products || []).map((p: any) => [p.id, p.title || ""]));
      }

      const items = (orderItems || []).map((i: any, idx: number) => ({
        name: i.product_name || productTitles[i.product_id] || `Item ${idx + 1}`,
        qty: i.quantity,
        price: i.price,
      }));

      const productTotal = items.reduce((s: number, i: any) => s + i.price * i.qty, 0);

      // For COD orders, use gateway_for_advance; for prepaid, use gateway_charge
      const gatewayChargeToShow = order.payment_type === "COD"
        ? Number(order.gateway_for_advance || 0)
        : Number(order.gateway_charge || 0);

      const html = buildOrderConfirmationEmail({
        customerName: order.customer_name,
        orderId: order.order_id,
        items,
        subtotal: productTotal,
        deliveryCharge: Number(order.delivery_charge),
        codCharge: Number(order.cod_charge || 0),
        gatewayCharge: gatewayChargeToShow,
        grandTotal: Number(order.total_amount),
        address: order.address,
        mobile: order.mobile,
        paymentType: order.payment_type,
        paymentStatus: order.payment_status,
        advancePaid: Number(order.advance_paid || 0),
        totalPaidOnline: Number(order.total_paid_online || 0),
        remainingAmount: Number(order.remaining_amount || 0),
      });

      sendEmail(order.email, `Payment Confirmed — ${order.order_id} | Sashvi Studio`, html).catch(
        () => {},
      );
    }
  }

  return res.json({ ok: true });
});

// Admin: initiate refund for cancelled prepaid order
paymentsRouter.post("/refund", requireAuth as any, async (req: AuthedRequest, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "forbidden" });

  const { orderId, action } = req.body;
  if (!orderId) return res.status(400).json({ error: "orderId required" });

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .or(`id.eq.${orderId},order_id.eq.${orderId}`)
    .maybeSingle();

  if (!order) return res.status(404).json({ error: "order_not_found" });
  if (order.order_status !== "cancelled") {
    return res.status(400).json({ error: "order_not_cancelled" });
  }

  const refundAction = action || "initiate";
  let refundStatus = order.refund_status;
  if (refundAction === "initiate") refundStatus = "refund_initiated";
  if (refundAction === "complete") refundStatus = "refund_completed";

  await supabase.from("orders").update({ refund_status: refundStatus }).eq("id", order.id);
  console.log("Refund status updated:", order.order_id, refundStatus);

  return res.json({ ok: true, refund_status: refundStatus });
});
