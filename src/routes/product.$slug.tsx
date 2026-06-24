import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Heart, MessageCircle, Minus, Plus, Share2, Star, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { getProduct, PRODUCTS, formatINR } from "@/lib/products";
import { BRAND, waLink } from "@/lib/contact";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return product;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — Sashvi Studio` },
          { name: "description", content: loaderData.description },
          { property: "og:title", content: loaderData.name },
          { property: "og:description", content: loaderData.description },
          { property: "og:image", content: loaderData.image },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <Layout>
      <div className="container-luxe py-32 text-center">
        <h1 className="font-display text-4xl">Product not found</h1>
        <Link to="/sarees" className="mt-6 inline-flex rounded-full bg-foreground px-6 py-3 text-sm uppercase tracking-widest text-background">Continue shopping</Link>
      </div>
    </Layout>
  ),
  errorComponent: ({ error }) => (
    <Layout>
      <div className="container-luxe py-24 text-center text-muted-foreground">{error.message}</div>
    </Layout>
  ),
  component: ProductPage,
});

function ProductPage() {
  const product = Route.useLoaderData() as ReturnType<typeof getProduct> & object;
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const images = product.images && product.images.length ? product.images : [product.image, product.image, product.image];
  const related = PRODUCTS.filter((p) => p.id !== product.id && p.categories.some((c) => product.categories.includes(c))).slice(0, 4);

  return (
    <Layout>
      <div className="container-luxe py-6">
        <nav className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link> /{" "}
          <Link to={product.categories[0] === "sarees" ? "/sarees" : product.categories[0] === "jewellery" ? "/jewellery" : "/combos"} className="hover:text-foreground capitalize">
            {product.categories[0]}
          </Link> / <span className="text-foreground">{product.name}</span>
        </nav>
      </div>

      <section className="container-luxe grid gap-10 pb-16 md:grid-cols-[1.05fr_1fr]">
        <div className="grid gap-3 md:grid-cols-[80px_1fr]">
          <div className="order-2 flex gap-3 overflow-x-auto md:order-1 md:flex-col">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`shrink-0 overflow-hidden rounded-xl ring-1 transition ${activeImg === i ? "ring-accent" : "ring-border"}`}
              >
                <img src={src} alt={`${product.name} ${i + 1}`} className="h-20 w-20 object-cover" />
              </button>
            ))}
          </div>
          <div className="order-1 overflow-hidden rounded-[1.5rem] ring-1 ring-border md:order-2">
            <img
              src={images[activeImg]}
              alt={product.name}
              className="aspect-[4/5] w-full object-cover transition duration-700 hover:scale-105"
            />
          </div>
        </div>

        <div>
          <div className="eyebrow mb-3">{product.tags[0]}</div>
          <h1 className="font-display text-3xl md:text-5xl leading-tight">{product.name}</h1>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex gap-0.5 text-accent">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating ?? 5) ? "fill-current" : ""}`} />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{product.rating?.toFixed(1)} · {product.reviewCount} reviews</span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-display text-3xl text-foreground">{formatINR(product.price)}</span>
            {product.compareAt && (
              <>
                <span className="text-muted-foreground line-through">{formatINR(product.compareAt)}</span>
                <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                  Save {formatINR(product.compareAt - product.price)}
                </span>
              </>
            )}
          </div>

          <p className="mt-6 text-foreground/80 leading-relaxed">{product.description}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {product.tags.map((t) => (
              <span key={t} className="rounded-full bg-secondary px-3 py-1 text-xs text-foreground/70">{t}</span>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="inline-flex items-center rounded-full border border-border bg-card">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center hover:text-accent"><Minus className="h-4 w-4" /></button>
              <span className="w-8 text-center text-sm">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="grid h-11 w-11 place-items-center hover:text-accent"><Plus className="h-4 w-4" /></button>
            </div>
            <button className="flex-1 rounded-full bg-foreground px-6 py-3.5 text-sm font-medium uppercase tracking-widest text-background hover:bg-accent hover:text-accent-foreground">
              Add to Cart
            </button>
            <button aria-label="Wishlist" className="grid h-12 w-12 place-items-center rounded-full border border-border bg-card hover:border-accent hover:text-accent">
              <Heart className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={waLink(`Hi Sashvi Studio, I'd like to enquire about ${product.name} (${formatINR(product.price)}).`)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-5 py-3 text-sm font-medium hover:border-accent hover:text-accent"
            >
              <MessageCircle className="h-4 w-4 text-accent" /> Enquire on WhatsApp
            </a>
            <button className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm hover:border-accent hover:text-accent">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>

          <div className="mt-8 grid gap-3 rounded-2xl border border-border bg-card p-5 text-sm sm:grid-cols-3">
            <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-accent" /> Pan-India shipping</div>
            <div className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-accent" /> 48-hr replacement</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Authentic craft</div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Replacement only (no returns). Send video proof to {BRAND.phone} on WhatsApp within 48 hours.
          </p>
        </div>
      </section>

      <section className="container-luxe pb-20">
        <h2 className="mb-8 font-display text-2xl md:text-3xl">You may also love</h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {related.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </Layout>
  );
}
