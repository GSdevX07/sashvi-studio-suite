import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { PRODUCTS, formatINR } from "@/lib/products";

export const Route = createFileRoute("/best-sellers")({
  head: () => ({ meta: [{ title: "Best Sellers — Sashvi Studio" }] }),
  component: BestSellersPage,
});

function BestSellersPage() {
  const bestSellers = PRODUCTS.filter((product) => product.isBestSelling).slice(0, 12);

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
        {bestSellers.map((product) => (
          <article key={product.id} className="rounded-[1.5rem] border border-border bg-card p-6 shadow-soft">
            <img src={product.image} alt={product.name} className="h-72 w-full rounded-3xl object-cover" />
            <div className="mt-5">
              <h2 className="text-lg font-semibold text-foreground">{product.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{product.tags[0]}</p>
              <div className="mt-4 text-base font-medium text-foreground">{formatINR(product.price)}</div>
              <Link to={`/product/${product.slug}`} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline">
                View product
              </Link>
            </div>
          </article>
        ))}
      </section>
    </Layout>
  );
}
