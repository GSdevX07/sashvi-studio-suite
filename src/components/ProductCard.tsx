import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, Heart, ShoppingBag, Trash2 } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatINR } from "@/lib/products";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { useAuth } from "@/lib/auth-context";
import { getPremiumDiscountBadge, hasProductDiscount, normalizeDiscountFields } from "@/lib/discount";

export function ProductCard({ product, showRemove, stock }: { product: Product; showRemove?: boolean; stock?: number }) {
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const wishlisted = isWishlisted(product.id);
  const isOutOfStock = stock === 0;
  const discount = normalizeDiscountFields(product);
  const discountBadge = getPremiumDiscountBadge(product);

  // Calculate sale price if discount exists
  let salePrice = product.price;
  let originalPrice = product.price;
  if (hasProductDiscount(product) && discount.discountType !== "none" && discount.discountValue > 0) {
    originalPrice = product.price;
    if (discount.discountType === "fixed") {
      salePrice = Math.max(0, product.price - discount.discountValue);
    } else if (discount.discountType === "percent") {
      salePrice = Math.max(0, product.price - (product.price * discount.discountValue / 100));
    }
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate({ to: "/my-account" });
      return;
    }
    // For Buy 1 Get 1, add 2 items automatically
    const quantityToAdd = product.buyOneGetOne ? 2 : 1;
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty: quantityToAdd,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      buyOneGetOne: product.buyOneGetOne,
    });
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      navigate({ to: "/my-account" });
      return;
    }
    toggle(product.id);
  }

  return (
    <div className="group relative flex flex-col">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block overflow-hidden rounded-2xl bg-card ring-1 ring-border"
      >
        <div className="aspect-[3/4] w-full overflow-hidden bg-secondary rounded-[18px]">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.04]"
          />
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="rounded-full bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground shadow-lg">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {product.isNew && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-widest text-foreground shadow-soft">
            New
          </span>
        )}
        {product.buyOneGetOne && (
          <span className="absolute left-3 top-3 rounded-full bg-accent/90 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-accent-foreground shadow-soft">
            Buy 1 Get 1
          </span>
        )}
        {hasProductDiscount(product) && discountBadge ? (
          <span className="absolute right-2 top-2 max-w-[calc(100%-1rem)] rounded-full bg-accent px-2 py-0.5 text-[0.5rem] sm:text-[0.6rem] font-semibold uppercase tracking-widest text-accent-foreground shadow-soft">
            {discountBadge}
          </span>
        ) : null}

        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between opacity-100 transition">
          <div className="pointer-events-auto flex gap-1.5">
            <button
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              onClick={handleWishlist}
              className={`grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full shadow-soft transition ${
                wishlisted
                  ? "bg-accent text-accent-foreground"
                  : "bg-background/95 text-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${wishlisted ? "fill-current" : ""}`} />
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1.5 h-8 text-[0.65rem] font-medium uppercase tracking-widest text-background shadow-soft hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingBag className="h-3 w-3" /> {isOutOfStock ? "Out" : "Add"}
          </button>
        </div>
      </Link>

      <div className="mt-4 px-1">
        <h3 className="font-display text-[18px] leading-snug text-foreground">
          <Link to="/product/$slug" params={{ slug: product.slug }} className="hover:text-accent">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[18px] sm:text-[22px] font-medium text-foreground">{formatINR(salePrice)}</span>
          {hasProductDiscount(product) && discount.discountType !== "none" && discount.discountValue > 0 && (
            <span className="text-sm text-muted-foreground line-through">{formatINR(originalPrice)}</span>
          )}
        </div>
        {showRemove && (
          <button
            onClick={(e) => {
              e.preventDefault();
              toggle(product.id);
            }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-border py-2 text-xs font-medium text-muted-foreground transition hover:border-destructive hover:bg-destructive/5 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove from wishlist
          </button>
        )}
      </div>
    </div>
  );
}
