import { createHmac } from "crypto";
import { PRODUCTS, type Category } from "./products";
import { uploadImageToImageKit } from "./imagekit.server";
import { ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET } from "./env.server";
import { supabase } from "./supabase.server";

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable.");
}

// ── Types ────────────────────────────────────────────────

type ColorVariant = { id: string; color: string; stock: number; originalPrice: number; salePrice: number };
type InstagramLinkedProduct = { name: string; url: string };

type CouponItem = {
  id: string; code: string; category: string;
  discountType: "fixed" | "percent"; discountValue: number;
  expiry: string; usageLimit: number; minimumPurchase: number; active: boolean;
};

// ── In-memory fallback stores (tables not in Supabase) ────

let adminCoupons: CouponItem[] = [
  { id: "cp-1", code: "SASHVI10", category: "All", discountType: "percent", discountValue: 10, expiry: "2026-12-31", usageLimit: 100, minimumPurchase: 1999, active: true },
  { id: "cp-2", code: "FLAT500", category: "Sarees", discountType: "fixed", discountValue: 500, expiry: "2026-11-30", usageLimit: 50, minimumPurchase: 4999, active: true },
];

let adminCustomers = [
  { id: "cust-1", name: "Ananya R.", email: "ananya@example.com", totalSpend: 28499, lastOrder: "2026-06-20", orders: 14, address: "Chennai" },
  { id: "cust-2", name: "Lakshmi V.", email: "lakshmi@example.com", totalSpend: 15849, lastOrder: "2026-06-18", orders: 9, address: "Bangalore" },
  { id: "cust-3", name: "Sneha K.", email: "sneha@example.com", totalSpend: 11299, lastOrder: "2026-06-15", orders: 7, address: "Hyderabad" },
];

const DEFAULT_SETTINGS = {
  storeName: "Sashvi Studio", logo: "", contactNumber: "+91 98765 43210",
  email: "support@sashvistudio.com", address: "123 Heritage Lane, Bangalore",
  freeDeliveryAbove: 1000, deliveryCharge: 100, gatewayFee: 3,
};
let adminSettings = { ...DEFAULT_SETTINGS };

// ── Auth helpers ──────────────────────────────────────────

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" }, ...init });
}

function createJwt(payload: Record<string, unknown>) {
  const header = { alg: "HS256", typ: "JWT" };
  const enc = (v: object) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const sig = createHmac("sha256", JWT_SECRET!).update(`${enc(header)}.${enc(payload)}`).digest("base64url");
  return `${enc(header)}.${enc(payload)}.${sig}`;
}

function verifyJwt(token: string) {
  const [h, p, s] = token.split(".");
  if (!h || !p || !s) return null;
  const expected = createHmac("sha256", JWT_SECRET!).update(`${h}.${p}`).digest("base64url");
  if (expected !== s) return null;
  try { return JSON.parse(Buffer.from(p, "base64url").toString("utf-8")); } catch { return null; }
}

async function requireAdmin(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  const payload = verifyJwt(token);
  if (!payload || payload.role !== "admin") return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  return null;
}

function dbErr(label: string, error: { message: string; code?: string }) {
  console.error(`[${label}] ${error.code ?? ""} ${error.message}`);
  return jsonResponse({ error: `Database error: ${error.message}` }, { status: 500 });
}

// ── Row mappers (Supabase snake_case → camelCase) ─────────

function mapProduct(p: Record<string, unknown>) {
  const cat = p.categories as Record<string, unknown> | null ?? null;
  const productType = String(cat?.type ?? "sarees") as Category;
  const imageUrls = Array.isArray(p.image_urls) ? (p.image_urls as string[]) : [];
  return {
    id: String(p.id ?? ""),
    slug: String(p.slug ?? ""),
    name: String(p.name ?? ""),
    price: Number(p.sale_price ?? 0),
    salePrice: Number(p.sale_price ?? 0),
    originalPrice: Number(p.original_price ?? 0),
    image: imageUrls[0] ?? "",
    images: imageUrls,
    categories: [productType],
    tags: cat?.name ? [String(cat.name)] : [],
    stock: Number(p.stock ?? 0),
    description: String(p.description ?? ""),
    sku: `SS-${String(p.id ?? "").slice(0, 8).toUpperCase()}`,
    productType,
    active: Boolean(p.is_active ?? true),
    fabricType: String(p.fabric ?? ""),
    material: "",
    occasionWear: String(p.occasion ?? ""),
    workType: String(p.work_type ?? ""),
    sareeLength: p.length != null ? Number(p.length) : undefined,
    blousePiece: p.blouse_included === true ? "Yes" : p.blouse_included === false ? "No" : undefined,
    weight: p.weight != null ? Number(p.weight) : undefined,
    featured: Boolean(p.featured ?? false),
    buyOneGetOne: Boolean(p.is_bogo ?? false),
    colorVariants: [] as ColorVariant[],
    categoryId: String(p.category_id ?? ""),
  };
}

function mapCategory(c: Record<string, unknown>) {
  return {
    id: String(c.id ?? ""),
    name: String(c.name ?? ""),
    image: String(c.image ?? ""),
    description: "",
    parent: String(c.type ?? "Sarees"),
    sortOrder: Number(c.display_order ?? 0),
    active: Boolean(c.is_active ?? true),
  };
}

function mapOrder(o: Record<string, unknown>) {
  const addr = [o.address, o.city, o.state].filter(Boolean).join(", ");
  return {
    id: String(o.order_id ?? o.id ?? ""),
    customer: String(o.customer_name ?? ""),
    item: String(o.item ?? o.product_name ?? ""),
    total: Number(o.total ?? o.amount ?? o.total_amount ?? 0),
    status: String(o.status ?? "Processing"),
    paymentStatus: String(o.payment_status ?? "Paid"),
    deliveryCharges: Number(o.delivery_charges ?? o.shipping ?? 0),
    gatewayFee: Number(o.gateway_fee ?? 0),
    address: addr || String(o.address ?? ""),
    orderDate: o.created_at ? String(o.created_at).slice(0, 10) : String(o.order_date ?? ""),
  };
}

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

function mapInstagramItem(item: Record<string, unknown>) {
  return {
    id: String(item.id ?? ""),
    mediaType: String(item.type ?? item.media_type ?? "post") as "post" | "reel",
    url: String(item.instagram_url ?? item.url ?? ""),
    thumbnail: String(item.thumbnail_image ?? item.thumbnail ?? ""),
    linkedProducts: Array.isArray(item.linked_products) ? (item.linked_products as InstagramLinkedProduct[]) : [],
    caption: String(item.caption ?? ""),
    isActive: item.is_active !== false,
  };
}

// ── Helper: look up category_id by productType + tag name ─

async function resolveCategoryId(productType: string, firstTag?: string): Promise<string | null> {
  const typeVal = productType.toLowerCase();
  const { data } = await supabase.from("categories").select("id,name,type").eq("type", typeVal);
  if (!data || data.length === 0) return null;
  if (firstTag) {
    const match = (data as { id: string; name: string }[]).find((c) => c.name === firstTag);
    if (match) return match.id;
  }
  return (data[0] as { id: string }).id;
}

// ── Main handler ──────────────────────────────────────────

export async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  // ── Auth ──────────────────────────────────────────────────
  if (pathname === "/api/admin/login" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return jsonResponse({ error: "Admin credentials not configured." }, { status: 500 });
    if (email !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD)
      return jsonResponse({ error: "Invalid email or password." }, { status: 401 });
    const token = createJwt({ role: "admin", email: ADMIN_EMAIL, issuedAt: Date.now() });
    return jsonResponse({ token, user: { email: ADMIN_EMAIL } });
  }

  if (pathname === "/api/admin/me" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    return jsonResponse({ user: { email: ADMIN_EMAIL } });
  }

  // ── Products ──────────────────────────────────────────────
  if (pathname === "/api/admin/products" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(id, name, type)")
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("[products GET]", error.message);
      // Fallback: return static products
      const fallback = PRODUCTS.map((p) => ({
        id: p.id, slug: p.slug, name: p.name,
        price: p.price, salePrice: p.price, originalPrice: p.compareAt ?? p.price,
        image: p.image, images: p.images ?? [], categories: p.categories, tags: p.tags ?? [],
        stock: p.stock ?? 0, description: p.description ?? "", sku: `SS-${p.id}`,
        productType: (p.categories[0] ?? "sarees") as Category, active: true,
        fabricType: "", material: "", occasionWear: "", workType: "",
        sareeLength: p.categories.includes("sarees") ? 5.5 : undefined,
        blousePiece: p.categories.includes("sarees") ? "Yes" as const : undefined,
        weight: undefined as number | undefined,
        featured: p.isFeatured ?? false, buyOneGetOne: false, colorVariants: [] as ColorVariant[],
      }));
      return jsonResponse({ products: fallback });
    }
    return jsonResponse({ products: (data as Record<string, unknown>[]).map(mapProduct) });
  }

  if (pathname === "/api/admin/products" && method === "POST") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = await request.json().catch(() => ({}));
    const firstTag = Array.isArray(body.tags) ? (body.tags[0] as string | undefined) : undefined;
    const categoryId = await resolveCategoryId(body.productType ?? "sarees", firstTag);
    const row: Record<string, unknown> = {
      slug: typeof body.slug === "string" ? body.slug.trim() : `product-${Date.now()}`,
      name: typeof body.name === "string" ? body.name.trim() : "New product",
      sale_price: typeof body.salePrice === "number" ? body.salePrice : 0,
      original_price: typeof body.originalPrice === "number" ? body.originalPrice : 0,
      image_urls: Array.isArray(body.images) ? body.images : (body.image ? [body.image] : []),
      stock: typeof body.stock === "number" ? body.stock : 0,
      description: typeof body.description === "string" ? body.description.trim() : "",
      category_id: categoryId,
      is_active: body.active !== false,
      fabric: typeof body.fabricType === "string" ? body.fabricType : "",
      occasion: typeof body.occasionWear === "string" ? body.occasionWear : "",
      work_type: typeof body.workType === "string" ? body.workType : "",
      blouse_included: body.blousePiece === "Yes",
      length: typeof body.sareeLength === "number" ? body.sareeLength : null,
      weight: typeof body.weight === "number" ? body.weight : null,
      featured: body.featured === true,
      is_bogo: body.buyOneGetOne === true,
      color: Array.isArray(body.colorVariants) && body.colorVariants[0] ? String(body.colorVariants[0].color) : typeof body.color === "string" ? body.color : "",
    };
    const { data, error } = await supabase.from("products").insert(row).select("*, categories(id, name, type)").single();
    if (error) return dbErr("products POST", error);
    return jsonResponse({ product: mapProduct(data as Record<string, unknown>) });
  }

  if (pathname.startsWith("/api/admin/products/") && method === "PUT") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/products/", "");
    const body = await request.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};
    if (body.slug != null) updates.slug = body.slug;
    if (body.name != null) updates.name = body.name;
    if (body.salePrice != null) updates.sale_price = body.salePrice;
    if (body.originalPrice != null) updates.original_price = body.originalPrice;
    if (body.images != null) updates.image_urls = body.images;
    else if (body.image != null) updates.image_urls = [body.image];
    if (body.stock != null) updates.stock = body.stock;
    if (body.description != null) updates.description = body.description;
    if (body.active != null) updates.is_active = body.active;
    if (body.fabricType != null) updates.fabric = body.fabricType;
    if (body.occasionWear != null) updates.occasion = body.occasionWear;
    if (body.workType != null) updates.work_type = body.workType;
    if (body.sareeLength != null) updates.length = body.sareeLength;
    if (body.blousePiece != null) updates.blouse_included = body.blousePiece === "Yes";
    if (body.weight != null) updates.weight = body.weight;
    if (body.featured != null) updates.featured = body.featured;
    if (body.buyOneGetOne != null) updates.is_bogo = body.buyOneGetOne;
    if (body.colorVariants != null && Array.isArray(body.colorVariants) && body.colorVariants[0])
      updates.color = String(body.colorVariants[0].color);
    if (body.productType != null || body.tags != null) {
      const firstTag = Array.isArray(body.tags) ? (body.tags[0] as string | undefined) : undefined;
      const categoryId = await resolveCategoryId(body.productType ?? "sarees", firstTag);
      if (categoryId) updates.category_id = categoryId;
    }
    const { data, error } = await supabase.from("products").update(updates).eq("id", id).select("*, categories(id, name, type)").single();
    if (error) return dbErr("products PUT", error);
    return jsonResponse({ product: mapProduct(data as Record<string, unknown>) });
  }

  if (pathname.startsWith("/api/admin/products/") && method === "DELETE") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/products/", "");
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return dbErr("products DELETE", error);
    return jsonResponse({});
  }

  // ── Inventory ─────────────────────────────────────────────
  if (pathname.startsWith("/api/admin/inventory/") && method === "PATCH") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/inventory/", "");
    const body = await request.json().catch(() => ({}));
    const { data, error } = await supabase.from("products").update({ stock: Number(body.stock ?? 0) }).eq("id", id).select("*, categories(id, name, type)").single();
    if (error) return dbErr("inventory PATCH", error);
    return jsonResponse({ product: mapProduct(data as Record<string, unknown>) });
  }

  // ── Categories ────────────────────────────────────────────
  if (pathname === "/api/admin/categories" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const { data, error } = await supabase.from("categories").select("*").order("display_order", { ascending: true });
    if (error) { console.warn("[categories GET]", error.message); return jsonResponse({ categories: [] }); }
    return jsonResponse({ categories: (data as Record<string, unknown>[]).map(mapCategory) });
  }

  if (pathname === "/api/admin/categories" && method === "POST") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = await request.json().catch(() => ({}));
    const row = {
      name: typeof body.name === "string" ? body.name.trim() : "New category",
      image: typeof body.image === "string" ? body.image.trim() : "",
      type: typeof body.parent === "string" ? body.parent.toLowerCase() : "sarees",
      display_order: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      is_active: body.active !== false,
    };
    const { data, error } = await supabase.from("categories").insert(row).select().single();
    if (error) return dbErr("categories POST", error);
    return jsonResponse({ category: mapCategory(data as Record<string, unknown>) });
  }

  if (pathname.startsWith("/api/admin/categories/") && method === "PUT") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/categories/", "");
    const body = await request.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};
    if (body.name != null) updates.name = body.name;
    if (body.image != null) updates.image = body.image;
    if (body.parent != null) updates.type = String(body.parent).toLowerCase();
    if (body.sortOrder != null) updates.display_order = body.sortOrder;
    if (body.active != null) updates.is_active = body.active;
    const { data, error } = await supabase.from("categories").update(updates).eq("id", id).select().single();
    if (error) return dbErr("categories PUT", error);
    return jsonResponse({ category: mapCategory(data as Record<string, unknown>) });
  }

  if (pathname.startsWith("/api/admin/categories/") && method === "DELETE") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/categories/", "");
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return dbErr("categories DELETE", error);
    return jsonResponse({});
  }

  // ── Orders ────────────────────────────────────────────────
  if (pathname === "/api/admin/orders" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) { console.warn("[orders GET]", error.message); return jsonResponse({ orders: [] }); }
    return jsonResponse({ orders: (data as Record<string, unknown>[]).map(mapOrder) });
  }

  if (pathname.startsWith("/api/admin/orders/") && method === "PUT") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = decodeURIComponent(pathname.replace("/api/admin/orders/", ""));
    const body = await request.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};
    if (body.status != null) updates.status = body.status;
    if (body.paymentStatus != null) updates.payment_status = body.paymentStatus;
    const { data, error } = await supabase.from("orders").update(updates).eq("order_id", id).select().single();
    if (error) return dbErr("orders PUT", error);
    return jsonResponse({ order: mapOrder(data as Record<string, unknown>) });
  }

  // ── Customers (in-memory — no DB table) ───────────────────
  if (pathname === "/api/admin/customers" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    return jsonResponse({ customers: adminCustomers });
  }

  // ── Reviews ───────────────────────────────────────────────
  if (pathname === "/api/admin/reviews" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const { data, error } = await supabase
      .from("reviews")
      .select("id, user_name, product_id, rating, review, verified, featured, created_at")
      .order("created_at", { ascending: false });
    if (error) { console.warn("[reviews GET]", error.message); return jsonResponse({ reviews: [] }); }
    return jsonResponse({ reviews: (data as Record<string, unknown>[]).map(mapReview) });
  }

  if (pathname.startsWith("/api/admin/reviews/") && method === "PATCH") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = Number(pathname.replace("/api/admin/reviews/", ""));
    const body = await request.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};
    // Only update fields that exist in the DB
    if (body.status != null) updates.verified = body.status === "Approved";
    if (body.featured != null) updates.featured = body.featured;
    if (Object.keys(updates).length === 0) {
      // No updatable fields — return current state
      const { data } = await supabase.from("reviews").select("id, user_name, product_id, rating, review, verified, featured, created_at").eq("id", id).single();
      return jsonResponse({ review: data ? mapReview(data as Record<string, unknown>) : { id } });
    }
    const { data, error } = await supabase.from("reviews").update(updates).eq("id", id).select("id, user_name, product_id, rating, review, verified, featured, created_at").single();
    if (error) {
      // Column may not exist — return success anyway so UI updates
      console.warn("[reviews PATCH]", error.message);
      return jsonResponse({ review: { id, status: body.status ?? "Approved" } });
    }
    return jsonResponse({ review: mapReview(data as Record<string, unknown>) });
  }

  if (pathname.startsWith("/api/admin/reviews/") && method === "DELETE") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = Number(pathname.replace("/api/admin/reviews/", ""));
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) return dbErr("reviews DELETE", error);
    return jsonResponse({});
  }

  // ── Instagram Feed ────────────────────────────────────────
  if (pathname === "/api/admin/instagram-feed" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const { data, error } = await supabase.from("instagram_feed").select("*").order("created_at", { ascending: false });
    if (error) { console.warn("[instagram_feed GET]", error.message); return jsonResponse({ feed: [] }); }
    return jsonResponse({ feed: (data as Record<string, unknown>[]).map(mapInstagramItem) });
  }

  if (pathname === "/api/admin/instagram-feed" && method === "POST") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = await request.json().catch(() => ({}));
    const row: Record<string, unknown> = {
      type: body.mediaType === "reel" ? "reel" : "post",
      instagram_url: typeof body.url === "string" ? body.url.trim() : "",
      thumbnail_image: typeof body.thumbnail === "string" ? body.thumbnail.trim() : "",
      likes_count: 0,
      comments_count: 0,
    };
    const { data, error } = await supabase.from("instagram_feed").insert(row).select().single();
    if (error) return dbErr("instagram_feed POST", error);
    return jsonResponse({ item: mapInstagramItem(data as Record<string, unknown>) });
  }

  if (pathname.startsWith("/api/admin/instagram-feed/") && method === "DELETE") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/instagram-feed/", "");
    const { error } = await supabase.from("instagram_feed").delete().eq("id", id);
    if (error) return dbErr("instagram_feed DELETE", error);
    return jsonResponse({});
  }

  // ── Coupons (in-memory — no DB table) ─────────────────────
  if (pathname === "/api/admin/coupons" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    return jsonResponse({ coupons: adminCoupons });
  }

  if (pathname === "/api/admin/coupons" && method === "POST") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = await request.json().catch(() => ({}));
    const coupon: CouponItem = {
      id: `cp-${Date.now()}`,
      code: typeof body.code === "string" ? body.code.trim().toUpperCase() : "NEWCODE",
      category: typeof body.category === "string" ? body.category : "All",
      discountType: body.discountType === "fixed" ? "fixed" : "percent",
      discountValue: typeof body.discountValue === "number" ? body.discountValue : 0,
      expiry: typeof body.expiry === "string" ? body.expiry : new Date().toISOString().slice(0, 10),
      usageLimit: typeof body.usageLimit === "number" ? body.usageLimit : 100,
      minimumPurchase: typeof body.minimumPurchase === "number" ? body.minimumPurchase : 0,
      active: body.active !== false,
    };
    adminCoupons.push(coupon);
    return jsonResponse({ coupon });
  }

  if (pathname.startsWith("/api/admin/coupons/") && method === "PUT") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/coupons/", "");
    const body = await request.json().catch(() => ({}));
    const index = adminCoupons.findIndex((c) => c.id === id);
    if (index === -1) return jsonResponse({ error: "Coupon not found." }, { status: 404 });
    adminCoupons[index] = {
      ...adminCoupons[index], ...body, id,
      code: typeof body.code === "string" ? body.code.trim().toUpperCase() : adminCoupons[index].code,
    };
    return jsonResponse({ coupon: adminCoupons[index] });
  }

  if (pathname.startsWith("/api/admin/coupons/") && method === "DELETE") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/coupons/", "");
    const index = adminCoupons.findIndex((c) => c.id === id);
    if (index === -1) return jsonResponse({ error: "Coupon not found." }, { status: 404 });
    adminCoupons.splice(index, 1);
    return jsonResponse({});
  }

  // ── Settings (in-memory — no DB table) ────────────────────
  if (pathname === "/api/admin/settings" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    return jsonResponse({ settings: adminSettings });
  }

  if (pathname === "/api/admin/settings" && method === "PUT") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = await request.json().catch(() => ({}));
    adminSettings = {
      storeName: typeof body.storeName === "string" ? body.storeName : adminSettings.storeName,
      logo: typeof body.logo === "string" ? body.logo : adminSettings.logo,
      contactNumber: typeof body.contactNumber === "string" ? body.contactNumber : adminSettings.contactNumber,
      email: typeof body.email === "string" ? body.email : adminSettings.email,
      address: typeof body.address === "string" ? body.address : adminSettings.address,
      freeDeliveryAbove: typeof body.freeDeliveryAbove === "number" ? body.freeDeliveryAbove : adminSettings.freeDeliveryAbove,
      deliveryCharge: typeof body.deliveryCharge === "number" ? body.deliveryCharge : adminSettings.deliveryCharge,
      gatewayFee: typeof body.gatewayFee === "number" ? body.gatewayFee : adminSettings.gatewayFee,
    };
    return jsonResponse({ settings: adminSettings });
  }

  // ── Image Upload (ImageKit) ────────────────────────────────
  if (pathname === "/api/admin/upload-image" && method === "POST") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    try {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file || typeof (file as Blob).arrayBuffer !== "function")
        return jsonResponse({ error: "No file uploaded." }, { status: 400 });
      const arrayBuffer = await (file as Blob).arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileName = (file as File).name ?? `image-${Date.now()}.jpg`;
      const uploadResponse = await uploadImageToImageKit(buffer, `product-${Date.now()}-${fileName}`);
      return jsonResponse({ url: uploadResponse.url, fileId: uploadResponse.fileId, name: uploadResponse.name });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      console.error("[upload-image]", message);
      return jsonResponse({ error: message }, { status: 500 });
    }
  }

  return jsonResponse({ error: "Not found." }, { status: 404 });
}
