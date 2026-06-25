import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Layout } from "@/components/Layout";
import { formatINR } from "@/lib/products";
import { calculateDelivery } from "@/lib/checkout";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — Sashvi Studio" }] }),
  component: CartPage,
});

function CartPage() {
  const { isLoggedIn } = useAuth();
  const { items, removeItem, updateQty } = useCart();
  const navigate = useNavigate();

  if (!isLoggedIn) {
    return (
      <Layout>
        <section className="container-luxe flex flex-col items-center justify-center gap-6 py-32 text-center">
          <ShoppingBag className="h-14 w-14 text-muted-foreground/40" />
          <div>
            <h1 className="font-display text-3xl text-foreground">Sign in to view your cart</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please sign in or create an account to access your shopping cart.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate({ to: "/my-account" })}
              className="rounded-full bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-widest text-background hover:bg-accent hover:text-accent-foreground transition"
            >
              Sign In
            </button>
            <Link to="/sarees" className="rounded-full border border-border px-6 py-3 text-sm font-medium uppercase tracking-widest text-foreground hover:border-accent hover:text-accent transition">
              Continue Shopping
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = calculateDelivery(subtotal);

  if (items.length === 0) {
    return (
      <Layout>
        <section className="container-luxe flex flex-col items-center justify-center gap-6 py-32 text-center">
          <ShoppingBag className="h-14 w-14 text-muted-foreground/40" />
          <div>
            <h1 className="font-display text-3xl text-foreground">Your cart is empty</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Add some beautiful pieces to get started.
            </p>
          </div>
          <Link
            to="/sarees"
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-widest text-background hover:bg-accent hover:text-accent-foreground transition"
          >
            Shop Sarees
          </Link>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="container-luxe pt-16 pb-10">
        <div className="eyebrow mb-3">Your Bag</div>
        <h1 className="font-display text-4xl md:text-5xl">Shopping Cart</h1>
      </section>

      <section className="container-luxe grid gap-10 pb-24 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[88px_1fr_auto] items-center gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[120px_1fr_auto] sm:gap-6 sm:p-5"
            >
              <img
                src={item.image}
                alt={item.name}
                className="aspect-square w-full rounded-xl object-cover"
              />
              <div className="min-w-0">
                <div className="font-display text-lg leading-tight text-foreground">{item.name}</div>
                <div className="mt-3 inline-flex items-center rounded-full border border-border">
                  <button
                    aria-label="Decrease quantity"
                    onClick={() => updateQty(item.id, item.qty - 1)}
                    className="grid h-8 w-8 place-items-center hover:text-accent transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm">{item.qty}</span>
                  <button
                    aria-label="Increase quantity"
                    onClick={() => updateQty(item.id, item.qty + 1)}
                    className="grid h-8 w-8 place-items-center hover:text-accent transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-foreground">{formatINR(item.price * item.qty)}</div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6">
          <div className="eyebrow mb-4">Order Summary</div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{shipping === 0 ? "Free" : formatINR(shipping)}</dd>
            </div>
            <div className="hairline my-3" />
            <div className="flex justify-between text-base font-medium">
              <dt>Total</dt>
              <dd>{formatINR(subtotal + shipping)}</dd>
            </div>
          </dl>
          <div className="mt-4 text-xs text-muted-foreground">
            {subtotal < 1999
              ? `Add ${formatINR(1999 - subtotal)} more for Free Delivery`
              : "Your order qualifies for free delivery."}
          </div>
          <Link
            to="/checkout"
            className="mt-6 block w-full rounded-full bg-foreground py-3.5 text-center text-sm font-medium uppercase tracking-widest text-background hover:bg-accent hover:text-accent-foreground transition"
          >
            Proceed to Checkout
          </Link>
          <Link
            to="/sarees"
            className="mt-3 block text-center text-xs text-muted-foreground hover:text-accent transition"
          >
            Continue shopping
          </Link>
        </aside>
      </section>
    </Layout>
  );
}
