import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { byCategory, JEWELLERY_CATEGORIES } from "@/lib/products";
import { CategoryShell } from "@/components/CategoryShell";

type Search = { tag?: string };

const JEWELLERY_THUMBNAILS = [
  { name: 'Necklaces', image: '/necklacethumbnail.jpeg' },
  { name: 'Long Haaram', image: '/longhaaramthumbnail.jpeg' },
  { name: 'Bridal Sets', image: '/bridalsetthumbnail.jpeg' },
  { name: 'Earrings&Jhumkas', image: '/jhumkathumbnail.jpeg' },
  { name: 'Jadau kundan jewellery', image: '/JadauKundanJewellerythumbnail.jpeg' },
  { name: 'Jewellery Under ₹599', image: '/budgetstorejewelleryunder599.png' },
  { name: 'Other Jewellery', image: '/otherjewellerythumbnail.jpeg' },
];

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
  const showCategories = !tag;
  
  return (
    <Layout>
      {showCategories ? (
        <CategoryShell
          eyebrow="Heritage Jewellery"
          title="Jewellery"
          description="South Indian imitation jewellery — temple necklaces, long haarams, jhumkas, and bridal sets — crafted to complete every look."
          filters={JEWELLERY_CATEGORIES}
          basePath="/jewellery"
        />
      ) : (
        <CategoryShell
          eyebrow="Heritage Jewellery"
          title={tag || "Jewellery"}
          description="Curated collection of beautiful jewellery for every occasion."
          filters={JEWELLERY_CATEGORIES}
          activeTag={tag}
          basePath="/jewellery"
        >
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </CategoryShell>
      )}
    </Layout>
  );
}
