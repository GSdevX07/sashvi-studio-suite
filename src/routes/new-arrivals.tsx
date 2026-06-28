import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { useCatalogProducts } from "@/lib/catalog";

export const Route = createFileRoute("/new-arrivals")({
  head: () => ({
    meta: [
      { title: "New Arrivals — Sashvi Studio" },
      {
        name: "description",
        content: "Fresh sarees, jewellery and combos just added to the studio.",
      },
    ],
  }),
  component: NewArrivalsPage,
});

function NewArrivalsPage() {
  const { products } = useCatalogProducts();
  const newProducts = products.filter((p) => p.isNew);
  return (
    <Layout>
      <section className="border-b border-border bg-secondary/40">
        <div className="container-luxe py-14 md:py-20">
          <div className="eyebrow mb-4">Just Landed</div>
          <h1 className="font-display text-4xl md:text-6xl">New Arrivals</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            The latest from our studio — freshly curated for the season.
          </p>
        </div>
      </section>
      <section className="container-luxe py-12">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {newProducts.map((p) => (
            <ProductCard key={p.id} product={p} stock={p.stock} />
          ))}
        </div>
      </section>
    </Layout>
  );
}
