import express from "express";
import { requireAuth, requireAdmin, AuthedRequest } from "../middleware/auth";
import { supabase } from "../lib/supabase";
import { dbErrorMessage } from "../lib/product-mapper";

export const reviewsRouter = express.Router();

function mapReview(r: Record<string, unknown>) {
  return {
    id: String(r.id ?? ""),
    user_name: String(r.user_name ?? ""),
    product_id: String(r.product_id ?? ""),
    rating: Number(r.rating ?? 5),
    review_text: String(r.review_text ?? ""),
    verified: Boolean(r.verified ?? false),
    featured: Boolean(r.featured ?? false),
    created_at: r.created_at ? String(r.created_at) : new Date().toISOString(),
  };
}

// Get all reviews (admin only)
reviewsRouter.get("/", requireAdmin as any, async (_req, res) => {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, user_name, product_id, rating, review_text, verified, featured, created_at")
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("reviews list error:", error.message);
    return res.json({ reviews: [] });
  }
  return res.json({ reviews: (data ?? []).map((r) => mapReview(r as Record<string, unknown>)) });
});

// Get reviews for a specific product (public)
reviewsRouter.get("/product/:productId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, user_name, product_id, rating, review_text, verified, featured, created_at")
      .eq("product_id", req.params.productId)
      .eq("verified", true)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Reviews GET error:", error);
      return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error) });
    }
    res.setHeader("Cache-Control", "no-store");
    return res.json({ reviews: data ?? [] });
  } catch (err) {
    console.error("Reviews GET unexpected error:", err);
    return res.status(500).json({ error: "server_error", detail: String(err) });
  }
});

// Create a review (authenticated users only)
reviewsRouter.post("/", requireAuth as any, async (req: AuthedRequest, res) => {
  try {
    const { product_id, rating, review_text } = req.body;

    if (!product_id || !rating || !review_text) {
      return res.status(400).json({ error: "missing_fields" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "invalid_rating" });
    }

    // Get user name from users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("name")
      .eq("id", req.user.id)
      .single();

    if (userError || !userData) {
      console.error("Review POST user error:", userError);
      return res.status(400).json({ error: "user_not_found" });
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        product_id,
        user_id: req.user.id,
        user_name: userData.name || "Customer",
        rating,
        review_text,
        verified: true, // Auto-verify reviews for immediate display
      })
      .select()
      .single();

    if (error) {
      console.error("Review POST insert error:", error);
      // Check if it's a unique constraint violation (user already reviewed this product)
      if (error.code === "23505") {
        return res.status(400).json({ error: "already_reviewed" });
      }
      return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error) });
    }

    return res.json({ review: mapReview(data as Record<string, unknown>) });
  } catch (err) {
    console.error("Review POST unexpected error:", err);
    return res.status(500).json({ error: "server_error", detail: String(err) });
  }
});

// Update review status (admin only)
reviewsRouter.patch("/:id", requireAdmin as any, async (req: AuthedRequest, res) => {
  const id = req.params.id;
  const body = req.body;
  const updates: Record<string, unknown> = {};
  if (body.status != null) updates.verified = body.status === "Approved";
  if (body.featured != null) updates.featured = body.featured;

  const { data, error } = await supabase
    .from("reviews")
    .update(updates)
    .eq("id", id)
    .select("id, user_name, product_id, rating, review_text, verified, featured, created_at")
    .maybeSingle();

  if (error) return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error) });
  return res.json({ review: data ? mapReview(data as Record<string, unknown>) : { id } });
});

// Delete a review (admin only)
reviewsRouter.delete("/:id", requireAdmin as any, async (req: AuthedRequest, res) => {
  const { error } = await supabase.from("reviews").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error) });
  return res.json({ ok: true });
});
