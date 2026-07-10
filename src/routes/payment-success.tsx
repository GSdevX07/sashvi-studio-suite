import { useNavigate, Link, createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { formatINR } from "@/lib/products";
import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";

export const Route = createFileRoute("/payment-success")({
  // Expect query parameters: orderId, status, total, paidAmount, isCod, discount
  validateSearch: (search: Record<string, unknown>) => {
    const orderId = typeof search.orderId === "string" ? search.orderId : undefined;
    const status = typeof search.status === "string" ? search.status : undefined;
    const total = typeof search.total === "string" ? search.total : undefined;
    const paidAmount = typeof search.paidAmount === "string" ? search.paidAmount : undefined;
    const isCod = typeof search.isCod === "string" ? search.isCod === "true" : false;
    const discount = typeof search.discount === "string" ? search.discount : undefined;
    return { orderId, status, total, paidAmount, isCod, discount };
  },
  component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
  const { orderId, status, total, paidAmount, isCod, discount } = Route.useSearch();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  // Scroll to top on mount and redirect after 10 seconds
  useEffect(() => {
    window.scrollTo(0, 0);
    // Clear cart after successful payment
    clearCart();
    const redirectTimer = setTimeout(() => {
      navigate({ to: "/" });
    }, 10000);
    return () => clearTimeout(redirectTimer);
  }, [navigate, clearCart]);

  // Luxury styling colors
  const gradientBg = "bg-gradient-to-br from-white via-[#FCFAF7] to-[#F8F5F1]";

  return (
    <Layout>
      <section className={`container-luxe min-h-screen flex flex-col items-center justify-center ${gradientBg} py-16 px-4 animate-in fade-in duration-500`}>
        {/* Logo */}
        <div className="mb-12 animate-in zoom-in duration-500 delay-100">
          <img src="/sashvi_logo.png" alt="Sashvi Studio" className="h-40 w-auto rounded-full" />
        </div>
        {/* Success icon */}
        <div className="mb-8 animate-in scale-in duration-500 delay-200">
          <svg
            className="h-20 w-20 text-[#C79A42]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="font-serif text-5xl md:text-6xl text-[#4A2B24] mb-10 text-center animate-in slide-in-from-bottom duration-500 delay-300">
          Order Placed Successfully
        </h1>
        <p className="text-center text-base text-[#6B6B6B] max-w-xl mb-12 space-y-2 animate-in slide-in-from-bottom duration-500 delay-400">
          <p>Thank you for shopping with Sashvi Studio.</p>
          <p>Your order has been confirmed and will be processed shortly.</p>
          <p>You will receive order updates via Email and WhatsApp.</p>
        </p>
        <div className="bg-white rounded-[20px] p-8 w-full max-w-md mb-12 shadow-lg border border-[#ECE7E1] animate-in slide-in-from-bottom duration-500 delay-500">
          <dl className="space-y-4 text-sm text-[#6B6B6B]">
            <div className="flex justify-between items-center">
              <dt className="font-medium">Order ID</dt>
              <dd className="text-[#4A2B24] font-semibold">{orderId ?? "—"}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="font-medium">Payment Status</dt>
              <dd className="text-[#4A2B24] font-semibold">{status ?? "—"}</dd>
            </div>
            {discount && Number(discount) > 0 && (
              <div className="flex justify-between items-center text-[#C79A42]">
                <dt className="font-medium">Discount Applied</dt>
                <dd className="font-semibold">-{formatINR(Number(discount))}</dd>
              </div>
            )}
            <div className="flex justify-between items-center">
              <dt className="font-medium">Total Amount</dt>
              <dd className="text-[#4A2B24] font-semibold">{total ? formatINR(Number(total)) : "—"}</dd>
            </div>
            {isCod && paidAmount && paidAmount !== total && (
              <>
                <div className="flex justify-between items-center">
                  <dt className="font-medium">Advance Paid</dt>
                  <dd className="text-[#C79A42] font-semibold">{formatINR(Number(paidAmount))}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="font-medium">Remaining Amount</dt>
                  <dd className="text-[#C79A42] font-semibold">{formatINR(Number(total) - Number(paidAmount))}</dd>
                </div>
              </>
            )}
            <div className="flex justify-between items-center">
              <dt className="font-medium">Estimated Delivery</dt>
              <dd className="text-[#4A2B24] font-semibold">3–7 Business Days</dd>
            </div>
          </dl>
        </div>
        <Link
          to="/"
          className="inline-block rounded-full bg-[#4A2B24] text-white px-8 py-3.5 text-sm font-medium hover:bg-[#3A1F1A] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-in fade-in duration-500 delay-600"
        >
          Go to Home
        </Link>
      </section>
    </Layout>
  );
}
