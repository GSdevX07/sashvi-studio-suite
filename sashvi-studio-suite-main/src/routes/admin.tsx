import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Gem,
  Layers,
  Star,
  Sparkles,
  ShoppingBag,
  Users,
  MessageSquare,
  Instagram,
  Tag,
  Settings,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Pencil,
  Trash2,
  Plus,
  X,
  ChevronDown,
  FileText,
  Eye,
  Check,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { PRODUCTS, formatINR, SAREE_CATEGORIES, JEWELLERY_CATEGORIES, COMBO_CATEGORIES, Category } from "@/lib/products";

// ─── Constants ───────────────────────────────────────────────────────────────

const ADMIN_STORAGE_KEY = "sashvi_admin_token";
const PAGE_SIZE = 10;

const FABRIC_TYPES = [
  "Kanchipuram Silk","Banarasi Silk","Soft Silk","Organza","Chiffon","Georgette",
  "Cotton","Linen","Mul Cotton","Modal Silk","Gajji Silk","Mysore Silk","Crepe Silk","Jamdani",
];

const MATERIAL_TYPES = [
  "Gold","Silver","Gold Plated","Silver Plated","Brass","Copper","Alloy","Antique",
  "Temple Jewellery","Jadau Kundan","Oxidized Jewellery","Victorian Jewellery","Moissanite Jewellery",
];

const ORDER_STATUSES = ["Pending","Confirmed","Processing","Packed","Shipped","Out for Delivery","Delivered","Cancelled","Refunded"];

const NAV = [
  { label: "Dashboard",      icon: LayoutDashboard },
  { label: "Products",       icon: Package },
  { label: "Categories",     icon: Tag },
  { label: "Sarees",         icon: Sparkles },
  { label: "Jewellery",      icon: Gem },
  { label: "Combos",         icon: Layers },
  { label: "Orders",         icon: ShoppingBag },
  { label: "Customers",      icon: Users },
  { label: "Reviews",        icon: MessageSquare },
  { label: "Instagram Feed", icon: Instagram },
  { label: "Coupons",        icon: Star },
  { label: "Inventory",      icon: TrendingUp },
  { label: "Settings",       icon: Settings },
] as const;

type AdminSection = (typeof NAV)[number]["label"];

// ─── Types ───────────────────────────────────────────────────────────────────

type ColorVariant = { id: string; color: string; stock: number; originalPrice: number; salePrice: number };

type ProductAdmin = {
  id: string; slug: string; name: string; price: number;
  image: string; images?: string[]; categories: string[]; tags: string[];
  stock: number; description: string; sku: string;
  productType: Category; active: boolean;
  originalPrice?: number; salePrice?: number;
  fabricType?: string; material?: string; occasionWear?: string; workType?: string;
  sareeLength?: number; blousePiece?: "Yes" | "No"; weight?: number;
  featured?: boolean; buyOneGetOne?: boolean; colorVariants?: ColorVariant[];
};

type ProductFormState = {
  id: string; slug: string; name: string; price: number;
  originalPrice: number; salePrice: number;
  image: string; images: string[];
  categories: string[]; tags: string[]; stock: number;
  description: string; sku: string;
  productType: "sarees" | "jewellery" | "combos"; active: boolean;
  fabricType: string; occasionWear: string; workType: string;
  sareeLength: number; blousePiece: "Yes" | "No";
  weight: number; material: string;
  featured: boolean; buyOneGetOne: boolean;
  colorVariants: ColorVariant[];
};

type CategoryAdmin = { id: string; name: string; image: string; description: string; parent: string; sortOrder: number; active: boolean };
type OrderAdmin = { id: string; customer: string; item: string; total: number; status: string; paymentStatus: string; deliveryCharges: number; gatewayFee: number; address: string; orderDate: string };
type CustomerAdmin = { id: string; name: string; email: string; totalSpend: number; lastOrder: string; orders: number; address: string };
type ReviewAdmin = { id: number; name: string; product: string; rating: number; comment: string; status: "Pending" | "Approved"; featured: boolean; date: string };
type InstagramLinkedProduct = { name: string; url: string };
type InstagramFeedItem = { id: string; mediaType: "post" | "reel"; url: string; thumbnail: string; linkedProducts: InstagramLinkedProduct[]; caption: string; isActive: boolean };
type CouponAdmin = { id: string; code: string; category: string; discountType: "fixed" | "percent"; discountValue: number; expiry: string; usageLimit: number; minimumPurchase: number; active: boolean };
type SettingsAdmin = { storeName: string; logo: string; contactNumber: string; email: string; address: string; freeDeliveryAbove: number; deliveryCharge: number; gatewayFee: number };

// ─── Helper Components ────────────────────────────────────────────────────────

const FL = "mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground";
const FI = "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent";
const FSel = "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent";
const FBtn = "rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50";
const FBtnSec = "rounded-full border border-border px-4 py-2.5 text-xs hover:border-accent";

function ComboBox({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <div className="flex items-center overflow-hidden rounded-xl border border-border bg-background focus-within:border-accent">
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="flex-1 bg-transparent px-4 py-2.5 text-sm text-foreground outline-none" />
        <button type="button" onClick={() => setOpen(!open)} className="px-3 py-2.5 border-l border-border text-muted-foreground hover:text-foreground transition">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-y-auto rounded-xl border border-border bg-background shadow-lg" style={{ maxHeight: 200 }}>
          {options.map(opt => (
            <div key={opt} onClick={() => { onChange(opt); setOpen(false); }} className="cursor-pointer px-3 py-2.5 text-sm hover:bg-secondary">{opt}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function MultiSelectDropdown({ value, onChange, options, placeholder }: { value: string[]; onChange: (v: string[]) => void; options: string[]; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-2.5 text-left text-sm outline-none focus:border-accent">
        <span className={value.length > 0 ? "text-foreground line-clamp-1" : "text-muted-foreground"}>{value.length > 0 ? value.join(", ") : (placeholder ?? "Select…")}</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-y-auto rounded-xl border border-border bg-background shadow-lg" style={{ maxHeight: 260 }}>
          {options.map(opt => (
            <label key={opt} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-secondary">
              <input type="checkbox" checked={value.includes(opt)} onChange={e => { if (e.target.checked) onChange([...value, opt]); else onChange(value.filter(v => v !== opt)); }} className="rounded border-border" />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`relative w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl`}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-xl">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatCard({ label, value, delta, up = true, icon: Icon }: { label: string; value: string; delta: string; up?: boolean; icon: typeof IndianRupee }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="eyebrow">{label}</div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-accent"><Icon className="h-4 w-4" /></div>
      </div>
      <div className="mt-3 font-display text-3xl text-foreground">{value}</div>
      <div className={`mt-1 inline-flex items-center gap-1 text-xs ${up ? "text-emerald-700" : "text-destructive"}`}>
        {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />} {delta}
      </div>
    </div>
  );
}

function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-display text-2xl">{title}</h2>
        <p className="text-sm text-muted-foreground">Manage {title.toLowerCase()} with search, edit, and quick actions.</p>
      </div>
      {actionLabel && onAction ? (
        <button onClick={onAction} type="button" className={FBtn}>{actionLabel}</button>
      ) : null}
    </div>
  );
}

function Pagination({ page, total, onPage }: { page: number; total: number; onPage: (p: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground pt-4">
      <span>Page {page} of {total}</span>
      <div className="flex gap-2">
        <button type="button" disabled={page === 1} onClick={() => onPage(Math.max(page - 1, 1))} className={FBtnSec + " disabled:opacity-50"}>Previous</button>
        <button type="button" disabled={page >= total} onClick={() => onPage(Math.min(page + 1, total))} className={FBtnSec + " disabled:opacity-50"}>Next</button>
      </div>
    </div>
  );
}

// ─── Invoice Download ────────────────────────────────────────────────────────

function downloadInvoice(order: OrderAdmin) {
  const subtotal = order.total - order.deliveryCharges - order.gatewayFee;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Invoice ${order.id}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Georgia,serif;color:#222;background:#fff}.page{max-width:640px;margin:48px auto;padding:0 24px 48px}.brand{text-align:center;border-bottom:2px solid #c8a97a;padding-bottom:24px;margin-bottom:24px}.brand h1{font-size:28px;letter-spacing:4px;text-transform:uppercase;color:#2a1a08}.brand p{font-size:12px;letter-spacing:2px;color:#8a6a40;margin-top:4px}.inv{text-align:center;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#8a6a40;margin-bottom:24px}.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e8ddd0;font-size:14px}.label{color:#666}.val{font-weight:600}.total{display:flex;justify-content:space-between;padding:14px 0;font-size:16px;font-weight:700;border-top:2px solid #c8a97a;margin-top:8px}.footer{text-align:center;margin-top:40px;font-size:11px;color:#999;letter-spacing:1px}</style>
</head><body><div class="page">
<div class="brand"><h1>Sashvi Studio</h1><p>Sarees &amp; Jewellery</p></div>
<div class="inv">Invoice</div>
<div class="row"><span class="label">Order ID</span><span class="val">${order.id}</span></div>
<div class="row"><span class="label">Date</span><span class="val">${order.orderDate}</span></div>
<div class="row"><span class="label">Customer</span><span class="val">${order.customer}</span></div>
<div class="row"><span class="label">Delivery Address</span><span class="val">${order.address}</span></div>
<div class="row"><span class="label">Item</span><span class="val">${order.item}</span></div>
<div class="row"><span class="label">Subtotal</span><span class="val">₹${subtotal.toLocaleString("en-IN")}</span></div>
<div class="row"><span class="label">Delivery Charges</span><span class="val">₹${order.deliveryCharges.toLocaleString("en-IN")}</span></div>
<div class="row"><span class="label">Gateway Fee</span><span class="val">₹${order.gatewayFee.toLocaleString("en-IN")}</span></div>
<div class="total"><span>Total</span><span>₹${order.total.toLocaleString("en-IN")}</span></div>
<div class="row"><span class="label">Payment</span><span class="val">${order.paymentStatus}</span></div>
<div class="row"><span class="label">Status</span><span class="val">${order.status}</span></div>
<div class="footer">Thank you for shopping with Sashvi Studio · support@sashvistudio.com</div>
</div></body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoice-${order.id.replace("#", "")}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Default data ─────────────────────────────────────────────────────────────

const emptyProductForm: ProductFormState = {
  id: "", slug: "", name: "", price: 0, originalPrice: 0, salePrice: 0,
  image: "", images: [], categories: [], tags: [], stock: 0,
  description: "", sku: "", productType: "sarees", active: true,
  fabricType: "", occasionWear: "", workType: "",
  sareeLength: 5.5, blousePiece: "Yes",
  weight: 0, material: "",
  featured: false, buyOneGetOne: false, colorVariants: [],
};

const emptyCouponForm = { code: "", category: "All", discountType: "percent" as "percent"|"fixed", discountValue: 10, expiry: "", usageLimit: 100, minimumPurchase: 0 };
const emptyIgForm = { mediaType: "post" as "post"|"reel", url: "", caption: "", linkedProducts: [] as InstagramLinkedProduct[] };
const emptyCatForm = { parent: "Sarees", name: "", description: "" };

function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

// ─── Admin Component ──────────────────────────────────────────────────────────

function Admin() {
  const [token,        setToken]        = useState<string | null>(null);
  const [user,         setUser]         = useState<{ email: string } | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [authError,    setAuthError]    = useState<string | null>(null);
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");

  const [activeSection, setActiveSection] = useState<AdminSection>("Dashboard");
  const [searchQuery,   setSearchQuery]   = useState("");

  // Products
  const [products,        setProducts]        = useState<ProductAdmin[]>([]);
  const [productFilter,   setProductFilter]   = useState<"all" | Category>("all");
  const [productPage,     setProductPage]     = useState(1);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productFiles,    setProductFiles]    = useState<File[]>([]);
  const [formError,       setFormError]       = useState<string | null>(null);
  const [formSaving,      setFormSaving]      = useState(false);
  const [pf,              setPf]              = useState<ProductFormState>(emptyProductForm);

  // Categories
  const [categories,      setCategories]      = useState<CategoryAdmin[]>([]);
  const [catModalOpen,    setCatModalOpen]    = useState(false);
  const [editingCat,      setEditingCat]      = useState<CategoryAdmin | null>(null);
  const [catForm,         setCatForm]         = useState(emptyCatForm);

  // Orders
  const [orders,          setOrders]          = useState<OrderAdmin[]>([]);
  const [ordersPage,      setOrdersPage]      = useState(1);
  const [orderDetailId,   setOrderDetailId]   = useState<string | null>(null);

  // Customers
  const [customers,       setCustomers]       = useState<CustomerAdmin[]>([]);
  const [customerPage,    setCustomerPage]    = useState(1);

  // Reviews
  const [reviews,         setReviews]         = useState<ReviewAdmin[]>([]);
  const [reviewPage,      setReviewPage]      = useState(1);

  // Instagram Feed
  const [igFeed,          setIgFeed]          = useState<InstagramFeedItem[]>([]);
  const [igModalOpen,     setIgModalOpen]     = useState(false);
  const [igForm,          setIgForm]          = useState(emptyIgForm);
  const [igLinked,        setIgLinked]        = useState<InstagramLinkedProduct[]>([]);

  // Coupons
  const [coupons,         setCoupons]         = useState<CouponAdmin[]>([]);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon,   setEditingCoupon]   = useState<CouponAdmin | null>(null);
  const [couponForm,      setCouponForm]      = useState(emptyCouponForm);

  // Inventory
  const [editingStockId,  setEditingStockId]  = useState<string | null>(null);
  const [stockValue,      setStockValue]      = useState(0);

  // Settings
  const [settings,        setSettings]        = useState<SettingsAdmin>({ storeName: "Sashvi Studio", logo: "", contactNumber: "+91 98765 43210", email: "support@sashvistudio.com", address: "123 Heritage Lane, Bangalore", freeDeliveryAbove: 1000, deliveryCharge: 100, gatewayFee: 3 });
  const [settingsSaving,  setSettingsSaving]  = useState(false);

  // ── API helpers ──────────────────────────────────────────────────────────────

  function authHeaders(): Record<string, string> {
    return { Authorization: token ? `Bearer ${token}` : "", "Content-Type": "application/json" };
  }

  async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`/api/admin/${path}`, { ...init, headers: { ...(init?.headers as Record<string, string>), ...authHeaders() } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((json as { error?: string }).error || "Request failed");
    return json as T;
  }

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd, headers: { Authorization: token ? `Bearer ${token}` : "" } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((json as { error?: string }).error || "Upload failed");
    return (json as { url: string }).url;
  }

  // ── Auth effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(ADMIN_STORAGE_KEY);
    if (saved) setToken(saved); else setInitializing(false);
  }, []);

  useEffect(() => {
    if (!token) return;
    setInitializing(true);
    fetch("/api/admin/me", { headers: authHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: { user: { email: string } }) => { setUser(d.user); setAuthError(null); })
      .catch(() => { window.localStorage.removeItem(ADMIN_STORAGE_KEY); setToken(null); setUser(null); })
      .finally(() => setInitializing(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Load admin data ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api<{ products: ProductAdmin[] }>("products"),
      api<{ categories: CategoryAdmin[] }>("categories"),
      api<{ orders: OrderAdmin[] }>("orders"),
      api<{ customers: CustomerAdmin[] }>("customers"),
      api<{ reviews: ReviewAdmin[] }>("reviews"),
      api<{ feed: InstagramFeedItem[] }>("instagram-feed"),
      api<{ coupons: CouponAdmin[] }>("coupons"),
      api<{ settings: SettingsAdmin }>("settings"),
    ]).then(([p, c, o, cu, rv, ig, cp, s]) => {
      setProducts(p.products);
      setCategories(c.categories);
      setOrders(o.orders);
      setCustomers(cu.customers);
      setReviews(rv.reviews);
      setIgFeed(ig.feed);
      setCoupons(cp.coupons);
      setSettings(s.settings);
    }).catch(err => console.warn("Failed to load admin data", err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Login ────────────────────────────────────────────────────────────────────

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setInitializing(true);
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const d = await res.json();
      if (!res.ok) { setAuthError(d.error || "Login failed."); return; }
      setToken(d.token);
      window.localStorage.setItem(ADMIN_STORAGE_KEY, d.token);
      setUser({ email: d.user.email });
      setEmail(""); setPassword("");
    } catch { setAuthError("Network error. Please try again."); }
    finally { setInitializing(false); }
  }

  function logout() { window.localStorage.removeItem(ADMIN_STORAGE_KEY); setToken(null); setUser(null); setActiveSection("Dashboard"); }

  // ── Product handlers ──────────────────────────────────────────────────────────

  function openProductForm(product?: ProductAdmin) {
    setFormError(null);
    setProductFiles([]);
    if (product) {
      setPf({
        id: product.id, slug: product.slug, name: product.name,
        price: product.price,
        originalPrice: product.originalPrice ?? product.price,
        salePrice: product.salePrice ?? product.price,
        image: product.image, images: product.images ?? [],
        categories: product.categories,
        tags: product.tags,
        stock: product.stock, description: product.description ?? "",
        sku: product.sku, productType: product.productType, active: product.active,
        fabricType: product.fabricType ?? "",
        occasionWear: product.occasionWear ?? "",
        workType: product.workType ?? "",
        sareeLength: product.sareeLength ?? 5.5,
        blousePiece: product.blousePiece ?? "Yes",
        weight: product.weight ?? 0,
        material: product.material ?? "",
        featured: product.featured ?? false,
        buyOneGetOne: product.buyOneGetOne ?? false,
        colorVariants: product.colorVariants ?? [],
      });
      setEditingProductId(product.id);
    } else {
      setPf(emptyProductForm);
      setEditingProductId(null);
    }
    setProductFormOpen(true);
  }

  async function saveProduct() {
    setFormError(null);
    if (!pf.name.trim()) { setFormError("Product name is required."); return; }
    if (pf.salePrice <= 0) { setFormError("Sale price must be greater than 0."); return; }
    setFormSaving(true);
    try {
      // Upload new images
      let allImages = [...pf.images];
      if (productFiles.length > 0) {
        const uploaded = await Promise.all(productFiles.map(f => uploadFile(f)));
        allImages = [...allImages, ...uploaded];
      }
      const primaryImage = allImages[0] ?? pf.image ?? "";
      const slug = pf.slug.trim() || slugify(pf.name);
      const payload = {
        ...pf,
        slug,
        price: pf.salePrice,
        image: primaryImage,
        images: allImages,
        categories: [pf.productType],
        tags: pf.tags,
        sku: pf.sku.trim() || `SS-${Date.now()}`,
      };
      if (editingProductId) {
        await api(`products/${editingProductId}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api("products", { method: "POST", body: JSON.stringify(payload) });
      }
      const r = await api<{ products: ProductAdmin[] }>("products");
      setProducts(r.products);
      setProductFormOpen(false);
      setEditingProductId(null);
      setProductPage(1);
    } catch (err) { setFormError((err as Error).message); }
    finally { setFormSaving(false); }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    await api(`products/${id}`, { method: "DELETE" });
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  function addColorVariant() {
    const v: ColorVariant = { id: `v-${Date.now()}`, color: "", stock: 0, originalPrice: pf.originalPrice, salePrice: pf.salePrice };
    setPf(prev => ({ ...prev, colorVariants: [...prev.colorVariants, v] }));
  }

  function updateVariant(id: string, field: keyof ColorVariant, value: string | number) {
    setPf(prev => ({ ...prev, colorVariants: prev.colorVariants.map(v => v.id === id ? { ...v, [field]: value } : v) }));
  }

  function removeVariant(id: string) {
    setPf(prev => ({ ...prev, colorVariants: prev.colorVariants.filter(v => v.id !== id) }));
  }

  // ── Category handlers ─────────────────────────────────────────────────────────

  function openCatModal(cat?: CategoryAdmin) {
    setEditingCat(cat ?? null);
    setCatForm(cat ? { parent: cat.parent, name: cat.name, description: cat.description } : emptyCatForm);
    setCatModalOpen(true);
  }

  async function saveCat() {
    if (!catForm.name.trim()) return;
    if (editingCat) {
      const r = await api<{ category: CategoryAdmin }>(`categories/${editingCat.id}`, { method: "PUT", body: JSON.stringify(catForm) });
      setCategories(prev => prev.map(c => c.id === editingCat.id ? r.category : c));
    } else {
      const r = await api<{ category: CategoryAdmin }>("categories", { method: "POST", body: JSON.stringify({ ...catForm, sortOrder: categories.length + 1, active: true }) });
      setCategories(prev => [...prev, r.category]);
    }
    setCatModalOpen(false);
  }

  async function deleteCat(id: string) {
    if (!confirm("Delete this category?")) return;
    await api(`categories/${id}`, { method: "DELETE" });
    setCategories(prev => prev.filter(c => c.id !== id));
  }

  // ── Order handlers ────────────────────────────────────────────────────────────

  async function updateOrderStatus(id: string, status: string) {
    await api(`orders/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ status }) });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  }

  // ── Review handlers ───────────────────────────────────────────────────────────

  async function approveReview(id: number) {
    await api(`reviews/${id}`, { method: "PATCH", body: JSON.stringify({ status: "Approved" }) });
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: "Approved" } : r));
  }

  async function deleteReview(id: number) {
    await api(`reviews/${id}`, { method: "DELETE" });
    setReviews(prev => prev.filter(r => r.id !== id));
  }

  // ── Instagram Feed handlers ───────────────────────────────────────────────────

  function openIgModal() { setIgForm(emptyIgForm); setIgLinked([]); setIgModalOpen(true); }

  async function saveIgItem() {
    if (!igForm.url.trim()) return;
    const item = { ...igForm, linkedProducts: igLinked };
    const r = await api<{ feed: InstagramFeedItem[] }>("instagram-feed", { method: "POST", body: JSON.stringify(item) });
    setIgFeed(r.feed);
    setIgModalOpen(false);
  }

  async function deleteIgItem(id: string) {
    const r = await api<{ feed: InstagramFeedItem[] }>(`instagram-feed/${id}`, { method: "DELETE" });
    setIgFeed(r.feed);
  }

  // ── Coupon handlers ───────────────────────────────────────────────────────────

  function openCouponModal(coupon?: CouponAdmin) {
    setEditingCoupon(coupon ?? null);
    setCouponForm(coupon ? { code: coupon.code, category: coupon.category, discountType: coupon.discountType, discountValue: coupon.discountValue, expiry: coupon.expiry, usageLimit: coupon.usageLimit, minimumPurchase: coupon.minimumPurchase } : emptyCouponForm);
    setCouponModalOpen(true);
  }

  async function saveCoupon() {
    if (!couponForm.code.trim()) return;
    if (editingCoupon) {
      const r = await api<{ coupon: CouponAdmin }>(`coupons/${editingCoupon.id}`, { method: "PUT", body: JSON.stringify(couponForm) });
      setCoupons(prev => prev.map(c => c.id === editingCoupon.id ? r.coupon : c));
    } else {
      const r = await api<{ coupon: CouponAdmin }>("coupons", { method: "POST", body: JSON.stringify(couponForm) });
      setCoupons(prev => [...prev, r.coupon]);
    }
    setCouponModalOpen(false);
  }

  async function deleteCoupon(id: string) {
    if (!confirm("Delete coupon?")) return;
    await api(`coupons/${id}`, { method: "DELETE" });
    setCoupons(prev => prev.filter(c => c.id !== id));
  }

  // ── Inventory ─────────────────────────────────────────────────────────────────

  async function saveStock(product: ProductAdmin) {
    await api(`products/${product.id}`, { method: "PUT", body: JSON.stringify({ stock: stockValue }) });
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: stockValue } : p));
    setEditingStockId(null);
  }

  // ── Settings ──────────────────────────────────────────────────────────────────

  async function saveSettings() {
    setSettingsSaving(true);
    try {
      const r = await api<{ settings: SettingsAdmin }>("settings", { method: "PUT", body: JSON.stringify(settings) });
      setSettings(r.settings);
      alert("Settings saved successfully.");
    } finally { setSettingsSaving(false); }
  }

  // ── Computed values ───────────────────────────────────────────────────────────

  const totalRevenue = useMemo(() => orders.reduce((s, o) => s + o.total, 0), [orders]);
  const deliveredCount = useMemo(() => orders.filter(o => o.status === "Delivered").length, [orders]);
  const deliveredPct = orders.length > 0 ? Math.round((deliveredCount / orders.length) * 100) : 0;
  const lowStockCount = useMemo(() => products.filter(p => p.stock <= 5).length, [products]);
  const lowStockPct = products.length > 0 ? Math.round((lowStockCount / products.length) * 100) : 0;

  const filteredProducts = useMemo(() => products.filter(p =>
    (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (productFilter === "all" || p.categories.includes(productFilter))
  ), [products, searchQuery, productFilter]);

  const filteredOrders = useMemo(() => orders.filter(o =>
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) || o.customer.toLowerCase().includes(searchQuery.toLowerCase())
  ), [orders, searchQuery]);

  const filteredCustomers = useMemo(() => customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase())
  ), [customers, searchQuery]);

  const filteredReviews = useMemo(() => reviews.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.product.toLowerCase().includes(searchQuery.toLowerCase())
  ), [reviews, searchQuery]);

  const tp = (len: number) => Math.max(1, Math.ceil(len / PAGE_SIZE));
  const pg = <T,>(arr: T[], page: number) => arr.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const orderDetail = orderDetailId ? orders.find(o => o.id === orderDetailId) : null;

  // ─────────────────────────────────────────────────────────────────────────────
  // Login screen
  // ─────────────────────────────────────────────────────────────────────────────

  if (!user && !initializing) {
    return (
      <div className="min-h-screen bg-background px-4 py-20 text-foreground">
        <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-border bg-card p-8 shadow-luxe sm:p-12">
          <div className="mb-8 text-center"><Logo /><h1 className="mt-6 font-display text-4xl">Admin Sign In</h1><p className="mt-3 text-sm text-muted-foreground">Secure access to Sashvi Studio's admin dashboard.</p></div>
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className={FL}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={FI} placeholder="admin@sashvistudio.com" required />
            </div>
            <div>
              <label className={FL}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={FI} placeholder="••••••••" required />
            </div>
            {authError && <p className="text-sm text-destructive">{authError}</p>}
            <button type="submit" disabled={initializing} className={FBtn + " w-full py-3"}>{initializing ? "Signing in…" : "Sign In"}</button>
          </form>
        </div>
      </div>
    );
  }

  if (initializing) {
    return <div className="flex min-h-screen items-center justify-center"><div className="text-muted-foreground text-sm animate-pulse">Loading…</div></div>;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Main admin layout
  // ─────────────────────────────────────────────────────────────────────────────

  const catStyles = pf.productType === "sarees" ? SAREE_CATEGORIES : pf.productType === "jewellery" ? JEWELLERY_CATEGORIES : COMBO_CATEGORIES;

  return (
    <div className="min-h-screen bg-secondary/50 text-foreground">
      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-border bg-background lg:block">
          <div className="border-b border-border px-5 py-4"><Logo /></div>
          <nav className="space-y-0.5 p-3">
            {NAV.map(n => (
              <button key={n.label} type="button" onClick={() => { setActiveSection(n.label); setSearchQuery(""); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${activeSection === n.label ? "bg-foreground text-background" : "text-foreground/75 hover:bg-secondary"}`}>
                <n.icon className="h-4 w-4 shrink-0" /> {n.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-5 lg:px-8">
              <div><div className="eyebrow text-xs uppercase tracking-widest text-muted-foreground">Studio</div><h1 className="font-display text-lg">{activeSection}</h1></div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-xs text-muted-foreground">{user?.email}</span>
                <Link to="/" className={FBtnSec + " text-xs"}>View Site</Link>
                <button type="button" onClick={logout} className={FBtnSec + " text-xs"}>Logout</button>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-5 lg:p-8">

            {/* ── DASHBOARD ──────────────────────────────────────────── */}
            {activeSection === "Dashboard" && (
              <>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Revenue (total)" value={formatINR(totalRevenue)} delta={`${orders.length} orders`} icon={IndianRupee} />
                  <StatCard label="Orders" value={String(orders.length)} delta={`${deliveredPct}% delivered`} icon={ShoppingBag} />
                  <StatCard label="Customers" value={String(customers.length)} delta={`${customers.length} registered`} icon={Users} />
                  <StatCard label="Low Stock" value={String(lowStockCount)} delta={`${lowStockPct}% of catalog`} up={false} icon={TrendingDown} />
                </div>
                <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
                  <section className="rounded-2xl border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border px-6 py-4">
                      <h2 className="font-display text-lg">Recent Orders</h2>
                      <button type="button" onClick={() => setActiveSection("Orders")} className="text-xs uppercase tracking-widest text-accent">View all</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                          <tr className="border-b border-border"><th className="px-5 py-3">Order</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Status</th></tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 5).map(o => (
                            <tr key={o.id} className="border-b border-border/60 last:border-0">
                              <td className="px-5 py-3 font-medium">{o.id}</td>
                              <td className="px-5 py-3 text-foreground/80">{o.customer}</td>
                              <td className="px-5 py-3">{formatINR(o.total)}</td>
                              <td className="px-5 py-3">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${o.status === "Delivered" ? "bg-emerald-100 text-emerald-800" : o.status === "Shipped" ? "bg-accent/15 text-accent" : "bg-secondary text-foreground/80"}`}>{o.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                  <section className="rounded-2xl border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border px-6 py-4">
                      <h2 className="font-display text-lg">Top Catalog</h2>
                      <button type="button" onClick={() => setActiveSection("Products")} className="text-xs uppercase tracking-widest text-accent">Manage</button>
                    </div>
                    <ul className="divide-y divide-border">
                      {PRODUCTS.slice(0, 5).map(p => (
                        <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                          <img src={p.image} alt={p.name} className="h-10 w-10 rounded-xl object-cover" />
                          <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{p.name}</div><div className="text-xs text-muted-foreground capitalize">{p.categories.join(" · ")}</div></div>
                          <div className="text-sm font-medium">{formatINR(p.price)}</div>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
                <section className="grid gap-5 md:grid-cols-3">
                  {([{ label: "Add Product", target: "Products" }, { label: "Approve Reviews", target: "Reviews" }, { label: "Create Coupon", target: "Coupons" }] as { label: string; target: AdminSection }[]).map(a => (
                    <div key={a.label} className="rounded-2xl border border-dashed border-border bg-card/60 p-6">
                      <div className="eyebrow mb-2 text-xs uppercase tracking-widest text-muted-foreground">Quick action</div>
                      <h3 className="font-display text-xl">{a.label}</h3>
                      <button type="button" onClick={() => setActiveSection(a.target)} className={`mt-4 ${FBtn}`}>Open</button>
                    </div>
                  ))}
                </section>
              </>
            )}

            {/* ── PRODUCTS ───────────────────────────────────────────── */}
            {activeSection === "Products" && (
              <div className="space-y-6">
                <SectionHeader title="Products" actionLabel="Add Product" onAction={() => openProductForm()} />
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                    <input type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search products…" className={FI + " sm:max-w-xs"} />
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <label className="flex items-center gap-2 text-muted-foreground text-sm">
                        Category
                        <select value={productFilter} onChange={e => setProductFilter(e.target.value as "all" | Category)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none">
                          <option value="all">All</option>
                          <option value="sarees">Sarees</option>
                          <option value="jewellery">Jewellery</option>
                          <option value="combos">Combos</option>
                        </select>
                      </label>
                      <span className="text-xs text-muted-foreground">{filteredProducts.length} of {products.length}</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                        <tr className="border-b border-border"><th className="px-3 py-3">Product</th><th className="px-3 py-3">Price</th><th className="px-3 py-3">Stock</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Actions</th></tr>
                      </thead>
                      <tbody>
                        {pg(filteredProducts, productPage).map(product => (
                          <tr key={product.id} className="border-b border-border/60 last:border-0">
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                <img src={product.image} alt={product.name} className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                                <div><div className="font-medium line-clamp-1">{product.name}</div><div className="text-xs text-muted-foreground">{product.sku}</div></div>
                              </div>
                            </td>
                            <td className="px-3 py-3">{formatINR(product.salePrice ?? product.price)}</td>
                            <td className="px-3 py-3"><span className={product.stock === 0 ? "text-destructive font-medium" : product.stock <= 5 ? "text-amber-600 font-medium" : ""}>{product.stock}</span></td>
                            <td className="px-3 py-3 capitalize">{product.productType}</td>
                            <td className="px-3 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => openProductForm(product)} className={FBtnSec}><Pencil className="inline h-3 w-3 mr-1" />Edit</button>
                                <button type="button" onClick={() => deleteProduct(product.id)} className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10"><Trash2 className="inline h-3 w-3 mr-1" />Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={productPage} total={tp(filteredProducts.length)} onPage={setProductPage} />
                </div>

                {/* Product Form */}
                {productFormOpen && (
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <SectionHeader title={editingProductId ? "Edit Product" : "Add Product"} actionLabel="Close" onAction={() => setProductFormOpen(false)} />

                    {/* Product Type Selector */}
                    <div className="mb-6">
                      <label className={FL}>Product Type</label>
                      <div className="flex gap-3">
                        {(["sarees","jewellery","combos"] as const).map(t => (
                          <button key={t} type="button" onClick={() => setPf(prev => ({ ...prev, productType: t, tags: [], categories: [t] }))}
                            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-widest capitalize transition ${pf.productType === t ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-accent"}`}>
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      {/* Name */}
                      <div className="lg:col-span-2">
                        <label className={FL}>Product Name</label>
                        <input value={pf.name} onChange={e => setPf(prev => ({ ...prev, name: e.target.value, slug: slugify(e.target.value) }))} className={FI} placeholder={pf.productType === "sarees" ? "e.g. Emerald Kanjivaram Silk Saree" : "e.g. Temple Gold Necklace Set"} />
                      </div>

                      {/* Category Style */}
                      <div className="lg:col-span-2">
                        <label className={FL}>Category Style (select all that apply)</label>
                        <MultiSelectDropdown value={pf.tags} onChange={v => setPf(prev => ({ ...prev, tags: v }))} options={catStyles} placeholder="Select category styles…" />
                      </div>

                      {/* Description */}
                      <div className="lg:col-span-2">
                        <label className={FL}>Description</label>
                        <textarea value={pf.description} onChange={e => setPf(prev => ({ ...prev, description: e.target.value }))} className={FI} rows={3} />
                      </div>

                      {/* Sale Price */}
                      <div>
                        <label className={FL}>Sale Price (₹)</label>
                        <input type="number" value={pf.salePrice || ""} onChange={e => setPf(prev => ({ ...prev, salePrice: Number(e.target.value), price: Number(e.target.value) }))} className={FI} placeholder="0" min={0} />
                      </div>

                      {/* Original Price */}
                      <div>
                        <label className={FL}>Original Price (₹)</label>
                        <input type="number" value={pf.originalPrice || ""} onChange={e => setPf(prev => ({ ...prev, originalPrice: Number(e.target.value) }))} className={FI} placeholder="0" min={0} />
                      </div>

                      {/* Stock */}
                      <div>
                        <label className={FL}>General Stock</label>
                        <input type="number" value={pf.stock || ""} onChange={e => setPf(prev => ({ ...prev, stock: Number(e.target.value) }))} className={FI} placeholder="0" min={0} />
                      </div>

                      {/* SKU */}
                      <div>
                        <label className={FL}>SKU (auto-generated if empty)</label>
                        <input value={pf.sku} onChange={e => setPf(prev => ({ ...prev, sku: e.target.value }))} className={FI} placeholder="SS-001" />
                      </div>

                      {/* Saree-specific fields */}
                      {pf.productType === "sarees" && (
                        <>
                          <div>
                            <label className={FL}>Fabric Type</label>
                            <ComboBox value={pf.fabricType} onChange={v => setPf(prev => ({ ...prev, fabricType: v }))} options={FABRIC_TYPES} placeholder="Type or select fabric…" />
                          </div>
                          <div>
                            <label className={FL}>Occasion Wear</label>
                            <input value={pf.occasionWear} onChange={e => setPf(prev => ({ ...prev, occasionWear: e.target.value }))} className={FI} placeholder="e.g. Wedding, Festive, Casual" />
                          </div>
                          <div>
                            <label className={FL}>Work Type</label>
                            <input value={pf.workType} onChange={e => setPf(prev => ({ ...prev, workType: e.target.value }))} className={FI} placeholder="e.g. Zari, Embroidery, Block Print" />
                          </div>
                          <div>
                            <label className={FL}>Saree Length (meters)</label>
                            <input type="number" step={0.1} value={pf.sareeLength} onChange={e => setPf(prev => ({ ...prev, sareeLength: Number(e.target.value) }))} className={FI} />
                          </div>
                          <div>
                            <label className={FL}>Blouse Piece Included</label>
                            <select value={pf.blousePiece} onChange={e => setPf(prev => ({ ...prev, blousePiece: e.target.value as "Yes" | "No" }))} className={FSel}>
                              <option value="Yes">Yes</option>
                              <option value="No">No</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* Jewellery-specific fields */}
                      {pf.productType === "jewellery" && (
                        <>
                          <div>
                            <label className={FL}>Weight (grams)</label>
                            <input type="number" step={0.1} value={pf.weight || ""} onChange={e => setPf(prev => ({ ...prev, weight: Number(e.target.value) }))} className={FI} placeholder="0" min={0} />
                          </div>
                          <div>
                            <label className={FL}>Material / Metal</label>
                            <ComboBox value={pf.material} onChange={v => setPf(prev => ({ ...prev, material: v }))} options={MATERIAL_TYPES} placeholder="Type or select material…" />
                          </div>
                          <div>
                            <label className={FL}>Occasion Wear</label>
                            <input value={pf.occasionWear} onChange={e => setPf(prev => ({ ...prev, occasionWear: e.target.value }))} className={FI} placeholder="e.g. Bridal, Daily Wear" />
                          </div>
                          <div>
                            <label className={FL}>Work Type</label>
                            <input value={pf.workType} onChange={e => setPf(prev => ({ ...prev, workType: e.target.value }))} className={FI} placeholder="e.g. Kundan, Filigree" />
                          </div>
                        </>
                      )}

                      {/* Combos */}
                      {pf.productType === "combos" && (
                        <>
                          <div>
                            <label className={FL}>Occasion Wear</label>
                            <input value={pf.occasionWear} onChange={e => setPf(prev => ({ ...prev, occasionWear: e.target.value }))} className={FI} placeholder="e.g. Bridal, Festive" />
                          </div>
                        </>
                      )}

                      {/* Images */}
                      <div className="lg:col-span-2">
                        <label className={FL}>Product Images (multiple allowed)</label>
                        <input type="file" accept="image/*" multiple onChange={e => setProductFiles(Array.from(e.target.files ?? []))} className={FI} />
                        {productFiles.length > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">{productFiles.length} file{productFiles.length > 1 ? "s" : ""} selected — will be uploaded on save</p>
                        )}
                        {pf.images.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {pf.images.map((img, i) => (
                              <div key={i} className="relative">
                                <img src={img} alt="" className="h-16 w-16 rounded-xl object-cover border border-border" />
                                <button type="button" onClick={() => setPf(prev => ({ ...prev, images: prev.images.filter((_, j) => j !== i), image: i === 0 ? prev.images[1] ?? "" : prev.image }))} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white text-xs">✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Checkboxes */}
                      <div className="flex items-center gap-6">
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <input type="checkbox" checked={pf.featured} onChange={e => setPf(prev => ({ ...prev, featured: e.target.checked }))} className="rounded border-border" />
                          Featured Masterpiece
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <input type="checkbox" checked={pf.buyOneGetOne} onChange={e => setPf(prev => ({ ...prev, buyOneGetOne: e.target.checked }))} className="rounded border-border" />
                          Buy 1 Get 1 Offer
                        </label>
                      </div>

                      {/* Color Variants */}
                      <div className="lg:col-span-2">
                        <div className="mb-3 flex items-center justify-between">
                          <label className={FL + " mb-0"}>Color Variants</label>
                          <button type="button" onClick={addColorVariant} className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:border-accent"><Plus className="h-3.5 w-3.5" /> Add Variant</button>
                        </div>
                        {pf.colorVariants.length === 0 && <p className="text-xs text-muted-foreground">No variants added. Click "Add Variant" to add color options.</p>}
                        <div className="space-y-3">
                          {pf.colorVariants.map(v => (
                            <div key={v.id} className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-background/50 p-3 sm:grid-cols-4">
                              <div><label className={FL}>Color</label><input value={v.color} onChange={e => updateVariant(v.id, "color", e.target.value)} className={FI} placeholder="e.g. Red" /></div>
                              <div><label className={FL}>Stock</label><input type="number" value={v.stock} onChange={e => updateVariant(v.id, "stock", Number(e.target.value))} className={FI} min={0} /></div>
                              <div><label className={FL}>Original (₹)</label><input type="number" value={v.originalPrice} onChange={e => updateVariant(v.id, "originalPrice", Number(e.target.value))} className={FI} min={0} /></div>
                              <div className="flex items-end gap-2">
                                <div className="flex-1"><label className={FL}>Sale (₹)</label><input type="number" value={v.salePrice} onChange={e => updateVariant(v.id, "salePrice", Number(e.target.value))} className={FI} min={0} /></div>
                                <button type="button" onClick={() => removeVariant(v.id)} className="mb-0.5 rounded-full p-2 text-destructive hover:bg-destructive/10"><X className="h-4 w-4" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="lg:col-span-2 flex items-center justify-between">
                        {formError ? <p className="text-sm text-destructive">{formError}</p> : <p className="text-sm text-muted-foreground">All fields with your product details.</p>}
                        <button type="button" onClick={saveProduct} disabled={formSaving} className={FBtn}>
                          {formSaving ? "Saving…" : editingProductId ? "Update Product" : "Create Product"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── SAREES / JEWELLERY / COMBOS ────────────────────────── */}
            {(activeSection === "Sarees" || activeSection === "Jewellery" || activeSection === "Combos") && (
              <div className="space-y-6">
                <SectionHeader title={activeSection} actionLabel={`Add ${activeSection.slice(0, -1)}`} onAction={() => { setActiveSection("Products"); openProductForm(); setPf(prev => ({ ...prev, productType: activeSection.toLowerCase() as Category })); }} />
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {products.filter(p => p.categories.includes(activeSection.toLowerCase() as Category)).map(product => (
                    <div key={product.id} className="rounded-3xl border border-border bg-card p-4">
                      <img src={product.image} alt={product.name} className="h-40 w-full rounded-2xl object-cover" />
                      <div className="mt-4 space-y-1">
                        <div className="font-medium line-clamp-2">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{formatINR(product.salePrice ?? product.price)}</div>
                        {product.featured && <span className="inline-block rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">Featured</span>}
                        <div className="flex gap-2 pt-2">
                          <button type="button" onClick={() => { setActiveSection("Products"); openProductForm(product); }} className={FBtnSec + " text-xs"}>Edit</button>
                          <button type="button" onClick={() => deleteProduct(product.id)} className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── CATEGORIES ─────────────────────────────────────────── */}
            {activeSection === "Categories" && (
              <div className="space-y-6">
                <SectionHeader title="Categories" actionLabel="Add Category" onAction={() => openCatModal()} />
                <div className="rounded-2xl border border-border bg-card p-5 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border"><th className="px-3 py-3">Name</th><th className="px-3 py-3">Parent</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th></tr>
                    </thead>
                    <tbody>
                      {categories.map(cat => (
                        <tr key={cat.id} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-3 font-medium">{cat.name}</td>
                          <td className="px-3 py-3">{cat.parent}</td>
                          <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs ${cat.active ? "bg-emerald-100 text-emerald-800" : "bg-secondary text-muted-foreground"}`}>{cat.active ? "Active" : "Inactive"}</span></td>
                          <td className="px-3 py-3 flex gap-2">
                            <button type="button" onClick={() => openCatModal(cat)} className={FBtnSec + " text-xs"}><Pencil className="inline h-3 w-3 mr-1" />Edit</button>
                            <button type="button" onClick={() => deleteCat(cat.id)} className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── ORDERS ─────────────────────────────────────────────── */}
            {activeSection === "Orders" && (
              <div className="space-y-6">
                <SectionHeader title="Orders" />
                <div className="mb-3"><input type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search orders…" className={FI + " max-w-sm"} /></div>
                <div className="rounded-2xl border border-border bg-card p-5 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="px-3 py-3">Order ID</th><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Payment</th><th className="px-3 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pg(filteredOrders, ordersPage).map(order => (
                        <tr key={order.id} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-3">
                            <button type="button" onClick={() => setOrderDetailId(order.id)} className="font-medium text-accent hover:underline flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{order.id}</button>
                          </td>
                          <td className="px-3 py-3">{order.customer}</td>
                          <td className="px-3 py-3 font-medium">{formatINR(order.total)}</td>
                          <td className="px-3 py-3">
                            <select value={order.status} onChange={e => updateOrderStatus(order.id, e.target.value)} className="rounded-xl border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-accent">
                              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${order.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-secondary"}`}>{order.paymentStatus}</span></td>
                          <td className="px-3 py-3 flex gap-2">
                            <button type="button" onClick={() => downloadInvoice(order)} className={FBtnSec + " text-xs flex items-center gap-1"}><FileText className="h-3.5 w-3.5" />Invoice</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination page={ordersPage} total={tp(filteredOrders.length)} onPage={setOrdersPage} />
                </div>
              </div>
            )}

            {/* ── CUSTOMERS ──────────────────────────────────────────── */}
            {activeSection === "Customers" && (
              <div className="space-y-6">
                <SectionHeader title="Customers" />
                <div className="mb-3"><input type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search customers…" className={FI + " max-w-sm"} /></div>
                <div className="rounded-2xl border border-border bg-card p-5 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border"><th className="px-3 py-3">Name</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">Total Spend</th><th className="px-3 py-3">Orders</th><th className="px-3 py-3">Last Order</th></tr>
                    </thead>
                    <tbody>
                      {pg(filteredCustomers, customerPage).map(c => (
                        <tr key={c.id} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-3 font-medium">{c.name}</td>
                          <td className="px-3 py-3 text-muted-foreground">{c.email}</td>
                          <td className="px-3 py-3">{formatINR(c.totalSpend)}</td>
                          <td className="px-3 py-3">{c.orders}</td>
                          <td className="px-3 py-3">{c.lastOrder}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination page={customerPage} total={tp(filteredCustomers.length)} onPage={setCustomerPage} />
                </div>
              </div>
            )}

            {/* ── REVIEWS ────────────────────────────────────────────── */}
            {activeSection === "Reviews" && (
              <div className="space-y-6">
                <SectionHeader title="Reviews" />
                <div className="mb-3"><input type="search" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search reviews…" className={FI + " max-w-sm"} /></div>
                <div className="rounded-2xl border border-border bg-card p-5 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border"><th className="px-3 py-3">Reviewer</th><th className="px-3 py-3">Product</th><th className="px-3 py-3">Rating</th><th className="px-3 py-3">Comment</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th></tr>
                    </thead>
                    <tbody>
                      {pg(filteredReviews, reviewPage).map(r => (
                        <tr key={r.id} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-3 font-medium">{r.name}</td>
                          <td className="px-3 py-3 text-muted-foreground line-clamp-1">{r.product}</td>
                          <td className="px-3 py-3">{"★".repeat(r.rating)}</td>
                          <td className="px-3 py-3 max-w-xs"><p className="line-clamp-2 text-xs text-muted-foreground">{r.comment}</p></td>
                          <td className="px-3 py-3 text-muted-foreground">{r.date}</td>
                          <td className="px-3 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.status === "Approved" ? "bg-emerald-100 text-emerald-800" : "bg-secondary text-muted-foreground"}`}>{r.status}</span>
                          </td>
                          <td className="px-3 py-3 flex gap-2">
                            {r.status !== "Approved" && <button type="button" onClick={() => approveReview(r.id)} className="flex items-center gap-1 rounded-full border border-emerald-500 px-3 py-1 text-xs text-emerald-700 hover:bg-emerald-50"><Check className="h-3 w-3" />Approve</button>}
                            <button type="button" onClick={() => deleteReview(r.id)} className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10"><Trash2 className="inline h-3 w-3 mr-1" />Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination page={reviewPage} total={tp(filteredReviews.length)} onPage={setReviewPage} />
                </div>
              </div>
            )}

            {/* ── INSTAGRAM FEED ─────────────────────────────────────── */}
            {activeSection === "Instagram Feed" && (
              <div className="space-y-6">
                <SectionHeader title="Instagram Feed" actionLabel="Add Feed Item" onAction={openIgModal} />
                <div className="rounded-2xl border border-border bg-card p-5 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border"><th className="px-3 py-3">Type</th><th className="px-3 py-3">URL</th><th className="px-3 py-3">Caption</th><th className="px-3 py-3">Linked Products</th><th className="px-3 py-3">Actions</th></tr>
                    </thead>
                    <tbody>
                      {igFeed.map(item => (
                        <tr key={item.id} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${item.mediaType === "reel" ? "bg-violet-100 text-violet-700" : "bg-secondary"}`}>{item.mediaType}</span></td>
                          <td className="px-3 py-3"><a href={item.url} target="_blank" rel="noreferrer" className="text-accent underline text-xs break-all">{item.url}</a></td>
                          <td className="px-3 py-3 text-xs text-muted-foreground max-w-[120px] line-clamp-2">{item.caption}</td>
                          <td className="px-3 py-3">
                            <div className="space-y-1">
                              {item.linkedProducts.map((lp, i) => (
                                <div key={i}><a href={lp.url} target="_blank" rel="noreferrer" className="text-xs text-accent underline">{lp.name}</a></div>
                              ))}
                              {item.linkedProducts.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <button type="button" onClick={() => deleteIgItem(item.id)} className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10"><Trash2 className="inline h-3 w-3 mr-1" />Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── COUPONS ────────────────────────────────────────────── */}
            {activeSection === "Coupons" && (
              <div className="space-y-6">
                <SectionHeader title="Coupons" actionLabel="Create Coupon" onAction={() => openCouponModal()} />
                <div className="rounded-2xl border border-border bg-card p-5 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border"><th className="px-3 py-3">Code</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Value</th><th className="px-3 py-3">Expiry</th><th className="px-3 py-3">Min. Purchase</th><th className="px-3 py-3">Actions</th></tr>
                    </thead>
                    <tbody>
                      {coupons.map(coupon => (
                        <tr key={coupon.id} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-3 font-mono font-semibold">{coupon.code}</td>
                          <td className="px-3 py-3">{coupon.category}</td>
                          <td className="px-3 py-3 capitalize">{coupon.discountType}</td>
                          <td className="px-3 py-3 font-medium">{coupon.discountType === "percent" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</td>
                          <td className="px-3 py-3">{coupon.expiry}</td>
                          <td className="px-3 py-3">{formatINR(coupon.minimumPurchase)}</td>
                          <td className="px-3 py-3 flex gap-2">
                            <button type="button" onClick={() => openCouponModal(coupon)} className={FBtnSec + " text-xs"}><Pencil className="inline h-3 w-3 mr-1" />Edit</button>
                            <button type="button" onClick={() => deleteCoupon(coupon.id)} className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── INVENTORY ──────────────────────────────────────────── */}
            {activeSection === "Inventory" && (
              <div className="space-y-6">
                <SectionHeader title="Inventory" />
                <div className="rounded-2xl border border-border bg-card p-5 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border"><th className="px-3 py-3">Product</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">SKU</th><th className="px-3 py-3">Stock</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Update</th></tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product.id} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-3 font-medium line-clamp-1">{product.name}</td>
                          <td className="px-3 py-3 capitalize">{product.productType}</td>
                          <td className="px-3 py-3 font-mono text-xs">{product.sku}</td>
                          <td className="px-3 py-3">
                            {editingStockId === product.id ? (
                              <div className="flex items-center gap-2">
                                <input type="number" value={stockValue} onChange={e => setStockValue(Number(e.target.value))} min={0} className="w-20 rounded-xl border border-border bg-background px-2 py-1 text-sm outline-none focus:border-accent" autoFocus />
                                <button type="button" onClick={() => saveStock(product)} className="flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs text-background"><Check className="h-3 w-3" /></button>
                                <button type="button" onClick={() => setEditingStockId(null)} className="rounded-full border border-border px-2 py-1 text-xs"><X className="h-3 w-3" /></button>
                              </div>
                            ) : (
                              <span className={`font-medium ${product.stock === 0 ? "text-destructive" : product.stock <= 5 ? "text-amber-600" : ""}`}>{product.stock}</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${product.stock === 0 ? "bg-destructive/10 text-destructive" : product.stock <= 5 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-800"}`}>
                              {product.stock === 0 ? "Out of Stock" : product.stock <= 5 ? "Low Stock" : "In Stock"}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            {editingStockId !== product.id && (
                              <button type="button" onClick={() => { setEditingStockId(product.id); setStockValue(product.stock); }} className={FBtnSec + " text-xs"}>Update</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── SETTINGS ───────────────────────────────────────────── */}
            {activeSection === "Settings" && (
              <div className="space-y-6">
                <SectionHeader title="Settings" />
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="grid gap-5 lg:grid-cols-2">
                    <div><label className={FL}>Store Name</label><input value={settings.storeName} onChange={e => setSettings(s => ({ ...s, storeName: e.target.value }))} className={FI} /></div>
                    <div><label className={FL}>Contact Number</label><input value={settings.contactNumber} onChange={e => setSettings(s => ({ ...s, contactNumber: e.target.value }))} className={FI} /></div>
                    <div><label className={FL}>Support Email</label><input type="email" value={settings.email} onChange={e => setSettings(s => ({ ...s, email: e.target.value }))} className={FI} /></div>
                    <div><label className={FL}>Free Delivery Above (₹)</label><input type="number" value={settings.freeDeliveryAbove} onChange={e => setSettings(s => ({ ...s, freeDeliveryAbove: Number(e.target.value) }))} className={FI} min={0} /></div>
                    <div><label className={FL}>Delivery Charge (₹)</label><input type="number" value={settings.deliveryCharge} onChange={e => setSettings(s => ({ ...s, deliveryCharge: Number(e.target.value) }))} className={FI} min={0} /></div>
                    <div><label className={FL}>Gateway Fee (%)</label><input type="number" value={settings.gatewayFee} onChange={e => setSettings(s => ({ ...s, gatewayFee: Number(e.target.value) }))} className={FI} min={0} step={0.1} /></div>
                    <div className="lg:col-span-2"><label className={FL}>Store Address</label><textarea value={settings.address} onChange={e => setSettings(s => ({ ...s, address: e.target.value }))} className={FI} rows={2} /></div>
                    <div className="lg:col-span-2 flex justify-end">
                      <button type="button" onClick={saveSettings} disabled={settingsSaving} className={FBtn}>{settingsSaving ? "Saving…" : "Save Settings"}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── ORDER DETAIL MODAL ──────────────────────────────────────── */}
      <Modal open={!!orderDetail} onClose={() => setOrderDetailId(null)} title={`Order ${orderDetail?.id ?? ""}`} wide>
        {orderDetail && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Customer Details</p>
                <p className="font-medium">{orderDetail.customer}</p>
                <p className="mt-1 text-sm text-muted-foreground">{orderDetail.address}</p>
              </div>
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Order Info</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{orderDetail.orderDate}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Payment</span><span className="font-medium text-emerald-700">{orderDetail.paymentStatus}</span></div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Items Ordered</p>
              <div className="rounded-lg bg-secondary/60 px-4 py-3 text-sm font-medium">{orderDetail.item}</div>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Price Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatINR(orderDetail.total - orderDetail.deliveryCharges - orderDetail.gatewayFee)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{formatINR(orderDetail.deliveryCharges)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Gateway Fee</span><span>{formatINR(orderDetail.gatewayFee)}</span></div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold text-base"><span>Total</span><span>{formatINR(orderDetail.total)}</span></div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Update Status</p>
              <div className="flex items-center gap-3">
                <select value={orderDetail.status} onChange={e => updateOrderStatus(orderDetail.id, e.target.value)} className={FSel + " flex-1"}>
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <span className={`rounded-full px-3 py-1.5 text-xs font-medium ${orderDetail.status === "Delivered" ? "bg-emerald-100 text-emerald-800" : orderDetail.status === "Cancelled" ? "bg-destructive/10 text-destructive" : "bg-secondary"}`}>{orderDetail.status}</span>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => downloadInvoice(orderDetail)} className={FBtn + " flex items-center gap-2"}><FileText className="h-4 w-4" />Download Invoice</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── CATEGORY MODAL ──────────────────────────────────────────── */}
      <Modal open={catModalOpen} onClose={() => setCatModalOpen(false)} title={editingCat ? "Edit Category" : "Add Category"}>
        <div className="space-y-4">
          <div>
            <label className={FL}>Parent Category</label>
            <select value={catForm.parent} onChange={e => setCatForm(f => ({ ...f, parent: e.target.value }))} className={FSel}>
              <option value="Sarees">Sarees</option>
              <option value="Jewellery">Jewellery</option>
              <option value="Combos">Combos</option>
            </select>
          </div>
          <div>
            <label className={FL}>Category Name</label>
            <input value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} className={FI} placeholder="e.g. Mysore Silk Sarees" />
          </div>
          <div>
            <label className={FL}>Description (optional)</label>
            <textarea value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} className={FI} rows={2} placeholder="Short description…" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setCatModalOpen(false)} className={FBtnSec}>Cancel</button>
            <button type="button" onClick={saveCat} className={FBtn}>{editingCat ? "Update" : "Add Category"}</button>
          </div>
        </div>
      </Modal>

      {/* ── INSTAGRAM FEED MODAL ────────────────────────────────────── */}
      <Modal open={igModalOpen} onClose={() => setIgModalOpen(false)} title="Add Feed Item" wide>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={FL}>Type</label>
              <select value={igForm.mediaType} onChange={e => setIgForm(f => ({ ...f, mediaType: e.target.value as "post"|"reel" }))} className={FSel}>
                <option value="post">Post</option>
                <option value="reel">Reel</option>
              </select>
            </div>
            <div>
              <label className={FL}>URL (Instagram link)</label>
              <input value={igForm.url} onChange={e => setIgForm(f => ({ ...f, url: e.target.value }))} className={FI} placeholder="https://instagram.com/p/..." />
            </div>
          </div>
          <div>
            <label className={FL}>Caption (optional)</label>
            <input value={igForm.caption} onChange={e => setIgForm(f => ({ ...f, caption: e.target.value }))} className={FI} placeholder="e.g. Festive collection drop!" />
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className={FL + " mb-0"}>Linked Products</label>
              <button type="button" onClick={() => setIgLinked(prev => [...prev, { name: "", url: "" }])} className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:border-accent"><Plus className="h-3.5 w-3.5" /> Add Product</button>
            </div>
            {igLinked.length === 0 && <p className="text-xs text-muted-foreground">No products linked yet. Click "Add Product" to link items from the website.</p>}
            <div className="space-y-3">
              {igLinked.map((lp, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end rounded-xl border border-border p-3 bg-background/50">
                  <div>
                    <label className={FL}>Product Name</label>
                    <input value={lp.name} onChange={e => setIgLinked(prev => prev.map((p, j) => j === i ? { ...p, name: e.target.value } : p))} className={FI} placeholder="Product name" list={`ig-products-${i}`} />
                    <datalist id={`ig-products-${i}`}>{products.map(p => <option key={p.id} value={p.name} />)}</datalist>
                  </div>
                  <div>
                    <label className={FL}>Website URL</label>
                    <input value={lp.url} onChange={e => setIgLinked(prev => prev.map((p, j) => j === i ? { ...p, url: e.target.value } : p))} className={FI} placeholder="/product/slug or full URL" />
                  </div>
                  <button type="button" onClick={() => setIgLinked(prev => prev.filter((_, j) => j !== i))} className="mb-0.5 rounded-full p-2 text-destructive hover:bg-destructive/10"><X className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIgModalOpen(false)} className={FBtnSec}>Cancel</button>
            <button type="button" onClick={saveIgItem} className={FBtn}>Add to Feed</button>
          </div>
        </div>
      </Modal>

      {/* ── COUPON MODAL ────────────────────────────────────────────── */}
      <Modal open={couponModalOpen} onClose={() => setCouponModalOpen(false)} title={editingCoupon ? "Edit Coupon" : "Create Coupon"}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={FL}>Coupon Code</label>
              <input value={couponForm.code} onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className={FI} placeholder="e.g. SASHVI10" />
            </div>
            <div>
              <label className={FL}>Applies To Category</label>
              <select value={couponForm.category} onChange={e => setCouponForm(f => ({ ...f, category: e.target.value }))} className={FSel}>
                <option value="All">All Categories</option>
                <option value="Sarees">Sarees</option>
                <option value="Jewellery">Jewellery</option>
                <option value="Combos">Combos</option>
              </select>
            </div>
            <div>
              <label className={FL}>Discount Type</label>
              <select value={couponForm.discountType} onChange={e => setCouponForm(f => ({ ...f, discountType: e.target.value as "percent"|"fixed" }))} className={FSel}>
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className={FL}>Discount Value ({couponForm.discountType === "percent" ? "%" : "₹"})</label>
              <input type="number" value={couponForm.discountValue || ""} onChange={e => setCouponForm(f => ({ ...f, discountValue: Number(e.target.value) }))} className={FI} min={0} />
            </div>
            <div>
              <label className={FL}>Expiry Date</label>
              <input type="date" value={couponForm.expiry} onChange={e => setCouponForm(f => ({ ...f, expiry: e.target.value }))} className={FI} />
            </div>
            <div>
              <label className={FL}>Minimum Purchase (₹)</label>
              <input type="number" value={couponForm.minimumPurchase || ""} onChange={e => setCouponForm(f => ({ ...f, minimumPurchase: Number(e.target.value) }))} className={FI} min={0} />
            </div>
            <div>
              <label className={FL}>Usage Limit</label>
              <input type="number" value={couponForm.usageLimit || ""} onChange={e => setCouponForm(f => ({ ...f, usageLimit: Number(e.target.value) }))} className={FI} min={1} />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setCouponModalOpen(false)} className={FBtnSec}>Cancel</button>
            <button type="button" onClick={saveCoupon} className={FBtn}>{editingCoupon ? "Update Coupon" : "Create Coupon"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export const Route = createFileRoute("/admin")({ component: Admin });
