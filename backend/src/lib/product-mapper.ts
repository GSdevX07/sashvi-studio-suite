import { calculateDiscountedPrice, normalizeDiscountFields, type DiscountType } from "./discount";

type Category = "sarees" | "jewellery" | "combos";

export type ColorVariant = {
  id: string;
  color: string;
  stock: number;
  originalPrice: number;
  salePrice: number;
};

export function mapProductRow(p: Record<string, unknown>, variants?: Record<string, unknown>[]) {
  const cat = (p.categories as Record<string, unknown> | null) ?? null;
  const allCategories = (p.allCategories as Record<string, unknown>[] | null) ?? [];
  const productType = String(cat?.type ?? "sarees") as Category;
  const imageUrls = Array.isArray(p.image_urls) ? (p.image_urls as string[]) : [];
  const tagName = cat?.name ? String(cat.name) : "";
  const originalPrice = Number(p.original_price ?? 0) || Number(p.sale_price ?? 0);
  const salePrice = Number(p.sale_price ?? 0);
  const discount = normalizeDiscountFields({
    discountType: p.discount_type as DiscountType | undefined,
    discountValue: Number(p.discount_value ?? 0),
    discountPercentage: Number(p.discount_percentage ?? 0),
    discountFixed: Number(p.discount_fixed ?? 0),
  });
  const discountedPrice = calculateDiscountedPrice(
    originalPrice,
    discount.discountType,
    discount.discountValue,
  );
  const listPrice = originalPrice > 0 ? originalPrice : salePrice;

  // Map variants from product_variants table
  const colorVariants: ColorVariant[] = Array.isArray(variants) && variants.length > 0
    ? variants.map((v: Record<string, unknown>) => ({
        id: String(v.id ?? ""),
        color: String(v.color ?? ""),
        stock: Number(v.stock ?? 0),
        originalPrice: Number(v.original_price ?? 0),
        salePrice: Number(v.sale_price ?? 0),
      }))
    : [];

  // Calculate total stock from variants if variants exist, otherwise use main product stock
  const totalStock = colorVariants.length > 0
    ? colorVariants.reduce((sum, v) => sum + v.stock, 0)
    : Number(p.stock ?? 0);

  // Get all category names from allCategories for tags
  const allCategoryNames = allCategories.map((c: Record<string, unknown>) => String(c.name ?? "")).filter(Boolean);

  return {
    id: String(p.id ?? ""),
    slug: String(p.slug ?? ""),
    name: String(p.name ?? ""),
    price: listPrice,
    salePrice: discountedPrice,
    discountedPrice,
    originalPrice: listPrice,
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    discountPercentage: discount.discountPercentage,
    discountFixed: discount.discountFixed,
    discountBadge: String(p.discount_badge ?? ""),
    image: imageUrls[0] ?? "",
    images: imageUrls,
    categories: [productType],
    tags: allCategoryNames.length > 0 ? allCategoryNames : (tagName ? [tagName] : []),
    stock: totalStock,
    description: String(p.description ?? ""),
    sku: `SS-${String(p.id ?? "")
      .slice(0, 8)
      .toUpperCase()}`,
    productType,
    active: Boolean(p.is_active ?? true),
    fabricType: String(p.fabric ?? ""),
    material: String(p.material ?? ""),
    occasionWear: String(p.occasion ?? ""),
    workType: String(p.work_type ?? ""),
    sareeLength: p.length != null ? Number(p.length) : undefined,
    blousePiece:
      p.blouse_included === true ? ("Yes" as const) : p.blouse_included === false ? ("No" as const) : undefined,
    weight: p.weight != null ? Number(p.weight) : undefined,
    featured: Boolean(p.featured ?? false),
    isNew: Boolean(p.is_new ?? false),
    isBestSeller: Boolean(p.is_best_seller ?? false),
    buyOneGetOne: Boolean(p.is_bogo ?? false),
    color: String(p.color ?? ""),
    colorVariants,
    categoryId: String(p.category_id ?? ""),
  };
  console.log('mapProductRow - buyOneGetOne mapping:', {
    productName: p.title,
    is_bogo: p.is_bogo,
    buyOneGetOne: Boolean(p.is_bogo ?? false)
  });
}

export function mapCategoryRow(c: Record<string, unknown>) {
  return {
    id: String(c.id ?? ""),
    name: String(c.name ?? ""),
    image: String(c.image ?? ""),
    description: "",
    parent: String(c.type ?? "Sarees").replace(/^./, (ch) => ch.toUpperCase()),
    sortOrder: Number(c.display_order ?? 0),
    active: Boolean(c.is_active ?? true),
  };
}

export async function resolveCategoryId(
  supabase: { from: (t: string) => any },
  productType: string,
  firstTag?: string,
): Promise<string | null> {
  const typeVal = productType.toLowerCase();
  const { data } = await supabase.from("categories").select("id,name,type").eq("type", typeVal);
  if (!data || data.length === 0) return null;
  if (firstTag) {
    const match = (data as { id: string; name: string }[]).find((c) => c.name === firstTag);
    if (match) return match.id;
  }
  return (data[0] as { id: string }).id;
}

export function bodyToProductRow(body: Record<string, unknown>) {
  const firstTag = Array.isArray(body.tags) ? (body.tags[0] as string | undefined) : undefined;
  const originalPrice = typeof body.originalPrice === "number" ? body.originalPrice : Number(body.salePrice ?? body.price ?? 0);
  const discount = normalizeDiscountFields({
    discountType: body.discountType as DiscountType | undefined,
    discountValue: typeof body.discountValue === "number" ? body.discountValue : undefined,
    discountPercentage: typeof body.discountPercentage === "number" ? body.discountPercentage : undefined,
    discountFixed: typeof body.discountFixed === "number" ? body.discountFixed : undefined,
  });
  const salePrice =
    typeof body.salePrice === "number"
      ? body.salePrice
      : calculateDiscountedPrice(originalPrice, discount.discountType, discount.discountValue);

  return {
    slug: typeof body.slug === "string" ? body.slug.trim() : `product-${Date.now()}`,
    name: typeof body.name === "string" ? body.name.trim() : "New product",
    sale_price: salePrice,
    original_price: originalPrice,
    discount_type: discount.discountType,
    discount_value: discount.discountValue,
    discount_percentage: discount.discountPercentage,
    discount_fixed: discount.discountFixed,
    discount_badge: typeof body.discountBadge === "string" ? body.discountBadge.trim() : "",
    image_urls: Array.isArray(body.images) ? body.images : body.image ? [body.image] : [],
    stock: typeof body.stock === "number" ? body.stock : 0,
    description: typeof body.description === "string" ? body.description.trim() : "",
    is_active: body.active !== false,
    fabric: typeof body.fabricType === "string" ? body.fabricType : "",
    material: typeof body.material === "string" ? body.material : "",
    occasion: typeof body.occasionWear === "string" ? body.occasionWear : "",
    work_type: typeof body.workType === "string" ? body.workType : "",
    blouse_included: body.blousePiece === "Yes",
    length: typeof body.sareeLength === "number" ? body.sareeLength : null,
    weight: typeof body.weight === "number" ? body.weight : null,
    featured: body.featured === true,
    is_new: body.isNew === true,
    is_best_seller: body.isBestSeller === true,
    is_bogo: body.buyOneGetOne === true,
    color: typeof body.color === "string" ? body.color : (
      Array.isArray(body.colorVariants) && (body.colorVariants as ColorVariant[])[0]
        ? String((body.colorVariants as ColorVariant[])[0].color)
        : ""
    ),
    variant_color: Array.isArray(body.colorVariants) && (body.colorVariants as ColorVariant[])[0]
      ? String((body.colorVariants as ColorVariant[])[0].color)
      : "",
    variant_stock: Array.isArray(body.colorVariants) && (body.colorVariants as ColorVariant[])[0]
      ? Number((body.colorVariants as ColorVariant[])[0].stock)
      : 0,
    variant_original_price: Array.isArray(body.colorVariants) && (body.colorVariants as ColorVariant[])[0]
      ? Number((body.colorVariants as ColorVariant[])[0].originalPrice)
      : 0,
    variant_sale_price: Array.isArray(body.colorVariants) && (body.colorVariants as ColorVariant[])[0]
      ? Number((body.colorVariants as ColorVariant[])[0].salePrice)
      : 0,
    _productType: typeof body.productType === "string" ? body.productType : "sarees",
    _firstTag: firstTag,
  };
}

export function bodyToProductUpdates(body: Record<string, unknown>) {
  const updates: Record<string, unknown> = {};
  if (body.slug != null) updates.slug = body.slug;
  if (body.name != null) updates.name = body.name;
  if (body.originalPrice != null) updates.original_price = body.originalPrice;
  if (body.discountBadge != null) updates.discount_badge = body.discountBadge;
  if (body.isBestSeller != null) updates.is_best_seller = body.isBestSeller;

  if (
    body.discountType != null ||
    body.discountValue != null ||
    body.discountPercentage != null ||
    body.discountFixed != null
  ) {
    const discount = normalizeDiscountFields({
      discountType: body.discountType as DiscountType | undefined,
      discountValue: typeof body.discountValue === "number" ? body.discountValue : undefined,
      discountPercentage: typeof body.discountPercentage === "number" ? body.discountPercentage : undefined,
      discountFixed: typeof body.discountFixed === "number" ? body.discountFixed : undefined,
    });
    updates.discount_type = discount.discountType;
    updates.discount_value = discount.discountValue;
    updates.discount_percentage = discount.discountPercentage;
    updates.discount_fixed = discount.discountFixed;
    const originalPrice = Number(body.originalPrice ?? updates.original_price ?? 0);
    if (originalPrice > 0) {
      updates.sale_price = calculateDiscountedPrice(
        originalPrice,
        discount.discountType,
        discount.discountValue,
      );
    }
  } else if (body.salePrice != null) {
    updates.sale_price = body.salePrice;
  } else if (body.price != null) {
    updates.sale_price = body.price;
  }
  
  if (body.images != null) updates.image_urls = body.images;
  else if (body.image != null) updates.image_urls = [body.image];
  if (body.stock != null) updates.stock = body.stock;
  if (body.description != null) updates.description = body.description;
  if (body.active != null) updates.is_active = body.active;
  if (body.fabricType != null) updates.fabric = body.fabricType;
  if (body.material != null) updates.material = body.material;
  if (body.occasionWear != null) updates.occasion = body.occasionWear;
  if (body.workType != null) updates.work_type = body.workType;
  if (body.sareeLength != null) updates.length = body.sareeLength;
  if (body.blousePiece != null) updates.blouse_included = body.blousePiece === "Yes";
  if (body.weight != null) updates.weight = body.weight;
  if (body.featured != null) updates.featured = body.featured;
  if (body.isNew != null) updates.is_new = body.isNew;
  if (body.color != null) updates.color = body.color;
  if (body.buyOneGetOne != null) updates.is_bogo = body.buyOneGetOne;
  if (body.colorVariants != null && Array.isArray(body.colorVariants) && body.colorVariants[0]) {
    if (body.color == null) {
      updates.color = String((body.colorVariants as ColorVariant[])[0].color);
    }
    updates.variant_color = String((body.colorVariants as ColorVariant[])[0].color);
    updates.variant_stock = Number((body.colorVariants as ColorVariant[])[0].stock);
    updates.variant_original_price = Number((body.colorVariants as ColorVariant[])[0].originalPrice);
    updates.variant_sale_price = Number((body.colorVariants as ColorVariant[])[0].salePrice);
  }
  return updates;
}

export function dbErrorMessage(error: { message?: string; code?: string; details?: string }): string {
  return error.message || error.details || error.code || "Database error";
}

type SupabaseClient = { from: (t: string) => any };

/** Avoid ambiguous embed — fetch categories separately and attach by category_id. */
export async function fetchProductsWithCategories(
  supabase: SupabaseClient,
  options?: { activeOnly?: boolean; productType?: string },
) {
  let query = supabase.from("products").select("*").order("created_at", { ascending: false });
  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }
  const { data: products, error } = await query;
  if (error) throw error;

  const rows = (products ?? []) as Record<string, unknown>[];
  const productIds = [
    ...new Set(rows.map((p) => p.id).filter(Boolean) as string[]),
  ];

  // Fetch all categories for products from junction table
  let productCategoriesMap: Record<string, string[]> = {};
  let categoryIds: string[] = [];
  if (productIds.length > 0) {
    const { data: productCategories } = await supabase
      .from("product_categories")
      .select("product_id, category_id")
      .in("product_id", productIds);
    
    if (productCategories && Array.isArray(productCategories)) {
      productCategoriesMap = productCategories.reduce((acc: Record<string, string[]>, pc: Record<string, unknown>) => {
        const productId = String(pc.product_id);
        const categoryId = String(pc.category_id);
        if (!acc[productId]) {
          acc[productId] = [];
        }
        acc[productId].push(categoryId);
        categoryIds.push(categoryId);
        return acc;
      }, {} as Record<string, string[]>);
    }
  }

  // Also include legacy category_id from products table
  rows.forEach((p) => {
    if (p.category_id && !productCategoriesMap[String(p.id)]?.includes(String(p.category_id))) {
      if (!productCategoriesMap[String(p.id)]) {
        productCategoriesMap[String(p.id)] = [];
      }
      productCategoriesMap[String(p.id)].push(String(p.category_id));
      categoryIds.push(String(p.category_id));
    }
  });

  // Fetch category details
  let categoryMap: Record<string, Record<string, unknown>> = {};
  if (categoryIds.length > 0) {
    const uniqueCategoryIds = [...new Set(categoryIds)];
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, type, image")
      .in("id", uniqueCategoryIds);
    categoryMap = Object.fromEntries(
      (categories ?? []).map((c: Record<string, unknown>) => [String(c.id), c]),
    );
  }

  // Fetch variants for all products
  let variantsMap: Record<string, Record<string, unknown>[]> = {};
  if (productIds.length > 0) {
    const { data: variants } = await supabase
      .from("product_variants")
      .select("*")
      .in("product_id", productIds);
    if (variants && Array.isArray(variants)) {
      variantsMap = variants.reduce((acc: Record<string, Record<string, unknown>[]>, v: Record<string, unknown>) => {
        const productId = String(v.product_id);
        if (!acc[productId]) {
          acc[productId] = [];
        }
        acc[productId].push(v);
        return acc;
      }, {} as Record<string, Record<string, unknown>[]>);
    }
  }

  let mapped = rows.map((p) => {
    const productCategoryIds = productCategoriesMap[String(p.id)] || [];
    const productCategories = productCategoryIds
      .map((cid) => categoryMap[cid])
      .filter(Boolean);
    
    // Use first category for backward compatibility, but store all
    const primaryCategory = productCategories[0] || null;
    
    return mapProductRow({
      ...p,
      categories: primaryCategory,
      allCategories: productCategories,
    }, variantsMap[String(p.id)] ?? []);
  });

  if (options?.productType) {
    const type = options.productType.toLowerCase();
    mapped = mapped.filter((p) => {
      const productCategories = (p as any).allCategories || [];
      const categoryTypes = productCategories.map((c: any) => c.type);
      return p.productType === type || categoryTypes.includes(type);
    });
  }

  return mapped;
}

export async function saveProductVariants(
  supabase: SupabaseClient,
  productId: string,
  variants: ColorVariant[],
) {
  // Delete existing variants for this product
  await supabase.from("product_variants").delete().eq("product_id", productId);

  // Insert new variants
  if (variants.length > 0) {
    const variantRows = variants.map((v) => ({
      product_id: productId,
      color: v.color,
      stock: v.stock,
      original_price: v.originalPrice,
      sale_price: v.salePrice,
    }));
    await supabase.from("product_variants").insert(variantRows);
  }
}

export async function fetchProductById(supabase: SupabaseClient, id: string) {
  const { data: product, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!product) return null;

  let cat = null;
  if (product.category_id) {
    const { data } = await supabase
      .from("categories")
      .select("id, name, type, image")
      .eq("id", product.category_id)
      .maybeSingle();
    cat = data;
  }

  // Fetch all categories for this product from junction table
  const { data: productCategories } = await supabase
    .from("product_categories")
    .select("category_id")
    .eq("product_id", id);

  let allCategories: Record<string, unknown>[] = [];
  if (productCategories && Array.isArray(productCategories)) {
    const categoryIds = productCategories.map((pc: Record<string, unknown>) => String(pc.category_id));
    if (categoryIds.length > 0) {
      const { data: categories } = await supabase
        .from("categories")
        .select("id, name, type, image")
        .in("id", categoryIds);
      allCategories = (categories as Record<string, unknown>[]) ?? [];
    }
  }

  // Fetch variants for this product
  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", id);

  return mapProductRow(
    { ...product, categories: cat, allCategories },
    (variants as Record<string, unknown>[]) ?? [],
  );
}

export async function fetchProductBySlug(supabase: SupabaseClient, slug: string) {
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!product) return null;

  let cat = null;
  if (product.category_id) {
    const { data } = await supabase
      .from("categories")
      .select("id, name, type, image")
      .eq("id", product.category_id)
      .maybeSingle();
    cat = data;
  }

  // Fetch all categories for this product from junction table
  const { data: productCategories } = await supabase
    .from("product_categories")
    .select("category_id")
    .eq("product_id", product.id);

  let allCategories: Record<string, unknown>[] = [];
  if (productCategories && Array.isArray(productCategories)) {
    const categoryIds = productCategories.map((pc: Record<string, unknown>) => String(pc.category_id));
    if (categoryIds.length > 0) {
      const { data: categories } = await supabase
        .from("categories")
        .select("id, name, type, image")
        .in("id", categoryIds);
      allCategories = (categories as Record<string, unknown>[]) ?? [];
    }
  }

  // Fetch variants for this product
  const { data: variants } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", product.id);

  return mapProductRow(
    { ...product, categories: cat, allCategories },
    (variants as Record<string, unknown>[]) ?? [],
  );
}

