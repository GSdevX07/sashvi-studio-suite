import { Link } from "@tanstack/react-router";
import { Instagram, Phone, MessageCircle } from "lucide-react";
import { Logo } from "./Logo";
import { BRAND, waLink } from "@/lib/contact";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/60">
      <div className="container-luxe py-16">
        <div className="grid gap-12 md:grid-cols-[minmax(18rem,1fr)_minmax(28rem,1fr)]">
          <div className="max-w-md">
            <Logo />
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Thoughtfully curated sarees, South Indian imitation jewellery, and ready-to-style
              combinations — crafted to complete every look.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href={BRAND.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:border-accent hover:text-accent"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href={`tel:${BRAND.phone.replace(/\s/g, "")}`}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-sm text-foreground transition hover:border-accent"
              >
                <Phone className="h-4 w-4" /> {BRAND.phone}
              </a>
              <a
                href={waLink("Hi Sashvi Studio, I'd like to enquire about a product.")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground transition hover:opacity-90"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-widest text-foreground/80">Quick Links</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link to="/shop" className="hover:text-foreground">Shop All</Link></li>
                <li><Link to="/track-order" className="hover:text-foreground">Track Order</Link></li>
                <li><Link to="/my-account" className="hover:text-foreground">My Account</Link></li>
                <li><Link to="/contact" className="hover:text-foreground">Customer Support</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-widest text-foreground/80">Legal</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms-and-conditions" className="hover:text-foreground">Terms &amp; Conditions</Link></li>
                <li><Link to="/shipping-policy" className="hover:text-foreground">Shipping Policy</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-foreground">Privacy Policy</Link></li>
                <li><Link to="/exchange-policy" className="hover:text-foreground">Exchange Policy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-widest text-foreground/80">Categories</h4>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li><Link to="/sarees" className="hover:text-foreground">Sarees</Link></li>
                <li><Link to="/jewellery" className="hover:text-foreground">Jewellery</Link></li>
                <li><Link to="/combos" className="hover:text-foreground">Combos</Link></li>
                <li><Link to="/best-sellers" className="hover:text-foreground">Best Sellers</Link></li>
                <li><Link to="/new-arrivals" className="hover:text-foreground">New Arrivals</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
          <p className="rounded-2xl bg-card/70 p-4 leading-relaxed">
            <span className="font-medium text-foreground">Replacement Policy:</span> We accept replacements only — no
            returns. Please send a video proof of any issue to our WhatsApp at{" "}
            <a className="text-accent hover:underline" href={waLink("Hi, I'd like to raise a replacement request.")} target="_blank" rel="noreferrer">
              {BRAND.phone}
            </a>{" "}
            within 48 hours of delivery.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 text-xs text-muted-foreground text-center">
          <p>© {new Date().getFullYear()} Sashvi Studio. All rights reserved.</p>
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-3">
            <span className="text-foreground/70">Developed by</span>
            <span className="font-medium underline decoration-dotted underline-offset-4 text-foreground/90">
              Sathwik
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="tel:+919502252440"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-foreground transition hover:border-accent hover:text-accent"
            >
              <Phone className="h-3.5 w-3.5" /> 9502252440
            </a>
            <a
              href="https://wa.me/919502252440"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs text-foreground transition hover:border-accent hover:bg-accent hover:text-accent-foreground"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
