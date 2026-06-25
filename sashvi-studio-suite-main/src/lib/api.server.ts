import { createHmac } from "crypto";
import { INSTAGRAM_FEED, InstagramFeedItem } from "./instagram";
import { PRODUCTS, type Category } from "./products";
import { uploadImageToImageKit } from "./imagekit.server";
import { ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET } from "./env.server";

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET environment variable.");
}

const activeFeedItems = [...INSTAGRAM_FEED];

const adminProducts = PRODUCTS.map((product) => ({
  ...product,
  sku: `SS-${product.id}`,
  productType: product.categories[0] ?? "sarees",
  active: true,
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
  {
    id: "#SS-2418",
    customer: "Ananya R.",
    item: "Emerald Kanjivaram Silk Saree",
    total: 8499,
    status: "Processing",
    paymentStatus: "Paid",
    deliveryCharges: 100,
    gatewayFee: 255,
    address: "3/24, South Avenue, Chennai",
    orderDate: "2026-06-20",
  },
  {
    id: "#SS-2417",
    customer: "Lakshmi V.",
    item: "Ruby Temple Necklace Set",
    total: 3299,
    status: "Shipped",
    paymentStatus: "Paid",
    deliveryCharges: 100,
    gatewayFee: 99,
    address: "12, MG Road, Bangalore",
    orderDate: "2026-06-18",
  },
  {
    id: "#SS-2416",
    customer: "Sneha K.",
    item: "Bagru Mul Cotton Saree",
    total: 1799,
    status: "Delivered",
    paymentStatus: "Paid",
    deliveryCharges: 100,
    gatewayFee: 54,
    address: "7, Lake View, Hyderabad",
    orderDate: "2026-06-15",
  },
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

let adminBanners = [
  { id: "ban-1", desktop: "https://placehold.co/1200x400", mobile: "https://placehold.co/600x400", startDate: "2026-06-01", endDate: "2026-06-30", link: "/sarees", active: true },
  { id: "ban-2", desktop: "https://placehold.co/1200x400?text=Sale", mobile: "https://placehold.co/600x400?text=Sale", startDate: "2026-07-01", endDate: "2026-07-15", link: "/jewellery", active: true },
];

let adminCoupons = [
  { id: "cp-1", code: "SASHVI10", discountType: "percent", discountValue: 10, expiry: "2026-12-31", usageLimit: 100, minimumPurchase: 1999, active: true },
  { id: "cp-2", code: "FLAT500", discountType: "fixed", discountValue: 500, expiry: "2026-11-30", usageLimit: 50, minimumPurchase: 4999, active: true },
];

let adminSettings = {
  storeName: "Sashvi Studio",
  logo: "https://placehold.co/120x40?text=Sashvi",
  contactNumber: "+91 98765 43210",
  email: "support@sashvistudio.com",
  address: "123 Heritage Lane, Bangalore",
  freeDeliveryAbove: 1999,
  deliveryCharge: 100,
  gatewayFee: 3,
  razorpayKey: "rzp_test_12345",
  imageKitUrl: "https://example.imagekit.io/sashvi",
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
  const signature = createHmac("sha256", JWT_SECRET)
    .update(`${encoded(header)}.${encoded(payload)}`)
    .digest("base64url");
  return `${encoded(header)}.${encoded(payload)}.${signature}`;
}

function verifyJwt(token: string) {
  const [headerEncoded, payloadEncoded, signature] = token.split(".");
  if (!headerEncoded || !payloadEncoded || !signature) return null;
  const expected = createHmac("sha256", JWT_SECRET)
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
  if (!token) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = verifyJwt(token);
  if (!payload || payload.role !== "admin") {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  if (pathname === "/api/admin/login" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return jsonResponse({ error: "Admin credentials are not configured." }, { status: 500 });
    }

    if (email !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
      return jsonResponse({ error: "Invalid email or password." }, { status: 401 });
    }

    const token = createJwt({ role: "admin", email: ADMIN_EMAIL, issuedAt: Date.now() });
    return jsonResponse({ token, user: { email: ADMIN_EMAIL } });
  }

  if (pathname === "/api/admin/me" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    return jsonResponse({ user: { email: ADMIN_EMAIL } });
  }

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
      price: typeof body.price === "number" ? body.price : 0,
      image: typeof body.image === "string" ? body.image.trim() : "",
      categories: Array.isArray(body.categories) ? body.categories : [body.productType ?? "sarees"],
      tags: Array.isArray(body.tags) ? body.tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
      stock: typeof body.stock === "number" ? body.stock : 0,
      description: typeof body.description === "string" ? body.description.trim() : "",
      sku: typeof body.sku === "string" ? body.sku.trim() : `SS-${Date.now()}`,
      productType: (body.productType as Category) ?? (Array.isArray(body.categories) ? body.categories[0] : "sarees"),
      active: body.active !== false,
    };
    adminProducts.unshift(newProduct);
    return jsonResponse({ product: newProduct });
  }

  if (pathname.startsWith("/api/admin/products/") && method === "PUT") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/products/", "");
    const body = await request.json().catch(() => ({}));
    const index = adminProducts.findIndex((product) => product.id === id);
    if (index === -1) {
      return jsonResponse({ error: "Product not found." }, { status: 404 });
    }
    const existing = adminProducts[index];
    const updated = {
      ...existing,
      ...body,
      id,
      slug: typeof body.slug === "string" ? body.slug.trim() : existing.slug,
      categories: Array.isArray(body.categories) ? body.categories : existing.categories,
      tags: Array.isArray(body.tags) ? body.tags.map((tag) => String(tag).trim()).filter(Boolean) : existing.tags,
      productType: (body.productType as Category) ?? existing.productType,
      active: body.active !== false && body.active !== undefined ? body.active : existing.active,
      price: typeof body.price === "number" ? body.price : existing.price,
      stock: typeof body.stock === "number" ? body.stock : existing.stock,
    };
    adminProducts[index] = updated;
    return jsonResponse({ product: updated });
  }

  if (pathname.startsWith("/api/admin/products/") && method === "DELETE") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/products/", "");
    const index = adminProducts.findIndex((product) => product.id === id);
    if (index === -1) {
      return jsonResponse({ error: "Product not found." }, { status: 404 });
    }
    adminProducts.splice(index, 1);
    return jsonResponse({});
  }

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
    const index = adminCategories.findIndex((category) => category.id === id);
    if (index === -1) {
      return jsonResponse({ error: "Category not found." }, { status: 404 });
    }
    const updated = {
      ...adminCategories[index],
      ...body,
      name: typeof body.name === "string" ? body.name.trim() : adminCategories[index].name,
    };
    adminCategories[index] = updated;
    return jsonResponse({ category: updated });
  }

  if (pathname.startsWith("/api/admin/categories/") && method === "DELETE") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/categories/", "");
    const index = adminCategories.findIndex((category) => category.id === id);
    if (index === -1) {
      return jsonResponse({ error: "Category not found." }, { status: 404 });
    }
    adminCategories.splice(index, 1);
    return jsonResponse({});
  }

  if (pathname === "/api/admin/orders" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    return jsonResponse({ orders: adminOrders });
  }

  if (pathname.startsWith("/api/admin/orders/") && method === "PUT") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/orders/", "");
    const body = await request.json().catch(() => ({}));
    const index = adminOrders.findIndex((order) => order.id === id);
    if (index === -1) {
      return jsonResponse({ error: "Order not found." }, { status: 404 });
    }
    adminOrders[index] = { ...adminOrders[index], ...body };
    return jsonResponse({ order: adminOrders[index] });
  }

  if (pathname === "/api/admin/customers" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    return jsonResponse({ customers: adminCustomers });
  }

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
    const index = adminReviews.findIndex((review) => review.id === id);
    if (index === -1) {
      return jsonResponse({ error: "Review not found." }, { status: 404 });
    }
    adminReviews[index] = { ...adminReviews[index], ...body };
    return jsonResponse({ review: adminReviews[index] });
  }

  if (pathname.startsWith("/api/admin/reviews/") && method === "DELETE") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = Number(pathname.replace("/api/admin/reviews/", ""));
    const index = adminReviews.findIndex((review) => review.id === id);
    if (index === -1) {
      return jsonResponse({ error: "Review not found." }, { status: 404 });
    }
    adminReviews.splice(index, 1);
    return jsonResponse({});
  }

  if (pathname === "/api/admin/instagram-feed" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    return jsonResponse({ feed: activeFeedItems });
  }

  if (pathname === "/api/admin/instagram-feed" && method === "POST") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = await request.json().catch(() => ({}));
    const item: Partial<InstagramFeedItem> = {
      id: `ig-${Date.now()}`,
      title: typeof body.title === "string" ? body.title.trim() : "Untitled",
      url: typeof body.url === "string" ? body.url.trim() : "",
      mediaType: body.mediaType === "reel" ? "reel" : "post",
      thumbnail: typeof body.thumbnail === "string" ? body.thumbnail.trim() : "",
      productMap: typeof body.productMap === "object" && body.productMap ? body.productMap : {},
      caption: typeof body.caption === "string" ? body.caption.trim() : "",
      isActive: body.isActive !== false,
    };
    activeFeedItems.unshift(item as InstagramFeedItem);
    return jsonResponse({ feed: activeFeedItems });
  }

  if (pathname.startsWith("/api/admin/instagram-feed/") && method === "DELETE") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/instagram-feed/", "");
    const index = activeFeedItems.findIndex((item) => item.id === id);
    if (index === -1) {
      return jsonResponse({ error: "Item not found." }, { status: 404 });
    }
    activeFeedItems.splice(index, 1);
    return jsonResponse({ feed: activeFeedItems });
  }

  if (pathname === "/api/admin/banners" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    return jsonResponse({ banners: adminBanners });
  }

  if (pathname === "/api/admin/banners" && method === "POST") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = await request.json().catch(() => ({}));
    const banner = {
      id: `ban-${Date.now()}`,
      desktop: typeof body.desktop === "string" ? body.desktop.trim() : "",
      mobile: typeof body.mobile === "string" ? body.mobile.trim() : "",
      startDate: typeof body.startDate === "string" ? body.startDate : new Date().toISOString().slice(0, 10),
      endDate: typeof body.endDate === "string" ? body.endDate : new Date().toISOString().slice(0, 10),
      link: typeof body.link === "string" ? body.link.trim() : "/",
      active: body.active !== false,
    };
    adminBanners.push(banner);
    return jsonResponse({ banner });
  }

  if (pathname.startsWith("/api/admin/banners/") && method === "DELETE") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/banners/", "");
    const index = adminBanners.findIndex((banner) => banner.id === id);
    if (index === -1) {
      return jsonResponse({ error: "Banner not found." }, { status: 404 });
    }
    adminBanners.splice(index, 1);
    return jsonResponse({});
  }

  if (pathname === "/api/admin/coupons" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    return jsonResponse({ coupons: adminCoupons });
  }

  if (pathname === "/api/admin/coupons" && method === "POST") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = await request.json().catch(() => ({}));
    const coupon = {
      id: `cp-${Date.now()}`,
      code: typeof body.code === "string" ? body.code.trim() : "NEWCODE",
      discountType: body.discountType === "fixed" ? "fixed" : "percent",
      discountValue: typeof body.discountValue === "number" ? body.discountValue : 0,
      expiry: typeof body.expiry === "string" ? body.expiry : new Date().toISOString().slice(0, 10),
      usageLimit: typeof body.usageLimit === "number" ? body.usageLimit : 0,
      minimumPurchase: typeof body.minimumPurchase === "number" ? body.minimumPurchase : 0,
      active: body.active !== false,
    };
    adminCoupons.push(coupon);
    return jsonResponse({ coupon });
  }

  if (pathname.startsWith("/api/admin/coupons/") && method === "DELETE") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/admin/coupons/", "");
    const index = adminCoupons.findIndex((coupon) => coupon.id === id);
    if (index === -1) {
      return jsonResponse({ error: "Coupon not found." }, { status: 404 });
    }
    adminCoupons.splice(index, 1);
    return jsonResponse({});
  }

  if (pathname === "/api/admin/settings" && method === "GET") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    return jsonResponse({ settings: adminSettings });
  }

  if (pathname === "/api/admin/settings" && method === "PUT") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = await request.json().catch(() => ({}));
    adminSettings = { ...adminSettings, ...body };
    return jsonResponse({ settings: adminSettings });
  }

  if (pathname === "/api/admin/upload-image" && method === "POST") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof (file as any).arrayBuffer !== "function") {
      return jsonResponse({ error: "No file uploaded." }, { status: 400 });
    }

    const arrayBuffer = await (file as Blob).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadResponse = await uploadImageToImageKit(buffer, `product-${Date.now()}-${(file as any).name ?? "image"}`);

    return jsonResponse({ url: uploadResponse.url });
  }

  if (pathname === "/api/instagram-feed" && method === "GET") {
    return jsonResponse({ feed: activeFeedItems });
  }

  if (pathname === "/api/instagram-feed" && method === "POST") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const body = await request.json().catch(() => ({}));
    const item: Partial<InstagramFeedItem> = {
      id: `ig-${Date.now()}`,
      title: typeof body.title === "string" ? body.title.trim() : "Untitled",
      url: typeof body.url === "string" ? body.url.trim() : "",
      mediaType: body.mediaType === "reel" ? "reel" : "post",
      thumbnail: typeof body.thumbnail === "string" ? body.thumbnail.trim() : "",
      productMap: typeof body.productMap === "object" && body.productMap ? body.productMap : {},
      caption: typeof body.caption === "string" ? body.caption.trim() : "",
      isActive: body.isActive !== false,
    };
    activeFeedItems.unshift(item as InstagramFeedItem);
    return jsonResponse({ feed: activeFeedItems });
  }

  if (pathname.startsWith("/api/instagram-feed/") && method === "DELETE") {
    const unauthorized = await requireAdmin(request);
    if (unauthorized) return unauthorized;
    const id = pathname.replace("/api/instagram-feed/", "");
    const index = activeFeedItems.findIndex((item) => item.id === id);
    if (index === -1) {
      return jsonResponse({ error: "Item not found." }, { status: 404 });
    }
    activeFeedItems.splice(index, 1);
    return jsonResponse({ feed: activeFeedItems });
  }

  return jsonResponse({ error: "Endpoint not found." }, { status: 404 });
}
