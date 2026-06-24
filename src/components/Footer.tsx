import { Link } from "@tanstack/react-router";
import { Instagram, Phone, MessageCircle } from "lucide-react";
import { Logo } from "./Logo";
import { BRAND, waLink } from "@/lib/contact";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/60">
      <div className="container-luxe py-16">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2 max-w-md">
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

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-foreground/80">Shop</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/sarees" className="hover:text-foreground">Sarees</Link></li>
              <li><Link to="/jewellery" className="hover:text-foreground">Jewellery</Link></li>
              <li><Link to="/combos" className="hover:text-foreground">Combos</Link></li>
              <li><Link to="/new-arrivals" className="hover:text-foreground">New Arrivals</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-foreground/80">Studio</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
              <li>Returns &amp; Replacements</li>
              <li>Shipping</li>
            </ul>
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

        <div className="mt-8 flex flex-col items-start justify-between gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Sashvi Studio. All rights reserved.</p>
          <a
            href={waLink(BRAND.devMessage, BRAND.devWhatsApp)}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-1 text-foreground/70 hover:text-accent"
          >
            Developed by <span className="font-medium underline decoration-dotted underline-offset-4 group-hover:decoration-solid">Sathwik</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
