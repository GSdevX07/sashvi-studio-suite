import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { useCatalogProductIds } from "@/lib/catalog";
import { useWishlist } from "@/lib/wishlist-context";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — Sashvi Studio" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const { isLoggedIn } = useAuth();
  const { ids } = useWishlist();
  const navigate = useNavigate();
  const { products: items } = useCatalogProductIds(ids);

  if (!isLoggedIn) {
    return (
      <Layout>
        <section className="container-luxe flex flex-col items-center justify-center gap-6 py-32 text-center">
          <Heart className="h-14 w-14 text-muted-foreground/40" />
          <div>
            <h1 className="font-display text-3xl text-foreground">Sign in to view your wishlist</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please sign in or create an account to save your favourite pieces.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate({ to: "/my-account" })}
              className="rounded-full bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-widest text-background transition hover:bg-accent hover:text-accent-foreground"
            >
              Sign In
            </button>
            <Link
              to="/sarees"
              className="rounded-full border border-border px-6 py-3 text-sm font-medium uppercase tracking-widest text-foreground transition hover:border-accent hover:text-accent"
            >
              Continue Shopping
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <section className="container-luxe flex flex-col items-center justify-center gap-6 py-32 text-center">
          <Heart className="h-14 w-14 text-muted-foreground/40" />
          <div>
            <h1 className="font-display text-3xl text-foreground">Your wishlist is empty</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tap the heart icon on any product to save it here.
            </p>
          </div>
          <Link
            to="/sarees"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-widest text-background transition hover:bg-accent hover:text-accent-foreground"
          >
            Browse Products
          </Link>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container-luxe pt-16 pb-10">
        <div className="eyebrow mb-3">Saved For You</div>
        <h1 className="font-display text-4xl md:text-5xl">Wishlist</h1>
      </section>
      <section className="container-luxe pb-20">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} showRemove stock={p.stock} />
          ))}
        </div>
      </section>
    </Layout>
  );
}
