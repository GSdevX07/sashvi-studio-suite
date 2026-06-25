import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { byCategory, SAREE_CATEGORIES } from "@/lib/products";
import { CategoryShell } from "@/components/CategoryShell";

type Search = { tag?: string };

const SAREE_THUMBNAILS = [
  { name: 'Mysore Silk Sarees', image: '/mysoresilksareethumbnail.jpeg' },
  { name: 'Mul Cotton Sarees', image: '/mulcottonsareethumbnail.jpeg' },
  { name: 'Handloom & Artisanal Sarees', image: '/handloomandartisinalsareethumbnail.jpeg' },
  { name: 'Fancy & Designer Sarees', image: '/fancyanddesignersareesthumbnail.jpeg' },
  { name: 'Saree & Stitched Blouse Combos', image: '/sareeandstitchedblousecombothumbnail.jpeg' },
  { name: 'Sarees Under ₹999', image: '/budgetstoresareeunder999.png' },
  { name: 'Other Sarees & Blouses', image: '/othersareesandblousesthumbnail.jpeg' },
];

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
  const showCategories = !tag;
  
  return (
    <Layout>
      {showCategories ? (
        <CategoryShell
          eyebrow="The Saree Edit"
          title="Sarees"
          description="Handwoven silks, breathable mul cottons, and artisanal block prints — each piece celebrates craftsmanship and effortless drape."
          filters={SAREE_CATEGORIES}
          basePath="/sarees"
        />
      ) : (
        <CategoryShell
          eyebrow="The Saree Edit"
          title={tag || "Sarees"}
          description="Curated collection of beautiful sarees for every occasion."
          filters={SAREE_CATEGORIES}
          activeTag={tag}
          basePath="/sarees"
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
