import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { PRODUCTS } from "@/lib/products";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — Sashvi Studio" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const items = PRODUCTS.slice(0, 4);
  return (
    <Layout>
      <section className="container-luxe pt-16 pb-10">
        <div className="eyebrow mb-3">Saved For You</div>
        <h1 className="font-display text-4xl md:text-5xl">Wishlist</h1>
      </section>
      <section className="container-luxe pb-20">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </Layout>
  );
}
