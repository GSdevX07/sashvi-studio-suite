import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Confetti } from "@/components/Confetti";
import { formatINR } from "@/lib/products";
import { calculateOrderTotals, COUPON_STORAGE_KEY, DELIVERY_THRESHOLD } from "@/lib/checkout";
import { apiJson, getAuthToken } from "@/lib/backend";
import type { CartItem } from "@/lib/cart-context";
import { getCartItemEffectivePrice, getCartItemListPrice } from "@/lib/cart-context";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

type CheckoutItem = {
  cartItem: CartItem;
  listPrice: number;
  effectivePrice: number;
};

const DEFAULT_RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID ?? "rzp_test_12345";
const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Sashvi Studio" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const [paymentMode, setPaymentMode] = useState<"prepaid" | "cod">("prepaid");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [items, setItems] = useState<CheckoutItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [razorpayKey, setRazorpayKey] = useState(DEFAULT_RAZORPAY_KEY);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(COUPON_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.code) {
          setAppliedCoupon(parsed);
          setCouponCode(parsed.code);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    apiJson<{ key: string }>("/payments/razorpay/key", {}, true)
      .then((d) => d.key && setRazorpayKey(d.key))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    // Fetch user details to auto-fill
    async function fetchUser() {
      const token = getAuthToken();
      if (!token) return;
      try {
        const data = await apiJson<{ user: { name: string; email: string; mobile?: string } }>(
          "/auth/me",
          {},
          true,
        );
        if (data?.user) {
          if (data.user.name) setName(data.user.name);
          if (data.user.email) setEmail(data.user.email);
          if (data.user.mobile && data.user.mobile !== "0000000000") setPhone(data.user.mobile);
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cart = JSON.parse(window.localStorage.getItem("cart") || "[]") as CartItem[];
      if (Array.isArray(cart) && cart.length > 0) {
        setItems(
          cart
            .filter((item) => item?.id && item?.price)
            .map((item) => ({
              cartItem: item,
              listPrice: getCartItemListPrice(item),
              effectivePrice: getCartItemEffectivePrice(item),
            })),
        );
      }
    } catch {
      setItems([]);
    }
  }, []);

  const listSubtotal = useMemo(
    () => items.reduce((sum, item) => {
      // For BOGO items, charge for 1 item even if qty is 2
      const qtyToCharge = item.cartItem.buyOneGetOne ? 1 : item.cartItem.qty;
      return sum + item.listPrice * qtyToCharge;
    }, 0),
    [items],
  );

  const effectiveSubtotal = useMemo(
    () => items.reduce((sum, item) => {
      // For BOGO items, charge for 1 item even if qty is 2
      const qtyToCharge = item.cartItem.buyOneGetOne ? 1 : item.cartItem.qty;
      return sum + item.effectivePrice * qtyToCharge;
    }, 0),
    [items],
  );

  const productDiscount = useMemo(
    () => listSubtotal - effectiveSubtotal,
    [listSubtotal, effectiveSubtotal],
  );

  const couponDiscount = appliedCoupon?.discount ?? 0;
  // If coupon is applied, use original price; otherwise use effective price (with product discount)
  const basePrice = couponDiscount > 0 ? listSubtotal : effectiveSubtotal;
  const { delivery, gatewayCharge, codCharge, total, advance, remainingAmount } = calculateOrderTotals(
    basePrice,
    paymentMode,
    couponDiscount,
  );
  const advancePayment = paymentMode === "cod" ? advance : total;
  const amountForFreeDelivery = Math.max(0, DELIVERY_THRESHOLD - basePrice);

  async function handleApplyCoupon() {
    setCouponError(null);
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const res = await apiJson<{ ok: boolean; discount: number; coupon: { code: string } }>(
        "/coupons/validate",
        {
          method: "POST",
          body: JSON.stringify({ code: couponCode.trim(), subtotal: listSubtotal }),
        },
        true,
      );
      const applied = { code: res.coupon.code, discount: res.discount };
      setAppliedCoupon(applied);
      window.localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(applied));
      // Trigger confetti animation on successful coupon application
      setShowConfetti(true);
    } catch (err: unknown) {
      setAppliedCoupon(null);
      window.localStorage.removeItem(COUPON_STORAGE_KEY);
      setCouponError((err as Error)?.message || "Invalid coupon code");
    } finally {
      setApplyingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError(null);
    window.localStorage.removeItem(COUPON_STORAGE_KEY);
  }

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

  async function handleDetectLocation() {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setDetectingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          );
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setError("Unable to detect address from location.");
          }
        } catch (err) {
          setError("Failed to fetch address details.");
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        setDetectingLocation(false);
        setError("Location permission denied or unavailable.");
      },
    );
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
        items: items.map((item) => ({
          product_id: item.cartItem.id,
          variant_id: item.cartItem.variant_id,
          name: item.cartItem.name,
          image: item.cartItem.image,
          category: "",
          color: item.cartItem.selected_color,
          qty: item.cartItem.qty,
          price: item.listPrice, // Send original price
          discountType: item.cartItem.discountType,
          discountValue: item.cartItem.discountValue,
          discount: item.listPrice - item.effectivePrice, // Send product discount amount for reference
        })),
        shipping: { name, email, phone, address },
        paymentMode,
        couponCode: appliedCoupon?.code,
      };

      const orderResponse = await apiJson<{ ok: boolean; order: { id: string; total: number } }>(
        "/orders",
        {
          method: "POST",
          body: JSON.stringify(orderBody),
        },
        true,
      );

      // For COD, pay 10% advance; for prepaid, pay full amount
      const amountType = paymentMode === "cod" ? "advance" : "full";

      const paymentResponse = await apiJson<{
        ok: boolean;
        razorOrder: { id: string; amount: number; currency: string };
      }>(
        "/payments/razorpay/create",
        {
          method: "POST",
          body: JSON.stringify({ orderId: orderResponse.order.id, amountType }),
        },
        true,
      );

      const scriptLoaded = await loadScript(CHECKOUT_SCRIPT_SRC);
      if (!scriptLoaded || typeof window.Razorpay === "undefined") {
        throw new Error("Unable to load payment checkout. Please try again later.");
      }

      const options = {
        key: razorpayKey,
        order_id: paymentResponse.razorOrder.id,
        amount: paymentResponse.razorOrder.amount,
        currency: paymentResponse.razorOrder.currency,
        name: "Sashvi Studio",
        description: "Order payment",
        prefill: { email, contact: phone },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await apiJson(
              "/payments/razorpay/verify",
              {
                method: "POST",
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: orderResponse.order.id,
                }),
              },
              true,
            );
            window.localStorage.removeItem("cart");
            window.localStorage.removeItem(COUPON_STORAGE_KEY);
            // Navigate to success page with order details
            navigate({
              to: "/payment-success",
              search: {
                orderId: orderResponse.order.id,
                status: paymentMode === "cod" ? "Partially Paid" : "Paid",
                total: orderResponse.order.total.toString(),
                paidAmount: paymentMode === "cod" ? advancePayment.toString() : orderResponse.order.total.toString(),
                isCod: paymentMode === "cod",
                discount: (productDiscount + couponDiscount).toString(),
              },
            });
          } catch (verifyError) {
            // Payment verification failed - restore stock
            try {
              await apiJson(
                "/payments/razorpay/verify",
                {
                  method: "POST",
                  body: JSON.stringify({
                    failed: true,
                    orderId: orderResponse.order.id,
                  }),
                },
                true,
              );
            } catch (err) {
              console.error("Failed to restore stock on verification failure:", err);
            }
            navigate({
              to: "/payment-failed",
              search: {
                orderId: orderResponse.order.id,
                status: "Failed",
                total: orderResponse.order.total.toString(),
                failureReason: "Payment Verification Failed",
                paidAmount: paymentMode === "cod" ? advancePayment.toString() : orderResponse.order.total.toString(),
              },
            });
          }
        },
        modal: {
          escape: true,
          ondismiss: async () => {
            // Restore stock when payment is cancelled
            try {
              await apiJson(
                "/payments/razorpay/verify",
                {
                  method: "POST",
                  body: JSON.stringify({
                    failed: true,
                    orderId: orderResponse.order.id,
                  }),
                },
                true,
              );
            } catch (err) {
              console.error("Failed to restore stock on cancellation:", err);
            }
            navigate({
              to: "/payment-failed",
              search: {
                orderId: orderResponse.order.id,
                status: "Failed",
                total: orderResponse.order.total.toString(),
                failureReason: "Payment Cancelled",
                paidAmount: paymentMode === "cod" ? advancePayment.toString() : orderResponse.order.total.toString(),
              },
            });
          },
        },
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
      <Confetti show={showConfetti} />
      <section className="container-luxe pt-16 pb-10">
        <div className="eyebrow mb-3">Checkout</div>
        <h1 className="font-display text-4xl md:text-5xl">Order Summary</h1>
      </section>

      <section className="container-luxe grid gap-10 lg:grid-cols-[1.7fr_1fr] pb-24">
        <div className="space-y-8">
          <div className="rounded-[1.5rem] border border-border bg-card p-6 sm:p-8 shadow-soft">
            <h2 className="mb-6 font-display text-2xl text-foreground">Delivery Details</h2>
            <div className="grid gap-4">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Full Name"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
              />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email Address"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
              />
                <p className="text-xs text-muted-foreground mt-1">You can edit your email before placing the order.</p>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone number"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
              />
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-foreground">Delivery Address</label>
                  <button
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    className="text-xs font-medium text-accent hover:underline disabled:opacity-50"
                  >
                    {detectingLocation ? "Detecting..." : "Detect My Location"}
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="Street address, city, state, pincode"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border bg-card p-6 sm:p-8 shadow-soft">
            <h2 className="mb-6 font-display text-2xl text-foreground">Payment</h2>
            <div className="grid gap-3">
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 sm:py-4">
                <input
                  type="radio"
                  checked={paymentMode === "prepaid"}
                  onChange={() => setPaymentMode("prepaid")}
                  className="h-4 w-4 accent-accent"
                />
                <span className="text-sm font-medium">Online Payment (Razorpay)</span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 sm:py-4">
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

        <aside className="w-full lg:px-0 lg:sticky lg:top-24 space-y-6">
          <div className="rounded-[1.5rem] border border-border bg-card p-1.5 sm:p-2 shadow-soft">
            <div className="eyebrow mb-3">Cart Summary</div>
            <div className="space-y-4">
              {items.length ? (
                items.map((item) => (
                  <div key={item.cartItem.id} className="flex items-center gap-4">
                    <img
                      src={item.cartItem.image}
                      alt={item.cartItem.name}
                      className="h-20 w-20 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground">{item.cartItem.name}</div>
                      <div className="text-xs text-muted-foreground">Qty {item.cartItem.qty}</div>
                    </div>
                    <div className="text-right">
                      {item.cartItem.discountApplied && item.effectivePrice < item.listPrice ? (
                        <>
                          <div className="text-xs text-muted-foreground line-through">
                            {formatINR(item.listPrice * item.cartItem.qty)}
                          </div>
                          <div className="text-sm font-medium">
                            {formatINR(item.effectivePrice * item.cartItem.qty)}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm font-medium">
                          {formatINR(item.listPrice * item.cartItem.qty)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-border bg-background p-6 text-sm text-muted-foreground">
                  Your cart is empty. Add items from the shop before checking out.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border bg-card p-1.5 sm:p-2 shadow-soft">
            <div className="eyebrow mb-3">Coupon Code</div>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                disabled={!!appliedCoupon}
                className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-accent disabled:opacity-60"
              />
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-secondary"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={applyingCoupon || !couponCode.trim()}
                  className="rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background hover:bg-accent disabled:opacity-50"
                >
                  {applyingCoupon ? "Applying..." : "Apply"}
                </button>
              )}
            </div>
            {couponError && <p className="mt-2 text-xs text-destructive">{couponError}</p>}
            {appliedCoupon && (
              <p className="mt-2 text-xs text-accent">
                Coupon {appliedCoupon.code} applied — save {formatINR(appliedCoupon.discount)}
              </p>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-border bg-card p-1.5 sm:p-2 shadow-soft">
            <div className="text-sm text-muted-foreground">Order calculation</div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatINR(listSubtotal)}</dd>
              </div>
              {productDiscount > 0 && (
                <div className="flex justify-between text-accent">
                  <dt>Product Discount</dt>
                  <dd>-{formatINR(productDiscount)}</dd>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-accent">
                  <dt>Coupon discount</dt>
                  <dd>-{formatINR(couponDiscount)}</dd>
                </div>
              )}
              {paymentMode === "cod" ? (
                <>
                  <div className="flex justify-between">
                    <dt>Delivery Charges</dt>
                    <dd>{delivery === 0 ? "FREE" : formatINR(delivery)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>COD Charges</dt>
                    <dd>{formatINR(codCharge)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Advance Payment (COD)</dt>
                    <dd>{formatINR(Math.ceil(effectiveSubtotal * 0.1))}</dd>
                  </div>
                  <div className="hairline my-3" />
                  <div className="flex justify-between text-base font-medium">
                    <dt>Pay Now</dt>
                    <dd className="text-accent">{formatINR(advancePayment)}</dd>
                  </div>
                  <div className="flex justify-between text-base font-medium">
                    <dt>Remaining Amount (COD)</dt>
                    <dd className="text-muted-foreground">{formatINR(remainingAmount)}</dd>
                  </div>
                  <div className="flex justify-between text-base font-medium">
                    <dt>Grand Total</dt>
                    <dd>{formatINR(total)}</dd>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <dt>Delivery Charges</dt>
                    <dd>{delivery === 0 ? "Free" : formatINR(delivery)}</dd>
                  </div>
                  <div className="hairline my-3" />
                  <div className="flex justify-between text-base font-medium">
                    <dt>Grand Total</dt>
                    <dd>{formatINR(total)}</dd>
                  </div>
                </>
              )}
            </dl>
            <div className="mt-4 text-xs text-muted-foreground">
              {effectiveSubtotal < DELIVERY_THRESHOLD
                ? `Add ${formatINR(amountForFreeDelivery)} more for free delivery.`
                : "Your order qualifies for free delivery."}
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-destructive/10 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 text-sm text-foreground">
              {message}
            </div>
          ) : null}

          <button
            onClick={handleCheckout}
            disabled={loading || !items.length}
            className="w-full rounded-full bg-foreground px-5 py-3 text-sm font-medium uppercase tracking-widest text-background hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading
              ? "Processing..."
              : paymentMode === "prepaid"
                ? "Proceed to Razorpay"
                : `Pay Advance ${formatINR(advancePayment)}`}
          </button>
          {paymentMode === "cod" ? (
            <p className="mt-3 text-xs text-muted-foreground">
              A 10% advance payment is required for Cash on Delivery. Remaining amount will be paid
              at delivery.
            </p>
          ) : null}
          <Link
            to="/cart"
            className="block text-center text-xs uppercase tracking-widest text-muted-foreground hover:text-accent"
          >
            Return to cart
          </Link>
        </aside>
      </section>
    </Layout>
  );
}
