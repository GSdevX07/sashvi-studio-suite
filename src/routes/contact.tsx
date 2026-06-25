import { createFileRoute } from "@tanstack/react-router";
import { Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Layout } from "@/components/Layout";
import { BRAND, waLink } from "@/lib/contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Sashvi Studio" },
      { name: "description", content: "Get in touch with Sashvi Studio for orders, styling and replacements." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <Layout>
      <section className="container-luxe pt-16 pb-10 md:pt-24">
        <div className="eyebrow mb-4">Say Hello</div>
        <h1 className="font-display text-4xl md:text-6xl">Contact Us</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          For enquiries, styling help, custom requests, or replacements — reach us anytime. We typically respond within a few hours.
        </p>
      </section>

      <section className="container-luxe grid gap-6 pb-20 md:grid-cols-3">
        {[
          { icon: Phone, label: "Call Us", value: BRAND.phone, href: `tel:${BRAND.phone.replace(/\s/g, "")}` },
          { icon: MessageCircle, label: "WhatsApp", value: BRAND.phone, href: waLink("Hi Sashvi Studio, I have an enquiry.") },
          { icon: Instagram, label: "Instagram", value: BRAND.instagramHandle, href: BRAND.instagram },
        ].map((c) => (
          <a
            key={c.label}
            href={c.href}
            target="_blank"
            rel="noreferrer"
            className="group rounded-2xl border border-border bg-card p-7 transition hover:border-accent"
          >
            <div className="grid h-12 w-12 place-items-center rounded-full bg-secondary text-foreground transition group-hover:bg-accent group-hover:text-accent-foreground">
              <c.icon className="h-5 w-5" />
            </div>
            <div className="eyebrow mt-5">{c.label}</div>
            <div className="mt-1 font-display text-xl text-foreground">{c.value}</div>
          </a>
        ))}
      </section>

      <section className="container-luxe pb-24">
        <div className="rounded-[1.5rem] border border-accent/30 bg-accent/10 p-8 md:p-12">
          <div className="eyebrow mb-3">Replacement Policy</div>
          <h2 className="font-display text-2xl md:text-3xl text-foreground">Replacement only — no returns.</h2>
          <p className="mt-4 max-w-2xl text-foreground/80 leading-relaxed">
            For any issues with your order, please send a clear video proof of the product within 48 hours of
            delivery to our WhatsApp number{" "}
            <a className="font-medium text-accent underline-offset-4 hover:underline" href={waLink("Hi, raising a replacement request with video proof.")} target="_blank" rel="noreferrer">
              {BRAND.phone}
            </a>
            . We’ll arrange a replacement at the earliest.
          </p>
        </div>
      </section>

      <section className="container-luxe pb-24">
        <div className="grid gap-10 md:grid-cols-2">
          <form className="space-y-4 rounded-2xl border border-border bg-card p-8">
            <div className="eyebrow">Send a message</div>
            <input className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent" placeholder="Your name" />
            <input className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent" placeholder="Email or phone" />
            <textarea rows={5} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent" placeholder="How can we help?" />
            <button type="button" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-widest text-background hover:bg-accent hover:text-accent-foreground">
              Send <Mail className="h-4 w-4" />
            </button>
          </form>
          <div className="rounded-2xl border border-border bg-secondary/50 p-8">
            <div className="eyebrow">Studio</div>
            <div className="mt-4 flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-accent" />
              <p className="text-foreground/80 leading-relaxed">
                Sashvi Studio · By appointment only.<br />
                For studio visits, please WhatsApp us in advance.
              </p>
            </div>
            <div className="hairline my-6" />
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /> {BRAND.phone}</div>
              <div className="flex items-center gap-2"><Instagram className="h-4 w-4 text-accent" /> {BRAND.instagramHandle}</div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
