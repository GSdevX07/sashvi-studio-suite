import express from "express";
import { requireAdmin, AuthedRequest } from "../middleware/auth";
import { supabase } from "../lib/supabase";
import {
  bodyToProductRow,
  bodyToProductUpdates,
  dbErrorMessage,
  fetchProductById,
  fetchProductBySlug,
  fetchProductsWithCategories,
  mapProductRow,
  resolveCategoryId,
  saveProductVariants,
} from "../lib/product-mapper";

export const productsRouter = express.Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isStaticProductId(id: string) {
  return !UUID_RE.test(id);
}

// Public catalog for storefront
productsRouter.get("/catalog", async (req, res) => {
  try {
    const type = typeof req.query.type === "string" ? req.query.type.toLowerCase() : undefined;
    const products = await fetchProductsWithCategories(supabase, { activeOnly: true, productType: type });
    res.setHeader("Cache-Control", "no-store");
    return res.json({ products });
  } catch (error) {
    console.error("catalog error:", error);
    return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error as any) });
  }
});

// Public product by slug
productsRouter.get("/slug/:slug", async (req, res) => {
  try {
    const product = await fetchProductBySlug(supabase, req.params.slug);
    if (!product || !product.active) return res.status(404).json({ error: "not_found" });
    res.setHeader("Cache-Control", "no-store");
    return res.json({ product });
  } catch (error) {
    return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error as any) });
  }
});

productsRouter.get("/", async (_req, res) => {
  try {
    const products = await fetchProductsWithCategories(supabase);
    return res.json({ products });
  } catch (error) {
    return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error as any) });
  }
});

productsRouter.get("/:id", async (req, res) => {
  const { id } = req.params;
  if (id === "catalog" || id === "slug") return res.status(404).json({ error: "not_found" });
  if (isStaticProductId(id)) {
    return res.status(404).json({
      error: "not_found",
      message: "Static catalog product — use database product IDs",
    });
  }
  try {
    const product = await fetchProductById(supabase, id);
    if (!product) return res.status(404).json({ error: "not_found" });
    return res.json({ product });
  } catch (error) {
    return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error as any) });
  }
});

productsRouter.post("/", requireAdmin as any, async (req: AuthedRequest, res) => {
  const body = req.body as Record<string, unknown>;
  const parsed = bodyToProductRow(body);
  const categoryId = await resolveCategoryId(supabase, parsed._productType, parsed._firstTag);
  const { _productType, _firstTag, ...row } = parsed;
  const insertRow = { ...row, category_id: categoryId };

  const { data, error } = await supabase.from("products").insert(insertRow).select("*").maybeSingle();
  if (error) {
    console.error("product insert error:", error);
    return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error) });
  }

  // Save variants if provided
  if (body.colorVariants && Array.isArray(body.colorVariants)) {
    await saveProductVariants(supabase, String(data.id), body.colorVariants as any[]);
  }

  const product = await fetchProductById(supabase, String(data.id));
  return res.json({ product });
});

productsRouter.put("/:id", requireAdmin as any, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  if (isStaticProductId(id)) {
    return res.status(400).json({
      error: "static_product",
      message: "This is a demo catalog item. Create a new product to save to the database.",
    });
  }

  const body = req.body as Record<string, unknown>;
  const updates = bodyToProductUpdates(body);
  if (body.productType != null || body.tags != null) {
    const firstTag = Array.isArray(body.tags) ? (body.tags[0] as string | undefined) : undefined;
    const categoryId = await resolveCategoryId(
      supabase,
      String(body.productType ?? "sarees"),
      firstTag,
    );
    if (categoryId) updates.category_id = categoryId;
  }

  const { error } = await supabase.from("products").update(updates).eq("id", id);
  if (error) {
    console.error("product update error:", error);
    return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error) });
  }

  // Save variants if provided
  if (body.colorVariants && Array.isArray(body.colorVariants)) {
    await saveProductVariants(supabase, id, body.colorVariants as any[]);
  }

  const product = await fetchProductById(supabase, id);
  return res.json({ product });
});

productsRouter.delete("/:id", requireAdmin as any, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  if (isStaticProductId(id)) {
    return res.status(400).json({
      error: "static_product",
      message: "Demo catalog items cannot be deleted from the database.",
    });
  }
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    console.error("product delete error:", error);
    return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error) });
  }
  return res.json({ ok: true });
});

// Update individual variant stock
productsRouter.put("/variants/:id", requireAdmin as any, async (req: AuthedRequest, res) => {
  const { id } = req.params;
  const body = req.body as Record<string, unknown>;

  const updates: Record<string, unknown> = {};
  if (body.stock != null) updates.stock = Number(body.stock);
  if (body.sku != null) updates.sku = String(body.sku);
  if (body.original_price != null) updates.original_price = Number(body.original_price);
  if (body.sale_price != null) updates.sale_price = Number(body.sale_price);

  const { data, error } = await supabase
    .from("product_variants")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("variant update error:", error);
    return res.status(500).json({ error: "db_error", detail: dbErrorMessage(error) });
  }

  return res.json({ variant: data });
});
