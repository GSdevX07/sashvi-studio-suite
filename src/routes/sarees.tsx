import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { ProductCardSkeleton } from "@/components/ProductCardSkeleton";
import { SAREE_CATEGORIES, sortProducts } from "@/lib/products";
import { useCatalogProducts, useCategoryFilters } from "@/lib/catalog";
import { CategoryShell } from "@/components/CategoryShell";

type Search = {
  tag?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
};

export const Route = createFileRoute("/sarees")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    tag: typeof s.tag === "string" ? s.tag : undefined,
    sort: typeof s.sort === "string" ? s.sort : undefined,
    minPrice: s.minPrice !== undefined ? Number(s.minPrice) : undefined,
    maxPrice: s.maxPrice !== undefined ? Number(s.maxPrice) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sarees — Sashvi Studio" },
      {
        name: "description",
        content: "Mysore silk, mul cotton, handloom & designer sarees curated by Sashvi Studio.",
      },
      { property: "og:title", content: "Sarees — Sashvi Studio" },
    ],
  }),
  component: SareesPage,
});

function SareesPage() {
  const { tag, sort, minPrice, maxPrice } = Route.useSearch();
  const { products: all } = useCatalogProducts("sarees");
  const [showSkeleton, setShowSkeleton] = useState(true);
  const dbFilters = useCategoryFilters("sarees");
  const filters = dbFilters.length > 0 ? dbFilters : SAREE_CATEGORIES;
  const filtered = all.filter((p) => {
    const matchesTag = !tag || p.tags.includes(tag);
    const matchesMinPrice = minPrice === undefined || p.price >= minPrice;
    const matchesMaxPrice = maxPrice === undefined || p.price <= maxPrice;
    return matchesTag && matchesMinPrice && matchesMaxPrice;
  });
  const products = sortProducts(filtered, sort || "featured");

  // Hide skeleton when products are loaded or after 50 seconds
  useEffect(() => {
    if (all.length > 0) {
      const timer = setTimeout(() => setShowSkeleton(false), 500);
      return () => clearTimeout(timer);
    }
  }, [all]);

  // Auto-refresh after 50 seconds if skeleton is still showing
  useEffect(() => {
    if (showSkeleton && all.length === 0) {
      const timer = setTimeout(() => {
        window.location.reload();
      }, 50000);
      return () => clearTimeout(timer);
    }
  }, [showSkeleton, all]);

  return (
    <Layout>
      <CategoryShell
        eyebrow="The Saree Edit"
        title={tag || "All Sarees"}
        description="Discover thoughtfully curated sarees crafted for timeless and modern elegance. Also explore our authentic Handloom & Artisanal collections, celebrating craftsmanship from across India."
        filters={filters}
        activeTag={tag}
        activeSort={sort}
        minPrice={minPrice}
        maxPrice={maxPrice}
        basePath="/sarees"
      >
        {showSkeleton ? (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length > 0 ? (
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
