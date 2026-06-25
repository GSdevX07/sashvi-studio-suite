import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { byCategory, SAREE_CATEGORIES } from "@/lib/products";
import { CategoryShell } from "@/components/CategoryShell";

type Search = { tag?: string };

export const Route = createFileRoute("/sarees")({
  validateSearch: (s: Record<string, unknown>): Search => ({ tag: typeof s.tag === "string" ? s.tag : undefined }),
  head: () => ({
    meta: [
      { title: "Sarees — Sashvi Studio" },
      { name: "description", content: "Mysore silk, mul cotton, handloom & designer sarees curated by Sashvi Studio." },
      { property: "og:title", content: "Sarees — Sashvi Studio" },
    ],
  }),
  component: SareesPage,
});

function SareesPage() {
  const { tag } = Route.useSearch();
  const all = byCategory("sarees");
  const products = tag ? all.filter((p) => p.tags.includes(tag)) : all;

  return (
    <Layout>
      <CategoryShell
        eyebrow="The Saree Edit"
        title={tag || "All Sarees"}
        description="Handwoven silks, breathable mul cottons, and artisanal block prints — each piece celebrates craftsmanship and effortless drape."
        filters={SAREE_CATEGORIES}
        activeTag={tag}
        basePath="/sarees"
      >
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-muted-foreground">
            No products found in this category yet. Check back soon!
          </div>
        )}
      </CategoryShell>
    </Layout>
  );
}
