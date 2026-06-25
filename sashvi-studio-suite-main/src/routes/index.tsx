import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Star, Sparkles, Play } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { PRODUCTS, formatINR } from "@/lib/products";
import { BRAND } from "@/lib/contact";
import { getActiveInstagramFeed } from "@/lib/instagram";
import { InstagramFeed } from "@/components/InstagramFeed";
import hero from "/saree_hero_banner.png";
import catSarees from "/saree-category.jpeg";
import catJewellery from "/jewellery-category.jpeg";
import catCombos from "/combo-category.jpeg";
import editorial from "@/assets/editorial.jpg";
import p2 from "/under999saree.jpeg";
import p4 from "/under599jewellery.jpeg";

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
              <Sparkles className="h-3.5 w-3.5" /> New Festive Edit · Autumn '26
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
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/sarees"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-widest text-background transition hover:bg-accent hover:text-accent-foreground"
              >
                Shop Sarees <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/jewellery"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-6 py-3 text-sm font-medium uppercase tracking-widest text-foreground transition hover:border-accent hover:text-accent"
              >
                Shop Jewellery
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-6 text-left">
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

      {/* HOW TO ORDER */}
      <section className="container-luxe py-16">
        <SectionHeading eyebrow="How to Order" title="Place your order in 4 easy steps" />
        <div className="grid gap-5 md:grid-cols-4">
          {[
            {
              title: "Browse the collection",
              description: "Explore sarees, jewellery and combos curated for every occasion.",
            },
            {
              title: "Add your favourites",
              description: "Select sizes, add to cart and review your order before checkout.",
            },
            {
              title: "Choose payment",
              description: "Pay securely online or choose Cash on Delivery with advance payment.",
            },
            {
              title: "Track your delivery",
              description: "Receive a tracking link once your order is dispatched and stay updated.",
            },
          ].map((step, index) => (
            <div key={step.title} className="rounded-[1.5rem] border border-border bg-card p-8 text-sm text-muted-foreground shadow-soft">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-sm font-semibold text-accent-foreground">
                {index + 1}
              </div>
              <h3 className="font-semibold text-foreground">{step.title}</h3>
              <p className="mt-3 leading-relaxed">{step.description}</p>
            </div>
          ))}
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

      {/* FAQ */}
      <section className="container-luxe py-20">
        <SectionHeading eyebrow="Help Center" title="Frequently Asked Questions" />
        <div className="grid gap-8">
          {[
            {
              question: "Are your sarees authentic?",
              answer: (
                <>
                  Yes. We carefully curate authentic sarees, including Mysore Silk, Mul Cotton, Handloom, and Artisanal collections sourced from skilled weavers and trusted artisans across India.
                  <br />
                  <br />
                  We offer both Pure Silk and Semi Silk sarees, depending on the collection. The fabric composition and product specifications are clearly mentioned in each product description.
                </>
              ),
            },
            {
              question: "Do all sarees come with a blouse piece?",
              answer: (
                <>
                  No. While many sarees include a matching blouse piece, several Mul Cotton sarees and selected handcrafted collections may not come with a blouse piece. Please refer to the product description for complete details.
                </>
              ),
            },
            {
              question: "Do you offer stitched blouses?",
              answer: "Yes. We offer ready-to-wear stitched blouses and curated saree & stitched blouse combos on selected products.",
            },
            {
              question: "What payment methods do you accept?",
              answer: (
                <>
                  We accept UPI, Credit Cards, Debit Cards, Net Banking, Wallets, and Cash on Delivery (COD) for eligible locations.
                  <br />
                  <br />
                  A 10% advance payment is required to confirm all COD orders. The remaining amount can be paid at the time of delivery. Applicable shipping charges and COD handling charges will be displayed during checkout.
                </>
              ),
            },
            {
              question: "Do you offer free shipping?",
              answer: "Yes. We offer Free Shipping across India on all prepaid orders above ₹1,000. Applicable shipping charges for other orders will be displayed during checkout.",
            },
            {
              question: "How long does delivery take?",
              answer: "Orders are generally dispatched within 1–3 business days and delivered within 3–7 business days across India, depending on your location. A tracking link will be shared via Email or WhatsApp once your order is dispatched.",
            },
            {
              question: "Do you accept returns or exchanges?",
              answer: (
                <>
                  We do not accept returns.
                  <br />
                  <br />
                  Exchanges are offered only if you receive a damaged product or an incorrect product, and the request must be raised within 7 days from the date of delivery.
                  <br />
                  <br />
                  A clear, continuous, and uncut unboxing video recorded from the moment the sealed package is opened is mandatory for all damage or exchange claims. Claims without an unboxing video cannot be accepted.
                </>
              ),
            },
            {
              question: "Will the saree colour be exactly the same as shown?",
              answer: "We strive to display our products as accurately as possible. However, slight colour variations may occur due to photography, lighting, or individual screen settings.",
            },
            {
              question: "Do handcrafted and naturally dyed sarees require special care?",
              answer: (
                <>
                  Yes. Handloom, block-printed, embroidered, and handcrafted sarees may have slight variations in weave, print, texture, or embroidery, which are natural characteristics and not defects.
                  <br />
                  <br />
                  Some sarees dyed using natural indigo or vegetable dyes may release excess colour during the first few washes. We recommend washing them separately with a mild detergent, avoiding prolonged soaking, and drying them in the shade.
                </>
              ),
            },
            {
              question: "Can I request additional photos or videos before placing an order?",
              answer: "Absolutely! If you'd like additional photos, close-up details, or a drape video of any product, feel free to contact us via WhatsApp or Instagram before placing your order.",
            },
            {
              question: "How can I contact Sashvi Studio?",
              answer: (
                <>
                  For any queries or assistance, please reach out to us at:
                  <br />
                  <strong>Email:</strong> sashvistudio26@gmail.com
                </>
              ),
            },
          ].map((faq) => (
            <div key={faq.question} className="rounded-[1.5rem] border border-border bg-card p-8 shadow-soft">
              <h3 className="font-semibold text-foreground">{faq.question}</h3>
              <div className="mt-4 text-sm leading-relaxed text-muted-foreground">{faq.answer}</div>
            </div>
          ))}
        </div>
      </section>

      <InstagramFeed feed={getActiveInstagramFeed()} />
    </Layout>
  );
}
