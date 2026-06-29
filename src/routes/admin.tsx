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
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Pencil,
  Edit,
  Trash2,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Eye,
  Check,
  RefreshCw,
  Clock,
  GripVertical,
  Box,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { useRealtime } from "@/lib/realtime-context";
import {
  PRODUCTS,
  formatINR,
  SAREE_CATEGORIES,
  JEWELLERY_CATEGORIES,
  COMBO_CATEGORIES,
  Category,
} from "@/lib/products";
import { ADMIN_ORDER_STATUSES, statusToDisplay, statusToSnake } from "@/lib/order-status";

// ─── Constants ───────────────────────────────────────────────────────────────

const ADMIN_STORAGE_KEY = "sashvi_admin_token";
const ADMIN_REFRESH_KEY = "sashvi_admin_refresh_token";
const PAGE_SIZE = 10;

const FABRIC_TYPES = [
  "Kanchipuram Silk",
  "Banarasi Silk",
  "Soft Silk",
  "Organza",
  "Chiffon",
  "Georgette",
  "Cotton",
  "Linen",
  "Mul Cotton",
  "Modal Silk",
  "Gajji Silk",
  "Mysore Silk",
  "Crepe Silk",
  "Jamdani",
];

const MATERIAL_TYPES = [
  "Gold",
  "Silver",
  "Gold Plated",
  "Silver Plated",
  "Brass",
  "Copper",
  "Alloy",
  "Antique",
  "Temple Jewellery",
  "Jadau Kundan",
  "Oxidized Jewellery",
  "Victorian Jewellery",
  "Moissanite Jewellery",
];

const ORDER_STATUSES = ADMIN_ORDER_STATUSES;

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Products", icon: Package },
  { label: "Categories", icon: Tag },
  { label: "Sarees", icon: Sparkles },
  { label: "Jewellery", icon: Gem },
  { label: "Combos", icon: Layers },
  { label: "Orders", icon: ShoppingBag },
  { label: "Instagram Feed", icon: Instagram },
  { label: "Coupons", icon: Star },
  { label: "Inventory", icon: TrendingUp },
] as const;

type AdminSection = (typeof NAV)[number]["label"];

// ─── Types ───────────────────────────────────────────────────────────────────

type ColorVariant = {
  id: string;
  color: string;
  sku?: string;
  stock: number;
  originalPrice: number;
  salePrice: number;
};

type ProductAdmin = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  images?: string[];
  categories: string[];
  tags: string[];
  stock: number;
  description: string;
  sku: string;
  productType: Category;
  active: boolean;
  originalPrice?: number;
  salePrice?: number;
  discountType?: "none" | "fixed" | "percent";
  discountValue?: number;
  discountPercentage?: number;
  discountFixed?: number;
  discountBadge?: string;
  fabricType?: string;
  material?: string;
  occasionWear?: string;
  workType?: string;
  sareeLength?: number;
  blousePiece?: "Yes" | "No";
  weight?: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  featured?: boolean;
  color?: string;
  buyOneGetOne?: boolean;
  colorVariants?: ColorVariant[];
};

type ProductFormState = {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice: number;
  salePrice: number;
  discountType: "none" | "fixed" | "percent";
  discountValue: number;
  discountPercentage: number;
  discountFixed: number;
  discountBadge: string;
  image: string;
  images: string[];
  categories: string[];
  tags: string[];
  stock: number;
  description: string;
  sku: string;
  productType: "sarees" | "jewellery" | "combos";
  active: boolean;
  fabricType: string;
  occasionWear: string;
  workType: string;
  sareeLength: number;
  blousePiece: "Yes" | "No";
  weight: number;
  material: string;
  isNew: boolean;
  isBestSeller: boolean;
  color: string;
  buyOneGetOne: boolean;
  colorVariants: ColorVariant[];
};

type CategoryAdmin = {
  id: string;
  name: string;
  image: string;
  description: string;
  parent: string;
  sortOrder: number;
  active: boolean;
};
type OrderAdmin = {
  id: string;
  uuid?: string;
  order_id: string;
  customer: string;
  mobile?: string;
  email?: string;
  item: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentType?: string;
  deliveryCharges: number;
  gatewayFee: number;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  orderDate: string;
  advancePaid?: number;
  totalPaidOnline?: number;
  remainingAmount?: number;
  notificationSent?: boolean;
  order_items?: Array<{
    product_name?: string;
    product_image?: string;
    category?: string;
    variant?: string;
    sku?: string;
    quantity?: number;
    price?: number;
  }>;
};
type OrderRequestAdmin = {
  id: string;
  order_id: string;
  user_id: string;
  type: string;
  reason: string;
  status: string;
  created_at: string;
  orders?: {
    order_id: string;
    total_amount: number;
    created_at: string;
    order_status: string;
  };
};
type CustomerAdmin = {
  id: string;
  name: string;
  email: string;
  totalSpend: number;
  lastOrder: string;
  orders: number;
  address: string;
};
type ReviewAdmin = {
  id: number;
  name: string;
  product: string;
  rating: number;
  comment: string;
  status: "Pending" | "Approved";
  featured: boolean;
  date: string;
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
type CouponAdmin = {
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

// ─── Helper Components ────────────────────────────────────────────────────────

function getTotalStock(product: ProductAdmin): number {
  if (product.colorVariants && product.colorVariants.length > 0) {
    return product.colorVariants.reduce((sum, v) => sum + v.stock, 0);
  }
  return product.stock ?? 0;
}

const FL = "mb-1.5 block text-xs uppercase tracking-[0.2em] text-muted-foreground";
const FI =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-accent";
const FSel =
  "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent";
const FBtn =
  "rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50";
const FBtnSec = "rounded-full border border-border px-4 py-2.5 text-xs hover:border-accent";

function ComboBox({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <div className="flex items-center overflow-hidden rounded-xl border border-border bg-background focus-within:border-accent">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-4 py-2.5 text-sm text-foreground outline-none"
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="px-3 py-2.5 border-l border-border text-muted-foreground hover:text-foreground transition"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <div
          className="absolute z-50 mt-1 w-full overflow-y-auto rounded-xl border border-border bg-background shadow-lg"
          style={{ maxHeight: 200 }}
        >
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="cursor-pointer px-3 py-2.5 text-sm hover:bg-secondary"
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MultiSelectDropdown({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-2.5 text-left text-sm outline-none focus:border-accent"
      >
        <span
          className={value.length > 0 ? "text-foreground line-clamp-1" : "text-muted-foreground"}
        >
          {value.length > 0 ? value.join(", ") : (placeholder ?? "Select…")}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <div
          className="absolute z-50 mt-1 w-full overflow-y-auto rounded-xl border border-border bg-background shadow-lg"
          style={{ maxHeight: 260 }}
        >
          {options.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-secondary"
            >
              <input
                type="checkbox"
                checked={value.includes(opt)}
                onChange={(e) => {
                  if (e.target.checked) onChange([...value, opt]);
                  else onChange(value.filter((v) => v !== opt));
                }}
                className="rounded border-border"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-xl">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  up = true,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: string;
  up?: boolean;
  icon: typeof IndianRupee;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="eyebrow">{label}</div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-accent">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 font-display text-3xl text-foreground">{value}</div>
      <div
        className={`mt-1 inline-flex items-center gap-1 text-xs ${up ? "text-emerald-700" : "text-destructive"}`}
      >
        {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}{" "}
        {delta}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="font-display text-2xl">{title}</h2>
        <p className="text-sm text-muted-foreground">
          Manage {title.toLowerCase()} with search, edit, and quick actions.
        </p>
      </div>
      {actionLabel && onAction ? (
        <button onClick={onAction} type="button" className={FBtn}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function Pagination({
  page,
  total,
  onPage,
}: {
  page: number;
  total: number;
  onPage: (p: number) => void;
}) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground pt-4">
      <span>
        Page {page} of {total}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPage(Math.max(page - 1, 1))}
          className={FBtnSec + " disabled:opacity-50"}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= total}
          onClick={() => onPage(Math.min(page + 1, total))}
          className={FBtnSec + " disabled:opacity-50"}
        >
          Next
        </button>
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
  id: "",
  slug: "",
  name: "",
  price: 0,
  originalPrice: 0,
  salePrice: 0,
  discountType: "none",
  discountValue: 0,
  discountPercentage: 0,
  discountFixed: 0,
  discountBadge: "",
  image: "",
  images: [],
  categories: [],
  tags: [],
  stock: 0,
  description: "",
  sku: "",
  productType: "sarees",
  active: true,
  fabricType: "",
  occasionWear: "",
  workType: "",
  sareeLength: 5.5,
  blousePiece: "Yes",
  weight: 0,
  material: "",
  isNew: false,
  isBestSeller: false,
  color: "",
  buyOneGetOne: false,
  colorVariants: [],
};

const emptyCouponForm = {
  code: "",
  category: "All",
  discountType: "percent" as "percent" | "fixed",
  discountValue: 10,
  expiry: "",
  usageLimit: 100,
  minimumPurchase: 0,
};
const emptyIgForm = {
  title: "",
  mediaType: "post" as "post" | "reel",
  url: "",
  thumbnail: "",
  caption: "",
  productMap: { saree: "", jewellery: "" } as { saree?: string; jewellery?: string },
  isActive: true,
  linkedProducts: [] as InstagramLinkedProduct[],
};
const emptyCatForm = { parent: "Sarees", name: "", description: "" };

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ─── Admin Component ──────────────────────────────────────────────────────────

function Admin() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [activeSection, setActiveSection] = useState<AdminSection>("Dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  // Products
  const [products, setProducts] = useState<ProductAdmin[]>([]);
  const [productFilter, setProductFilter] = useState<"all" | Category>("all");
  const [productPage, setProductPage] = useState(1);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productFiles, setProductFiles] = useState<File[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [pf, setPf] = useState<ProductFormState>(emptyProductForm);

  // Categories
  const [categories, setCategories] = useState<CategoryAdmin[]>([]);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryAdmin | null>(null);
  const [catForm, setCatForm] = useState(emptyCatForm);

  // Orders
  const [orders, setOrders] = useState<OrderAdmin[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [orderDetailId, setOrderDetailId] = useState<string | null>(null);

  // Order Requests
  const [orderRequests, setOrderRequests] = useState<OrderRequestAdmin[]>([]);

  // Reviews
  const [reviews, setReviews] = useState<ReviewAdmin[]>([]);
  const [reviewPage, setReviewPage] = useState(1);

  // Instagram Feed
  const [igFeed, setIgFeed] = useState<InstagramFeedItem[]>([]);
  const [igModalOpen, setIgModalOpen] = useState(false);
  const [igForm, setIgForm] = useState(emptyIgForm);
  const [igLinked, setIgLinked] = useState<InstagramLinkedProduct[]>([]);
  const [igThumbnailFile, setIgThumbnailFile] = useState<File | null>(null);
  const { instagramFeedVersion } = useRealtime();

  // Refetch Instagram feed on realtime changes
  useEffect(() => {
    const fetchInstagramFeed = async () => {
      try {
        const r = await apiDirect<{ feed: InstagramFeedItem[] }>("instagram-feed");
        const transformedFeed = (r.feed || []).map((item: any) => ({
          ...item,
          mediaType: item.media_type,
          productMap: item.product_map || {},
          linkedProducts: item.linked_products || [],
          isActive: item.is_active,
        }));
        setIgFeed(transformedFeed);
      } catch (error) {
        console.error("Failed to fetch Instagram feed:", error);
      }
    };
    fetchInstagramFeed();
  }, [instagramFeedVersion]);

  // Coupons
  const [coupons, setCoupons] = useState<CouponAdmin[]>([]);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponAdmin | null>(null);
  const [couponForm, setCouponForm] = useState(emptyCouponForm);

  // Inventory
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState(0);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [variantStockValue, setVariantStockValue] = useState(0);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  // ── API helpers ──────────────────────────────────────────────────────────────

  function authHeaders(): Record<string, string> {
    return { Authorization: token ? `Bearer ${token}` : "", "Content-Type": "application/json" };
  }

  function parseApiError(json: unknown, fallback: string): string {
    if (!json || typeof json !== "object") return fallback;
    const o = json as Record<string, unknown>;
    if (typeof o.detail === "string") return o.detail;
    if (typeof o.message === "string") return o.message;
    if (typeof o.error === "string") return o.error;
    if (o.error && typeof o.error === "object" && "message" in (o.error as object)) {
      return String((o.error as { message: string }).message);
    }
    return fallback;
  }

  async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`/api/admin/${path}`, {
      ...init,
      headers: { ...(init?.headers as Record<string, string>), ...authHeaders() },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(parseApiError(json, "Request failed"));
    return json as T;
  }

  async function apiDirect<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`/backend-api/${path}`, {
      ...init,
      headers: { ...(init?.headers as Record<string, string>), ...authHeaders() },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(parseApiError(json, "Request failed"));
    return json as T;
  }

  async function reloadOrders() {
    const o = await apiDirect<{ orders: OrderAdmin[] }>("orders/admin/all");
    setOrders(
      o.orders.map((order) => ({
        ...order,
        status: statusToDisplay(order.status),
      })),
    );
  }

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/backend-api/upload/upload-image", {
      method: "POST",
      body: fd,
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((json as { error?: string }).error || "Upload failed");
    return (json as { url: string }).url;
  }

  // ── Auth effects ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(ADMIN_STORAGE_KEY);
    if (saved) setToken(saved);
    else setInitializing(false);
  }, []);

  async function refreshAdminToken(): Promise<string | null> {
    const refresh = window.localStorage.getItem(ADMIN_REFRESH_KEY);
    if (!refresh) return null;
    try {
      const res = await fetch("/backend-api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      const d = await res.json();
      if (!res.ok) return null;
      const newToken = d.token || d.access;
      window.localStorage.setItem(ADMIN_STORAGE_KEY, newToken);
      if (d.refresh) window.localStorage.setItem(ADMIN_REFRESH_KEY, d.refresh);
      setToken(newToken);
      return newToken;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    if (!token) return;
    setInitializing(true);
    fetch("/backend-api/auth/admin/me", { headers: authHeaders() })
      .then(async (r) => {
        if (r.status === 401) {
          const refreshed = await refreshAdminToken();
          if (!refreshed) throw new Error("Session expired. Please login again.");
          const retry = await fetch("/backend-api/auth/admin/me", {
            headers: { Authorization: `Bearer ${refreshed}` },
          });
          if (!retry.ok) throw new Error("Authentication failed");
          return retry.json();
        }
        if (!r.ok) {
          if (r.status === 403) throw new Error("Access denied. Admin privileges required.");
          throw new Error("Authentication failed");
        }
        return r.json();
      })
      .then((d: { user: { email: string } }) => {
        setUser(d.user);
        setAuthError(null);
      })
      .catch((err) => {
        console.error("Admin auth error:", err);
        window.localStorage.removeItem(ADMIN_STORAGE_KEY);
        setToken(null);
        setUser(null);
        setAuthError(err.message || "Authentication failed");
      })
      .finally(() => setInitializing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Load admin data ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiDirect<{ orders: OrderAdmin[] }>("orders/admin/all").catch((err) => {
        console.error("Failed to load orders:", err);
        return { orders: [] };
      }),
      apiDirect<OrderRequestAdmin[]>("request/pending").catch((err) => {
        console.error("Failed to load requests:", err);
        return [];
      }),
      apiDirect<{ products: ProductAdmin[] }>("products").catch(() => ({ products: [] })),
      apiDirect<{ categories: CategoryAdmin[] }>("categories/admin/all").catch(() => ({ categories: [] })),
      apiDirect<{ reviews: ReviewAdmin[] }>("reviews").catch(() => ({ reviews: [] })),
      apiDirect<{ feed: InstagramFeedItem[] }>("instagram-feed").catch(() => ({ feed: [] })),
      apiDirect<{ coupons: CouponAdmin[] }>("coupons").catch(() => ({ coupons: [] })),
    ])
      .then(([o, req, p, c, rv, ig, cp]) => {
        setProducts(p.products);
        setCategories(c.categories);
        setOrders(
          o.orders.map((order) => ({
            ...order,
            status: statusToDisplay(order.status),
          })),
        );
        setReviews(rv.reviews);
        // Transform Instagram feed from database format to frontend format
        const transformedIgFeed = (ig.feed || []).map((item: any) => ({
          ...item,
          mediaType: item.media_type,
          productMap: item.product_map || {},
          linkedProducts: item.linked_products || [],
          isActive: item.is_active,
        }));
        setIgFeed(transformedIgFeed);
        setCoupons(cp.coupons);
        setOrderRequests(req);
      })
      .catch((err) => console.warn("Failed to load admin data", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Login ────────────────────────────────────────────────────────────────────

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setInitializing(true);
    try {
      const res = await fetch("/backend-api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await res.json();
      if (!res.ok) {
        setAuthError(d.error || "Login failed.");
        return;
      }
      setToken(d.token);
      window.localStorage.setItem(ADMIN_STORAGE_KEY, d.token);
      if (d.refresh) window.localStorage.setItem(ADMIN_REFRESH_KEY, d.refresh);
      setUser({ email: d.user.email });
      setEmail("");
      setPassword("");
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setInitializing(false);
    }
  }

  function logout() {
    window.localStorage.removeItem(ADMIN_STORAGE_KEY);
    window.localStorage.removeItem(ADMIN_REFRESH_KEY);
    setToken(null);
    setUser(null);
    setActiveSection("Dashboard");
  }

  // ── Product handlers ──────────────────────────────────────────────────────────

  function openProductForm(product?: ProductAdmin) {
    setFormError(null);
    setProductFiles([]);
    if (product) {
      setPf({
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice ?? product.price,
        salePrice: product.salePrice ?? product.price,
        discountType:
          product.discountType ??
          (product.discountPercentage && product.discountPercentage > 0
            ? "percent"
            : product.discountFixed && product.discountFixed > 0
              ? "fixed"
              : "none"),
        discountValue:
          product.discountValue ??
          (product.discountPercentage && product.discountPercentage > 0
            ? product.discountPercentage
            : product.discountFixed ?? 0),
        discountPercentage: product.discountPercentage ?? 0,
        discountFixed: product.discountFixed ?? 0,
        discountBadge: product.discountBadge ?? "",
        image: product.image,
        images: product.images ?? [],
        categories: product.categories,
        tags: product.tags,
        stock: product.stock,
        description: product.description ?? "",
        sku: product.sku,
        productType: product.productType,
        active: product.active,
        fabricType: product.fabricType ?? "",
        occasionWear: product.occasionWear ?? "",
        workType: product.workType ?? "",
        sareeLength: product.sareeLength ?? 5.5,
        blousePiece: product.blousePiece ?? "Yes",
        weight: product.weight ?? 0,
        material: product.material ?? "",
        isNew: product.isNew ?? false,
        isBestSeller: product.isBestSeller ?? false,
        color: product.color ?? "",
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
    if (!pf.name.trim()) {
      setFormError("Product name is required.");
      return;
    }
    if (pf.salePrice <= 0) {
      setFormError("Sale price must be greater than 0.");
      return;
    }
    setFormSaving(true);
    try {
      // Upload new images
      let allImages = [...pf.images];
      if (productFiles.length > 0) {
        const uploaded = await Promise.all(productFiles.map((f) => uploadFile(f)));
        allImages = [...allImages, ...uploaded];
      }
      const primaryImage = allImages[0] ?? pf.image ?? "";
      const slug = pf.slug.trim() || slugify(pf.name);
      const payload = {
        ...pf,
        slug,
        salePrice: pf.salePrice,
        originalPrice: pf.originalPrice,
        discountBadge: pf.discountBadge,
        isBestSeller: pf.isBestSeller,
        image: primaryImage,
        images: allImages,
        categories: [pf.productType],
        tags: pf.tags,
        sku: pf.sku.trim() || `SS-${Date.now()}`,
        colorVariants: pf.colorVariants,
      };
      if (editingProductId) {
        await apiDirect(`products/${editingProductId}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await apiDirect("products", { method: "POST", body: JSON.stringify(payload) });
      }
      const r = await apiDirect<{ products: ProductAdmin[] }>("products");
      setProducts(r.products);
      setProductFormOpen(false);
      setEditingProductId(null);
      setProductPage(1);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setFormSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    try {
      await apiDirect(`products/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert((err as Error).message);
    }
  }

  function addColorVariant() {
    const v: ColorVariant = {
      id: `v-${Date.now()}`,
      color: "",
      stock: 0,
      originalPrice: pf.originalPrice,
      salePrice: pf.salePrice,
    };
    setPf((prev) => ({ ...prev, colorVariants: [...prev.colorVariants, v] }));
  }

  function updateVariant(id: string, field: keyof ColorVariant, value: string | number) {
    setPf((prev) => ({
      ...prev,
      colorVariants: prev.colorVariants.map((v) => (v.id === id ? { ...v, [field]: value } : v)),
    }));
  }

  function removeVariant(id: string) {
    setPf((prev) => ({ ...prev, colorVariants: prev.colorVariants.filter((v) => v.id !== id) }));
  }

  // ── Category handlers ─────────────────────────────────────────────────────────

  function openCatModal(cat?: CategoryAdmin) {
    setEditingCat(cat ?? null);
    setCatForm(
      cat ? { parent: cat.parent, name: cat.name, description: cat.description } : emptyCatForm,
    );
    setCatModalOpen(true);
  }

  async function saveCat() {
    if (!catForm.name.trim()) return;
    if (editingCat) {
      const r = await apiDirect<{ category: CategoryAdmin }>(`categories/${editingCat.id}`, {
        method: "PUT",
        body: JSON.stringify(catForm),
      });
      setCategories((prev) => prev.map((c) => (c.id === editingCat.id ? r.category : c)));
    } else {
      const r = await apiDirect<{ category: CategoryAdmin }>("categories", {
        method: "POST",
        body: JSON.stringify({ ...catForm, sortOrder: categories.length + 1, active: true }),
      });
      setCategories((prev) => [...prev, r.category]);
    }
    setCatModalOpen(false);
  }

  async function deleteCat(id: string) {
    if (!confirm("Delete this category?")) return;
    await apiDirect(`categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }

  async function moveCategory(fromIndex: number, toIndex: number) {
    const newCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= newCategories.length) return;
    if (toIndex < 0 || toIndex >= newCategories.length) return;

    // Remove from old position and insert at new position
    const [movedCategory] = newCategories.splice(fromIndex, 1);
    newCategories.splice(toIndex, 0, movedCategory);

    // Update sortOrder values
    const updatedCategories = newCategories.map((cat, i) => ({
      ...cat,
      sortOrder: i + 1,
    }));

    // Update in database
    await Promise.all(
      updatedCategories.map((cat) =>
        apiDirect(`categories/${cat.id}`, {
          method: "PUT",
          body: JSON.stringify({ sortOrder: cat.sortOrder }),
        })
      )
    );

    // Update local state
    setCategories(updatedCategories);
  }

  // ── Order handlers ────────────────────────────────────────────────────────────

  async function updateOrderStatus(id: string, status: string) {
    const snakeStatus = statusToSnake(status);
    try {
      await apiDirect(`orders/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ new_status: snakeStatus }),
      });
      await reloadOrders();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function deleteOrder(id: string) {
    if (!confirm("Delete this order?")) return;
    await apiDirect(`orders/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }

  async function markNotificationsAsSent(orderIds: string[]) {
    try {
      await apiDirect("orders/notifications/mark-sent", {
        method: "POST",
        body: JSON.stringify({ orderIds }),
      });
      await reloadOrders();
    } catch (err) {
      console.error("Failed to mark notifications as sent:", err);
      alert("Failed to mark notifications as sent. Please try again.");
    }
  }

  // ── Order Request handlers ────────────────────────────────────────────────────────────

  async function approveRequest(id: string) {
    try {
      await apiDirect(`request/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "approved" }),
      });
      const req = await apiDirect<OrderRequestAdmin[]>("request/pending");
      setOrderRequests(req);
      await reloadOrders();
    } catch (err) {
      alert((err as Error).message);
    }
  }

  async function rejectRequest(id: string) {
    if (!confirm("Reject this request?")) return;
    try {
      await apiDirect(`request/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "rejected" }),
      });
      const req = await apiDirect<OrderRequestAdmin[]>("request/pending");
      setOrderRequests(req);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  // ── Review handlers ───────────────────────────────────────────────────────────

  async function approveReview(id: number) {
    await apiDirect(`reviews/${id}`, { method: "PATCH", body: JSON.stringify({ status: "Approved" }) });
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Approved" } : r)));
  }

  async function deleteReview(id: number) {
    await apiDirect(`reviews/${id}`, { method: "DELETE" });
    setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  // ── Instagram Feed handlers ───────────────────────────────────────────────────

  function openIgModal() {
    setIgForm(emptyIgForm);
    setIgLinked([]);
    setIgThumbnailFile(null);
    setIgModalOpen(true);
  }

  function editIgItem(item: any) {
    setIgForm({
      title: item.title || "",
      mediaType: item.mediaType || "post",
      url: item.url || "",
      thumbnail: item.thumbnail || "",
      caption: item.caption || "",
      productMap: item.productMap || {},
      isActive: item.isActive !== false,
      linkedProducts: item.linkedProducts || [],
    });
    setIgLinked(item.linkedProducts || []);
    setIgThumbnailFile(null);
    setIgModalOpen(true);
  }

  async function saveIgItem() {
    if (!igForm.url.trim()) return;
    
    // Upload thumbnail if file is selected
    let thumbnailUrl = igForm.thumbnail;
    if (igThumbnailFile) {
      try {
        thumbnailUrl = await uploadFile(igThumbnailFile);
      } catch (err) {
        alert((err as Error).message);
        return;
      }
    }
    
    const item = { ...igForm, thumbnail: thumbnailUrl, linkedProducts: igLinked };
    console.log("Saving Instagram item:", item);
    console.log("Linked products:", igLinked);
    
    // Check if we're editing an existing item
    const isEditing = igFeed.some((ig) => ig.id === (igForm as any).id);
    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing ? `instagram-feed/${(igForm as any).id}` : "instagram-feed";
    
    const r = await apiDirect<{ feed: InstagramFeedItem[] }>(endpoint, {
      method,
      body: JSON.stringify(item),
    });
    // Transform response data
    const transformedFeed = (r.feed || []).map((item: any) => ({
      ...item,
      mediaType: item.media_type,
      productMap: item.product_map || {},
      linkedProducts: item.linked_products || [],
      isActive: item.is_active,
    }));
    setIgFeed(transformedFeed);
    setIgModalOpen(false);
    setIgThumbnailFile(null);
  }

  async function deleteIgItem(id: string) {
    const r = await apiDirect<{ feed: InstagramFeedItem[] }>(`instagram-feed/${id}`, {
      method: "DELETE",
    });
    // Transform response data
    const transformedFeed = (r.feed || []).map((item: any) => ({
      ...item,
      mediaType: item.media_type,
      productMap: item.product_map || {},
      linkedProducts: item.linked_products || [],
      isActive: item.is_active,
    }));
    setIgFeed(transformedFeed);
  }

  // ── Coupon handlers ───────────────────────────────────────────────────────────

  function openCouponModal(coupon?: CouponAdmin) {
    setEditingCoupon(coupon ?? null);
    setCouponForm(
      coupon
        ? {
            code: coupon.code,
            category: coupon.category,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            expiry: coupon.expiry,
            usageLimit: coupon.usageLimit,
            minimumPurchase: coupon.minimumPurchase,
          }
        : emptyCouponForm,
    );
    setCouponModalOpen(true);
  }

  async function saveCoupon() {
    if (!couponForm.code.trim()) return;
    try {
      if (editingCoupon) {
        const r = await apiDirect<{ coupon: CouponAdmin }>(`coupons/${editingCoupon.id}`, {
          method: "PUT",
          body: JSON.stringify(couponForm),
        });
        setCoupons((prev) => prev.map((c) => (c.id === editingCoupon.id ? r.coupon : c)));
      } else {
        const r = await apiDirect<{ coupon: CouponAdmin }>("coupons", {
          method: "POST",
          body: JSON.stringify({ ...couponForm, active: true }),
        });
        setCoupons((prev) => [...prev, r.coupon]);
      }
      setCouponModalOpen(false);
    } catch (err: any) {
      console.error("Failed to save coupon:", err);
      alert(`Failed to save coupon: ${err.message || "Unknown error"}`);
    }
  }

  async function deleteCoupon(id: string) {
    if (!confirm("Delete coupon?")) return;
    await apiDirect(`coupons/${id}`, { method: "DELETE" });
    setCoupons((prev) => prev.filter((c) => c.id !== id));
  }

  // ── Inventory ─────────────────────────────────────────────────────────────────

  function toggleProductExpand(productId: string) {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  }

  async function saveStock(product: ProductAdmin) {
    try {
      await apiDirect(`products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify({ stock: stockValue }),
      });
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, stock: stockValue } : p)));
      setEditingStockId(null);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  // ── Computed values ───────────────────────────────────────────────────────────

  const totalRevenue = useMemo(() => orders.reduce((s, o) => s + o.total, 0), [orders]);
  const deliveredCount = useMemo(
    () => orders.filter((o) => o.status === "Delivered").length,
    [orders],
  );
  const deliveredPct = orders.length > 0 ? Math.round((deliveredCount / orders.length) * 100) : 0;
  const lowStockCount = useMemo(() => products.filter((p) => p.stock <= 5).length, [products]);
  const lowStockPct = products.length > 0 ? Math.round((lowStockCount / products.length) * 100) : 0;

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase())) &&
          (productFilter === "all" || p.categories.includes(productFilter)),
      ),
    [products, searchQuery, productFilter],
  );

  const filteredOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.customer.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [orders, searchQuery],
  );

  const filteredReviews = useMemo(
    () =>
      reviews.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.product.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [reviews, searchQuery],
  );

  const tp = (len: number) => Math.max(1, Math.ceil(len / PAGE_SIZE));
  const pg = <T,>(arr: T[], page: number) => arr.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const orderDetail = orderDetailId ? orders.find((o) => o.id === orderDetailId) : null;

  // ─────────────────────────────────────────────────────────────────────────────
  // Login screen
  // ─────────────────────────────────────────────────────────────────────────────

  if (!user && !initializing) {
    return (
      <div className="min-h-screen bg-background px-4 py-20 text-foreground">
        <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-border bg-card p-8 shadow-luxe sm:p-12">
          <div className="mb-8 text-center">
            <Logo />
            <h1 className="mt-6 font-display text-4xl">Admin Sign In</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Secure access to Sashvi Studio's admin dashboard.
            </p>
          </div>
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className={FL}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={FI}
                placeholder="admin@sashvistudio.com"
                required
              />
            </div>
            <div>
              <label className={FL}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={FI}
                placeholder="••••••••"
                required
              />
            </div>
            {authError && <p className="text-sm text-destructive">{authError}</p>}
            <button type="submit" disabled={initializing} className={FBtn + " w-full py-3"}>
              {initializing ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Main admin layout
  // ─────────────────────────────────────────────────────────────────────────────

  const catStyles =
    pf.productType === "sarees"
      ? categories.filter((c) => c.parent === "Sarees").map((c) => c.name)
      : pf.productType === "jewellery"
        ? categories.filter((c) => c.parent === "Jewellery").map((c) => c.name)
        : categories.filter((c) => c.parent === "Combos").map((c) => c.name);

  return (
    <div className="min-h-screen bg-secondary/50 text-foreground">
      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r border-border bg-background lg:block">
          <div className="border-b border-border px-5 py-4">
            <Logo />
          </div>
          <nav className="space-y-0.5 p-3">
            {NAV.map((n) => (
              <button
                key={n.label}
                type="button"
                onClick={() => {
                  setActiveSection(n.label);
                  setSearchQuery("");
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${activeSection === n.label ? "bg-foreground text-background" : "text-foreground/75 hover:bg-secondary"}`}
              >
                <n.icon className="h-4 w-4 shrink-0" /> {n.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-5 lg:px-8">
              <div>
                <div className="eyebrow text-xs uppercase tracking-widest text-muted-foreground">
                  Studio
                </div>
                <h1 className="font-display text-lg">{activeSection}</h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline text-xs text-muted-foreground">
                  {user?.email}
                </span>
                <Link to="/" className={FBtnSec + " text-xs"}>
                  View Site
                </Link>
                <button type="button" onClick={logout} className={FBtnSec + " text-xs"}>
                  Logout
                </button>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-5 lg:p-8">
            {/* ── DASHBOARD ──────────────────────────────────────────── */}
            {activeSection === "Dashboard" && (
              <>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Revenue (total)"
                    value={formatINR(totalRevenue)}
                    delta={`${orders.length} orders`}
                    icon={IndianRupee}
                  />
                  <StatCard
                    label="Orders"
                    value={String(orders.length)}
                    delta={`${deliveredPct}% delivered`}
                    icon={ShoppingBag}
                  />
                  <StatCard
                    label="Low Stock"
                    value={String(lowStockCount)}
                    delta={`${lowStockPct}% of catalog`}
                    up={false}
                    icon={TrendingDown}
                  />
                </div>
                <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
                  <section className="rounded-2xl border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border px-6 py-4">
                      <h2 className="font-display text-lg">Recent Orders</h2>
                      <button
                        type="button"
                        onClick={() => setActiveSection("Orders")}
                        className="text-xs uppercase tracking-widest text-accent"
                      >
                        View all
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                          <tr className="border-b border-border">
                            <th className="px-5 py-3">Order</th>
                            <th className="px-5 py-3">Customer</th>
                            <th className="px-5 py-3">Total</th>
                            <th className="px-5 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.filter((o) => o.paymentStatus !== "failed" && o.paymentStatus !== "pending").slice(0, 5).map((o) => (
                            <tr key={o.id} className="border-b border-border/60 last:border-0">
                              <td className="px-5 py-3 font-medium">{o.id}</td>
                              <td className="px-5 py-3 text-foreground/80">{o.customer}</td>
                              <td className="px-5 py-3">{formatINR(o.total)}</td>
                              <td className="px-5 py-3">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${o.status === "Delivered" ? "bg-emerald-100 text-emerald-800" : o.status === "Shipped" ? "bg-accent/15 text-accent" : "bg-secondary text-foreground/80"}`}
                                >
                                  {o.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                  <section className="rounded-2xl border border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border px-6 py-4">
                      <h2 className="font-display text-lg">Notifications</h2>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const unsentOrderIds = orders.filter((o) => !o.notificationSent).map((o) => o.id);
                            if (unsentOrderIds.length > 0) {
                              markNotificationsAsSent(unsentOrderIds);
                            }
                          }}
                          disabled={orders.filter((o) => !o.notificationSent).length === 0}
                          className="text-xs text-accent hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Mark all as read
                        </button>
                        <span className="text-xs uppercase tracking-widest text-accent">
                          {orders.filter((o) => !o.notificationSent).length + products.filter((p) => p.stock <= 5).length} pending
                        </span>
                      </div>
                    </div>
                    <ul className="divide-y divide-border max-h-80 overflow-y-auto">
                      {orders
                        .filter((o) => !o.notificationSent)
                        .slice(0, 5)
                        .map((o) => (
                        <li key={o.id} className="px-5 py-3">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 rounded-full p-1.5 ${
                              o.status === "Cancelled" 
                                ? "bg-red-100 text-red-600" 
                                : o.status === "Replacement Requested"
                                  ? "bg-amber-100 text-amber-600"
                                  : o.status === "Pending"
                                    ? "bg-blue-100 text-blue-600"
                                    : o.paymentType === "cod"
                                      ? "bg-purple-100 text-purple-600"
                                      : "bg-green-100 text-green-600"
                            }`}>
                              {o.status === "Cancelled" ? (
                                <X className="h-3 w-3" />
                              ) : o.status === "Replacement Requested" ? (
                                <RefreshCw className="h-3 w-3" />
                              ) : o.status === "Pending" ? (
                                <Clock className="h-3 w-3" />
                              ) : o.paymentType === "cod" ? (
                                <Box className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">{o.id}</div>
                              <div className="text-xs text-muted-foreground">
                                {o.status === "Cancelled" 
                                  ? "Order cancelled by customer" 
                                  : o.status === "Replacement Requested"
                                    ? "Replacement requested"
                                    : o.status === "Pending"
                                      ? "New order pending"
                                      : o.paymentType === "cod"
                                        ? "COD advance payment confirmed"
                                        : "Online payment confirmed"
                                }
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {o.customer} · {formatINR(o.total)} · {o.paymentType === "cod" ? "COD" : "Online"}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSection("Orders");
                                setOrderDetailId(o.id);
                              }}
                              className="text-xs text-accent hover:underline"
                            >
                              View
                            </button>
                          </div>
                        </li>
                      ))}
                      {products.filter((p) => p.stock <= 5).slice(0, 3).map((p) => (
                        <li key={p.id} className="px-5 py-3">
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 rounded-full p-1.5 ${p.stock === 0 ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}>
                              {p.stock === 0 ? <X className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">{p.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {p.stock === 0 ? "Out of stock" : "Low stock warning"}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {p.stock === 0 ? "0 remaining" : `${p.stock} remaining`} · {formatINR(p.price)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSection("Products");
                                setEditingProductId(p.id);
                              }}
                              className="text-xs text-accent hover:underline"
                            >
                              Edit
                            </button>
                          </div>
                        </li>
                      ))}
                      {(orders.filter((o) => !o.notificationSent).length + products.filter((p) => p.stock <= 5).length) === 0 && (
                        <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                          No new notifications
                        </li>
                      )}
                    </ul>
                  </section>
                </div>
                <section className="grid gap-5 md:grid-cols-3">
                  {(
                    [
                      { label: "Add Product", target: "Products" },
                      { label: "Create Coupon", target: "Coupons" },
                    ] as { label: string; target: AdminSection }[]
                  ).map((a) => (
                    <div
                      key={a.label}
                      className="rounded-2xl border border-dashed border-border bg-card/60 p-6"
                    >
                      <div className="eyebrow mb-2 text-xs uppercase tracking-widest text-muted-foreground">
                        Quick action
                      </div>
                      <h3 className="font-display text-xl">{a.label}</h3>
                      <button
                        type="button"
                        onClick={() => setActiveSection(a.target)}
                        className={`mt-4 ${FBtn}`}
                      >
                        Open
                      </button>
                    </div>
                  ))}
                </section>
              </>
            )}

            {/* ── PRODUCTS ───────────────────────────────────────────── */}
            {activeSection === "Products" && (
              <div className="space-y-6">
                <SectionHeader
                  title="Products"
                  actionLabel="Add Product"
                  onAction={() => openProductForm()}
                />
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products…"
                      className={FI + " sm:max-w-xs"}
                    />
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <label className="flex items-center gap-2 text-muted-foreground text-sm">
                        Category
                        <select
                          value={productFilter}
                          onChange={(e) => setProductFilter(e.target.value as "all" | Category)}
                          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
                        >
                          <option value="all">All</option>
                          <option value="sarees">Sarees</option>
                          <option value="jewellery">Jewellery</option>
                          <option value="combos">Combos</option>
                        </select>
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {filteredProducts.length} of {products.length}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                        <tr className="border-b border-border">
                          <th className="px-3 py-3">Product</th>
                          <th className="px-3 py-3">Price</th>
                          <th className="px-3 py-3">Stock</th>
                          <th className="px-3 py-3">Type</th>
                          <th className="px-3 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pg(filteredProducts, productPage).map((product) => (
                          <tr key={product.id} className="border-b border-border/60 last:border-0">
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="h-10 w-10 shrink-0 rounded-xl object-cover"
                                />
                                <div>
                                  <div className="font-medium line-clamp-1">{product.name}</div>
                                  <div className="text-xs text-muted-foreground">{product.sku}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3">
                              {formatINR(product.salePrice ?? product.price)}
                              {product.discountPercentage && product.discountPercentage > 0 ? (
                                <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                                  {product.discountPercentage}% OFF
                                </span>
                              ) : product.discountFixed && product.discountFixed > 0 ? (
                                <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                                  ₹{product.discountFixed} OFF
                                </span>
                              ) : null}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={
                                  getTotalStock(product) === 0
                                    ? "text-destructive font-medium"
                                    : getTotalStock(product) <= 5
                                      ? "text-amber-600 font-medium"
                                      : ""
                                }
                              >
                                {getTotalStock(product)}
                              </span>
                            </td>
                            <td className="px-3 py-3 capitalize">{product.productType}</td>
                            <td className="px-3 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => openProductForm(product)}
                                  className={FBtnSec}
                                >
                                  <Pencil className="inline h-3 w-3 mr-1" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteProduct(product.id)}
                                  className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="inline h-3 w-3 mr-1" />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    page={productPage}
                    total={tp(filteredProducts.length)}
                    onPage={setProductPage}
                  />
                </div>

                {/* Product Form */}
                {productFormOpen && (
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <SectionHeader
                      title={editingProductId ? "Edit Product" : "Add Product"}
                      actionLabel="Close"
                      onAction={() => setProductFormOpen(false)}
                    />

                    {/* Product Type Selector */}
                    <div className="mb-6">
                      <label className={FL}>Product Type</label>
                      <div className="flex gap-3">
                        {(["sarees", "jewellery", "combos"] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() =>
                              setPf((prev) => ({
                                ...prev,
                                productType: t,
                                tags: [],
                                categories: [t],
                              }))
                            }
                            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-widest capitalize transition ${pf.productType === t ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-accent"}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      {/* Name */}
                      <div className="lg:col-span-2">
                        <label className={FL}>Product Name</label>
                        <input
                          value={pf.name}
                          onChange={(e) =>
                            setPf((prev) => ({
                              ...prev,
                              name: e.target.value,
                              slug: slugify(e.target.value),
                            }))
                          }
                          className={FI}
                          placeholder={
                            pf.productType === "sarees"
                              ? "e.g. Emerald Kanjivaram Silk Saree"
                              : "e.g. Temple Gold Necklace Set"
                          }
                        />
                      </div>

                      {/* Category Style */}
                      <div className="lg:col-span-2">
                        <label className={FL}>Category Style (select all that apply)</label>
                        <MultiSelectDropdown
                          value={pf.tags}
                          onChange={(v) => setPf((prev) => ({ ...prev, tags: v }))}
                          options={catStyles}
                          placeholder="Select category styles…"
                        />
                      </div>

                      {/* Description */}
                      <div className="lg:col-span-2">
                        <label className={FL}>Description</label>
                        <textarea
                          value={pf.description}
                          onChange={(e) =>
                            setPf((prev) => ({ ...prev, description: e.target.value }))
                          }
                          className={FI}
                          rows={3}
                        />
                      </div>

                      {/* Original Price */}
                      <div>
                        <label className={FL}>Original Price (₹)</label>
                        <input
                          type="number"
                          value={pf.originalPrice || ""}
                          onChange={(e) => {
                            const originalPrice = Number(e.target.value);
                            setPf((prev) => {
                              const discountType = prev.discountType;
                              const discountValue = prev.discountValue || 0;
                              let salePrice = originalPrice;
                              if (discountType === "percent" && discountValue > 0 && originalPrice > 0) {
                                salePrice = originalPrice - (originalPrice * discountValue) / 100;
                              } else if (discountType === "fixed" && discountValue > 0 && originalPrice > 0) {
                                salePrice = originalPrice - discountValue;
                              }
                              return {
                                ...prev,
                                originalPrice,
                                salePrice,
                                price: salePrice,
                              };
                            });
                          }}
                          className={FI}
                          placeholder="0"
                          min={0}
                        />
                      </div>

                      {/* Discount Type */}
                      <div>
                        <label className={FL}>Discount Type</label>
                        <select
                          value={pf.discountType}
                          onChange={(e) => {
                            const discountType = e.target.value as "none" | "fixed" | "percent";
                            setPf((prev) => {
                              const originalPrice = prev.originalPrice || 0;
                              const discountValue =
                                discountType === "none" ? 0 : prev.discountValue || 0;
                              let salePrice = originalPrice;
                              if (discountType === "percent" && discountValue > 0 && originalPrice > 0) {
                                salePrice = originalPrice - (originalPrice * discountValue) / 100;
                              } else if (discountType === "fixed" && discountValue > 0 && originalPrice > 0) {
                                salePrice = originalPrice - discountValue;
                              }
                              return {
                                ...prev,
                                discountType,
                                discountValue,
                                discountPercentage: discountType === "percent" ? discountValue : 0,
                                discountFixed: discountType === "fixed" ? discountValue : 0,
                                salePrice,
                                price: salePrice,
                              };
                            });
                          }}
                          className={FI}
                        >
                          <option value="none">None</option>
                          <option value="fixed">Fixed Amount (₹)</option>
                          <option value="percent">Percentage (%)</option>
                        </select>
                      </div>

                      {/* Discount Value */}
                      <div>
                        <label className={FL}>
                          Discount Value ({pf.discountType === "percent" ? "%" : "₹"})
                        </label>
                        <input
                          type="number"
                          value={pf.discountType === "none" ? "" : pf.discountValue || ""}
                          disabled={pf.discountType === "none"}
                          onChange={(e) => {
                            const discountValue = Number(e.target.value) || 0;
                            setPf((prev) => {
                              const originalPrice = prev.originalPrice || 0;
                              let salePrice = originalPrice;
                              if (prev.discountType === "percent" && discountValue > 0 && originalPrice > 0) {
                                salePrice = originalPrice - (originalPrice * discountValue) / 100;
                              } else if (prev.discountType === "fixed" && discountValue > 0 && originalPrice > 0) {
                                salePrice = originalPrice - discountValue;
                              }
                              return {
                                ...prev,
                                discountValue,
                                discountPercentage: prev.discountType === "percent" ? discountValue : 0,
                                discountFixed: prev.discountType === "fixed" ? discountValue : 0,
                                salePrice,
                                price: salePrice,
                              };
                            });
                          }}
                          className={FI}
                          placeholder="0"
                          min={0}
                          max={pf.discountType === "percent" ? 100 : undefined}
                          step={pf.discountType === "percent" ? 1 : 1}
                        />
                      </div>

                      {/* Sale Price (Auto-calculated) */}
                      <div>
                        <label className={FL}>Final Price (₹)</label>
                        <input
                          type="number"
                          value={pf.salePrice || ""}
                          onChange={(e) =>
                            setPf((prev) => ({
                              ...prev,
                              salePrice: Number(e.target.value),
                              price: Number(e.target.value),
                            }))
                          }
                          className={FI}
                          placeholder="0"
                          min={0}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Auto-calculated from Original Price and Discount (% or ₹)
                        </p>
                      </div>

                      {/* Custom Discount Badge */}
                      <div>
                        <label className={FL}>Custom Discount Badge (optional)</label>
                        <input
                          type="text"
                          value={pf.discountBadge}
                          onChange={(e) =>
                            setPf((prev) => ({ ...prev, discountBadge: e.target.value }))
                          }
                          className={FI}
                          placeholder="e.g. Save 200, Best Deal, Limited Offer"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Leave empty to auto-generate badge from discount settings
                        </p>
                      </div>


                      {/* SKU */}
                      <div>
                        <label className={FL}>SKU (auto-generated if empty)</label>
                        <input
                          value={pf.sku}
                          onChange={(e) => setPf((prev) => ({ ...prev, sku: e.target.value }))}
                          className={FI}
                          placeholder="SS-001"
                        />
                      </div>

                      {/* Saree-specific fields */}
                      {pf.productType === "sarees" && (
                        <>
                          <div>
                            <label className={FL}>Fabric Type</label>
                            <ComboBox
                              value={pf.fabricType}
                              onChange={(v) => setPf((prev) => ({ ...prev, fabricType: v }))}
                              options={FABRIC_TYPES}
                              placeholder="Type or select fabric…"
                            />
                          </div>
                          <div>
                            <label className={FL}>Occasion Wear</label>
                            <input
                              value={pf.occasionWear}
                              onChange={(e) =>
                                setPf((prev) => ({ ...prev, occasionWear: e.target.value }))
                              }
                              className={FI}
                              placeholder="e.g. Wedding, Festive, Casual"
                            />
                          </div>
                          <div>
                            <label className={FL}>Work Type</label>
                            <input
                              value={pf.workType}
                              onChange={(e) =>
                                setPf((prev) => ({ ...prev, workType: e.target.value }))
                              }
                              className={FI}
                              placeholder="e.g. Zari, Embroidery, Block Print"
                            />
                          </div>
                          <div>
                            <label className={FL}>Saree Length (meters)</label>
                            <input
                              type="number"
                              step={0.1}
                              value={pf.sareeLength}
                              onChange={(e) =>
                                setPf((prev) => ({ ...prev, sareeLength: Number(e.target.value) }))
                              }
                              className={FI}
                            />
                          </div>
                          <div>
                            <label className={FL}>Blouse Piece Included</label>
                            <select
                              value={pf.blousePiece}
                              onChange={(e) =>
                                setPf((prev) => ({
                                  ...prev,
                                  blousePiece: e.target.value as "Yes" | "No",
                                }))
                              }
                              className={FSel}
                            >
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
                            <label className={FL}>Material/Metal</label>
                            <input
                              value={pf.material}
                              onChange={(e) =>
                                setPf((prev) => ({ ...prev, material: e.target.value }))
                              }
                              className={FI}
                              placeholder="e.g. Gold Plated, Silver, Brass"
                            />
                          </div>
                          <div>
                            <label className={FL}>Color</label>
                            <input
                              value={pf.color}
                              onChange={(e) =>
                                setPf((prev) => ({ ...prev, color: e.target.value }))
                              }
                              className={FI}
                              placeholder="e.g. Gold, Silver, Rose Gold"
                            />
                          </div>
                          <div>
                            <label className={FL}>Weight (grams)</label>
                            <input
                              type="number"
                              step={0.1}
                              value={pf.weight || ""}
                              onChange={(e) =>
                                setPf((prev) => ({ ...prev, weight: Number(e.target.value) }))
                              }
                              className={FI}
                              placeholder="0"
                              min={0}
                            />
                          </div>
                          <div>
                            <label className={FL}>Occasion Wear</label>
                            <input
                              value={pf.occasionWear}
                              onChange={(e) =>
                                setPf((prev) => ({ ...prev, occasionWear: e.target.value }))
                              }
                              className={FI}
                              placeholder="e.g. Bridal, Daily Wear"
                            />
                          </div>
                        </>
                      )}

                      {/* Combos-specific fields */}
                      {pf.productType === "combos" && (
                        <>
                          <div>
                            <label className={FL}>Color</label>
                            <input
                              value={pf.color}
                              onChange={(e) =>
                                setPf((prev) => ({ ...prev, color: e.target.value }))
                              }
                              className={FI}
                              placeholder="e.g. Red, Blue, Green"
                            />
                          </div>
                          <div>
                            <label className={FL}>Occasion Wear</label>
                            <input
                              value={pf.occasionWear}
                              onChange={(e) =>
                                setPf((prev) => ({ ...prev, occasionWear: e.target.value }))
                              }
                              className={FI}
                              placeholder="e.g. Wedding, Festive, Casual"
                            />
                          </div>
                        </>
                      )}

                      {/* Images */}
                      <div className="lg:col-span-2">
                        <label className={FL}>Product Images (multiple allowed)</label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => setProductFiles(Array.from(e.target.files ?? []))}
                          className={FI}
                        />
                        {productFiles.length > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {productFiles.length} file{productFiles.length > 1 ? "s" : ""} selected
                            — will be uploaded on save
                          </p>
                        )}
                        {pf.images.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {pf.images.map((img, i) => (
                              <div key={i} className="relative">
                                <img
                                  src={img}
                                  alt=""
                                  className="h-16 w-16 rounded-xl object-cover border border-border"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPf((prev) => ({
                                      ...prev,
                                      images: prev.images.filter((_, j) => j !== i),
                                      image: i === 0 ? (prev.images[1] ?? "") : prev.image,
                                    }))
                                  }
                                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Checkboxes */}
                      <div className="flex items-center gap-6">
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={pf.isNew}
                            onChange={(e) =>
                              setPf((prev) => ({ ...prev, isNew: e.target.checked }))
                            }
                            className="rounded border-border"
                          />
                          New Arrival
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={pf.isBestSeller}
                            onChange={(e) =>
                              setPf((prev) => ({ ...prev, isBestSeller: e.target.checked }))
                            }
                            className="rounded border-border"
                          />
                          Best Seller
                        </label>
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={pf.buyOneGetOne}
                            onChange={(e) =>
                              setPf((prev) => ({ ...prev, buyOneGetOne: e.target.checked }))
                            }
                            className="rounded border-border"
                          />
                          Buy 1 Get 1 Offer
                        </label>
                      </div>

                      {/* Color Variants */}
                      <div className="lg:col-span-2">
                        <div className="mb-3 flex items-center justify-between">
                          <label className={FL + " mb-0"}>Color Variants</label>
                          <button
                            type="button"
                            onClick={addColorVariant}
                            className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:border-accent"
                          >
                            <Plus className="h-3.5 w-3.5" /> Add Variant
                          </button>
                        </div>
                        {pf.colorVariants.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            No variants added. Click "Add Variant" to add color options.
                          </p>
                        )}
                        <div className="space-y-3">
                          {pf.colorVariants.map((v) => (
                            <div
                              key={v.id}
                              className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-background/50 p-3 sm:grid-cols-4"
                            >
                              <div>
                                <label className={FL}>Color</label>
                                <input
                                  value={v.color}
                                  onChange={(e) => updateVariant(v.id, "color", e.target.value)}
                                  className={FI}
                                  placeholder="e.g. Red"
                                />
                              </div>
                              <div>
                                <label className={FL}>Stock</label>
                                <input
                                  type="number"
                                  value={v.stock}
                                  onChange={(e) =>
                                    updateVariant(v.id, "stock", Number(e.target.value))
                                  }
                                  className={FI}
                                  min={0}
                                />
                              </div>
                              <div>
                                <label className={FL}>Original (₹)</label>
                                <input
                                  type="number"
                                  value={v.originalPrice}
                                  onChange={(e) =>
                                    updateVariant(v.id, "originalPrice", Number(e.target.value))
                                  }
                                  className={FI}
                                  min={0}
                                />
                              </div>
                              <div className="flex items-end gap-2">
                                <div className="flex-1">
                                  <label className={FL}>Sale (₹)</label>
                                  <input
                                    type="number"
                                    value={v.salePrice}
                                    onChange={(e) =>
                                      updateVariant(v.id, "salePrice", Number(e.target.value))
                                    }
                                    className={FI}
                                    min={0}
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeVariant(v.id)}
                                  className="mb-0.5 rounded-full p-2 text-destructive hover:bg-destructive/10"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="lg:col-span-2 flex items-center justify-between">
                        {formError ? (
                          <p className="text-sm text-destructive">{formError}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            All fields with your product details.
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={saveProduct}
                          disabled={formSaving}
                          className={FBtn}
                        >
                          {formSaving
                            ? "Saving…"
                            : editingProductId
                              ? "Update Product"
                              : "Create Product"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── SAREES / JEWELLERY / COMBOS ────────────────────────── */}
            {(activeSection === "Sarees" ||
              activeSection === "Jewellery" ||
              activeSection === "Combos") && (
              <div className="space-y-6">
                <SectionHeader
                  title={activeSection}
                  actionLabel={`Add ${activeSection.slice(0, -1)}`}
                  onAction={() => {
                    setActiveSection("Products");
                    openProductForm();
                    setPf((prev) => ({
                      ...prev,
                      productType: activeSection.toLowerCase() as Category,
                    }));
                  }}
                />
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {products
                    .filter((p) => p.categories.includes(activeSection.toLowerCase() as Category))
                    .map((product) => (
                      <div
                        key={product.id}
                        className="rounded-3xl border border-border bg-card p-4"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-40 w-full rounded-2xl object-cover"
                        />
                        <div className="mt-4 space-y-1">
                          <div className="font-medium line-clamp-2">{product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatINR(product.salePrice ?? product.price)}
                          </div>
                          {product.featured && (
                            <span className="inline-block rounded-full bg-accent/15 px-2 py-0.5 text-xs text-accent">
                              Featured
                            </span>
                          )}
                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSection("Products");
                                openProductForm(product);
                              }}
                              className={FBtnSec + " text-xs"}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteProduct(product.id)}
                              className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                            >
                              Delete
                            </button>
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
                <SectionHeader
                  title="Categories"
                  actionLabel="Add Category"
                  onAction={() => openCatModal()}
                />
                <div className="rounded-2xl border border-border bg-card p-5 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="px-3 py-3 w-10"></th>
                        <th className="px-3 py-3">Name</th>
                        <th className="px-3 py-3">Parent</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((cat, index) => (
                        <tr
                          key={cat.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("categoryIndex", String(index));
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const fromIndex = Number(e.dataTransfer.getData("categoryIndex"));
                            const toIndex = index;
                            if (fromIndex !== toIndex) {
                              moveCategory(fromIndex, toIndex);
                            }
                          }}
                          className="border-b border-border/60 last:border-0 hover:bg-secondary/30 cursor-move"
                        >
                          <td className="px-3 py-3">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </td>
                          <td className="px-3 py-3 font-medium">{cat.name}</td>
                          <td className="px-3 py-3">{cat.parent}</td>
                          <td className="px-3 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs ${cat.active ? "bg-emerald-100 text-emerald-800" : "bg-secondary text-muted-foreground"}`}
                            >
                              {cat.active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-3 py-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => openCatModal(cat)}
                              className={FBtnSec + " text-xs"}
                            >
                              <Pencil className="inline h-3 w-3 mr-1" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteCat(cat.id)}
                              className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                            >
                              Delete
                            </button>
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
                <div className="mb-3">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search orders…"
                    className={FI + " max-w-sm"}
                  />
                </div>
                <div className="rounded-2xl border border-border bg-card p-5 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="px-3 py-3">Order ID</th>
                        <th className="px-3 py-3">Customer</th>
                        <th className="px-3 py-3">Total</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Payment</th>
                        <th className="px-3 py-3">Remaining</th>
                        <th className="px-3 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pg(filteredOrders, ordersPage).map((order) => (
                        <tr key={order.id} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => setOrderDetailId(order.id)}
                              className="font-medium text-accent hover:underline flex items-center gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              {order.order_id || `ORD-${order.id.slice(0, 8)}`}
                            </button>
                          </td>
                          <td className="px-3 py-3">{order.customer}</td>
                          <td className="px-3 py-3 font-medium">{formatINR(order.total)}</td>
                          <td className="px-3 py-3">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className="rounded-xl border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-accent"
                            >
                              {ORDER_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${order.paymentStatus === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-secondary"}`}
                            >
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-medium">
                            {order.remainingAmount && order.remainingAmount > 0 ? formatINR(order.remainingAmount) : "—"}
                          </td>
                          <td className="px-3 py-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => downloadInvoice(order)}
                              className={FBtnSec + " text-xs flex items-center gap-1"}
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Invoice
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteOrder(order.id)}
                              className={FBtnSec + " text-xs flex items-center gap-1 text-destructive hover:border-destructive"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination
                    page={ordersPage}
                    total={tp(filteredOrders.length)}
                    onPage={setOrdersPage}
                  />
                </div>
              </div>
            )}

            {/* ── INSTAGRAM FEED ─────────────────────────────────────── */}
            {activeSection === "Instagram Feed" && (
              <div className="space-y-6">
                <SectionHeader
                  title="Instagram Feed"
                  actionLabel="Add Feed Item"
                  onAction={openIgModal}
                />
                <div className="rounded-2xl border border-border bg-card p-5 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="px-3 py-3">Type</th>
                        <th className="px-3 py-3">URL</th>
                        <th className="px-3 py-3">Caption</th>
                        <th className="px-3 py-3">Linked Products</th>
                        <th className="px-3 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {igFeed.map((item) => (
                        <tr key={item.id} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-3">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${item.mediaType === "reel" ? "bg-violet-100 text-violet-700" : "bg-secondary"}`}
                            >
                              {item.mediaType}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-accent underline text-xs break-all"
                            >
                              {item.url}
                            </a>
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground max-w-[120px] line-clamp-2">
                            {item.caption}
                          </td>
                          <td className="px-3 py-3">
                            <div className="space-y-1">
                              {item.linkedProducts.map((lp, i) => (
                                <div key={i}>
                                  <a
                                    href={lp.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-accent underline"
                                  >
                                    {lp.name}
                                  </a>
                                </div>
                              ))}
                              {item.linkedProducts.length === 0 && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => editIgItem(item)}
                              className="rounded-full border border-border px-3 py-1 text-xs text-foreground hover:border-accent hover:text-accent"
                            >
                              <Edit className="inline h-3 w-3 mr-1" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteIgItem(item.id)}
                              className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="inline h-3 w-3 mr-1" />
                              Delete
                            </button>
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
                <SectionHeader
                  title="Coupons"
                  actionLabel="Create Coupon"
                  onAction={() => openCouponModal()}
                />
                <div className="rounded-2xl border border-border bg-card p-5 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="px-3 py-3">Code</th>
                        <th className="px-3 py-3">Category</th>
                        <th className="px-3 py-3">Type</th>
                        <th className="px-3 py-3">Value</th>
                        <th className="px-3 py-3">Expiry</th>
                        <th className="px-3 py-3">Min. Purchase</th>
                        <th className="px-3 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map((coupon) => (
                        <tr key={coupon.id} className="border-b border-border/60 last:border-0">
                          <td className="px-3 py-3 font-mono font-semibold">{coupon.code}</td>
                          <td className="px-3 py-3">{coupon.category}</td>
                          <td className="px-3 py-3 capitalize">{coupon.discountType}</td>
                          <td className="px-3 py-3 font-medium">
                            {coupon.discountType === "percent"
                              ? `${coupon.discountValue}%`
                              : `₹${coupon.discountValue}`}
                          </td>
                          <td className="px-3 py-3">{coupon.expiry}</td>
                          <td className="px-3 py-3">{formatINR(coupon.minimumPurchase)}</td>
                          <td className="px-3 py-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => openCouponModal(coupon)}
                              className={FBtnSec + " text-xs"}
                            >
                              <Pencil className="inline h-3 w-3 mr-1" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteCoupon(coupon.id)}
                              className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10"
                            >
                              Delete
                            </button>
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
                      <tr className="border-b border-border">
                        <th className="px-3 py-3 w-8"></th>
                        <th className="px-3 py-3">Product</th>
                        <th className="px-3 py-3">Type</th>
                        <th className="px-3 py-3">Total Stock</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <React.Fragment key={product.id}>
                          <tr className="border-b border-border/60 last:border-0">
                            <td className="px-3 py-3">
                              <button
                                type="button"
                                onClick={() => toggleProductExpand(product.id)}
                                className="p-1 hover:bg-secondary rounded transition-colors"
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${expandedProducts.has(product.id) ? "rotate-180" : ""}`}
                                />
                              </button>
                            </td>
                            <td className="px-3 py-3 font-medium line-clamp-1">{product.name}</td>
                            <td className="px-3 py-3 capitalize">{product.productType}</td>
                            <td className="px-3 py-3">
                              {editingStockId === product.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={stockValue}
                                    onChange={(e) => setStockValue(Number(e.target.value))}
                                    min={0}
                                    className="w-20 rounded-xl border border-border bg-background px-2 py-1 text-sm outline-none focus:border-accent"
                                    autoFocus
                                  />
                                  <button
                                    type="button"
                                    onClick={() => saveStock(product)}
                                    className="flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs text-background"
                                  >
                                    <Check className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingStockId(null)}
                                    className="rounded-full border border-border px-2 py-1 text-xs"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ) : (
                                <span
                                  className={`font-medium ${getTotalStock(product) === 0 ? "text-destructive" : getTotalStock(product) <= 5 ? "text-amber-600" : ""}`}
                                >
                                  {getTotalStock(product)}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${getTotalStock(product) === 0 ? "bg-destructive/10 text-destructive" : getTotalStock(product) <= 5 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-800"}`}
                              >
                                {getTotalStock(product) === 0
                                  ? "Out of Stock"
                                  : getTotalStock(product) <= 5
                                    ? "Low Stock"
                                    : "In Stock"}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              {editingStockId !== product.id && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStockId(product.id);
                                    setStockValue(getTotalStock(product));
                                  }}
                                  className={FBtnSec + " text-xs"}
                                >
                                  Update
                                </button>
                              )}
                            </td>
                          </tr>
                          {expandedProducts.has(product.id) && product.colorVariants && product.colorVariants.length > 0 && (
                            <tr className="bg-secondary/30">
                              <td colSpan={6} className="px-3 py-2">
                                <table className="w-full text-sm">
                                  <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                                    <tr>
                                      <th className="px-3 py-2">Color</th>
                                      <th className="px-3 py-2">SKU</th>
                                      <th className="px-3 py-2">Stock</th>
                                      <th className="px-3 py-2">Status</th>
                                      <th className="px-3 py-2">Update</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {product.colorVariants.map((variant) => (
                                      <tr key={variant.id} className="border-b border-border/40 last:border-0">
                                        <td className="px-3 py-2 capitalize">{variant.color}</td>
                                        <td className="px-3 py-2 font-mono text-xs">{variant.sku || "N/A"}</td>
                                        <td className="px-3 py-2">
                                          {editingVariantId === variant.id ? (
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="number"
                                                value={variantStockValue}
                                                onChange={(e) => setVariantStockValue(Number(e.target.value))}
                                                min={0}
                                                className="w-20 rounded-xl border border-border bg-background px-2 py-1 text-sm outline-none focus:border-accent"
                                                autoFocus
                                              />
                                              <button
                                                type="button"
                                                onClick={async () => {
                                                  try {
                                                    // Update variant stock in database
                                                    await apiDirect(`products/variants/${variant.id}`, {
                                                      method: "PUT",
                                                      body: JSON.stringify({ stock: variantStockValue }),
                                                    });
                                                    // Update local state
                                                    setProducts((prev) =>
                                                      prev.map((p) =>
                                                        p.id === product.id
                                                          ? {
                                                              ...p,
                                                              colorVariants: p.colorVariants?.map((v) =>
                                                                v.id === variant.id ? { ...v, stock: variantStockValue } : v
                                                              ),
                                                            }
                                                          : p
                                                      )
                                                    );
                                                    setEditingVariantId(null);
                                                  } catch (err) {
                                                    alert((err as Error).message);
                                                  }
                                                }}
                                                className="flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs text-background"
                                              >
                                                <Check className="h-3 w-3" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => setEditingVariantId(null)}
                                                className="rounded-full border border-border px-2 py-1 text-xs"
                                              >
                                                <X className="h-3 w-3" />
                                              </button>
                                            </div>
                                          ) : (
                                            <span
                                              className={`font-medium ${variant.stock === 0 ? "text-destructive" : variant.stock <= 5 ? "text-amber-600" : ""}`}
                                            >
                                              {variant.stock}
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2">
                                          <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${variant.stock === 0 ? "bg-destructive/10 text-destructive" : variant.stock <= 5 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-800"}`}
                                          >
                                            {variant.stock === 0
                                              ? "Out of Stock"
                                              : variant.stock <= 5
                                                ? "Low Stock"
                                                : "In Stock"}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2">
                                          {editingVariantId !== variant.id && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingVariantId(variant.id);
                                                setVariantStockValue(variant.stock);
                                              }}
                                              className={FBtnSec + " text-xs"}
                                            >
                                              Update
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── ORDER DETAIL MODAL ──────────────────────────────────────── */}
      <Modal
        open={!!orderDetail}
        onClose={() => setOrderDetailId(null)}
        title={`Order ${orderDetail?.id ?? ""}`}
        wide
      >
        {orderDetail && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Customer Details
                </p>
                <p className="font-medium">{orderDetail.customer}</p>
                <p className="mt-1 text-sm text-muted-foreground">{orderDetail.mobile || 'N/A'}</p>
                <p className="mt-1 text-sm text-muted-foreground">{orderDetail.email || 'N/A'}</p>
                <p className="mt-1 text-sm text-muted-foreground">{orderDetail.address}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {orderDetail.city || 'N/A'}, {orderDetail.state || 'N/A'} - {orderDetail.pincode || 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Order Info
                </p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span>{orderDetail.orderDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Type</span>
                    <span className="font-medium">{orderDetail.paymentType || 'Online'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Status</span>
                    <span className="font-medium text-emerald-700">
                      {orderDetail.paymentStatus}
                    </span>
                  </div>
                  {(orderDetail.advancePaid ?? 0) > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Advance Paid</span>
                        <span className="font-medium">{formatINR(orderDetail.advancePaid ?? 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Paid Online</span>
                        <span className="font-medium">{formatINR(orderDetail.totalPaidOnline ?? 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Remaining Amount</span>
                        <span className="font-medium text-amber-700">{formatINR(orderDetail.remainingAmount ?? 0)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Items Ordered
              </p>
              <div className="space-y-3">
                {orderDetail.order_items && orderDetail.order_items.length > 0 ? (
                  orderDetail.order_items.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-3 rounded-lg bg-secondary/60 px-4 py-3">
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{item.product_name || 'Product'}</div>
                        {item.category && (
                          <div className="text-xs text-muted-foreground capitalize">{item.category}</div>
                        )}
                        {(item.selected_color || item.variant) ? (
                          <div className="text-xs text-muted-foreground">Color: {item.selected_color || item.variant}</div>
                        ) : (
                          <div className="text-xs text-muted-foreground">Color: N/A</div>
                        )}
                        {item.sku && (
                          <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-medium">Qty: {item.quantity}</div>
                        <div className="text-muted-foreground">{formatINR(item.price)}</div>
                        <div className="font-medium">{formatINR(item.price * item.quantity)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-secondary/60 px-4 py-3 text-sm font-medium">
                    {orderDetail.item}
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Price Summary
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>
                    {formatINR(
                      orderDetail.total - orderDetail.deliveryCharges - orderDetail.gatewayFee,
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{formatINR(orderDetail.deliveryCharges)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gateway Fee</span>
                  <span>{formatINR(orderDetail.gatewayFee)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold text-base">
                  <span>Total</span>
                  <span>{formatINR(orderDetail.total)}</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Update Status
              </p>
              <div className="flex items-center gap-3">
                <select
                  value={orderDetail.status}
                  onChange={(e) => updateOrderStatus(orderDetail.id, e.target.value)}
                  className={FSel + " flex-1"}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${orderDetail.status === "Delivered" ? "bg-emerald-100 text-emerald-800" : orderDetail.status === "Cancelled" ? "bg-destructive/10 text-destructive" : "bg-secondary"}`}
                >
                  {orderDetail.status}
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => downloadInvoice(orderDetail)}
                className={FBtn + " flex items-center gap-2"}
              >
                <FileText className="h-4 w-4" />
                Download Invoice
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── CATEGORY MODAL ──────────────────────────────────────────── */}
      <Modal
        open={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCat ? "Edit Category" : "Add Category"}
      >
        <div className="space-y-4">
          <div>
            <label className={FL}>Parent Category</label>
            <select
              value={catForm.parent}
              onChange={(e) => setCatForm((f) => ({ ...f, parent: e.target.value }))}
              className={FSel}
            >
              <option value="Sarees">Sarees</option>
              <option value="Jewellery">Jewellery</option>
              <option value="Combos">Combos</option>
            </select>
          </div>
          <div>
            <label className={FL}>Category Name</label>
            <input
              value={catForm.name}
              onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
              className={FI}
              placeholder="e.g. Mysore Silk Sarees"
            />
          </div>
          <div>
            <label className={FL}>Description (optional)</label>
            <textarea
              value={catForm.description}
              onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))}
              className={FI}
              rows={2}
              placeholder="Short description…"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setCatModalOpen(false)} className={FBtnSec}>
              Cancel
            </button>
            <button type="button" onClick={saveCat} className={FBtn}>
              {editingCat ? "Update" : "Add Category"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── INSTAGRAM FEED MODAL ────────────────────────────────────── */}
      <Modal open={igModalOpen} onClose={() => setIgModalOpen(false)} title="Add Feed Item" wide>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={FL}>Title</label>
              <input
                value={igForm.title}
                onChange={(e) => setIgForm((f) => ({ ...f, title: e.target.value }))}
                className={FI}
                placeholder="e.g. Temple Gold Bridal Set"
              />
            </div>
            <div>
              <label className={FL}>Type</label>
              <select
                value={igForm.mediaType}
                onChange={(e) =>
                  setIgForm((f) => ({ ...f, mediaType: e.target.value as "post" | "reel" }))
                }
                className={FSel}
              >
                <option value="post">Post</option>
                <option value="reel">Reel</option>
              </select>
            </div>
          </div>
          <div>
            <label className={FL}>URL (Instagram link)</label>
            <input
              value={igForm.url}
              onChange={(e) => setIgForm((f) => ({ ...f, url: e.target.value }))}
              className={FI}
              placeholder="https://instagram.com/p/..."
            />
          </div>
          <div>
            <label className={FL}>Thumbnail Image</label>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setIgThumbnailFile(file);
                }}
                className="flex-1 text-xs"
              />
              <button
                type="button"
                onClick={() => setIgThumbnailFile(null)}
                className="rounded-lg border border-border px-3 py-2 text-xs hover:border-accent"
              >
                Clear
              </button>
            </div>
            {igThumbnailFile && (
              <p className="mt-1 text-xs text-muted-foreground">
                Selected: {igThumbnailFile.name}
              </p>
            )}
            <div className="mt-2">
              <label className={FL + " text-xs"}>Or enter ImageKit URL directly:</label>
              <input
                value={igForm.thumbnail}
                onChange={(e) => setIgForm((f) => ({ ...f, thumbnail: e.target.value }))}
                className={FI}
                placeholder="https://ik.imagekit.io/..."
              />
            </div>
          </div>
          <div>
            <label className={FL}>Caption (optional)</label>
            <input
              value={igForm.caption}
              onChange={(e) => setIgForm((f) => ({ ...f, caption: e.target.value }))}
              className={FI}
              placeholder="e.g. Festive collection drop!"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ig-active"
              checked={igForm.isActive}
              onChange={(e) => setIgForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="ig-active" className={FL + " mb-0"}>Active (show on website)</label>
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className={FL + " mb-0"}>Linked Products</label>
              <button
                type="button"
                onClick={() => setIgLinked((prev) => [...prev, { name: "", url: "" }])}
                className="flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs hover:border-accent"
              >
                <Plus className="h-3.5 w-3.5" /> Add Product
              </button>
            </div>
            {igLinked.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No products linked yet. Click "Add Product" to link items from the website.
              </p>
            )}
            <div className="space-y-3">
              {igLinked.map((lp, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end rounded-xl border border-border p-3 bg-background/50"
                >
                  <div>
                    <label className={FL}>Product Name</label>
                    <input
                      value={lp.name}
                      onChange={(e) =>
                        setIgLinked((prev) =>
                          prev.map((p, j) => (j === i ? { ...p, name: e.target.value } : p)),
                        )
                      }
                      className={FI}
                      placeholder="Product name"
                      list={`ig-products-${i}`}
                    />
                    <datalist id={`ig-products-${i}`}>
                      {products.map((p) => (
                        <option key={p.id} value={p.name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className={FL}>Website URL</label>
                    <input
                      value={lp.url}
                      onChange={(e) =>
                        setIgLinked((prev) =>
                          prev.map((p, j) => (j === i ? { ...p, url: e.target.value } : p)),
                        )
                      }
                      className={FI}
                      placeholder="/product/slug or full URL"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIgLinked((prev) => prev.filter((_, j) => j !== i))}
                    className="mb-0.5 rounded-full p-2 text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIgModalOpen(false)} className={FBtnSec}>
              Cancel
            </button>
            <button type="button" onClick={saveIgItem} className={FBtn}>
              {(igForm as any).id ? "Save" : "Add to Feed"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── COUPON MODAL ────────────────────────────────────────────── */}
      <Modal
        open={couponModalOpen}
        onClose={() => setCouponModalOpen(false)}
        title={editingCoupon ? "Edit Coupon" : "Create Coupon"}
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={FL}>Coupon Code</label>
              <input
                value={couponForm.code}
                onChange={(e) =>
                  setCouponForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                }
                className={FI}
                placeholder="e.g. SASHVI10"
              />
            </div>
            <div>
              <label className={FL}>Applies To Category</label>
              <select
                value={couponForm.category}
                onChange={(e) => setCouponForm((f) => ({ ...f, category: e.target.value }))}
                className={FSel}
              >
                <option value="All">All Categories</option>
                <option value="Sarees">Sarees</option>
                <option value="Jewellery">Jewellery</option>
                <option value="Combos">Combos</option>
              </select>
            </div>
            <div>
              <label className={FL}>Discount Type</label>
              <select
                value={couponForm.discountType}
                onChange={(e) =>
                  setCouponForm((f) => ({
                    ...f,
                    discountType: e.target.value as "percent" | "fixed",
                  }))
                }
                className={FSel}
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div>
              <label className={FL}>
                Discount Value ({couponForm.discountType === "percent" ? "%" : "₹"})
              </label>
              <input
                type="number"
                value={couponForm.discountValue || ""}
                onChange={(e) =>
                  setCouponForm((f) => ({ ...f, discountValue: Number(e.target.value) }))
                }
                className={FI}
                min={0}
              />
            </div>
            <div>
              <label className={FL}>Expiry Date</label>
              <input
                type="date"
                value={couponForm.expiry}
                onChange={(e) => setCouponForm((f) => ({ ...f, expiry: e.target.value }))}
                className={FI}
              />
            </div>
            <div>
              <label className={FL}>Minimum Purchase (₹)</label>
              <input
                type="number"
                value={couponForm.minimumPurchase || ""}
                onChange={(e) =>
                  setCouponForm((f) => ({ ...f, minimumPurchase: Number(e.target.value) }))
                }
                className={FI}
                min={0}
              />
            </div>
            <div>
              <label className={FL}>Usage Limit</label>
              <input
                type="number"
                value={couponForm.usageLimit || ""}
                onChange={(e) =>
                  setCouponForm((f) => ({ ...f, usageLimit: Number(e.target.value) }))
                }
                className={FI}
                min={1}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setCouponModalOpen(false)} className={FBtnSec}>
              Cancel
            </button>
            <button type="button" onClick={saveCoupon} className={FBtn}>
              {editingCoupon ? "Update Coupon" : "Create Coupon"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export const Route = createFileRoute("/admin")({ component: Admin });
