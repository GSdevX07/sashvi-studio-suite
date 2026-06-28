import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, X, User } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Logo } from "./Logo";
import {
  SAREE_CATEGORIES,
  JEWELLERY_CATEGORIES,
  COMBO_CATEGORIES,
  formatINR,
} from "@/lib/products";
import { useCatalogProducts } from "@/lib/catalog";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";

const NAV = [
  { label: "Home", to: "/" },
  { label: "Sarees", to: "/sarees", mega: "sarees" as const },
  { label: "Jewellery", to: "/jewellery", mega: "jewellery" as const },
  { label: "Combos", to: "/combos", mega: "combos" as const },
  { label: "New Arrivals", to: "/new-arrivals" },
  { label: "About Us", to: "/about" },
  { label: "Contact Us", to: "/contact" },
];

function MegaPanel({ type }: { type: "sarees" | "jewellery" | "combos" }) {
  const items =
    type === "sarees"
      ? SAREE_CATEGORIES
      : type === "jewellery"
        ? JEWELLERY_CATEGORIES
        : COMBO_CATEGORIES;
  const base = type === "sarees" ? "/sarees" : type === "jewellery" ? "/jewellery" : "/combos";
  return (
    <div className="absolute left-1/2 top-full z-40 hidden -translate-x-1/2 pt-3 group-hover:block">
      <div className="w-[min(720px,90vw)] rounded-2xl border border-border bg-card p-6 shadow-luxe">
        <div className="eyebrow mb-4">Shop {type}</div>
        <ul className="grid grid-cols-2 gap-x-8 gap-y-2">
          {items.map((c) => (
            <li key={c}>
              <Link
                to={base}
                search={{ tag: c }}
                className="block rounded-md px-2 py-1.5 text-sm text-foreground/80 transition hover:bg-secondary hover:text-foreground"
              >
                {c}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { products: catalogProducts } = useCatalogProducts();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return catalogProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.categories.some((c) => c.toLowerCase().includes(q)) ||
        p.tags.some((t) => t.toLowerCase().includes(q)),
    ).slice(0, 5);
  }, [searchQuery, catalogProducts]);

  const { isLoggedIn } = useAuth();
  const { count } = useCart();
  const { ids } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setOpen(false);
      }
    };
    if (searchOpen || open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEsc);
        document.body.style.overflow = "";
      };
    }
  }, [searchOpen, open]);

  function handleProtectedLink(to: "/cart" | "/wishlist") {
    if (!isLoggedIn) {
      navigate({ to: "/my-account", search: { redirect: to } });
    } else {
      navigate({ to });
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Menu"
        className="fixed top-4 left-4 z-50 rounded-full p-2 bg-background/90 backdrop-blur border border-border/50 hover:bg-secondary"
      >
        <Menu className="h-5 w-5" />
      </button>

      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="container-luxe flex h-20 items-center justify-between gap-2 sm:gap-4">
          <div className="w-10" />
          
          <Link to="/" className="flex items-center shrink-0">
            <Logo />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((item) => (
              <div key={item.to} className="group relative">
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.to === "/" }}
                  activeProps={{ className: "text-foreground after:scale-x-100" }}
                  className="relative px-3 py-2 text-[0.82rem] font-medium tracking-wide text-foreground/75 transition hover:text-foreground after:absolute after:inset-x-3 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-accent after:transition-transform after:duration-300 group-hover:after:scale-x-100"
                >
                  {item.label}
                </Link>
                {item.mega && <MegaPanel type={item.mega} />}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-0 sm:gap-0.5 sm:gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="rounded-full p-1 sm:p-1.5 sm:p-2 hover:bg-secondary"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              aria-label="Cart"
              onClick={() => handleProtectedLink("/cart")}
              className="relative rounded-full p-1 sm:p-1.5 sm:p-2 hover:bg-secondary"
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[0.6rem] font-semibold text-accent-foreground">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-4 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-ivory rounded-3xl shadow-luxe overflow-hidden">
            <div className="flex h-16 items-center justify-between border-b border-border px-6">
              <Logo />
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-full p-2 hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-4 border-b border-border">
              <button
                onClick={() => {
                  setOpen(false);
                  setSearchOpen(true);
                }}
                className="flex items-center gap-2 w-full rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:border-accent hover:text-accent"
              >
                <Search className="h-4 w-4" />
                Search for products...
              </button>
            </div>
            <nav className="flex flex-col p-4 max-h-[60vh] overflow-y-auto">
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-[0.95rem] font-medium text-foreground/85 hover:bg-secondary"
              >
                Home
              </Link>
              <Link
                to="/shop"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-[0.95rem] font-medium text-foreground/85 hover:bg-secondary"
              >
                Shop All
              </Link>
              <Link
                to="/best-sellers"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-[0.95rem] font-medium text-foreground/85 hover:bg-secondary"
              >
                Best Sellers
              </Link>
              <div className="my-2 border-b border-border" />
              <div className="mt-2">
                <div className="px-4 py-2 text-xs font-normal text-muted-foreground/70 uppercase tracking-wider">
                  Categories
                </div>
                <div className="mt-1 space-y-1">
                  {NAV.filter(item => item.mega).map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-4 py-2 text-[0.95rem] font-medium text-foreground/85 hover:bg-secondary"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="my-2 border-b border-border" />
              {isLoggedIn ? (
                <>
                  <Link
                    to="/my-account"
                    onClick={() => setOpen(false)}
                    className="mt-2 rounded-xl px-4 py-3 text-[0.95rem] font-medium text-foreground/85 hover:bg-secondary"
                  >
                    My Account
                  </Link>
                  <Link
                    to="/my-account"
                    search={{ tab: "orders" }}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 text-[0.95rem] font-medium text-foreground/85 hover:bg-secondary"
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={() => {
                      setOpen(false);
                      handleProtectedLink("/wishlist");
                    }}
                    className="rounded-xl px-4 py-3 text-[0.95rem] font-medium text-foreground/85 hover:bg-secondary text-left"
                  >
                    Wishlist
                  </button>
                </>
              ) : (
                <Link
                  to="/my-account"
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-xl px-4 py-3 text-[0.95rem] font-medium text-foreground/85 hover:bg-secondary"
                >
                  Login / Register
                </Link>
              )}
              <Link
                to="/contact"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-[0.95rem] font-medium text-foreground/85 hover:bg-secondary"
              >
                Customer Support
              </Link>
            </nav>
          </div>
        </div>
      )}
      {/* Search Overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[100] bg-foreground/10 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="mx-auto w-[95%] max-w-[750px] pt-24 sm:w-full sm:pt-28"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative animate-in slide-in-from-top-4 duration-300">
              <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                placeholder="Search by name, category, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-border/60 bg-card py-4 pl-14 pr-24 text-[0.95rem] text-foreground shadow-luxe outline-none transition-colors placeholder:text-muted-foreground focus:border-accent"
              />
              <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                {searchQuery && (
                  <>
                    <button
                      onClick={() => setSearchQuery("")}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="mx-1 h-4 w-px bg-border" />
                  </>
                )}
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-accent transition-colors"
                  aria-label="Close search"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {searchQuery.trim() !== "" && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-luxe">
                  <div className="max-h-[60vh] overflow-y-auto p-2 sm:p-3">
                    {searchResults.length === 0 ? (
                      <div className="px-6 py-14 text-center">
                        <div className="mb-2 font-display text-xl text-foreground">
                          No Products Found
                        </div>
                        <p className="text-sm text-muted-foreground">
                          We couldn't find any products matching "{searchQuery}". Try different
                          keywords.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-1">
                        {searchResults.map((product) => (
                          <Link
                            key={product.id}
                            to="/product/$slug"
                            params={{ slug: product.slug }}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center gap-4 rounded-2xl p-3 transition hover:bg-secondary/60"
                          >
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-16 w-16 shrink-0 rounded-xl border border-border/50 object-cover"
                            />
                            <div className="flex min-w-0 flex-1 flex-col justify-center">
                              <div className="truncate text-[0.95rem] font-medium text-foreground">
                                {product.name}
                              </div>
                              <div className="mb-1 mt-0.5 text-xs capitalize text-muted-foreground">
                                {product.categories[0]}
                              </div>
                              <div className="text-sm font-medium text-foreground">
                                {formatINR(product.price)}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
