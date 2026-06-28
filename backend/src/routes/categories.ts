import express from "express";
import { requireAdmin, AuthedRequest } from "../middleware/auth";
import { supabase } from "../lib/supabase";
import { dbErrorMessage, mapCategoryRow } from "../lib/product-mapper";

export const categoriesRouter = express.Router();

categoriesRouter.get("/", async (req, res) => {
  const type = typeof req.query.type === "string" ? req.query.type.toLowerCase() : undefined;
  let query = supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (type) {
    query = query.eq("type", type);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error) });
  res.setHeader("Cache-Control", "no-store");
  return res.json({ categories: (data ?? []).map((c) => mapCategoryRow(c as Record<string, unknown>)) });
});

categoriesRouter.get("/admin/all", requireAdmin as any, async (_req, res) => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error) });
  return res.json({ categories: (data ?? []).map((c) => mapCategoryRow(c as Record<string, unknown>)) });
});

categoriesRouter.post("/", requireAdmin as any, async (req: AuthedRequest, res) => {
  const body = req.body;
  const row = {
    name: typeof body.name === "string" ? body.name.trim() : "New category",
    image: typeof body.image === "string" ? body.image.trim() : "",
    type: typeof body.parent === "string" ? body.parent.toLowerCase() : "sarees",
    display_order: typeof body.sortOrder === "number" ? body.sortOrder : 0,
    is_active: body.active !== false,
  };
  const { data, error } = await supabase.from("categories").insert(row).select().maybeSingle();
  if (error) return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error) });
  return res.json({ category: mapCategoryRow(data as Record<string, unknown>) });
});

categoriesRouter.put("/:id", requireAdmin as any, async (req: AuthedRequest, res) => {
  const body = req.body;
  const updates: Record<string, unknown> = {};
  if (body.name != null) updates.name = body.name;
  if (body.image != null) updates.image = body.image;
  if (body.parent != null) updates.type = String(body.parent).toLowerCase();
  if (body.sortOrder != null) updates.display_order = body.sortOrder;
  if (body.active != null) updates.is_active = body.active;

  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", req.params.id)
    .select()
    .maybeSingle();
  if (error) return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error) });
  return res.json({ category: mapCategoryRow(data as Record<string, unknown>) });
});

categoriesRouter.delete("/:id", requireAdmin as any, async (req: AuthedRequest, res) => {
  const { error } = await supabase.from("categories").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error) });
  return res.json({ ok: true });
});
