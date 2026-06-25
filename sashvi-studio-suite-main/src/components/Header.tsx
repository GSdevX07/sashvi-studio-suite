import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, Menu, Search, ShoppingBag, X, User } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import {
  SAREE_CATEGORIES,
  JEWELLERY_CATEGORIES,
  COMBO_CATEGORIES,
} from "@/lib/products";
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
    type === "sarees" ? SAREE_CATEGORIES : type === "jewellery" ? JEWELLERY_CATEGORIES : COMBO_CATEGORIES;
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
  const { isLoggedIn } = useAuth();
  const { count } = useCart();
  const { ids } = useWishlist();
  const navigate = useNavigate();

  function handleProtectedLink(to: "/cart" | "/wishlist") {
    if (!isLoggedIn) {
      navigate({ to: "/my-account", search: { redirect: to } });
    } else {
      navigate({ to });
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container-luxe flex h-20 items-center justify-between gap-4">
        <button
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="lg:hidden -ml-2 rounded-full p-2 hover:bg-secondary"
        >
          <Menu className="h-5 w-5" />
        </button>

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

        <div className="flex items-center gap-1">
          <button aria-label="Search" className="hidden sm:inline-flex rounded-full p-2 hover:bg-secondary">
            <Search className="h-5 w-5" />
          </button>
          <Link to="/my-account" aria-label="Account" className="rounded-full p-2 hover:bg-secondary" title="My Account">
            <User className="h-5 w-5" />
          </Link>
          <button
            aria-label="Wishlist"
            onClick={() => handleProtectedLink("/wishlist")}
            className="relative rounded-full p-2 hover:bg-secondary"
          >
            <Heart className="h-5 w-5" />
            {ids.length > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[0.6rem] font-semibold text-accent-foreground">
                {ids.length}
              </span>
            )}
          </button>
          <button
            aria-label="Cart"
            onClick={() => handleProtectedLink("/cart")}
            className="relative rounded-full p-2 hover:bg-secondary"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[0.6rem] font-semibold text-accent-foreground">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-sm bg-background shadow-luxe">
            <div className="flex h-20 items-center justify-between border-b border-border px-5">
              <Logo />
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-2 hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col p-3">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-[0.95rem] font-medium text-foreground/85 hover:bg-secondary"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-2 border-t border-border p-5">
              <div className="eyebrow mb-3">Shop Categories</div>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="mb-1 font-medium">Sarees</div>
                  <ul className="space-y-1 text-foreground/70">
                    {SAREE_CATEGORIES.slice(0, 5).map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="mb-1 font-medium">Jewellery</div>
                  <ul className="space-y-1 text-foreground/70">
                    {JEWELLERY_CATEGORIES.slice(0, 5).map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
