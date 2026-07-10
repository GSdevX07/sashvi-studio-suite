import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop All — Sashvi Studio" },
      {
        name: "description",
        content: "Browse all sarees, jewellery and styling combos available at Sashvi Studio.",
      },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  return (
    <Layout>
      <section className="container-luxe pt-16 pb-20">
        <div className="eyebrow mb-3">Shop</div>
        <h1 className="font-display text-4xl md:text-5xl">Shop All Collections</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Discover authentic sarees, elegant jewellery, and curated shop-ready combos for every
          occasion. Choose your favourites and place your order with COD or online payment.
        </p>
      </section>

      <section className="container-luxe grid gap-6 md:grid-cols-3 pb-24">
        {[
          {
            title: "Sarees",
            description: "Silks, mul cottons, handlooms and festive favourites.",
            to: "/sarees",
          },
          {
            title: "Jewellery",
            description: "Temple jewellery, earrings, bridal sets and everyday pieces.",
            to: "/jewellery",
          },
          {
            title: "Combos",
            description: "Styled saree & jewellery pairings curated to complete your look.",
            to: "/combos",
          },
          {
            title: "New Arrivals",
            description: "Fresh drops and limited-edition pieces added regularly.",
            to: "/new-arrivals",
          },
          {
            title: "Best Sellers",
            description: "Customer favorites and most-loved pieces from our collection.",
            to: "/best-sellers",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-[1.5rem] border border-border bg-card p-8 shadow-soft"
          >
            <h2 className="font-display text-2xl text-foreground">{item.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
            <Link
              to={item.to}
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
            >
              Explore {item.title}
            </Link>
          </article>
        ))}
      </section>
    </Layout>
  );
}
