import { Link } from "@tanstack/react-router";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatINR } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group relative flex flex-col">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block overflow-hidden rounded-2xl bg-card ring-1 ring-border"
      >
        <div className="aspect-[4/5] w-full overflow-hidden bg-secondary">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.04]"
          />
        </div>

        {product.isNew && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-widest text-foreground shadow-soft">
            New
          </span>
        )}
        {product.compareAt && (
          <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-widest text-accent-foreground shadow-soft">
            Sale
          </span>
        )}

        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between opacity-0 transition group-hover:opacity-100">
          <div className="pointer-events-auto flex gap-1.5">
            <button aria-label="Quick view" className="grid h-9 w-9 place-items-center rounded-full bg-background/95 text-foreground shadow-soft hover:bg-accent hover:text-accent-foreground">
              <Eye className="h-4 w-4" />
            </button>
            <button aria-label="Wishlist" className="grid h-9 w-9 place-items-center rounded-full bg-background/95 text-foreground shadow-soft hover:bg-accent hover:text-accent-foreground">
              <Heart className="h-4 w-4" />
            </button>
          </div>
          <button className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-[0.7rem] font-medium uppercase tracking-widest text-background shadow-soft hover:bg-accent hover:text-accent-foreground">
            <ShoppingBag className="h-3.5 w-3.5" /> Add
          </button>
        </div>
      </Link>

      <div className="mt-4 px-1">
        <h3 className="font-display text-[1.05rem] leading-snug text-foreground">
          <Link to="/product/$slug" params={{ slug: product.slug }} className="hover:text-accent">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-sm font-medium text-foreground">{formatINR(product.price)}</span>
          {product.compareAt && (
            <span className="text-xs text-muted-foreground line-through">{formatINR(product.compareAt)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
