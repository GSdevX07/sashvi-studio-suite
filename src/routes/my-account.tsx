import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
// realtime subscription is imported dynamically in useEffect (client-only)
import OrderStatusTimeline from '@/components/OrderStatusTimeline';
import { Layout } from "@/components/Layout";
import { useState, useEffect, useRef } from "react";
import { apiJson, setAuthTokens, clearAuthTokens, getAuthToken } from "@/lib/backend";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { toast } from "sonner";
import {
  User,
  LogOut,
  Package,
  Star,
  Heart,
  MapPin,
  ChevronRight,
  Download,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { formatINR, PRODUCTS } from "@/lib/products";
import { useCart } from "@/lib/cart-context";

type Search = { redirect?: string; tab?: "dashboard" | "orders" | "saved" };

// Helper functions for order action button visibility
function canCancelOrder(status: string): boolean {
  const cancellableStatuses = ['pending', 'confirmed', 'processing'];
  return cancellableStatuses.includes(status);
}

function canRequestReplacement(status: string, deliveredAt: string): boolean {
  if (status !== 'delivered') return false;
  const deliveryDate = new Date(deliveredAt);
  const daysSinceDelivery = (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceDelivery <= 7;
}

// Invoice download function
function downloadInvoice(order: any) {
  const subtotal = order.total_amount - order.delivery_charge - order.gateway_charge + (order.coupon_discount || 0);
  const itemsHtml = (order.order_items || []).map((item: any) => `
    <div class="row">
      <span class="label">${item.product_name || 'Product'} x${item.quantity}</span>
      <span class="val">₹${(item.price * item.quantity).toLocaleString("en-IN")}</span>
    </div>
  `).join('');

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Invoice ${order.order_id}</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Georgia,serif;color:#222;background:#fff}.page{max-width:640px;margin:48px auto;padding:0 24px 48px}.brand{text-align:center;border-bottom:2px solid #c8a97a;padding-bottom:24px;margin-bottom:24px}.brand h1{font-size:28px;letter-spacing:4px;text-transform:uppercase;color:#2a1a08}.brand p{font-size:12px;letter-spacing:2px;color:#8a6a40;margin-top:4px}.inv{text-align:center;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#8a6a40;margin-bottom:24px}.row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e8ddd0;font-size:14px}.label{color:#666}.val{font-weight:600}.total{display:flex;justify-content:space-between;padding:14px 0;font-size:16px;font-weight:700;border-top:2px solid #c8a97a;margin-top:8px}.footer{text-align:center;margin-top:40px;font-size:11px;color:#999;letter-spacing:1px}</style>
</head><body><div class="page">
<div class="brand"><h1>Sashvi Studio</h1><p>Sarees &amp; Jewellery</p></div>
<div class="inv">Invoice</div>
<div class="row"><span class="label">Order ID</span><span class="val">${order.order_id}</span></div>
<div class="row"><span class="label">Date</span><span class="val">${new Date(order.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</span></div>
<div class="row"><span class="label">Customer</span><span class="val">${order.customer_name}</span></div>
<div class="row"><span class="label">Email</span><span class="val">${order.email}</span></div>
<div class="row"><span class="label">Mobile</span><span class="val">${order.mobile}</span></div>
<div class="row"><span class="label">Delivery Address</span><span class="val">${order.address}, ${order.city}, ${order.state} - ${order.pincode}</span></div>
<div style="border-bottom:1px solid #c8a97a;margin:16px 0"></div>
${itemsHtml}
<div class="row"><span class="label">Subtotal</span><span class="val">₹${subtotal.toLocaleString("en-IN")}</span></div>
${order.coupon_discount > 0 ? `<div class="row"><span class="label">Coupon (${order.coupon_code})</span><span class="val">-₹${order.coupon_discount.toLocaleString("en-IN")}</span></div>` : ''}
<div class="row"><span class="label">Delivery Charges</span><span class="val">₹${order.delivery_charge.toLocaleString("en-IN")}</span></div>
<div class="row"><span class="label">Gateway Fee</span><span class="val">₹${order.gateway_charge.toLocaleString("en-IN")}</span></div>
<div class="total"><span>Total</span><span>₹${order.total_amount.toLocaleString("en-IN")}</span></div>
<div class="row"><span class="label">Payment</span><span class="val">${order.payment_status?.replace("_", " ")}</span></div>
<div class="row"><span class="label">Status</span><span class="val">${order.order_status?.replace("_", " ")}</span></div>
<div class="footer">Thank you for shopping with Sashvi Studio · support@sashvistudio.com</div>
</div></body></html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoice-${order.order_id.replace(/#/g, "")}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function OrderActionModals({
  requestModal,
  setRequestModal,
  cancelReason,
  setCancelReason,
  isCancelling,
  handleCancelOrder,
  replacementReason,
  setReplacementReason,
  replacementDescription,
  setReplacementDescription,
  isSubmittingReplacement,
  handleReplacementRequest,
}: {
  requestModal: { open: boolean; type: string; orderId: string | null };
  setRequestModal: (v: { open: boolean; type: "cancellation" | "replacement" | "return"; orderId: string | null }) => void;
  cancelReason: string;
  setCancelReason: (v: string) => void;
  isCancelling: boolean;
  handleCancelOrder: () => void;
  replacementReason: string;
  setReplacementReason: (v: string) => void;
  replacementDescription: string;
  setReplacementDescription: (v: string) => void;
  isSubmittingReplacement: boolean;
  handleReplacementRequest: () => void;
}) {
  return (
    <>
      {requestModal.open && requestModal.type === "cancellation" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-display text-xl mb-4">Cancel Order</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Cancellation Reason</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-accent min-h-[100px]"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setRequestModal({ open: false, type: "cancellation", orderId: null });
                  setCancelReason("");
                }}
                disabled={isCancelling}
                className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
              >
                No, Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isCancelling || !cancelReason.trim()}
                className="rounded-full bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {requestModal.open && requestModal.type === "replacement" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <h3 className="font-display text-xl mb-4">Request Replacement</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please provide details for your replacement request.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Replacement Reason</label>
              <textarea
                value={replacementReason}
                onChange={(e) => setReplacementReason(e.target.value)}
                placeholder="Please provide a reason for replacement..."
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-accent min-h-[80px]"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <textarea
                value={replacementDescription}
                onChange={(e) => setReplacementDescription(e.target.value)}
                placeholder="Additional details about the replacement..."
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-accent min-h-[60px]"
              />
            </div>
            <div className="mb-4 p-3 rounded-xl bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Note:</span> Please keep a video ready as proof for submission. After clicking submit, you'll be redirected to WhatsApp to send the video.
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setRequestModal({ open: false, type: "replacement", orderId: null });
                  setReplacementReason("");
                  setReplacementDescription("");
                }}
                disabled={isSubmittingReplacement}
                className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReplacementRequest}
                disabled={isSubmittingReplacement || !replacementReason.trim()}
                className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-accent disabled:opacity-50"
              >
                {isSubmittingReplacement ? "Submitting..." : "Submit Replacement Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const Route = createFileRoute("/my-account")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    tab: (s.tab === "dashboard" || s.tab === "orders" || s.tab === "saved") ? s.tab : undefined,
  }),
  head: () => ({ meta: [{ title: "My Account — Sashvi Studio" }] }),
  component: MyAccountPage,
});

function MyAccountPage() {
  const { isLoggedIn, login, logout } = useAuth();
  const { redirect, tab } = Route.useSearch();
  const navigate = useNavigate();
  const { ordersVersion } = useRealtime();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  // User profile state
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "saved">(
    tab || "dashboard",
  );
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  // Track realtime unsubscribe function across renders
  const realtimeUnsubRef = useRef<(() => void) | null>(null);

  // Subscribe to realtime order status updates (client‑only, runs only in browser)
  // Temporarily disabled due to import protection issues with TanStack Start
  // TODO: Re-enable after moving to proper client-only component pattern

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const res = await apiJson<any>(`/orders/${orderId}`, {}, true);
      console.log('Order details fetched:', res);
      console.log('Order items:', res.order_items);
      setSelectedOrder(res);
    } catch (err) {
      console.error("Failed to fetch order details:", err);
    }
  };

// (moved above) userProfile state declared earlier
  const { savedItems, moveToCart, removeSavedItem } = useCart();
  const [requestModal, setRequestModal] = useState<{ open: boolean; type: "cancellation" | "replacement" | "return"; orderId: string | null }>({ open: false, type: "cancellation", orderId: null });
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [replacementReason, setReplacementReason] = useState("");
  const [replacementDescription, setReplacementDescription] = useState("");
  const [isSubmittingReplacement, setIsSubmittingReplacement] = useState(false);

  const handleCancelOrder = async () => {
    if (!requestModal.orderId) return;
    setIsCancelling(true);
    try {
      await apiJson(`/orders/${requestModal.orderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason }),
      }, true);
      toast.success('Order cancelled successfully');
      setRequestModal({ open: false, type: 'cancellation', orderId: null });
      setCancelReason('');
      // Refresh order details
      if (selectedOrder) {
        await fetchOrderDetails(selectedOrder.id);
      }
      // Refresh orders list
      apiJson<any[]>('/orders', {}, true)
        .then((res) => setOrders(res))
        .catch((err) => console.error('Failed to refresh orders:', err));
    } catch (err) {
      console.error('Failed to cancel order:', err);
      toast.error('Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReplacementRequest = async () => {
    if (!requestModal.orderId) return;
    setIsSubmittingReplacement(true);
    try {
      await apiJson(`/orders/${requestModal.orderId}/replacement`, {
        method: 'POST',
        body: JSON.stringify({ reason: replacementReason, description: replacementDescription }),
      }, true);
      toast.success('Replacement request submitted successfully');
      setRequestModal({ open: false, type: 'replacement', orderId: null });
      setReplacementReason('');
      setReplacementDescription('');
      // Refresh order details
      if (selectedOrder) {
        await fetchOrderDetails(selectedOrder.id);
      }
      // Refresh orders list
      apiJson<any[]>('/orders', {}, true)
        .then((res) => setOrders(res))
        .catch((err) => console.error('Failed to refresh orders:', err));
      // Redirect to WhatsApp with reason and description
      const whatsappNumber = '917483821247';
      const message = `Order ID: ${selectedOrder?.order_id}\nReplacement Reason: ${replacementReason}${replacementDescription ? `\nDescription: ${replacementDescription}` : ''}\n\nPlease attach video proof for this replacement request.`;
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.error('Failed to submit replacement request:', err);
      toast.error('Failed to submit replacement request');
    } finally {
      setIsSubmittingReplacement(false);
    }
  };

  // Helper to fetch and set user profile
  const fetchUserProfile = async () => {
    try {
      const res = await apiJson<{ user: any }>("/auth/me", {}, true);
      console.log('Fetch profile response:', res);
      if (res?.user) {
        console.log('Setting userProfile to:', res.user);
        setUserProfile(res.user);
        setName(res.user.name ?? "");
        setEmail(res.user.email ?? "");
        setPhone(res.user.mobile ?? "");
        console.log('Profile state updated - name:', res.user.name, 'email:', res.user.email, 'mobile:', res.user.mobile);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      if ((err as any)?.message?.includes('unauthorized')) {
        clearAuthTokens();
        logout();
        navigate({ to: "/my-account" });
      }
    }
  };

  // Single consolidated effect: fetch profile + orders when logged in
  useEffect(() => {
    if (!isLoggedIn) return;

    fetchUserProfile();

    apiJson<any[]>("/orders", {}, true)
      .then((res) => setOrders(res))
      .catch((err) => {
        console.error('Failed to fetch orders:', err);
        if (err?.message?.includes('unauthorized')) {
          clearAuthTokens();
          logout();
          navigate({ to: "/my-account" });
        }
      });
  }, [isLoggedIn, ordersVersion]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function init() {
      if (typeof window === "undefined") return;
      if (!isLoggedIn || !userProfile?.id) return;

      const { subscribeOrderStatus } = await import("@/lib/realtime");

      unsubscribe = subscribeOrderStatus(userProfile.id, (payload) => {
        setOrders((prev) =>
          prev.map((o) =>
            o.order_id === payload.order_id ? { ...o, order_status: payload.new_status } : o,
          ),
        );
        if (selectedOrder?.order_id === payload.order_id) {
          fetchOrderDetails(selectedOrder.id);
        }
      });
      realtimeUnsubRef.current = unsubscribe;
    }

    init();

    return () => {
      if (unsubscribe) unsubscribe();
      realtimeUnsubRef.current = null;
    };
  }, [isLoggedIn, userProfile?.id, selectedOrder?.id, selectedOrder?.order_id]);

  const modalProps = {
    requestModal,
    setRequestModal,
    cancelReason,
    setCancelReason,
    isCancelling,
    handleCancelOrder,
    replacementReason,
    setReplacementReason,
    replacementDescription,
    setReplacementDescription,
    isSubmittingReplacement,
    handleReplacementRequest,
  };

  if (isLoggedIn) {
    if (selectedOrder) {
      return (
        <>
        <Layout>
          <section className="container-luxe pt-12 pb-24">
            <button
              onClick={() => setSelectedOrder(null)}
              className="mb-6 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              &larr; Back to Orders
            </button>

            <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
              <div>
                <h1 className="font-display text-3xl mb-2">Order {selectedOrder.order_id}</h1>
                <p className="text-sm text-muted-foreground mb-2">
                  Placed on {new Date(selectedOrder.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </p>
                <p className="text-sm text-muted-foreground mb-8">
                  {selectedOrder.city || 'N/A'}, {selectedOrder.state || 'N/A'} - {selectedOrder.pincode || 'N/A'}
                </p>

                <div className="rounded-[1.5rem] border border-border bg-card p-6 mb-8">
                  <h2 className="font-display text-xl mb-4">Order Items</h2>
                  <div className="space-y-4">
                    {(selectedOrder.order_items?.length
                      ? selectedOrder.order_items
                      : [{ product_name: "Order item", quantity: 1, price: selectedOrder.total_amount }]).map(
                      (item: any, idx: number) => {
                      const product = PRODUCTS.find((p) => p.id === item.product_id);
                      const name = item.product_name || product?.name || `Item ${idx + 1}`;
                      const image = item.product_image || product?.image;
                      const color = item.selected_color || item.color;
                      const size = item.selected_size || item.size;
                      return (
                        <div key={idx} className="flex gap-4 items-center border-b border-border/50 pb-4 last:border-0 last:pb-0">
                          {image ? (
                            <img
                              src={image}
                              alt={name}
                              className="h-16 w-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-secondary flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{name}</div>
                            {item.category && (
                              <div className="text-xs text-muted-foreground capitalize">{item.category}</div>
                            )}
                            {color && (
                              <div className="text-xs text-muted-foreground">Color: {color}</div>
                            )}
                            {size && (
                              <div className="text-xs text-muted-foreground">Size: {size}</div>
                            )}
                            {item.variant && !color && !size && (
                              <div className="text-xs text-muted-foreground">Variant: {item.variant}</div>
                            )}
                            {item.sku && (
                              <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                            )}
                            <div className="text-sm text-muted-foreground mt-1">
                              Qty: {item.quantity} · Unit: {formatINR(item.price)}
                            </div>
                          </div>
                          <div className="font-medium">{formatINR(item.price * item.quantity)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-border bg-card p-6">
                  <h2 className="font-display text-xl mb-6">Order Tracking</h2>
                  <OrderStatusTimeline order={selectedOrder} />
                </div>

                <div className="rounded-[1.5rem] border border-border bg-card p-6">
                  <h2 className="font-display text-xl mb-4">Order Actions</h2>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => downloadInvoice(selectedOrder)}
                      className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent transition flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      Download Invoice
                    </button>
                    {canCancelOrder(selectedOrder.order_status) && (
                      <button
                        onClick={() => setRequestModal({ open: true, type: 'cancellation', orderId: selectedOrder.id })}
                        className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-destructive hover:text-destructive transition"
                      >
                        Cancel Order
                      </button>
                    )}
                    {canRequestReplacement(selectedOrder.order_status, selectedOrder.updated_at || selectedOrder.created_at) && (
                      <button
                        onClick={() => setRequestModal({ open: true, type: 'replacement', orderId: selectedOrder.id })}
                        className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent transition"
                      >
                        Request Replacement
                      </button>
                    )}
                    {(selectedOrder.order_status === 'shipped' || selectedOrder.order_status === 'out_for_delivery') && (
                      <button
                        className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent transition"
                      >
                        Track Shipment
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[1.5rem] border border-border bg-card p-6">
                  <h2 className="font-display text-xl mb-4">Payment Summary</h2>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt>Payment Type</dt>
                      <dd className="font-medium">{selectedOrder.payment_type || 'Online'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Payment Status</dt>
                      <dd className="font-medium">{selectedOrder.payment_status}</dd>
                    </div>
                    {(selectedOrder.advance_paid ?? 0) > 0 && (
                      <>
                        <div className="flex justify-between">
                          <dt>Advance Paid</dt>
                          <dd className="font-medium">{formatINR(selectedOrder.advance_paid ?? 0)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Total Paid Online</dt>
                          <dd className="font-medium">{formatINR(selectedOrder.total_paid_online ?? 0)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Remaining Amount</dt>
                          <dd className="font-medium text-amber-700">{formatINR(selectedOrder.remaining_amount ?? 0)}</dd>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <dt>Subtotal</dt>
                      <dd>
                        {formatINR(
                          selectedOrder.total_amount -
                            selectedOrder.delivery_charge -
                            selectedOrder.gateway_charge +
                            Number(selectedOrder.coupon_discount ?? 0),
                        )}
                      </dd>
                    </div>
                    {Number(selectedOrder.coupon_discount ?? 0) > 0 && (
                      <div className="flex justify-between text-accent">
                        <dt>Coupon ({selectedOrder.coupon_code})</dt>
                        <dd>-{formatINR(Number(selectedOrder.coupon_discount))}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt>Delivery</dt>
                      <dd>{formatINR(selectedOrder.delivery_charge)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Gateway Fee</dt>
                      <dd>{formatINR(selectedOrder.gateway_charge)}</dd>
                    </div>
                    <div className="hairline my-2" />
                    <div className="flex justify-between font-medium text-base">
                      <dt>Total Amount</dt>
                      <dd>{formatINR(selectedOrder.total_amount)}</dd>
                    </div>
                  </dl>

                  {selectedOrder.payment_status === "advance_paid" && (
                    <div className="mt-4 p-3 rounded-xl bg-secondary text-sm">
                      <div className="flex justify-between font-medium text-accent">
                        <dt>Advance Paid</dt>
                        <dd>{formatINR(Math.ceil(selectedOrder.total_amount * 0.1))}</dd>
                      </div>
                      <div className="flex justify-between font-medium mt-1">
                        <dt>To pay at delivery</dt>
                        <dd>
                          {formatINR(
                            selectedOrder.total_amount -
                              Math.ceil(selectedOrder.total_amount * 0.1),
                          )}
                        </dd>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-wider text-foreground">
                      {selectedOrder.payment_status?.replace("_", " ")}
                    </span>
                    <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-wider text-foreground">
                      {selectedOrder.payment_status === "advance_paid"
                        ? "Cash on Delivery"
                        : "Prepaid"}
                    </span>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-border bg-card p-6">
                  <h2 className="font-display text-xl mb-4">Shipping Details</h2>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Customer Name</dt>
                      <dd className="font-medium">{selectedOrder.customer_name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Mobile Number</dt>
                      <dd className="font-medium">{selectedOrder.mobile}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Email</dt>
                      <dd className="font-medium">{selectedOrder.email}</dd>
                    </div>
                    <div className="flex justify-between items-start">
                      <dt className="text-muted-foreground">Address</dt>
                      <dd className="font-medium text-right max-w-[60%]">{selectedOrder.address}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">City</dt>
                      <dd className="font-medium">{selectedOrder.city}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">State</dt>
                      <dd className="font-medium">{selectedOrder.state}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Pincode</dt>
                      <dd className="font-medium">{selectedOrder.pincode || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Country</dt>
                      <dd className="font-medium">India</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </section>
        </Layout>
        <OrderActionModals {...modalProps} />
        </>
      );
    }

    return (
      <>
      <Layout>
        <section className="container-luxe pt-12 pb-24">
          <div className="mb-10 flex flex-col md:flex-row gap-6 items-center justify-between p-6 rounded-[1.5rem] bg-secondary border border-border">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background border border-border">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h1 className="font-display text-2xl">{userProfile?.name || "Welcome!"}</h1>
                <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="rounded-full bg-background border border-border px-5 py-2.5 text-sm font-medium hover:text-accent transition"
              >
                Go to Home
              </Link>
              <button
                onClick={() => {
                  logout();
                  navigate({ to: "/" });
                }}
                className="flex items-center justify-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground bg-background hover:text-destructive transition"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-10">
            <aside className="md:w-64 shrink-0 space-y-2">
              {[
                { id: "dashboard", label: "Dashboard", icon: User },
                { id: "orders", label: "My Orders", icon: Package },
                { id: "saved", label: "Saved for Later", icon: Heart },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-accent text-accent-foreground" : "hover:bg-secondary text-muted-foreground hover:text-foreground"}`}
                >
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </button>
              ))}
            </aside>

            <main className="flex-1 min-w-0">
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  {/* Profile Section */}
                  <div className="rounded-[1.5rem] border border-border bg-card p-6">
                    <h2 className="font-display text-2xl mb-4">Profile</h2>
                    <div className="flex items-center gap-4 mb-4">
                      {userProfile?.profile_picture ? (
                        <img
                          src={userProfile.profile_picture}
                          alt="Profile"
                          className="h-20 w-20 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="grid gap-4">
                      {isEditingProfile ? (
                        <>
                          <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full Name"
                            className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-accent"
                          />
                          <input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Phone"
                            className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-accent"
                            readOnly
                            disabled
                            style={{ backgroundColor: 'var(--secondary)', opacity: 0.5, cursor: 'not-allowed' }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                // Reset any previous messages or errors
                                setMessage(null);
                                setError(null);
                                const toastId = toast.loading('Saving profile...');
                                try {
                                  console.log('Saving profile', { name, email, phone });
                                  const res = await apiJson<{ user?: { name?: string; email?: string; mobile?: string } }>('/auth/me', {
                                    method: 'PUT',
                                    body: JSON.stringify({ name, email, mobile: phone }),
                                  }, true);
                                  console.log('Save response:', res);
                                  console.log('Response user:', res?.user);
                                  // Update UI state from response
                                  if (res?.user) {
                                    console.log('Updating state with:', res.user);
                                    setUserProfile(res.user);
                                    setName(res.user.name ?? '');
                                    setEmail(res.user.email ?? '');
                                    setPhone(res.user.mobile ?? '');
                                    console.log('State updated - name:', res.user.name, 'email:', res.user.email, 'mobile:', res.user.mobile);
                                    // Refetch profile to ensure sync
                                    await fetchUserProfile();
                                    // Switch back to view mode after successful save
                                    setIsEditingProfile(false);
                                  }
                                  toast.success('Profile saved successfully', { id: toastId });
                                } catch (e) {
                                  console.error('Save profile error:', e);
                                  toast.error(`Failed to save profile: ${(e as any).message || e}`, { id: toastId });
                                }
                              }}
                              className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-accent"
                            >
                              Save Profile
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingProfile(false);
                                // Reset form to current profile values
                                setName(userProfile?.name ?? '');
                                setEmail(userProfile?.email ?? '');
                                setPhone(userProfile?.mobile ?? '');
                              }}
                              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-border">
                              <span className="text-sm text-muted-foreground">Name</span>
                              <span className="text-sm font-medium">{userProfile?.name || 'Not set'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border">
                              <span className="text-sm text-muted-foreground">Email</span>
                              <span className="text-sm font-medium">{userProfile?.email || 'Not set'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border">
                              <span className="text-sm text-muted-foreground">Phone</span>
                              <span className="text-sm font-medium">{userProfile?.mobile || 'Not set'}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setIsEditingProfile(true)}
                            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-accent"
                          >
                            Edit Profile
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <h2 className="font-display text-2xl">Overview</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      onClick={() => setActiveTab("orders")}
                      className="cursor-pointer rounded-2xl border border-border bg-card p-6 hover:border-accent transition"
                    >
                      <Package className="h-6 w-6 mb-3 text-accent" />
                      <div className="text-2xl font-display">{orders.length}</div>
                      <div className="text-sm text-muted-foreground">Total Orders</div>
                    </div>
                    <div
                      onClick={() => setActiveTab("saved")}
                      className="cursor-pointer rounded-2xl border border-border bg-card p-6 hover:border-accent transition"
                    >
                      <Heart className="h-6 w-6 mb-3 text-accent" />
                      <div className="text-2xl font-display">{savedItems.length}</div>
                      <div className="text-sm text-muted-foreground">Saved Items</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "orders" && (
                <div className="space-y-6">
                  <h2 className="font-display text-2xl">My Orders</h2>
                  {orders.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl border border-border bg-card">
                      <Package className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">You haven't placed any orders yet.</p>
                      <Link
                        to="/sarees"
                        className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.filter((o) => o.payment_status !== "failed" && o.payment_status !== "pending").map((order) => {
                        const firstItem = order.order_items?.[0];
                        const product = firstItem
                          ? PRODUCTS.find((p) => p.id === firstItem.product_id)
                          : null;

                        return (
                          <div
                            key={order.id}
                            className="rounded-[1.5rem] border border-border bg-card p-5 flex flex-col sm:flex-row gap-5 items-center justify-between"
                          >
                            <div className="flex gap-4 items-center flex-1 w-full">
                              <div className="h-16 w-16 shrink-0 rounded-xl bg-secondary overflow-hidden flex items-center justify-center">
                                {product?.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-muted-foreground mb-0.5">
                                  Order {order.order_id}
                                </div>
                                <div className="font-medium truncate">
                                  {product?.name || "Multiple items"}{" "}
                                  {order.order_items?.length > 1 &&
                                    `+ ${order.order_items.length - 1} more`}
                                </div>
                                <div className="text-sm text-muted-foreground mt-0.5">
                                  {new Date(order.created_at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                              <div className="text-right">
                                <div className="font-medium">{formatINR(order.total_amount)}</div>
                                <div className="text-xs uppercase tracking-wider text-accent font-medium mt-0.5">
                                  {order.order_status}
                                </div>
                              </div>
                              <button
                                onClick={() => fetchOrderDetails(order.id)}
                                className="h-10 w-10 rounded-full flex items-center justify-center border border-border hover:bg-accent hover:text-accent-foreground hover:border-accent transition shrink-0"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "saved" && (
                <div className="space-y-6">
                  <h2 className="font-display text-2xl">Saved for Later</h2>
                  {savedItems.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl border border-border bg-card">
                      <Heart className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-muted-foreground">You don't have any saved items.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {savedItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-4 rounded-2xl border border-border bg-card p-4"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-20 w-20 rounded-xl object-cover"
                          />
                          <div className="flex flex-col justify-center min-w-0">
                            <div className="font-medium text-foreground truncate">{item.name}</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {formatINR(item.price)}
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button
                                onClick={() => moveToCart(item.id)}
                                className="rounded-full bg-foreground px-4 py-2 text-xs font-medium uppercase tracking-wider text-background hover:bg-accent transition-colors"
                              >
                                Move to Cart
                              </button>
                              <button
                                onClick={() => removeSavedItem(item.id)}
                                className="rounded-full border border-border px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </section>
      </Layout>
      <OrderActionModals {...modalProps} />
      </>
    );
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await apiJson("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password, mobile: phone }),
        });
        setMessage("Account created successfully! You can now sign in.");
        setIsSignUp(false);
      } else {
        const data = await apiJson<{ access: string; refresh: string }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setAuthTokens(data.access, data.refresh);
        login();
        if (redirect) {
          navigate({ to: redirect as "/cart" | "/wishlist" });
        } else {
          setMessage("Signed in successfully!");
        }
      }
    } catch (err: any) {
      const msg = err?.message || "Unable to sign in. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="container-luxe pt-12 pb-24">
        <div className="max-w-md mx-auto">
          <div className="eyebrow mb-3 text-center">My Account</div>
          <h1 className="font-display text-3xl md:text-4xl text-center mb-8">
            {isSignUp ? "Create Account" : "Sign In"}
          </h1>

          {redirect && (
            <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-center text-foreground">
              Please sign in to continue to your {redirect.replace("/", "")}.
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={isSignUp}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-card"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required={isSignUp}
                    readOnly={!isSignUp}
                    disabled={!isSignUp}
                    className={!isSignUp ? "w-full px-4 py-2 border border-border rounded-lg bg-secondary/50 text-muted-foreground cursor-not-allowed" : "w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-card"}
                    placeholder="10-digit mobile number"
                  />
                  {!isSignUp && <p className="text-xs text-muted-foreground mt-1">Phone number cannot be changed</p>}
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-card"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-card"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-foreground">{message}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background py-2.5 font-semibold rounded-lg hover:bg-accent transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
              className="text-accent font-semibold hover:underline"
            >
              {isSignUp ? "Sign In" : "Create one"}
            </button>
          </p>
        </div>
      </section>
    </Layout>
  );
}
