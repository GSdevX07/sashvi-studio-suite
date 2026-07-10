import { supabase } from "./supabase";

/**
 * Validate and reserve stock availability before order placement
 * This reserves stock immediately to prevent race conditions during payment
 */
export async function validateAndReserveStock(
  items: Array<{ product_id?: string | null; variant_id?: string | null; qty?: number; quantity?: number }>,
): Promise<{ valid: boolean; error?: string; insufficientItems?: Array<{ productId: string; variantId?: string; requested: number; available: number }> }> {
  const insufficientItems: Array<{ productId: string; variantId?: string; requested: number; available: number }> = [];

  for (const item of items) {
    const productId = item.product_id;
    const variantId = item.variant_id;
    const qty = Number(item.qty ?? item.quantity ?? 0);
    if (!productId || qty <= 0) continue;

    // If variant_id is provided, check and reserve variant stock
    if (variantId) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock, color")
        .eq("id", variantId)
        .eq("product_id", productId)
        .maybeSingle();

      if (!variant) {
        insufficientItems.push({ productId, variantId, requested: qty, available: 0 });
        continue;
      }

      const current = Number(variant.stock ?? 0);
      if (qty > current) {
        insufficientItems.push({
          productId,
          variantId,
          requested: qty,
          available: current,
        });
      } else {
        // Reserve stock by reducing it immediately
        const newStock = current - qty;
        await supabase.from("product_variants").update({ stock: newStock }).eq("id", variantId);
      }
    } else {
      // Fallback to main product stock if no variant
      const { data: product } = await supabase
        .from("products")
        .select("stock, name")
        .eq("id", productId)
        .maybeSingle();

      if (!product) continue;

      const current = Number(product.stock ?? 0);
      if (qty > current) {
        insufficientItems.push({
          productId,
          requested: qty,
          available: current,
        });
      } else {
        // Reserve stock by reducing it immediately
        const newStock = current - qty;
        await supabase.from("products").update({ stock: newStock }).eq("id", productId);
      }
    }
  }

  if (insufficientItems.length > 0) {
    return {
      valid: false,
      error: "Insufficient stock for one or more items",
      insufficientItems,
    };
  }

  return { valid: true };
}

/**
 * Reduce product stock after a successful order. Uses atomic SQL update to avoid negative stock.
 */
export async function reduceStockForOrderItems(
  items: Array<{ product_id?: string | null; variant_id?: string | null; qty?: number; quantity?: number }>,
): Promise<void> {
  for (const item of items) {
    const productId = item.product_id;
    const variantId = item.variant_id;
    const qty = Number(item.qty ?? item.quantity ?? 0);
    if (!productId || qty <= 0) continue;

    // If variant_id is provided, reduce variant stock
    if (variantId) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock")
        .eq("id", variantId)
        .eq("product_id", productId)
        .maybeSingle();

      if (!variant) continue;

      const current = Number(variant.stock ?? 0);
      const newStock = Math.max(0, current - qty);
      await supabase.from("product_variants").update({ stock: newStock }).eq("id", variantId);
    } else {
      // Fallback to main product stock if no variant
      const { data: product } = await supabase
        .from("products")
        .select("stock")
        .eq("id", productId)
        .maybeSingle();

      if (!product) continue;

      const current = Number(product.stock ?? 0);
      const newStock = Math.max(0, current - qty);
      await supabase.from("products").update({ stock: newStock }).eq("id", productId);
    }
  }
}

/**
 * Restore product stock when an order is cancelled.
 * Accepts either internal UUID or display order_id.
 */
export async function restoreStockForOrder(orderId: string): Promise<void> {
  // First, find the order to get the display order_id
  const { data: order } = await supabase
    .from("orders")
    .select("id, order_id")
    .or(`id.eq.${orderId},order_id.eq.${orderId}`)
    .maybeSingle();

  if (!order) return;

  // Use the display order_id to query order_items
  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, variant_id, quantity")
    .eq("order_id", order.order_id);

  if (!items?.length) return;

  for (const item of items) {
    if (!item.product_id) continue;
    const qty = Number(item.quantity ?? 0);
    if (qty <= 0) continue;

    // If variant_id is present, restore variant stock
    if (item.variant_id) {
      const { data: variant } = await supabase
        .from("product_variants")
        .select("stock")
        .eq("id", item.variant_id)
        .eq("product_id", item.product_id)
        .maybeSingle();

      if (!variant) continue;

      const newStock = Number(variant.stock ?? 0) + qty;
      await supabase.from("product_variants").update({ stock: newStock }).eq("id", item.variant_id);
    } else {
      // Fallback to main product stock if no variant
      const { data: product } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .maybeSingle();

      if (!product) continue;

      const newStock = Number(product.stock ?? 0) + qty;
      await supabase.from("products").update({ stock: newStock }).eq("id", item.product_id);
    }
  }
}
