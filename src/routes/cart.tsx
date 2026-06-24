import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { PRODUCTS, formatINR } from "@/lib/products";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — Sashvi Studio" }] }),
  component: CartPage,
});

function CartPage() {
  const items = PRODUCTS.slice(0, 3).map((p) => ({ product: p, qty: 1 }));
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const shipping = subtotal > 2000 ? 0 : 99;

  return (
    <Layout>
      <section className="container-luxe pt-16 pb-10">
        <div className="eyebrow mb-3">Your Bag</div>
        <h1 className="font-display text-4xl md:text-5xl">Shopping Cart</h1>
      </section>

      <section className="container-luxe grid gap-10 pb-24 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {items.map(({ product, qty }) => (
            <div key={product.id} className="grid grid-cols-[88px_1fr_auto] items-center gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[120px_1fr_auto] sm:gap-6 sm:p-5">
              <img src={product.image} alt={product.name} className="aspect-square w-full rounded-xl object-cover" />
              <div className="min-w-0">
                <div className="font-display text-lg leading-tight text-foreground">{product.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{product.tags[0]}</div>
                <div className="mt-3 inline-flex items-center rounded-full border border-border">
                  <button className="grid h-8 w-8 place-items-center"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-6 text-center text-sm">{qty}</span>
                  <button className="grid h-8 w-8 place-items-center"><Plus className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-foreground">{formatINR(product.price * qty)}</div>
                <button className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6">
          <div className="eyebrow mb-4">Order Summary</div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatINR(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{shipping === 0 ? "Free" : formatINR(shipping)}</dd></div>
            <div className="hairline my-3" />
            <div className="flex justify-between text-base font-medium"><dt>Total</dt><dd>{formatINR(subtotal + shipping)}</dd></div>
          </dl>
          <button className="mt-6 w-full rounded-full bg-foreground py-3.5 text-sm font-medium uppercase tracking-widest text-background hover:bg-accent hover:text-accent-foreground">
            Checkout
          </button>
          <Link to="/sarees" className="mt-3 block text-center text-xs text-muted-foreground hover:text-accent">Continue shopping</Link>
        </aside>
      </section>
    </Layout>
  );
}
