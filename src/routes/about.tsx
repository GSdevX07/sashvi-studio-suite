import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import editorial from "@/assets/editorial.jpg";
import hero from "@/assets/hero-saree.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Sashvi Studio" },
      { name: "description", content: "Sashvi Studio — your one-stop destination for thoughtfully curated sarees, jewellery, and combos. Styled to Complete You." },
      { property: "og:title", content: "About Sashvi Studio" },
      { property: "og:image", content: editorial },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <Layout>
      <section className="container-luxe pt-16 pb-10 md:pt-24">
        <div className="grid items-end gap-10 md:grid-cols-[1fr_1fr]">
          <div>
            <div className="eyebrow mb-5">Our Story</div>
            <h1 className="font-display text-5xl leading-[1.05] tracking-tight md:text-7xl">
              About <em className="not-italic text-accent">Sashvi Studio</em>
            </h1>
            <p className="mt-6 max-w-md text-lg italic text-muted-foreground">Styled to Complete You.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground">
            Sashvi Studio is your one-stop destination for thoughtfully curated sarees, South Indian
            imitation jewellery, and ready-to-style saree &amp; jewellery combos.
          </div>
        </div>
      </section>

      <section className="container-luxe my-10 overflow-hidden rounded-[2rem]">
        <img src={editorial} alt="Sashvi Studio editorial" className="h-[420px] w-full object-cover md:h-[620px]" />
      </section>

      <section className="container-luxe grid gap-10 py-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="eyebrow mb-4">Craft & Care</div>
          <h2 className="font-display text-3xl md:text-4xl leading-tight">A celebration of craftsmanship, tradition and effortless elegance.</h2>
        </div>
        <div className="space-y-5 text-foreground/80 leading-relaxed md:col-span-7">
          <p>
            Our collection features a wide variety of sarees, including Mysore Silk, Mul Cotton, authentic
            Handloom sarees, artisanal block prints, embroidered sarees, designer styles, and saree &amp; stitched
            blouse combinations. Each piece is carefully selected to celebrate craftsmanship, tradition, and
            effortless elegance.
          </p>
          <p>
            Complementing our sarees is a beautiful range of South Indian imitation jewellery, including
            necklaces, long haarams, bridal sets, jhumkas, and more. For those looking for a complete look,
            our curated saree and jewellery combos make styling simple and convenient.
          </p>
          <p>
            Whether you’re shopping for everyday elegance, festive celebrations, weddings, or special
            occasions, Sashvi Studio brings everything you need to complete your look in one place.
          </p>
        </div>
      </section>

      <section className="container-luxe pb-20">
        <div className="grid items-center gap-10 rounded-[2rem] border border-border bg-secondary/60 p-8 md:grid-cols-2 md:p-14">
          <div className="overflow-hidden rounded-2xl">
            <img src={hero} alt="Styled to Complete You" className="h-80 w-full object-cover md:h-96" />
          </div>
          <div>
            <div className="eyebrow mb-3">Our Promise</div>
            <h3 className="font-display text-3xl md:text-4xl leading-tight">Styled to Complete You.</h3>
            <p className="mt-4 text-muted-foreground">
              From everyday elegance to wedding-day grandeur — every piece at Sashvi Studio is chosen to make
              you feel completely, beautifully you.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
