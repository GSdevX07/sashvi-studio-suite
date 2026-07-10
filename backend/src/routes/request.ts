import express from "express";
import { supabase } from "../lib/supabase";
import { requireAuth, AuthedRequest } from "../middleware/auth";

export const requestRouter = express.Router();

const REPLACEMENT_STATUS_MAP: Record<string, string> = {
  approved: "replacement_approved",
  rejected: "delivered",
};

requestRouter.post("/", requireAuth as any, async (req: AuthedRequest, res) => {
  const { orderId, requestType, reason } = req.body;
  if (!orderId || !requestType || !reason) {
    return res.status(400).json({ error: "missing_fields" });
  }
  const payload = {
    order_id: orderId,
    user_id: req.user.id,
    type: requestType,
    reason,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("order_requests").insert(payload).select("*").maybeSingle();
  if (error) {
    console.error("order request insert error:", error);
    return res.status(500).json({ error: "db_error", detail: error.message });
  }
  return res.json({ ok: true, request: data });
});

requestRouter.get("/pending", requireAuth as any, async (req: AuthedRequest, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "forbidden" });
  }
  const { data, error } = await supabase
    .from("order_requests")
    .select("*, orders!inner(order_id, user_id, total_amount, created_at, order_status)")
    .eq("status", "pending");
  if (error) {
    console.error("fetch pending requests error:", error);
    if (error.code === "42P01" || error.message?.includes("order_requests")) {
      return res.json([]);
    }
    return res.status(500).json({ error: "db_error", detail: error.message });
  }
  return res.json(data ?? []);
});

requestRouter.patch("/:id", requireAuth as any, async (req: AuthedRequest, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "forbidden" });
  }
  const { id } = req.params;
  const { status, remarks } = req.body;
  if (!status) {
    return res.status(400).json({ error: "missing_status" });
  }

  const { data: existing } = await supabase
    .from("order_requests")
    .select("*, orders(order_id, order_status)")
    .eq("id", id)
    .maybeSingle();

  const { data, error } = await supabase
    .from("order_requests")
    .update({ status, admin_remarks: remarks || null })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("update request error:", error);
    return res.status(500).json({ error: "db_error", detail: error.message });
  }

  if (existing && existing.type === "replacement" && existing.orders?.order_id) {
    const displayOrderId = existing.orders.order_id;
    const newOrderStatus = REPLACEMENT_STATUS_MAP[status];
    if (newOrderStatus) {
      await supabase.rpc("update_order_status", {
        p_order_id: displayOrderId,
        p_new_status: newOrderStatus,
      });
    }
  }

  if (existing && existing.type === "cancellation" && status === "approved" && existing.orders?.order_id) {
    await supabase.rpc("update_order_status", {
      p_order_id: existing.orders.order_id,
      p_new_status: "cancelled",
    });
  }

  console.log("Request updated:", id, status);
  return res.json({ ok: true, request: data });
});
