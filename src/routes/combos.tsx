import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { COMBO_CATEGORIES, sortProducts } from "@/lib/products";
import { useCatalogProducts, useCategoryFilters } from "@/lib/catalog";
import { CategoryShell } from "@/components/CategoryShell";

type Search = {
  tag?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  bogo?: string;
};

export const Route = createFileRoute("/combos")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    tag: typeof s.tag === "string" ? s.tag : undefined,
    sort: typeof s.sort === "string" ? s.sort : undefined,
    minPrice: s.minPrice !== undefined ? Number(s.minPrice) : undefined,
    maxPrice: s.maxPrice !== undefined ? Number(s.maxPrice) : undefined,
    bogo: typeof s.bogo === "string" ? s.bogo : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Combos — Sashvi Studio" },
      { name: "description", content: "Saree & jewellery combos and buy 1 get 1 offers." },
    ],
  }),
  component: CombosPage,
});

function CombosPage() {
  const { tag, sort, minPrice, maxPrice, bogo } = Route.useSearch();
  const { products: all } = useCatalogProducts("combos");
  const dbFilters = useCategoryFilters("combos");
  const filters = dbFilters.length > 0 ? dbFilters : COMBO_CATEGORIES;
  const filtered = all.filter((p) => {
    const matchesTag = !tag || p.tags.includes(tag);
    const matchesMinPrice = minPrice === undefined || p.price >= minPrice;
    const matchesMaxPrice = maxPrice === undefined || p.price <= maxPrice;
    const matchesBogo = bogo !== "true" || p.buyOneGetOne === true;
    return matchesTag && matchesMinPrice && matchesMaxPrice && matchesBogo;
  });
  const products = sortProducts(filtered, sort || "featured");

  return (
    <Layout>
      <CategoryShell
        eyebrow="Styled Together"
        title="Combos"
        description="Curated saree & jewellery pairings — styling made simple, effortless, and irresistibly elegant."
        filters={filters}
        activeTag={tag}
        activeSort={sort}
        minPrice={minPrice}
        maxPrice={maxPrice}
        basePath="/combos"
        activeBogo={bogo}
      >
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} stock={p.stock} />
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
