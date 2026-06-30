import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, Check, X } from "lucide-react";
import { Layout } from "@/components/Layout";
import { formatINR } from "@/lib/products";
import { calculateDelivery, DELIVERY_THRESHOLD } from "@/lib/checkout";
import {
  useCart,
  cartItemHasDiscount,
  getCartItemEffectivePrice,
  getCartItemListPrice,
} from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { apiJson } from "@/lib/backend";
import { useEffect, useState } from "react";
import { Confetti } from "@/components/Confetti";
import { getDiscountOffLabel } from "@/lib/discount";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Cart — Sashvi Studio" }] }),
  component: CartPage,
});

function CartPage() {
  const { isLoggedIn } = useAuth();
  const {
    items,
    savedItems,
    removeItem,
    updateQty,
    saveForLater,
    moveToCart,
    removeSavedItem,
    applyItemDiscount,
    refreshCartItems,
    cartUpdateNotification,
    dismissCartNotification,
  } = useCart();
  const navigate = useNavigate();
  const [productStock, setProductStock] = useState<Record<string, number>>({});
  const [showConfetti, setShowConfetti] = useState(false);

  // Auto-apply discounts for items that have them
  useEffect(() => {
    items.forEach((item) => {
      if (cartItemHasDiscount(item) && !item.discountApplied) {
        applyItemDiscount(item.id);
      }
    });
  }, [items, applyItemDiscount]);

  // Auto-refresh cart when cart items change (not when products change globally)
  // Cart items are refreshed by CartContext's internal logic when needed
  // We only need to refresh stock data from backend
  useEffect(() => {
    if (!isLoggedIn || items.length === 0) return;

    const fetchProductData = async () => {
      const stockMap: Record<string, number> = {};

      for (const item of items) {
        try {
          const res = await apiJson<{ product: { stock: number } }>(
            `/products/${item.id}`,
            {},
            true,
          );
          if (res.product) {
            stockMap[item.id] = res.product?.stock ?? 999;
          }
        } catch {
          try {
            const catalogRes = await apiJson<{ products: { id: string; stock: number }[] }>(
              "/backend-api/products/catalog",
              {},
              false,
            );
            const catalogProduct = catalogRes.products?.find((p) => p.id === item.id);
            stockMap[item.id] = catalogProduct?.stock ?? 999;
          } catch {
            stockMap[item.id] = 999;
          }
        }
      }
      setProductStock(stockMap);
    };

    fetchProductData();
  }, [isLoggedIn, items]);

  const listSubtotal = items.reduce(
    (sum, item) => sum + getCartItemListPrice(item) * item.qty,
    0,
  );
  const effectiveSubtotal = items.reduce(
    (sum, item) => sum + getCartItemEffectivePrice(item) * item.qty,
    0,
  );
  const productDiscount = listSubtotal - effectiveSubtotal;
  const shipping = calculateDelivery(effectiveSubtotal);
  const grandTotal = effectiveSubtotal + shipping;

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
              className="rounded-full bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-widest text-background transition hover:bg-accent hover:text-accent-foreground"
            >
              Sign In
            </button>
            <Link
              to="/sarees"
              className="rounded-full border border-border px-6 py-3 text-sm font-medium uppercase tracking-widest text-foreground transition hover:border-accent hover:text-accent"
            >
              Continue Shopping
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

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
          <div className="flex gap-4">
            <Link
              to="/sarees"
              className="rounded-full bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-widest text-background transition hover:bg-accent hover:text-accent-foreground"
            >
              Shop Sarees
            </Link>
            <Link
              to="/jewellery"
              className="rounded-full bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-widest text-background transition hover:bg-accent hover:text-accent-foreground"
            >
              Shop Jewellery
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <Confetti show={showConfetti} onComplete={() => setShowConfetti(false)} />
      {cartUpdateNotification && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 max-w-md w-full px-4">
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 shadow-lg flex items-start gap-3">
            <div className="flex-1 text-sm text-foreground">
              <div className="font-medium text-accent mb-1">Product updated</div>
              <div className="text-muted-foreground">
                The price or availability of one or more items in your bag has changed. Your order summary has been refreshed automatically.
              </div>
            </div>
            <button
              onClick={dismissCartNotification}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <section className="container-luxe pt-16 pb-10">
        <div className="eyebrow mb-3">Your Bag</div>
        <h1 className="font-display text-4xl md:text-5xl">Shopping Cart</h1>
      </section>

      <section className="container-luxe grid gap-10 pb-24 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {items.map((item) => {
            const listPrice = getCartItemListPrice(item);
            const effectivePrice = getCartItemEffectivePrice(item);
            const lineListTotal = listPrice * item.qty;
            const lineEffectiveTotal = effectivePrice * item.qty;
            const discountLabel = getDiscountOffLabel({
              discountType: item.discountType,
              discountValue: item.discountValue,
            });
            const hasDiscount = cartItemHasDiscount(item);

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border bg-card p-4 sm:p-5"
              >
                <div className="grid grid-cols-[88px_1fr] items-start gap-4 sm:grid-cols-[120px_1fr_auto] sm:gap-6 sm:items-center">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-lg leading-tight text-foreground">
                      {item.name}
                    </div>
                    <div className="mt-3 inline-flex items-center rounded-full border border-border">
                      <button
                        aria-label="Decrease quantity"
                        onClick={() => updateQty(item.id, item.qty - 1, productStock[item.id])}
                        className="grid h-8 w-8 place-items-center transition-colors hover:text-accent"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm">{item.qty}</span>
                      <button
                        aria-label="Increase quantity"
                        onClick={() => updateQty(item.id, item.qty + 1, productStock[item.id])}
                        disabled={item.qty >= (productStock[item.id] || 999)}
                        className="grid h-8 w-8 place-items-center transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {productStock[item.id] !== undefined && productStock[item.id] < 999 && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {productStock[item.id] - item.qty <= 0
                          ? "Out of stock"
                          : `${productStock[item.id] - item.qty} left in stock`}
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:block text-right">
                    <div className="font-medium text-foreground">{formatINR(lineListTotal)}</div>
                  </div>
                </div>
                {/* Mobile price display */}
                <div className="mt-3 sm:hidden flex justify-between items-center">
                  <div className="font-medium text-foreground">{formatINR(lineListTotal)}</div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                  <button
                    onClick={() => saveForLater(item.id)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-accent"
                  >
                    Save for Later
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="eyebrow mb-4">Order Summary</div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatINR(listSubtotal)}</dd>
            </div>
            {productDiscount > 0 && (
              <div className="flex justify-between text-accent">
                <dt>Product Discount</dt>
                <dd>-{formatINR(productDiscount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd>{shipping === 0 ? "Free" : formatINR(shipping)}</dd>
            </div>
            <div className="hairline my-3" />
            <div className="flex justify-between text-base font-medium">
              <dt>Grand Total</dt>
              <dd>{formatINR(grandTotal)}</dd>
            </div>
          </dl>
          <div className="mt-4 text-xs text-muted-foreground">
            {effectiveSubtotal < DELIVERY_THRESHOLD
              ? `Add ${formatINR(DELIVERY_THRESHOLD - effectiveSubtotal)} more for Free Delivery`
              : "Your order qualifies for free delivery."}
          </div>
          <Link
            to="/checkout"
            className="mt-6 block w-full rounded-full bg-foreground py-3.5 text-center text-sm font-medium uppercase tracking-widest text-background transition hover:bg-accent hover:text-accent-foreground"
          >
            Proceed to Checkout
          </Link>
          <Link
            to="/sarees"
            className="mt-3 block text-center text-xs text-muted-foreground transition hover:text-accent"
          >
            Continue shopping
          </Link>
        </aside>
      </section>

      {savedItems.length > 0 && (
        <section className="container-luxe pb-24">
          <h2 className="mb-6 font-display text-2xl md:text-3xl">Saved for Later</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {savedItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-2xl border border-border bg-card p-4"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-24 w-24 rounded-xl object-cover"
                />
                <div className="flex min-w-0 flex-col justify-center">
                  <div className="truncate font-medium text-foreground">{item.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{formatINR(item.price)}</div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => moveToCart(item.id)}
                      className="rounded-full border border-border px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors hover:border-accent hover:text-accent"
                    >
                      Move to Cart
                    </button>
                    <button
                      onClick={() => removeSavedItem(item.id)}
                      className="rounded-full border border-border px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
}
