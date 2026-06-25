import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { formatINR } from "@/lib/products";
import { calculateOrderTotals } from "@/lib/checkout";
import { apiJson, getAuthToken } from "@/lib/backend";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

type CheckoutProduct = {
  id: string;
  name: string;
  price: number;
  image: string;
};

type CheckoutItem = {
  product: CheckoutProduct;
  qty: number;
};

const DEFAULT_RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID ?? "rzp_test_12345";
const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Sashvi Studio" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const [paymentMode, setPaymentMode] = useState<"prepaid" | "cod">("prepaid");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cart = JSON.parse(window.localStorage.getItem("cart") || "[]");
      if (Array.isArray(cart) && cart.length > 0) {
        setItems(
          cart
            .filter((item) => item?.id && item?.price)
            .map((item: any) => ({
              product: {
                id: String(item.id),
                name: String(item.name),
                price: Number(item.price),
                image: String(item.image || ""),
              },
              qty: Number(item.qty) || 1,
            })),
        );
      }
    } catch {
      setItems([]);
    }
  }, []);

  const productTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.qty, 0),
    [items],
  );
  const { delivery, gatewayCharge, codCharge, total } = calculateOrderTotals(productTotal, paymentMode);
  const advancePayment = paymentMode === "cod" ? Math.ceil(total * 0.1) : total;
  const amountForFreeDelivery = Math.max(0, 1999 - productTotal);

  async function loadScript(src: string) {
    if (typeof window === "undefined") return false;
    if (window.document.querySelector(`script[src="${src}"]`)) return true;

    return new Promise<boolean>((resolve) => {
      const script = window.document.createElement("script");
      script.src = src;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      window.document.body.appendChild(script);
    });
  }

  async function handleCheckout() {
    setError(null);
    setMessage(null);

    if (!items.length) {
      setError("Your cart is empty. Add some items before checking out.");
      return;
    }

    if (!email || !phone || !address) {
      setError("Please complete your delivery details before placing the order.");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError("Please sign in before checking out.");
      return;
    }

    setLoading(true);

    try {
      const orderBody = {
        items: items.map((item) => ({ product_id: item.product.id, qty: item.qty, price: item.product.price })),
        shipping: { email, phone, address },
        paymentMode,
      };

      const orderResponse = await apiJson<{ ok: boolean; order: { id: string; total: number } }>(
        "/orders",
        {
          method: "POST",
          body: JSON.stringify(orderBody),
        },
        true,
      );

      if (paymentMode === "cod") {
        window.localStorage.removeItem("cart");
        setMessage(`Order placed successfully. Your order id is ${orderResponse.order.id}.`);
        return;
      }

      const paymentResponse = await apiJson<{ ok: boolean; razorOrder: { id: string; amount: number; currency: string } }>(
        "/payments/razorpay/create",
        {
          method: "POST",
          body: JSON.stringify({ orderId: orderResponse.order.id, amountType: "full" }),
        },
      );

      const scriptLoaded = await loadScript(CHECKOUT_SCRIPT_SRC);
      if (!scriptLoaded || typeof window.Razorpay === "undefined") {
        throw new Error("Unable to load payment checkout. Please try again later.");
      }

      const options = {
        key: DEFAULT_RAZORPAY_KEY,
        order_id: paymentResponse.razorOrder.id,
        amount: paymentResponse.razorOrder.amount,
        currency: paymentResponse.razorOrder.currency,
        name: "Sashvi Studio",
        description: "Order payment",
        prefill: { email, contact: phone },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          await apiJson("/payments/razorpay/verify", {
            method: "POST",
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderResponse.order.id,
            }),
          });
          window.localStorage.removeItem("cart");
          setMessage("Payment completed successfully. Thank you for your order.");
        },
        modal: { escape: true, ondismiss: () => setMessage("Payment cancelled. You can try again.") },
      };

      new window.Razorpay(options).open();
    } catch (err: any) {
      setError(err?.message || "Unable to place the order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <section className="container-luxe pt-16 pb-10">
        <div className="eyebrow mb-3">Checkout</div>
        <h1 className="font-display text-4xl md:text-5xl">Order Summary</h1>
      </section>

      <section className="container-luxe grid gap-10 lg:grid-cols-[1.7fr_1fr] pb-24">
        <div className="space-y-8">
          <div className="rounded-[1.5rem] border border-border bg-card p-8 shadow-soft">
            <h2 className="mb-6 font-display text-2xl text-foreground">Delivery Details</h2>
            <div className="grid gap-4">
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
              />
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone number"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
              />
              <textarea
                rows={5}
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Delivery address"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border bg-card p-8 shadow-soft">
            <h2 className="mb-6 font-display text-2xl text-foreground">Payment</h2>
            <div className="grid gap-3">
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-4">
                <input
                  type="radio"
                  checked={paymentMode === "prepaid"}
                  onChange={() => setPaymentMode("prepaid")}
                  className="h-4 w-4 accent-accent"
                />
                <span className="text-sm font-medium">Online Payment (Razorpay)</span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-4">
                <input
                  type="radio"
                  checked={paymentMode === "cod"}
                  onChange={() => setPaymentMode("cod")}
                  className="h-4 w-4 accent-accent"
                />
                <span className="text-sm font-medium">Cash on Delivery</span>
              </label>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[1.5rem] border border-border bg-card p-6 shadow-soft">
            <div className="eyebrow mb-3">Cart Summary</div>
            <div className="space-y-4">
              {items.length ? (
                items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-4">
                    <img src={item.product.image} alt={item.product.name} className="h-20 w-20 rounded-2xl object-cover" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground">{item.product.name}</div>
                      <div className="text-xs text-muted-foreground">Qty {item.qty}</div>
                    </div>
                    <div className="text-sm font-medium">{formatINR(item.product.price * item.qty)}</div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-border bg-background p-6 text-sm text-muted-foreground">
                  Your cart is empty. Add items from the shop before checking out.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border bg-card p-6 shadow-soft">
            <div className="text-sm text-muted-foreground">Order calculation</div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><dt>Product total</dt><dd>{formatINR(productTotal)}</dd></div>
              <div className="flex justify-between"><dt>Delivery charge</dt><dd>{delivery === 0 ? "Free" : formatINR(delivery)}</dd></div>
              <div className="flex justify-between"><dt>Gateway fee (3%)</dt><dd>{formatINR(gatewayCharge)}</dd></div>
              {paymentMode === "cod" ? (
                <div className="flex justify-between"><dt>COD fee</dt><dd>{formatINR(codCharge)}</dd></div>
              ) : null}
              <div className="hairline my-3" />
              <div className="flex justify-between text-base font-medium"><dt>Grand total</dt><dd>{formatINR(total)}</dd></div>
            </dl>
            <div className="mt-4 text-xs text-muted-foreground">
              {productTotal < 1999 ? `Add ${formatINR(amountForFreeDelivery)} more for free delivery.` : "Your order qualifies for free delivery."}
            </div>
          </div>

          {error ? <div className="rounded-2xl border border-destructive/10 bg-destructive/5 p-4 text-sm text-destructive">{error}</div> : null}
          {message ? <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 text-sm text-foreground">{message}</div> : null}

          <button
            onClick={handleCheckout}
            disabled={loading || !items.length}
            className="w-full rounded-full bg-foreground px-5 py-3 text-sm font-medium uppercase tracking-widest text-background hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Processing..." : paymentMode === "prepaid" ? "Proceed to Razorpay" : `Pay ${formatINR(advancePayment)} advance for COD`}
          </button>
          {paymentMode === "cod" ? (
            <p className="mt-3 text-xs text-muted-foreground">
              A 10% advance payment is required for Cash on Delivery. Remaining amount will be paid at delivery.
            </p>
          ) : null}
          <Link to="/cart" className="block text-center text-xs uppercase tracking-widest text-muted-foreground hover:text-accent">
            Return to cart
          </Link>
        </aside>
      </section>
    </Layout>
  );
}
