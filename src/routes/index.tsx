import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Star, Sparkles, Play } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { PRODUCTS, formatINR } from "@/lib/products";
import { BRAND } from "@/lib/contact";
import hero from "@/assets/hero-saree.jpg";
import catSarees from "@/assets/cat-sarees.jpg";
import catJewellery from "@/assets/cat-jewellery.jpg";
import catCombos from "@/assets/cat-combos.jpg";
import editorial from "@/assets/editorial.jpg";
import p2 from "@/assets/p2.jpg";
import p4 from "@/assets/p4.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sashvi Studio — Sarees & Jewellery" },
      { name: "description", content: "Curated sarees, South Indian jewellery & styled combos. Styled to Complete You." },
      { property: "og:title", content: "Sashvi Studio — Styled to Complete You" },
      { property: "og:description", content: "Luxury sarees, jewellery & combos curated for every occasion." },
    ],
  }),
  component: Home,
});

function SectionHeading({ eyebrow, title, link, linkLabel }: { eyebrow: string; title: string; link?: string; linkLabel?: string }) {
  return (
    <div className="mb-10 flex items-end justify-between gap-6">
      <div>
        <div className="eyebrow mb-3">{eyebrow}</div>
        <h2 className="text-3xl md:text-4xl font-medium text-foreground">{title}</h2>
      </div>
      {link && (
        <Link to={link} className="hidden sm:inline-flex items-center gap-1.5 text-sm text-foreground/70 hover:text-accent">
          {linkLabel ?? "View all"} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function Home() {
  const newArrivals = PRODUCTS.filter((p) => p.isNew).slice(0, 6);
  const featured = PRODUCTS.filter((p) => p.isFeatured).slice(0, 4);

  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="container-luxe grid items-center gap-10 pt-10 pb-16 md:grid-cols-[1.05fr_1fr] md:pt-16 md:pb-24">
          <div className="order-2 md:order-1">
            <div className="eyebrow mb-5 inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" /> New Festive Edit · Autumn ’26
            </div>
            <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-[5.25rem]">
              {BRAND.name}
            </h1>
            <p className="mt-5 max-w-md text-lg italic text-muted-foreground">
              {BRAND.subline}.
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Thoughtfully curated sarees, South Indian imitation jewellery, and ready-to-style
              combos — crafted to celebrate craft, tradition, and effortless elegance.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-6 border-t border-border pt-6 text-left">
              {[
                ["500+", "Curated Pieces"],
                ["4.9★", "Loved by Patrons"],
                ["48hr", "Replacement"],
              ].map(([k, v]) => (
                <div key={v}>
                  <div className="font-display text-2xl text-foreground">{k}</div>
                  <div className="mt-1 text-[0.7rem] uppercase tracking-widest text-muted-foreground">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-secondary/70" />
              <div className="overflow-hidden rounded-[1.75rem] shadow-luxe">
                <img
                  src={hero}
                  alt="Model in deep maroon Mysore silk saree with temple gold jewellery"
                  width={1536}
                  height={1024}
                  className="h-[460px] w-full object-cover sm:h-[560px] md:h-[640px]"
                />
              </div>
              <div className="absolute bottom-5 left-5 max-w-[15rem] rounded-2xl border border-border bg-background/90 p-4 shadow-soft backdrop-blur">
                <div className="eyebrow mb-1">Featured Look</div>
                <div className="font-display text-lg leading-tight text-foreground">Maroon Mysore Silk × Temple Gold</div>
                <Link to="/product/$slug" params={{ slug: "emerald-kanjivaram-silk-saree" }} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent">
                  Shop the look <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="container-luxe py-16">
        <SectionHeading eyebrow="Just In" title="New Arrivals" link="/new-arrivals" />
        <div className="-mx-5 px-5 sm:mx-0 sm:px-0">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="container-luxe py-16">
        <SectionHeading eyebrow="Curated Worlds" title="Shop By Category" />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { to: "/sarees", title: "Sarees", img: catSarees, copy: "Silks, mul cottons & handlooms" },
            { to: "/jewellery", title: "Jewellery", img: catJewellery, copy: "Temple, kundan & jhumkas" },
            { to: "/combos", title: "Combos", img: catCombos, copy: "Styled saree & jewellery sets" },
          ].map((c) => (
            <Link
              key={c.title}
              to={c.to}
              className="group relative overflow-hidden rounded-[1.5rem] ring-1 ring-border"
            >
              <div className="aspect-[4/5] overflow-hidden bg-secondary">
                <img src={c.img} alt={c.title} loading="lazy" className="h-full w-full object-cover transition duration-[1200ms] group-hover:scale-105" />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent p-6 text-background">
                <div className="font-display text-3xl">{c.title}</div>
                <div className="mt-1 text-xs uppercase tracking-widest opacity-90">{c.copy}</div>
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium">
                  Explore <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* BUDGET STORE */}
      <section className="container-luxe py-16">
        <SectionHeading eyebrow="Budget Store" title="Beautiful · Affordable · Effortless" />
        <div className="grid gap-5 md:grid-cols-2">
          {[
            { to: "/sarees", tag: "Sarees Under ₹999", img: p2, eyebrow: "Sarees", price: "₹999" },
            { to: "/jewellery", tag: "Jewellery Under ₹599", img: p4, eyebrow: "Jewellery", price: "₹599" },
          ].map((c) => (
            <Link
              key={c.tag}
              to={c.to}
              search={{ tag: c.tag }}
              className="group relative grid grid-cols-[1fr_1fr] overflow-hidden rounded-[1.5rem] bg-card ring-1 ring-border"
            >
              <div className="p-7 md:p-10">
                <div className="eyebrow mb-4">{c.eyebrow} · Budget Store</div>
                <h3 className="font-display text-3xl md:text-4xl leading-tight text-foreground">Under {c.price}</h3>
                <p className="mt-3 text-sm text-muted-foreground">Carefully curated styles at gentle prices — without compromising elegance.</p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-accent">Shop now <ArrowRight className="h-4 w-4" /></span>
              </div>
              <div className="overflow-hidden">
                <img src={c.img} alt={c.tag} loading="lazy" className="h-full w-full object-cover transition duration-[1200ms] group-hover:scale-105" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED COLLECTION — editorial */}
      <section className="relative mt-10">
        <div className="container-luxe grid items-center gap-10 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-[1.75rem] ring-1 ring-border">
            <img src={editorial} alt="Editorial — pastel pink saree in courtyard" loading="lazy" className="h-[480px] w-full object-cover md:h-[600px]" />
          </div>
          <div className="md:pl-10">
            <div className="eyebrow mb-4">The Vivanta Edit · Featured Collection</div>
            <h2 className="font-display text-4xl leading-tight text-foreground md:text-5xl">
              Heirloom craft, reimagined for modern muses.
            </h2>
            <p className="mt-5 max-w-md text-muted-foreground">
              A limited collection of handwoven silks paired with antique gold jewellery — for the
              wedding season and beyond.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {featured.slice(0, 2).map((p) => (
                <Link key={p.id} to="/product/$slug" params={{ slug: p.slug }} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:border-accent">
                  <img src={p.image} alt={p.name} className="h-16 w-16 rounded-xl object-cover" />
                  <div className="min-w-0">
                    <div className="truncate font-display text-base text-foreground">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{formatINR(p.price)}</div>
                  </div>
                </Link>
              ))}
            </div>
            <Link to="/sarees" className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-widest text-background hover:bg-accent hover:text-accent-foreground">
              View the collection <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="container-luxe py-20">
        <SectionHeading eyebrow="Customer Stories" title="Loved by patrons across India" />
        <div className="grid gap-5 md:grid-cols-3">
          {[
            { name: "Ananya R.", city: "Bengaluru", quote: "The Mysore silk is dreamy — the gold border catches the light beautifully. The packaging felt like a gift to myself.", rating: 5 },
            { name: "Lakshmi V.", city: "Chennai", quote: "Bought the temple necklace set for my wedding receptions. Quality is exceptional and styling tips were so helpful.", rating: 5 },
            { name: "Sneha K.", city: "Hyderabad", quote: "My go-to for everyday mul cottons. Soft, breathable, and the block prints are gorgeous.", rating: 5 },
          ].map((r) => (
            <article key={r.name} className="rounded-[1.5rem] border border-border bg-card p-7">
              <div className="flex gap-0.5 text-accent">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-foreground/85 leading-relaxed">“{r.quote}”</p>
              <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-secondary font-display text-foreground">{r.name[0]}</div>
                <div>
                  <div className="text-sm font-medium text-foreground">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.city}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* INSTAGRAM */}
      <section className="container-luxe py-12">
        <SectionHeading eyebrow="@sashvi.studio" title="Follow our journal" link={BRAND.instagram} linkLabel="Visit Instagram" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {PRODUCTS.slice(0, 6).map((p, i) => (
            <a
              key={p.id}
              href={BRAND.instagram}
              target="_blank"
              rel="noreferrer"
              className="group relative aspect-square overflow-hidden rounded-2xl bg-secondary ring-1 ring-border"
            >
              <img src={p.image} alt="Instagram post" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              {i % 2 === 0 && (
                <div className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-foreground">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 translate-y-full bg-foreground/85 p-2 text-center text-[0.65rem] font-medium uppercase tracking-widest text-background transition group-hover:translate-y-0">
                Shop this look
              </div>
            </a>
          ))}
        </div>
      </section>
    </Layout>
  );
}
