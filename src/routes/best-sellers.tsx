import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { useCatalogProducts } from "@/lib/catalog";

export const Route = createFileRoute("/best-sellers")({
  head: () => ({ meta: [{ title: "Best Sellers — Sashvi Studio" }] }),
  component: BestSellersPage,
});

function BestSellersPage() {
  const { products } = useCatalogProducts();
  const bestSellers = products.filter((product) => product.isBestSeller);

  return (
    <Layout>
      <section className="container-luxe pt-16 pb-10">
        <div className="eyebrow mb-3">Best Sellers</div>
        <h1 className="font-display text-4xl md:text-5xl">Customer Favorites</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Shop the most-loved sarees and jewellery pieces from Sashvi Studio.
        </p>
      </section>

      <section className="container-luxe grid gap-6 pb-24 md:grid-cols-2 lg:grid-cols-3">
        {bestSellers.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <p className="text-lg text-muted-foreground">No best sellers available yet.</p>
            <Link to="/" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline">
              Browse all products
            </Link>
          </div>
        ) : (
          bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} stock={product.stock} />
          ))
        )}
      </section>
    </Layout>
  );
}
