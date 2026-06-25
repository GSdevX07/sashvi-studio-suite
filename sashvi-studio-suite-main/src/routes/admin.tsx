import { createFileRoute, Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Gem,
  Layers,
  Star,
  Image as ImageIcon,
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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Logo } from "@/components/Logo";
import {
  PRODUCTS,
  formatINR,
  SAREE_CATEGORIES,
  JEWELLERY_CATEGORIES,
  COMBO_CATEGORIES,
  Product,
  Category,
} from "@/lib/products";

const ADMIN_STORAGE_KEY = "sashvi_admin_token";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Products", icon: Package },
  { label: "Categories", icon: Tag },
  { label: "Sarees", icon: Sparkles },
  { label: "Jewellery", icon: Gem },
  { label: "Combos", icon: Layers },
  { label: "Orders", icon: ShoppingBag },
  { label: "Customers", icon: Users },
  { label: "Reviews", icon: MessageSquare },
  { label: "Instagram Feed", icon: Instagram },
  { label: "Banners", icon: ImageIcon },
  { label: "Coupons", icon: Star },
  { label: "Inventory", icon: TrendingUp },
  { label: "Settings", icon: Settings },
] as const;

type AdminSection = (typeof NAV)[number]["label"];

type ProductAdmin = Product & {
  sku: string;
  productType: Category;
  active: boolean;
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
  customer: string;
  item: string;
  total: number;
  status: string;
  paymentStatus: string;
  deliveryCharges: number;
  gatewayFee: number;
  address: string;
  orderDate: string;
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
  status: "Pending" | "Approved" | "Rejected";
  featured: boolean;
  date: string;
};

type InstagramItem = {
  id: string;
  mediaType: "post" | "reel";
  url: string;
  thumbnail: string;
  linkedProduct: string;
  order: number;
  active: boolean;
};

type BannerAdmin = {
  id: string;
  desktop: string;
  mobile: string;
  startDate: string;
  endDate: string;
  link: string;
  active: boolean;
};

type CouponAdmin = {
  id: string;
  code: string;
  discountType: "fixed" | "percent";
  discountValue: number;
  expiry: string;
  usageLimit: number;
  minimumPurchase: number;
  active: boolean;
};

type SettingsAdmin = {
  storeName: string;
  logo: string;
  contactNumber: string;
  email: string;
  address: string;
  freeDeliveryAbove: number;
  deliveryCharge: number;
  gatewayFee: number;
  razorpayKey: string;
  imageKitUrl: string;
};

function StatCard({ label, value, delta, up = true, icon: Icon }: { label: string; value: string; delta: string; up?: boolean; icon: typeof IndianRupee }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="eyebrow">{label}</div>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-accent">
          <Icon className="h-4 w-4" />
        </div>
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
        <button onClick={onAction} type="button" className="rounded-full bg-foreground px-4 py-2 text-xs font-semibold uppercase tracking-widest text-background hover:bg-accent hover:text-accent-foreground">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

const defaultCategories: CategoryAdmin[] = [
  { id: "cat-1", name: "Mysore Silk Sarees", image: "", description: "Premium wedding and festive sarees.", parent: "Sarees", sortOrder: 1, active: true },
  { id: "cat-2", name: "Mul Cotton Sarees", image: "", description: "Everyday breathable cotton sarees.", parent: "Sarees", sortOrder: 2, active: true },
  { id: "cat-3", name: "Handloom & Artisanal Sarees", image: "", description: "Handloom craft sarees with artisanal detail.", parent: "Sarees", sortOrder: 3, active: true },
  { id: "cat-4", name: "Fancy & Designer Sarees", image: "", description: "Designer sarees for reception and parties.", parent: "Sarees", sortOrder: 4, active: true },
  { id: "cat-5", name: "Necklaces", image: "", description: "Statement necklaces and temple sets.", parent: "Jewellery", sortOrder: 1, active: true },
  { id: "cat-6", name: "Long Haaram", image: "", description: "Classic long necklaces for bridal wear.", parent: "Jewellery", sortOrder: 2, active: true },
  { id: "cat-7", name: "Bridal Sets", image: "", description: "Full bridal jewellery sets.", parent: "Jewellery", sortOrder: 3, active: true },
  { id: "cat-8", name: "Earrings & Jhumkas", image: "", description: "Detailed earrings and jhumkas.", parent: "Jewellery", sortOrder: 4, active: true },
];

const defaultOrders: OrderAdmin[] = [
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

const defaultCustomers: CustomerAdmin[] = [
  { id: "cust-1", name: "Ananya R.", email: "ananya@example.com", totalSpend: 28499, lastOrder: "2026-06-20", orders: 14, address: "Chennai" },
  { id: "cust-2", name: "Lakshmi V.", email: "lakshmi@example.com", totalSpend: 15849, lastOrder: "2026-06-18", orders: 9, address: "Bangalore" },
  { id: "cust-3", name: "Sneha K.", email: "sneha@example.com", totalSpend: 11299, lastOrder: "2026-06-15", orders: 7, address: "Hyderabad" },
];

const defaultReviews: ReviewAdmin[] = [
  { id: 1, name: "Ananya R.", product: "Emerald Kanjivaram Silk Saree", rating: 5, comment: "The silk is dreamy and the finish is perfect.", status: "Pending", featured: false, date: "2026-06-21" },
  { id: 2, name: "Lakshmi V.", product: "Ruby Temple Necklace Set", rating: 5, comment: "Beautiful shine and excellent quality.", status: "Approved", featured: true, date: "2026-06-19" },
];

const defaultInstagram: InstagramItem[] = [
  { id: "ig-1", mediaType: "post", url: "https://instagram.com/p/1", thumbnail: "https://placehold.co/120x120", linkedProduct: "Emerald Kanjivaram Silk Saree", order: 1, active: true },
  { id: "ig-2", mediaType: "reel", url: "https://instagram.com/reel/2", thumbnail: "https://placehold.co/120x120", linkedProduct: "Ruby Temple Necklace Set", order: 2, active: true },
];

const defaultBanners: BannerAdmin[] = [
  { id: "ban-1", desktop: "https://placehold.co/1200x400", mobile: "https://placehold.co/600x400", startDate: "2026-06-01", endDate: "2026-06-30", link: "/sarees", active: true },
  { id: "ban-2", desktop: "https://placehold.co/1200x400?text=Sale", mobile: "https://placehold.co/600x400?text=Sale", startDate: "2026-07-01", endDate: "2026-07-15", link: "/jewellery", active: true },
];

const defaultCoupons: CouponAdmin[] = [
  { id: "cp-1", code: "SASHVI10", discountType: "percent", discountValue: 10, expiry: "2026-12-31", usageLimit: 100, minimumPurchase: 1999, active: true },
  { id: "cp-2", code: "FLAT500", discountType: "fixed", discountValue: 500, expiry: "2026-11-30", usageLimit: 50, minimumPurchase: 4999, active: true },
];

const initialSettings: SettingsAdmin = {
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

function Admin() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeSection, setActiveSection] = useState<AdminSection>("Dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [productFilter, setProductFilter] = useState<"all" | Category>("all");
  const [productPage, setProductPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [products, setProducts] = useState<ProductAdmin[]>([]);
  const [categories, setCategories] = useState<CategoryAdmin[]>(defaultCategories);
  const [orders, setOrders] = useState<OrderAdmin[]>(defaultOrders);
  const [customers, setCustomers] = useState<CustomerAdmin[]>(defaultCustomers);
  const [reviews, setReviews] = useState<ReviewAdmin[]>(defaultReviews);
  const [instagramFeed, setInstagramFeed] = useState<InstagramItem[]>(defaultInstagram);
  const [banners, setBanners] = useState<BannerAdmin[]>(defaultBanners);
  const [coupons, setCoupons] = useState<CouponAdmin[]>(defaultCoupons);
  const [settings, setSettings] = useState<SettingsAdmin>(initialSettings);
  const [productFormData, setProductFormData] = useState<ProductAdmin>({
    id: "",
    slug: "",
    name: "",
    price: 0,
    image: "",
    categories: ["sarees"],
    tags: [],
    stock: 0,
    description: "",
    sku: "",
    productType: "sarees",
    active: true,
  });

  const pageSize = 5;

  function headers(contentType = "application/json") {
    return {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": contentType,
    };
  }

  async function apiRequest<T>(path: string, init?: RequestInit) {
    const response = await fetch(`/api/admin/${path}`, {
      ...init,
      headers: { ...(init?.headers as Record<string, string>), ...headers() },
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.error || "API request failed");
    }
    return json as T;
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedToken = window.localStorage.getItem(ADMIN_STORAGE_KEY);
    if (savedToken) {
      setToken(savedToken);
    } else {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    setInitializing(true);
    fetch("/api/admin/me", { headers: headers() })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Not authenticated");
        }
        return res.json();
      })
      .then((result) => {
        setUser(result.user);
        setAuthError(null);
      })
      .catch(() => {
        window.localStorage.removeItem(ADMIN_STORAGE_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setInitializing(false));
  }, [token]);

  useEffect(() => {
    if (!token) return;
    async function loadAdminData() {
      try {
        const [productData, categoryData, orderData, customerData, reviewData, instagramData, bannerData, couponData, settingsData] = await Promise.all([
          apiRequest<{ products: ProductAdmin[] }>("products"),
          apiRequest<{ categories: CategoryAdmin[] }>("categories"),
          apiRequest<{ orders: OrderAdmin[] }>("orders"),
          apiRequest<{ customers: CustomerAdmin[] }>("customers"),
          apiRequest<{ reviews: ReviewAdmin[] }>("reviews"),
          apiRequest<{ feed: InstagramItem[] }>("instagram-feed"),
          apiRequest<{ banners: BannerAdmin[] }>("banners"),
          apiRequest<{ coupons: CouponAdmin[] }>("coupons"),
          apiRequest<{ settings: SettingsAdmin }>("settings"),
        ]);

        setProducts(productData.products);
        setCategories(categoryData.categories);
        setOrders(orderData.orders);
        setCustomers(customerData.customers);
        setReviews(reviewData.reviews);
        setInstagramFeed(instagramData.feed);
        setBanners(bannerData.banners);
        setCoupons(couponData.coupons);
        setSettings(settingsData.settings);
      } catch (error) {
        console.warn("Failed to load admin data", error);
      }
    }
    loadAdminData();
  }, [token]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);
    setInitializing(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setAuthError(data.error || "Unable to log in.");
        return;
      }
      setToken(data.token);
      window.localStorage.setItem(ADMIN_STORAGE_KEY, data.token);
      setUser({ email: data.user.email });
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
    setToken(null);
    setUser(null);
    setActiveSection("Dashboard");
  }

  function openProductForm(product?: ProductAdmin) {
    setFormError(null);
    if (product) {
      setProductFormData(product);
      setEditingProductId(product.id);
    } else {
      setProductFormData({
        id: "",
        slug: "",
        name: "",
        price: 0,
        image: "",
        categories: ["sarees"],
        tags: [],
        stock: 0,
        description: "",
        sku: "",
        productType: "sarees",
        active: true,
      });
      setEditingProductId(null);
    }
    setProductFormOpen(true);
    setActiveSection("Products");
  }

  async function uploadProductImage() {
    if (!productFile) {
      return productFormData.image;
    }

    const formData = new FormData();
    formData.append("file", productFile);

    const response = await fetch("/api/admin/upload-image", {
      method: "POST",
      body: formData,
      headers: { Authorization: token ? `Bearer ${token}` : "" },
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(json.error || "Image upload failed");
    }

    return json.url as string;
  }

  async function saveProduct() {
    setFormError(null);
    if (!productFormData.name.trim()) {
      setFormError("Product name is required.");
      return;
    }
    if (productFormData.price <= 0) {
      setFormError("Product price must be greater than 0.");
      return;
    }
    if (!productFormData.slug.trim()) {
      setFormError("Product slug is required.");
      return;
    }

    const imageUrl = await uploadProductImage();
    const payload = {
      ...productFormData,
      image: imageUrl,
      tags: productFormData.tags.map((tag) => tag.trim()).filter(Boolean),
      categories: [productFormData.productType],
    };

    try {
      if (editingProductId) {
        await apiRequest<{ product: ProductAdmin }>(`products/${editingProductId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest<{ product: ProductAdmin }>("products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setProductFormOpen(false);
      setEditingProductId(null);
      setProductPage(1);
      const result = await apiRequest<{ products: ProductAdmin[] }>("products");
      setProducts(result.products);
    } catch (error) {
      setFormError((error as Error).message);
    }
  }

  async function deleteProduct(id: string) {
    await apiRequest<void>(`products/${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((product) => product.id !== id));
  }

  async function duplicateProduct(product: ProductAdmin) {
    await apiRequest<{ product: ProductAdmin }>("products", {
      method: "POST",
      body: JSON.stringify({
        ...product,
        id: "",
        name: `${product.name} (copy)`,
        slug: `${product.slug}-copy-${Date.now()}`,
        sku: `SS-${Date.now()}`,
      }),
    });
    const result = await apiRequest<{ products: ProductAdmin[] }>("products");
    setProducts(result.products);
  }

  async function submitCategory() {
    const name = window.prompt("Category name");
    if (!name) return;
    await apiRequest<{ category: CategoryAdmin }>("categories", {
      method: "POST",
      body: JSON.stringify({
        name,
        image: "",
        description: "",
        parent: "Sarees",
        sortOrder: categories.length + 1,
        active: true,
      }),
    });
    const result = await apiRequest<{ categories: CategoryAdmin[] }>("categories");
    setCategories(result.categories);
  }

  async function addInstagramItem() {
    const url = window.prompt("Instagram URL");
    if (!url) return;
    await apiRequest<{ item: InstagramItem }>("instagram-feed", {
      method: "POST",
      body: JSON.stringify({
        mediaType: "post",
        url,
        thumbnail: "https://placehold.co/120x120",
        linkedProduct: PRODUCTS[0]?.name ?? "",
        order: instagramFeed.length + 1,
        active: true,
      }),
    });
    const result = await apiRequest<{ feed: InstagramItem[] }>("instagram-feed");
    setInstagramFeed(result.feed);
  }

  async function deleteInstagramItem(id: string) {
    await apiRequest<void>(`instagram-feed/${id}`, { method: "DELETE" });
    setInstagramFeed((prev) => prev.filter((item) => item.id !== id));
  }

  async function addBanner() {
    await apiRequest<{ banner: BannerAdmin }>("banners", {
      method: "POST",
      body: JSON.stringify({
        desktop: "https://placehold.co/1200x400",
        mobile: "https://placehold.co/600x400",
        startDate: "2026-07-01",
        endDate: "2026-07-15",
        link: "/",
        active: true,
      }),
    });
    const result = await apiRequest<{ banners: BannerAdmin[] }>("banners");
    setBanners(result.banners);
  }

  async function addCoupon() {
    const code = window.prompt("Coupon code");
    if (!code) return;
    await apiRequest<{ coupon: CouponAdmin }>("coupons", {
      method: "POST",
      body: JSON.stringify({
        code,
        discountType: "percent",
        discountValue: 10,
        expiry: "2026-12-31",
        usageLimit: 100,
        minimumPurchase: 1999,
        active: true,
      }),
    });
    const result = await apiRequest<{ coupons: CouponAdmin[] }>("coupons");
    setCoupons(result.coupons);
  }

  async function deleteCoupon(id: string) {
    await apiRequest<void>(`coupons/${id}`, { method: "DELETE" });
    setCoupons((prev) => prev.filter((item) => item.id !== id));
  }

  async function updateInventory(product: ProductAdmin) {
    const amount = Number(window.prompt("New stock quantity", String(product.stock)));
    if (Number.isNaN(amount)) return;
    await apiRequest<{ product: ProductAdmin }>(`products/${product.id}`, {
      method: "PUT",
      body: JSON.stringify({ stock: amount }),
    });
    setProducts((prev) => prev.map((item) => (item.id === product.id ? { ...item, stock: amount } : item)));
  }

  async function updateOrderStatus(id: string, status: string) {
    await apiRequest<{ order: OrderAdmin }>(`orders/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));
  }

  async function approveReview(id: number) {
    await apiRequest<{ review: ReviewAdmin }>(`reviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "Approved" }),
    });
    setReviews((prev) => prev.map((review) => (review.id === id ? { ...review, status: "Approved" } : review)));
  }

  async function rejectReview(id: number) {
    await apiRequest<{ review: ReviewAdmin }>(`reviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "Rejected" }),
    });
    setReviews((prev) => prev.map((review) => (review.id === id ? { ...review, status: "Rejected" } : review)));
  }

  async function deleteReview(id: number) {
    await apiRequest<void>(`reviews/${id}`, { method: "DELETE" });
    setReviews((prev) => prev.filter((review) => review.id !== id));
  }

  async function saveSettings() {
    await apiRequest<{ settings: SettingsAdmin }>("settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
    const result = await apiRequest<{ settings: SettingsAdmin }>("settings");
    setSettings(result.settings);
    window.alert("Settings saved.");
  }

  async function editCategory(category: CategoryAdmin) {
    const newName = window.prompt("New category name", category.name);
    if (!newName) return;
    const result = await apiRequest<{ category: CategoryAdmin }>(`categories/${category.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: newName }),
    });
    setCategories((prev) => prev.map((item) => (item.id === category.id ? result.category : item)));
  }

  async function deleteCategory(id: string) {
    await apiRequest<void>(`categories/${id}`, { method: "DELETE" });
    setCategories((prev) => prev.filter((item) => item.id !== id));
  }

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.sku.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter((product) => (productFilter === "all" ? true : product.categories.includes(productFilter)));
  }, [products, searchQuery, productFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => order.id.toLowerCase().includes(searchQuery.toLowerCase()) || order.customer.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [orders, searchQuery]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || customer.email.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [customers, searchQuery]);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => review.name.toLowerCase().includes(searchQuery.toLowerCase()) || review.product.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [reviews, searchQuery]);

  const totalPages = (length: number) => Math.max(1, Math.ceil(length / pageSize));

  const currentProducts = filteredProducts.slice((productPage - 1) * pageSize, productPage * pageSize);
  const currentOrders = filteredOrders.slice((ordersPage - 1) * pageSize, ordersPage * pageSize);
  const currentCustomers = filteredCustomers.slice((customerPage - 1) * pageSize, customerPage * pageSize);
  const currentReviews = filteredReviews.slice((reviewPage - 1) * pageSize, reviewPage * pageSize);

  const quickActions = [
    { label: "Add Saree", target: "Sarees" as AdminSection },
    { label: "Schedule Banner", target: "Banners" as AdminSection },
    { label: "Approve Reviews", target: "Reviews" as AdminSection },
  ];

  if (!user && !initializing) {
    return (
      <div className="min-h-screen bg-background px-4 py-20 text-foreground">
        <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-border bg-card p-8 shadow-luxe sm:p-12">
          <div className="mb-8 text-center">
            <Logo />
            <h1 className="mt-6 font-display text-4xl">Admin Sign In</h1>
            <p className="mt-3 text-sm text-muted-foreground">Secure access to Sashvi Studio’s admin dashboard.</p>
          </div>
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                placeholder="********"
                required
              />
            </div>
            {authError ? <p className="text-sm text-destructive">{authError}</p> : null}
            <button
              type="submit"
              disabled={initializing}
              className="w-full rounded-full bg-foreground px-5 py-3 text-sm font-semibold uppercase tracking-widest text-background transition hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              {initializing ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p className="mt-6 text-center text-xs uppercase tracking-[0.22em] text-muted-foreground">Admin users are managed through secure environment configuration.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/50 text-foreground">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-border bg-background lg:block">
          <div className="border-b border-border px-6 py-5"><Logo /></div>
          <nav className="space-y-0.5 p-3">
            {NAV.map((n) => (
              <button
                key={n.label}
                type="button"
                onClick={() => setActiveSection(n.label)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  activeSection === n.label ? "bg-foreground text-background" : "text-foreground/75 hover:bg-secondary"
                }`}
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-5 lg:px-10">
              <div>
                <div className="eyebrow">Studio</div>
                <h1 className="font-display text-xl">{activeSection}</h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex text-sm text-muted-foreground">{user?.email}</span>
                <Link to="/" className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium uppercase tracking-widest hover:border-accent">View Site</Link>
                <button type="button" onClick={logout} className="rounded-full border border-border bg-card px-4 py-2 text-xs font-medium uppercase tracking-widest hover:border-accent">Logout</button>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-5 lg:p-10">
            {activeSection === "Dashboard" && (
              <>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard label="Revenue (30d)" value={formatINR(248900)} delta="+12.4% vs last month" icon={IndianRupee} />
                  <StatCard label="Orders" value={String(orders.length)} delta="+8 this week" icon={ShoppingBag} />
                  <StatCard label="Customers" value={String(customers.length)} delta="+5.1%" icon={Users} />
                  <StatCard label="Low stock" value={String(products.filter((p) => p.stock <= 5).length)} delta="out of stock items" up={false} icon={TrendingDown} />
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
                          <tr className="border-b border-border">
                            <th className="px-6 py-3">Order</th>
                            <th className="px-6 py-3">Customer</th>
                            <th className="px-6 py-3">Item</th>
                            <th className="px-6 py-3">Total</th>
                            <th className="px-6 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 5).map((order) => (
                            <tr key={order.id} className="border-b border-border/60 last:border-0">
                              <td className="px-6 py-4 font-medium">{order.id}</td>
                              <td className="px-6 py-4 text-foreground/80">{order.customer}</td>
                              <td className="px-6 py-4 text-foreground/80">{order.item}</td>
                              <td className="px-6 py-4">{formatINR(order.total)}</td>
                              <td className="px-6 py-4">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                  order.status === "Delivered" ? "bg-emerald-100 text-emerald-800" :
                                  order.status === "Shipped" ? "bg-accent/15 text-accent" :
                                  "bg-secondary text-foreground/80"
                                }`}>{order.status}</span>
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
                      {PRODUCTS.slice(0, 5).map((product) => (
                        <li key={product.id} className="flex items-center gap-3 px-6 py-3">
                          <img src={product.image} alt={product.name} className="h-12 w-12 rounded-xl object-cover" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{product.name}</div>
                            <div className="text-xs text-muted-foreground capitalize">{product.categories.join(" · ")}</div>
                          </div>
                          <div className="text-sm font-medium">{formatINR(product.price)}</div>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                <section className="grid gap-5 md:grid-cols-3">
                  {quickActions.map((action) => (
                    <div key={action.label} className="rounded-2xl border border-dashed border-border bg-card/60 p-6">
                      <div className="eyebrow mb-2">Quick action</div>
                      <h3 className="font-display text-xl">{action.label}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Open {action.target.toLowerCase()} management.</p>
                      <button type="button" onClick={() => setActiveSection(action.target)} className="mt-4 rounded-full bg-foreground px-4 py-2 text-xs font-medium uppercase tracking-widest text-background hover:bg-accent hover:text-accent-foreground">
                        Open
                      </button>
                    </div>
                  ))}
                </section>
              </>
            )}

            {activeSection === "Products" && (
              <div className="space-y-6">
                <SectionHeader title="Products" actionLabel="Add Product" onAction={() => openProductForm()} />
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search products"
                      className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent lg:max-w-md"
                    />
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <label className="flex items-center gap-2 text-muted-foreground">
                        Category
                        <select value={productFilter} onChange={(event) => setProductFilter(event.target.value as "all" | Category)} className="rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent">
                          <option value="all">All</option>
                          <option value="sarees">Sarees</option>
                          <option value="jewellery">Jewellery</option>
                          <option value="combos">Combos</option>
                        </select>
                      </label>
                      <span className="text-xs text-muted-foreground">Showing {filteredProducts.length} of {products.length}</span>
                    </div>
                  </div>

                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                        <tr className="border-b border-border">
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3">Price</th>
                          <th className="px-4 py-3">Stock</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentProducts.map((product) => (
                          <tr key={product.id} className="border-b border-border/60 last:border-0">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <img src={product.image} alt={product.name} className="h-10 w-10 rounded-xl object-cover" />
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-xs text-muted-foreground">{product.sku}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">{formatINR(product.price)}</td>
                            <td className="px-4 py-3">{product.stock}</td>
                            <td className="px-4 py-3">{product.active ? "Active" : "Inactive"}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => openProductForm(product)} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent">
                                  <Pencil className="inline h-3.5 w-3.5" /> Edit
                                </button>
                                <button type="button" onClick={() => duplicateProduct(product)} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent">Duplicate</button>
                                <button type="button" onClick={() => deleteProduct(product.id)} className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10">
                                  <Trash2 className="inline h-3.5 w-3.5" /> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Page {productPage} of {totalPages(filteredProducts.length)}</span>
                    <div className="flex gap-2">
                      <button type="button" disabled={productPage === 1} onClick={() => setProductPage((prev) => Math.max(prev - 1, 1))} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent disabled:opacity-50">Previous</button>
                      <button type="button" disabled={productPage >= totalPages(filteredProducts.length)} onClick={() => setProductPage((prev) => Math.min(prev + 1, totalPages(filteredProducts.length)))} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent disabled:opacity-50">Next</button>
                    </div>
                  </div>
                </div>

                {productFormOpen ? (
                  <div className="rounded-2xl border border-border bg-card p-6">
                    <SectionHeader title={editingProductId ? "Edit Product" : "Add Product"} actionLabel="Close form" onAction={() => setProductFormOpen(false)} />
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Name</label>
                        <input
                          value={productFormData.name}
                          onChange={(event) => setProductFormData({ ...productFormData, name: event.target.value })}
                          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Slug</label>
                        <input
                          value={productFormData.slug}
                          onChange={(event) => setProductFormData({ ...productFormData, slug: event.target.value })}
                          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Price</label>
                        <input
                          type="number"
                          value={productFormData.price}
                          onChange={(event) => setProductFormData({ ...productFormData, price: Number(event.target.value) })}
                          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Stock</label>
                        <input
                          type="number"
                          value={productFormData.stock}
                          onChange={(event) => setProductFormData({ ...productFormData, stock: Number(event.target.value) })}
                          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Product type</label>
                        <select
                          value={productFormData.productType}
                          onChange={(event) => setProductFormData({ ...productFormData, productType: event.target.value as Category, categories: [event.target.value as Category] })}
                          className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                        >
                          <option value="sarees">Sarees</option>
                          <option value="jewellery">Jewellery</option>
                          <option value="combos">Combos</option>
                        </select>
                      </div>
                      <div className="lg:col-span-2">
                        <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Description</label>
                        <textarea
                          value={productFormData.description}
                          onChange={(event) => setProductFormData({ ...productFormData, description: event.target.value })}
                          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                          rows={4}
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Tags</label>
                        <input
                          value={productFormData.tags.join(", ")}
                          onChange={(event) => setProductFormData({ ...productFormData, tags: event.target.value.split(",").map((tag) => tag.trim()) })}
                          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                          placeholder="Mysore Silk Sarees, Bridal Sets"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Product image</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => setProductFile(event.target.files?.[0] ?? null)}
                          className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                        />
                        <p className="mt-2 text-xs text-muted-foreground">Upload a file and the admin API will store it in ImageKit.</p>
                      </div>
                      <div className="flex items-center justify-between lg:col-span-2">
                        {formError ? <p className="text-sm text-destructive">{formError}</p> : <p className="text-sm text-muted-foreground">Fill out the form and save to update catalog data.</p>}
                        <button type="button" onClick={saveProduct} className="rounded-full bg-foreground px-5 py-3 text-sm font-semibold uppercase tracking-widest text-background hover:bg-accent hover:text-accent-foreground">
                          {editingProductId ? "Update product" : "Create product"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {activeSection === "Categories" && (
              <div className="space-y-6">
                <SectionHeader title="Categories" actionLabel="Add Category" onAction={submitCategory} />
                <div className="rounded-2xl border border-border bg-card p-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Parent</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((category) => (
                        <tr key={category.id} className="border-b border-border/60 last:border-0">
                          <td className="px-4 py-3">{category.name}</td>
                          <td className="px-4 py-3">{category.parent}</td>
                          <td className="px-4 py-3">{category.active ? "Active" : "Inactive"}</td>
                          <td className="px-4 py-3 flex gap-2">
                            <button type="button" onClick={() => editCategory(category)} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent">Edit</button>
                            <button type="button" onClick={() => deleteCategory(category.id)} className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(activeSection === "Sarees" || activeSection === "Jewellery" || activeSection === "Combos") && (
              <div className="space-y-6">
                <SectionHeader title={activeSection} actionLabel={`Add ${activeSection.slice(0, -1)}`} onAction={() => openProductForm()} />
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {products.filter((product) => product.categories.includes(activeSection.toLowerCase() as Category)).map((product) => (
                    <div key={product.id} className="rounded-3xl border border-border bg-card p-4">
                      <img src={product.image} alt={product.name} className="h-40 w-full rounded-3xl object-cover" />
                      <div className="mt-4 space-y-2">
                        <div className="text-sm font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{formatINR(product.price)}</div>
                        <div className="flex flex-wrap gap-2 pt-2">
                          <button type="button" onClick={() => openProductForm(product)} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent">Edit</button>
                          <button type="button" onClick={() => duplicateProduct(product)} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent">Duplicate</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "Orders" && (
              <div className="space-y-6">
                <SectionHeader title="Orders" />
                <div className="rounded-2xl border border-border bg-card p-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="px-4 py-3">Order</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Total</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Payment</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentOrders.map((order) => (
                        <tr key={order.id} className="border-b border-border/60 last:border-0">
                          <td className="px-4 py-3 font-medium">{order.id}</td>
                          <td className="px-4 py-3">{order.customer}</td>
                          <td className="px-4 py-3">{formatINR(order.total)}</td>
                          <td className="px-4 py-3">
                            <select value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value)} className="rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent">
                              {['Pending', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'].map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">{order.paymentStatus}</td>
                          <td className="px-4 py-3 flex flex-wrap gap-2">
                            <button type="button" onClick={() => window.alert(`Invoice for ${order.id} downloaded.`)} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent">Invoice</button>
                            <button type="button" onClick={() => setActiveSection("Customers")} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent">Customer</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Page {ordersPage} of {totalPages(filteredOrders.length)}</span>
                  <div className="flex gap-2">
                    <button type="button" disabled={ordersPage === 1} onClick={() => setOrdersPage((prev) => Math.max(prev - 1, 1))} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent disabled:opacity-50">Previous</button>
                    <button type="button" disabled={ordersPage >= totalPages(filteredOrders.length)} onClick={() => setOrdersPage((prev) => Math.min(prev + 1, totalPages(filteredOrders.length)))} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent disabled:opacity-50">Next</button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "Customers" && (
              <div className="space-y-6">
                <SectionHeader title="Customers" />
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="mb-5">
                    <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search customers" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                        <tr className="border-b border-border">
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Total Spend</th>
                          <th className="px-4 py-3">Orders</th>
                          <th className="px-4 py-3">Last Order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentCustomers.map((customer) => (
                          <tr key={customer.id} className="border-b border-border/60 last:border-0">
                            <td className="px-4 py-3">{customer.name}</td>
                            <td className="px-4 py-3">{customer.email}</td>
                            <td className="px-4 py-3">{formatINR(customer.totalSpend)}</td>
                            <td className="px-4 py-3">{customer.orders}</td>
                            <td className="px-4 py-3">{customer.lastOrder}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Page {customerPage} of {totalPages(filteredCustomers.length)}</span>
                    <div className="flex gap-2">
                      <button type="button" disabled={customerPage === 1} onClick={() => setCustomerPage((prev) => Math.max(prev - 1, 1))} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent disabled:opacity-50">Previous</button>
                      <button type="button" disabled={customerPage >= totalPages(filteredCustomers.length)} onClick={() => setCustomerPage((prev) => Math.min(prev + 1, totalPages(filteredCustomers.length)))} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent disabled:opacity-50">Next</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "Reviews" && (
              <div className="space-y-6">
                <SectionHeader title="Reviews" />
                <div className="rounded-2xl border border-border bg-card p-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="px-4 py-3">Reviewer</th>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Rating</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentReviews.map((review) => (
                        <tr key={review.id} className="border-b border-border/60 last:border-0">
                          <td className="px-4 py-3">{review.name}</td>
                          <td className="px-4 py-3">{review.product}</td>
                          <td className="px-4 py-3">{review.rating}/5</td>
                          <td className="px-4 py-3">{review.status}</td>
                          <td className="px-4 py-3 flex flex-wrap gap-2">
                            <button type="button" onClick={() => approveReview(review.id)} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent">Approve</button>
                            <button type="button" onClick={() => rejectReview(review.id)} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent">Reject</button>
                            <button type="button" onClick={() => deleteReview(review.id)} className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Page {reviewPage} of {totalPages(filteredReviews.length)}</span>
                  <div className="flex gap-2">
                    <button type="button" disabled={reviewPage === 1} onClick={() => setReviewPage((prev) => Math.max(prev - 1, 1))} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent disabled:opacity-50">Previous</button>
                    <button type="button" disabled={reviewPage >= totalPages(filteredReviews.length)} onClick={() => setReviewPage((prev) => Math.min(prev + 1, totalPages(filteredReviews.length)))} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent disabled:opacity-50">Next</button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "Instagram Feed" && (
              <div className="space-y-6">
                <SectionHeader title="Instagram Feed" actionLabel="Add Feed item" onAction={addInstagramItem} />
                <div className="rounded-2xl border border-border bg-card p-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">URL</th>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Order</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {instagramFeed.map((item) => (
                        <tr key={item.id} className="border-b border-border/60 last:border-0">
                          <td className="px-4 py-3">{item.mediaType}</td>
                          <td className="px-4 py-3 break-all"><a href={item.url} target="_blank" rel="noreferrer" className="text-accent underline">Link</a></td>
                          <td className="px-4 py-3">{item.linkedProduct}</td>
                          <td className="px-4 py-3">{item.order}</td>
                          <td className="px-4 py-3">
                            <button type="button" onClick={() => deleteInstagramItem(item.id)} className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSection === "Banners" && (
              <div className="space-y-6">
                <SectionHeader title="Banners" actionLabel="Add Banner" onAction={addBanner} />
                <div className="rounded-2xl border border-border bg-card p-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="px-4 py-3">Desktop</th>
                        <th className="px-4 py-3">Mobile</th>
                        <th className="px-4 py-3">Period</th>
                        <th className="px-4 py-3">Link</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {banners.map((banner) => (
                        <tr key={banner.id} className="border-b border-border/60 last:border-0">
                          <td className="px-4 py-3 break-all">{banner.desktop}</td>
                          <td className="px-4 py-3 break-all">{banner.mobile}</td>
                          <td className="px-4 py-3">{banner.startDate} → {banner.endDate}</td>
                          <td className="px-4 py-3 break-all">{banner.link}</td>
                          <td className="px-4 py-3">
                            <button type="button" onClick={() => deleteBanner(banner.id)} className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSection === "Coupons" && (
              <div className="space-y-6">
                <SectionHeader title="Coupons" actionLabel="Create Coupon" onAction={addCoupon} />
                <div className="rounded-2xl border border-border bg-card p-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="px-4 py-3">Code</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Value</th>
                        <th className="px-4 py-3">Expiry</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map((coupon) => (
                        <tr key={coupon.id} className="border-b border-border/60 last:border-0">
                          <td className="px-4 py-3">{coupon.code}</td>
                          <td className="px-4 py-3">{coupon.discountType}</td>
                          <td className="px-4 py-3">{coupon.discountValue}{coupon.discountType === "percent" ? "%" : "₹"}</td>
                          <td className="px-4 py-3">{coupon.expiry}</td>
                          <td className="px-4 py-3">
                            <button type="button" onClick={() => deleteCoupon(coupon.id)} className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive hover:bg-destructive/10">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSection === "Inventory" && (
              <div className="space-y-6">
                <SectionHeader title="Inventory" />
                <div className="rounded-2xl border border-border bg-card p-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                      <tr className="border-b border-border">
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Stock</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-b border-border/60 last:border-0">
                          <td className="px-4 py-3">{product.name}</td>
                          <td className="px-4 py-3">{product.stock}</td>
                          <td className="px-4 py-3">{product.stock === 0 ? "Out of stock" : product.stock <= 5 ? "Low stock" : "In stock"}</td>
                          <td className="px-4 py-3">
                            <button type="button" onClick={() => updateInventory(product)} className="rounded-full border border-border px-3 py-1 text-xs hover:border-accent">Update</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeSection === "Settings" && (
              <div className="space-y-6">
                <SectionHeader title="Settings" />
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Store Name</label>
                      <input value={settings.storeName} onChange={(event) => setSettings({ ...settings, storeName: event.target.value })} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Contact Number</label>
                      <input value={settings.contactNumber} onChange={(event) => setSettings({ ...settings, contactNumber: event.target.value })} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Email</label>
                      <input value={settings.email} onChange={(event) => setSettings({ ...settings, email: event.target.value })} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Free delivery above</label>
                      <input type="number" value={settings.freeDeliveryAbove} onChange={(event) => setSettings({ ...settings, freeDeliveryAbove: Number(event.target.value) })} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" />
                    </div>
                    <div className="lg:col-span-2">
                      <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Address</label>
                      <textarea value={settings.address} onChange={(event) => setSettings({ ...settings, address: event.target.value })} rows={3} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">Razorpay Key</label>
                      <input value={settings.razorpayKey} onChange={(event) => setSettings({ ...settings, razorpayKey: event.target.value })} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">ImageKit URL</label>
                      <input value={settings.imageKitUrl} onChange={(event) => setSettings({ ...settings, imageKitUrl: event.target.value })} className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent" />
                    </div>
                    <div className="lg:col-span-2">
                      <button type="button" onClick={saveSettings} className="rounded-full bg-foreground px-5 py-3 text-sm font-semibold uppercase tracking-widest text-background hover:bg-accent hover:text-accent-foreground">
                        Save settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · Sashvi Studio" }] }),
  component: Admin,
});
