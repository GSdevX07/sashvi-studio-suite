import express from "express";
import { supabase } from "../lib/supabase";
import { requireAuth, requireAdmin, AuthedRequest } from "../middleware/auth";

export const couponsRouter = express.Router();

function mapCoupon(row: Record<string, unknown>) {
  return {
    id: String(row.id ?? ""),
    code: String(row.code ?? ""),
    category: String(row.category ?? "All"),
    discountType: row.discount_type === "fixed" ? "fixed" : "percent",
    discountValue: Number(row.discount_value ?? 0),
    minimumPurchase: Number(row.minimum_purchase ?? 0),
    usageLimit: Number(row.usage_limit ?? 0),
    usageCount: Number(row.usage_count ?? 0),
    expiry: row.expiry ? String(row.expiry).slice(0, 10) : "",
    active: Boolean(row.active ?? true),
  };
}

function calcDiscount(
  coupon: { discount_type: string; discount_value: number; minimum_purchase: number },
  subtotal: number,
): number {
  if (subtotal < Number(coupon.minimum_purchase ?? 0)) return 0;
  if (coupon.discount_type === "fixed") {
    return Math.min(subtotal, Number(coupon.discount_value));
  }
  return Math.round(subtotal * (Number(coupon.discount_value) / 100));
}

// Admin: list coupons
couponsRouter.get("/", requireAdmin as any, async (_req, res) => {
  const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("coupons list error:", error);
    return res.status(500).json({ error: "db_error", detail: error.message });
  }
  return res.json({ coupons: (data ?? []).map(mapCoupon) });
});

// Admin: create coupon
couponsRouter.post("/", requireAdmin as any, async (req: AuthedRequest, res) => {
  const body = req.body;
  const row = {
    code: String(body.code ?? "").trim().toUpperCase(),
    category: body.category ?? "All",
    discount_type: body.discountType === "fixed" ? "fixed" : "percent",
    discount_value: Number(body.discountValue ?? 0),
    minimum_purchase: Number(body.minimumPurchase ?? 0),
    usage_limit: Number(body.usageLimit ?? 0),
    expiry: body.expiry || null,
    active: body.active !== false,
  };
  const { data, error } = await supabase.from("coupons").insert(row).select("*").maybeSingle();
  if (error) return res.status(500).json({ error: "db_error", detail: error.message });
  return res.json({ coupon: mapCoupon(data as Record<string, unknown>) });
});

// Admin: update coupon
couponsRouter.put("/:id", requireAdmin as any, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const body = req.body;
  const updates: Record<string, unknown> = {};
  if (body.code) updates.code = String(body.code).trim().toUpperCase();
  if (body.category) updates.category = body.category;
  if (body.discountType) updates.discount_type = body.discountType === "fixed" ? "fixed" : "percent";
  if (body.discountValue != null) updates.discount_value = Number(body.discountValue);
  if (body.minimumPurchase != null) updates.minimum_purchase = Number(body.minimumPurchase);
  if (body.usageLimit != null) updates.usage_limit = Number(body.usageLimit);
  if (body.expiry) updates.expiry = body.expiry;
  if (body.active != null) updates.active = Boolean(body.active);

  const { data, error } = await supabase.from("coupons").update(updates).eq("id", id).select("*").maybeSingle();
  if (error) return res.status(500).json({ error: "db_error", detail: error.message });
  return res.json({ coupon: mapCoupon(data as Record<string, unknown>) });
});

// Admin: delete coupon
couponsRouter.delete("/:id", requireAdmin as any, async (req: AuthedRequest, res) => {
  const { error } = await supabase.from("coupons").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "db_error", detail: error.message });
  return res.json({ ok: true });
});

// Customer: validate coupon (server-side)
couponsRouter.post("/validate", requireAuth as any, async (req: AuthedRequest, res) => {
  const { code, subtotal } = req.body;
  if (!code || !subtotal) return res.status(400).json({ error: "missing_fields" });

  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", String(code).trim().toUpperCase())
    .maybeSingle();

  if (error || !coupon) return res.status(404).json({ error: "invalid_coupon" });
  if (!coupon.active) return res.status(400).json({ error: "coupon_inactive" });
  if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
    return res.status(400).json({ error: "coupon_expired" });
  }
  if (coupon.usage_limit > 0 && coupon.usage_count >= coupon.usage_limit) {
    return res.status(400).json({ error: "coupon_limit_reached" });
  }
  const productSubtotal = Number(subtotal);
  if (productSubtotal < Number(coupon.minimum_purchase ?? 0)) {
    return res.status(400).json({ error: "minimum_not_met", minimum: coupon.minimum_purchase });
  }

  const discount = calcDiscount(coupon, productSubtotal);
  return res.json({
    ok: true,
    coupon: mapCoupon(coupon as Record<string, unknown>),
    discount,
  });
});

export { calcDiscount };
