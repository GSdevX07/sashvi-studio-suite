import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { byCategory, COMBO_CATEGORIES } from "@/lib/products";
import { CategoryShell } from "@/components/CategoryShell";

type Search = { tag?: string };

export const Route = createFileRoute("/combos")({
  validateSearch: (s: Record<string, unknown>): Search => ({ tag: typeof s.tag === "string" ? s.tag : undefined }),
  head: () => ({
    meta: [
      { title: "Combos — Sashvi Studio" },
      { name: "description", content: "Saree & jewellery combos and buy 1 get 1 offers." },
    ],
  }),
  component: CombosPage,
});

function CombosPage() {
  const { tag } = Route.useSearch();
  const all = byCategory("combos");
  const products = tag ? all.filter((p) => p.tags.includes(tag)) : all;
  return (
    <Layout>
      <CategoryShell
        eyebrow="Styled Together"
        title="Combos"
        description="Curated saree & jewellery pairings — styling made simple, effortless, and irresistibly elegant."
        filters={COMBO_CATEGORIES}
        activeTag={tag}
        basePath="/combos"
      >
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </CategoryShell>
    </Layout>
  );
}
