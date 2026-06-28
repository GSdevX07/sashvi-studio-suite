import express from "express";
import { requireAdmin, AuthedRequest } from "../middleware/auth";
import { supabase } from "../lib/supabase";
import { dbErrorMessage } from "../lib/product-mapper";

export const reviewsRouter = express.Router();

function mapReview(r: Record<string, unknown>) {
  return {
    id: Number(r.id ?? 0),
    name: String(r.user_name ?? r.name ?? ""),
    product: String(r.product_id ?? r.product_slug ?? r.product ?? ""),
    rating: Number(r.rating ?? 5),
    comment: String(r.review ?? r.comment ?? ""),
    status: r.verified === false ? "Pending" : "Approved",
    featured: Boolean(r.featured ?? false),
    date: r.created_at ? String(r.created_at).slice(0, 10) : new Date().toISOString().slice(0, 10),
  };
}

reviewsRouter.get("/", requireAdmin as any, async (_req, res) => {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, user_name, product_id, rating, review, verified, featured, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("reviews list error:", error.message);
    return res.json({ reviews: [] });
  }
  return res.json({ reviews: (data ?? []).map((r) => mapReview(r as Record<string, unknown>)) });
});

reviewsRouter.patch("/:id", requireAdmin as any, async (req: AuthedRequest, res) => {
  const id = Number(req.params.id);
  const body = req.body;
  const updates: Record<string, unknown> = {};
  if (body.status != null) updates.verified = body.status === "Approved";
  if (body.featured != null) updates.featured = body.featured;

  const { data, error } = await supabase
    .from("reviews")
    .update(updates)
    .eq("id", id)
    .select("id, user_name, product_id, rating, review, verified, featured, created_at")
    .maybeSingle();

  if (error) return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error) });
  return res.json({ review: data ? mapReview(data as Record<string, unknown>) : { id } });
});

reviewsRouter.delete("/:id", requireAdmin as any, async (req: AuthedRequest, res) => {
  const { error } = await supabase.from("reviews").delete().eq("id", Number(req.params.id));
  if (error) return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error) });
  return res.json({ ok: true });
});

reviewsRouter.get("/public/:productId", async (req, res) => {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, user_name, product_id, rating, review, featured, created_at")
    .eq("product_id", req.params.productId)
    .eq("verified", true)
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error) });
  res.setHeader("Cache-Control", "no-store");
  return res.json({ reviews: data ?? [] });
});
