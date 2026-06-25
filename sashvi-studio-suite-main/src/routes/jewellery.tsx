import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { byCategory, JEWELLERY_CATEGORIES } from "@/lib/products";
import { CategoryShell } from "@/components/CategoryShell";

type Search = { tag?: string };

export const Route = createFileRoute("/jewellery")({
  validateSearch: (s: Record<string, unknown>): Search => ({ tag: typeof s.tag === "string" ? s.tag : undefined }),
  head: () => ({
    meta: [
      { title: "Jewellery — Sashvi Studio" },
      { name: "description", content: "South Indian temple jewellery, kundan, jhumkas & bridal sets." },
    ],
  }),
  component: JewelleryPage,
});

function JewelleryPage() {
  const { tag } = Route.useSearch();
  const all = byCategory("jewellery");
  const products = tag ? all.filter((p) => p.tags.includes(tag)) : all;

  return (
    <Layout>
      <CategoryShell
        eyebrow="Heritage Jewellery"
        title={tag || "All Jewellery"}
        description="South Indian imitation jewellery — temple necklaces, long haarams, jhumkas, and bridal sets — crafted to complete every look."
        filters={JEWELLERY_CATEGORIES}
        activeTag={tag}
        basePath="/jewellery"
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
