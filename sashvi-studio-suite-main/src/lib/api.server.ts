import { createHmac } from "crypto";
import { PRODUCTS, type Category } from "./products";
import { uploadImageToImageKit } from "./imagekit.server";
import { ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET } from "./env.server";

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable.");
}

type ColorVariant = {
  id: string;
  color: string;
  stock: number;
  originalPrice: number;
  salePrice: number;
};

type InstagramLinkedProduct = { name: string; url: string };

type InstagramFeedItem = {
  id: string;
  mediaType: "post" | "reel";
  url: string;
  thumbnail: string;
  linkedProducts: InstagramLinkedProduct[];
  caption: string;
  isActive: boolean;
};

type CouponItem = {
  id: string;
  code: string;
  category: string;
  discountType: "fixed" | "percent";
  discountValue: number;
  expiry: string;
  usageLimit: number;
  minimumPurchase: number;
  active: boolean;
};

const adminProducts = PRODUCTS.map((product) => ({
  ...product,
  sku: `SS-${product.id}`,
  productType: product.categories[0] ?? "sarees",
  active: true,
  salePrice: product.price,
  originalPrice: product.compareAt ?? product.price,
  fabricType: "",
  material: "",
  occasionWear: "",
  workType: "",
  sareeLength: product.categories.includes("sarees") ? 5.5 : undefined,
  blousePiece: product.categories.includes("sarees") ? "Yes" : undefined,
  weight: undefined as number | undefined,
  featured: product.isFeatured ?? false,
  buyOneGetOne: false,
  colorVariants: [] as ColorVariant[],
}));

let adminCategories = [
  { id: "cat-1", name: "Mysore Silk Sarees", image: "", description: "Premium wedding and festive sarees.", parent: "Sarees", sortOrder: 1, active: true },
  { id: "cat-2", name: "Mul Cotton Sarees", image: "", description: "Everyday breathable cotton sarees.", parent: "Sarees", sortOrder: 2, active: true },
  { id: "cat-3", name: "Handloom & Artisanal Sarees", image: "", description: "Handloom craft sarees with artisanal detail.", parent: "Sarees", sortOrder: 3, active: true },
  { id: "cat-4", name: "Fancy & Designer Sarees", image: "", description: "Designer sarees for reception and parties.", parent: "Sarees", sortOrder: 4, active: true },
  { id: "cat-5", name: "Necklaces", image: "", description: "Statement necklaces and temple sets.", parent: "Jewellery", sortOrder: 1, active: true },
  { id: "cat-6", name: "Long Haaram", image: "", description: "Classic long necklaces for bridal wear.", parent: "Jewellery", sortOrder: 2, active: true },
  { id: "cat-7", name: "Bridal Sets", image: "", description: "Full bridal jewellery sets.", parent: "Jewellery", sortOrder: 3, active: true },
  { id: "cat-8", name: "Earrings & Jhumkas", image: "", description: "Detailed earrings and jhumkas.", parent: "Jewellery", sortOrder: 4, active: true },
];

let adminOrders = [
  { id: "#SS-2418", customer: "Ananya R.", item: "Emerald Kanjivaram Silk Saree", total: 8499, status: "Processing", paymentStatus: "Paid", deliveryCharges: 100, gatewayFee: 255, address: "3/24, South Avenue, Chennai", orderDate: "2026-06-20" },
  { id: "#SS-2417", customer: "Lakshmi V.", item: "Ruby Temple Necklace Set", total: 3299, status: "Shipped", paymentStatus: "Paid", deliveryCharges: 100, gatewayFee: 99, address: "12, MG Road, Bangalore", orderDate: "2026-06-18" },
  { id: "#SS-2416", customer: "Sneha K.", item: "Bagru Mul Cotton Saree", total: 1799, status: "Delivered", paymentStatus: "Paid", deliveryCharges: 100, gatewayFee: 54, address: "7, Lake View, Hyderabad", orderDate: "2026-06-15" },
];

let adminCustomers = [
  { id: "cust-1", name: "Ananya R.", email: "ananya@example.com", totalSpend: 28499, lastOrder: "2026-06-20", orders: 14, address: "Chennai" },
  { id: "cust-2", name: "Lakshmi V.", email: "lakshmi@example.com", totalSpend: 15849, lastOrder: "2026-06-18", orders: 9, address: "Bangalore" },
  { id: "cust-3", name: "Sneha K.", email: "sneha@example.com", totalSpend: 11299, lastOrder: "2026-06-15", orders: 7, address: "Hyderabad" },
];

let adminReviews = [
  { id: 1, name: "Ananya R.", product: "Emerald Kanjivaram Silk Saree", rating: 5, comment: "The silk is dreamy and the finish is perfect.", status: "Pending", featured: false, date: "2026-06-21" },
  { id: 2, name: "Lakshmi V.", product: "Ruby Temple Necklace Set", rating: 5, comment: "Beautiful shine and excellent quality.", status: "Approved", featured: true, date: "2026-06-19" },
];

let adminInstagramFeed: InstagramFeedItem[] = [
  { id: "ig-1", mediaType: "post", url: "https://instagram.com/p/1", thumbnail: "", linkedProducts: [{ name: "Emerald Kanjivaram Silk Saree", url: "/product/emerald-kanjivaram-silk-saree" }], caption: "Festive collection!", isActive: true },
  { id: "ig-2", mediaType: "reel", url: "https://instagram.com/reel/2", thumbnail: "", linkedProducts: [{ name: "Ruby Temple Necklace Set", url: "/product/ruby-temple-necklace-set" }], caption: "Temple jewellery vibes", isActive: true },
];

let adminCoupons: CouponItem[] = [
  { id: "cp-1", code: "SASHVI10", category: "All", discountType: "percent", discountValue: 10, expiry: "2026-12-31", usageLimit: 100, minimumPurchase: 1999, active: true },
  { id: "cp-2", code: "FLAT500", category: "Sarees", discountType: "fixed", discountValue: 500, expiry: "2026-11-30", usageLimit: 50, minimumPurchase: 4999, active: true },
];

let adminSettings = {
  storeName: "Sashvi Studio",
  logo: "",
  contactNumber: "+91 98765 43210",
  email: "support@sashvistudio.com",
  address: "123 Heritage Lane, Bangalore",
  freeDeliveryAbove: 1000,
  deliveryCharge: 100,
  gatewayFee: 3,
};

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function createJwt(payload: Record<string, unknown>) {
  const header = { alg: "HS256", typ: "JWT" };
  const encoded = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const signature = createHmac("sha256", JWT_SECRET!)
    .update(`${encoded(header)}.${encoded(payload)}`)
    .digest("base64url");
  return `${encoded(header)}.${encoded(payload)}.${signature}`;
}

function verifyJwt(token: string) {
  const [headerEncoded, payloadEncoded, signature] = token.split(".");
  if (!headerEncoded || !payloadEncoded || !signature) return null;
  const expected = createHmac("sha256", JWT_SECRET!)
    .update(`${headerEncoded}.${payloadEncoded}`)
    .digest("base64url");
  if (expected !== signature) return null;
  try {
    return JSON.parse(Buffer.from(payloadEncoded, "base64url").toString("utf-8"));
  } catch {
    return null;
  }
}

function getBearerToken(request: Request) {
  const auth = request.headers.get("authorization") || "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

async function requireAdmin(request: Request) {
  const token = getBearerToken(request);
  if (!token) return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  const payload = verifyJwt(token);
  if (!payload || payload.role !== "admin") return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  // ── Auth ──────────────────────────────────────────────────
  if (pathname === "/api/admin/login" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return jsonResponse({ error: "Admin credentials are not configured." }, { status: 500 });
    if (email !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) return jsonResponse({ error: "Invalid email or password." }, { status: 401 });
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
    return jsonResponse({ products: adminProducts });
  }

  if (pathname === "/api/admin/products" && method === "POST") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = await request.json().catch(() => ({}));
    const newProduct = {
      id: `prod-${Date.now()}`,
      slug: typeof body.slug === "string" ? body.slug.trim() : `product-${Date.now()}`,
      name: typeof body.name === "string" ? body.name.trim() : "New product",
      price: typeof body.salePrice === "number" ? body.salePrice : (typeof body.price === "number" ? body.price : 0),
      salePrice: typeof body.salePrice === "number" ? body.salePrice : 0,
      originalPrice: typeof body.originalPrice === "number" ? body.originalPrice : 0,
      image: typeof body.image === "string" ? body.image.trim() : "",
      images: Array.isArray(body.images) ? body.images : [],
      categories: Array.isArray(body.categories) ? body.categories : [body.productType ?? "sarees"],
      tags: Array.isArray(body.tags) ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean) : [],
      stock: typeof body.stock === "number" ? body.stock : 0,
      description: typeof body.description === "string" ? body.description.trim() : "",
      sku: typeof body.sku === "string" ? body.sku.trim() : `SS-${Date.now()}`,
      productType: (body.productType as Category) ?? "sarees",
      active: body.active !== false,
      fabricType: typeof body.fabricType === "string" ? body.fabricType : "",
      material: typeof body.material === "string" ? body.material : "",
      occasionWear: typeof body.occasionWear === "string" ? body.occasionWear : "",
      workType: typeof body.workType === "string" ? body.workType : "",
      sareeLength: typeof body.sareeLength === "number" ? body.sareeLength : undefined,
      blousePiece: body.blousePiece === "Yes" || body.blousePiece === "No" ? body.blousePiece : undefined,
      weight: typeof body.weight === "number" ? body.weight : undefined,
      featured: body.featured === true,
      buyOneGetOne: body.buyOneGetOne === true,
      colorVariants: Array.isArray(body.colorVariants) ? body.colorVariants : [],
    };
    adminProducts.unshift(newProduct as typeof adminProducts[0]);
    return jsonResponse({ product: newProduct });
  }

  if (pathname.startsWith("/api/admin/products/") && method === "PUT") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/products/", "");
    const body = await request.json().catch(() => ({}));
    const index = adminProducts.findIndex((p) => p.id === id);
    if (index === -1) return jsonResponse({ error: "Product not found." }, { status: 404 });
    const existing = adminProducts[index];
    const updated = {
      ...existing,
      ...body,
      id,
      price: typeof body.salePrice === "number" ? body.salePrice : (typeof body.price === "number" ? body.price : existing.price),
      categories: Array.isArray(body.categories) ? body.categories : existing.categories,
      tags: Array.isArray(body.tags) ? body.tags.map((t: unknown) => String(t).trim()).filter(Boolean) : existing.tags,
      images: Array.isArray(body.images) ? body.images : existing.images,
      colorVariants: Array.isArray(body.colorVariants) ? body.colorVariants : existing.colorVariants,
    };
    adminProducts[index] = updated;
    return jsonResponse({ product: updated });
  }

  if (pathname.startsWith("/api/admin/products/") && method === "DELETE") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/products/", "");
    const index = adminProducts.findIndex((p) => p.id === id);
    if (index === -1) return jsonResponse({ error: "Product not found." }, { status: 404 });
    adminProducts.splice(index, 1);
    return jsonResponse({});
  }

  // ── Categories ────────────────────────────────────────────
  if (pathname === "/api/admin/categories" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    return jsonResponse({ categories: adminCategories });
  }

  if (pathname === "/api/admin/categories" && method === "POST") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = await request.json().catch(() => ({}));
    const category = {
      id: `cat-${Date.now()}`,
      name: typeof body.name === "string" ? body.name.trim() : "New category",
      image: typeof body.image === "string" ? body.image.trim() : "",
      description: typeof body.description === "string" ? body.description.trim() : "",
      parent: typeof body.parent === "string" ? body.parent : "Sarees",
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : adminCategories.length + 1,
      active: body.active !== false,
    };
    adminCategories.push(category);
    return jsonResponse({ category });
  }

  if (pathname.startsWith("/api/admin/categories/") && method === "PUT") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/categories/", "");
    const body = await request.json().catch(() => ({}));
    const index = adminCategories.findIndex((c) => c.id === id);
    if (index === -1) return jsonResponse({ error: "Category not found." }, { status: 404 });
    adminCategories[index] = { ...adminCategories[index], ...body, id };
    return jsonResponse({ category: adminCategories[index] });
  }

  if (pathname.startsWith("/api/admin/categories/") && method === "DELETE") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/categories/", "");
    const index = adminCategories.findIndex((c) => c.id === id);
    if (index === -1) return jsonResponse({ error: "Category not found." }, { status: 404 });
    adminCategories.splice(index, 1);
    return jsonResponse({});
  }

  // ── Orders ────────────────────────────────────────────────
  if (pathname === "/api/admin/orders" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    return jsonResponse({ orders: adminOrders });
  }

  if (pathname.startsWith("/api/admin/orders/") && method === "PUT") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = decodeURIComponent(pathname.replace("/api/admin/orders/", ""));
    const body = await request.json().catch(() => ({}));
    const index = adminOrders.findIndex((o) => o.id === id);
    if (index === -1) return jsonResponse({ error: "Order not found." }, { status: 404 });
    adminOrders[index] = { ...adminOrders[index], ...body };
    return jsonResponse({ order: adminOrders[index] });
  }

  // ── Customers ─────────────────────────────────────────────
  if (pathname === "/api/admin/customers" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    return jsonResponse({ customers: adminCustomers });
  }

  // ── Reviews ───────────────────────────────────────────────
  if (pathname === "/api/admin/reviews" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    return jsonResponse({ reviews: adminReviews });
  }

  if (pathname.startsWith("/api/admin/reviews/") && method === "PATCH") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = Number(pathname.replace("/api/admin/reviews/", ""));
    const body = await request.json().catch(() => ({}));
    const index = adminReviews.findIndex((r) => r.id === id);
    if (index === -1) return jsonResponse({ error: "Review not found." }, { status: 404 });
    adminReviews[index] = { ...adminReviews[index], ...body };
    return jsonResponse({ review: adminReviews[index] });
  }

  if (pathname.startsWith("/api/admin/reviews/") && method === "DELETE") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = Number(pathname.replace("/api/admin/reviews/", ""));
    const index = adminReviews.findIndex((r) => r.id === id);
    if (index === -1) return jsonResponse({ error: "Review not found." }, { status: 404 });
    adminReviews.splice(index, 1);
    return jsonResponse({});
  }

  // ── Instagram Feed ────────────────────────────────────────
  if (pathname === "/api/admin/instagram-feed" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    return jsonResponse({ feed: adminInstagramFeed });
  }

  if (pathname === "/api/admin/instagram-feed" && method === "POST") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = await request.json().catch(() => ({}));
    const item: InstagramFeedItem = {
      id: `ig-${Date.now()}`,
      mediaType: body.mediaType === "reel" ? "reel" : "post",
      url: typeof body.url === "string" ? body.url.trim() : "",
      thumbnail: typeof body.thumbnail === "string" ? body.thumbnail.trim() : "",
      linkedProducts: Array.isArray(body.linkedProducts) ? body.linkedProducts : [],
      caption: typeof body.caption === "string" ? body.caption.trim() : "",
      isActive: body.isActive !== false,
    };
    adminInstagramFeed.unshift(item);
    return jsonResponse({ feed: adminInstagramFeed });
  }

  if (pathname.startsWith("/api/admin/instagram-feed/") && method === "DELETE") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/instagram-feed/", "");
    const index = adminInstagramFeed.findIndex((item) => item.id === id);
    if (index === -1) return jsonResponse({ error: "Item not found." }, { status: 404 });
    adminInstagramFeed.splice(index, 1);
    return jsonResponse({ feed: adminInstagramFeed });
  }

  // ── Coupons ───────────────────────────────────────────────
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
      ...adminCoupons[index],
      ...body,
      id,
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

  // ── Settings ──────────────────────────────────────────────
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

  // ── Image Upload ──────────────────────────────────────────
  if (pathname === "/api/admin/upload-image" && method === "POST") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    try {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!file || typeof (file as Blob).arrayBuffer !== "function") {
        return jsonResponse({ error: "No file uploaded." }, { status: 400 });
      }
      const arrayBuffer = await (file as Blob).arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileName = (file as File).name ?? `image-${Date.now()}.jpg`;
      const uploadResponse = await uploadImageToImageKit(buffer, `product-${Date.now()}-${fileName}`);
      return jsonResponse({ url: uploadResponse.url });
    } catch (err) {
      console.error("Image upload error:", err);
      return jsonResponse({ error: (err as Error).message ?? "Image upload failed." }, { status: 500 });
    }
  }

  // ── Public instagram feed ─────────────────────────────────
  if (pathname === "/api/instagram-feed" && method === "GET") {
    return jsonResponse({ feed: adminInstagramFeed.filter(i => i.isActive) });
  }

  return jsonResponse({ error: "Endpoint not found." }, { status: 404 });
}
