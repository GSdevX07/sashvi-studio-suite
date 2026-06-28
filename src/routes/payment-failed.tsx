import { useNavigate, Link, createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { formatINR } from "@/lib/products";
import { useEffect } from "react";

export const Route = createFileRoute("/payment-failed")({
  // Expect query parameters: orderId, status, total, failureReason, paidAmount
  validateSearch: (search: Record<string, unknown>) => {
    const orderId = typeof search.orderId === "string" ? search.orderId : undefined;
    const status = typeof search.status === "string" ? search.status : undefined;
    const total = typeof search.total === "string" ? search.total : undefined;
    const failureReason = typeof search.failureReason === "string" ? search.failureReason : "Payment Cancelled";
    const paidAmount = typeof search.paidAmount === "string" ? search.paidAmount : undefined;
    return { orderId, status, total, failureReason, paidAmount };
  },
  component: PaymentFailedPage,
});

function PaymentFailedPage() {
  const { orderId, status, total, failureReason, paidAmount } = Route.useSearch();
  const navigate = useNavigate();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Luxury styling colors
  const gradientBg = "bg-gradient-to-br from-white via-[#FCFAF7] to-[#F8F5F1]";

  return (
    <Layout>
      <section className={`container-luxe min-h-screen flex flex-col items-center justify-center ${gradientBg} py-16 px-4 animate-in fade-in duration-500`}>
        {/* Logo */}
        <div className="mb-12 animate-in zoom-in duration-500 delay-100">
          <img src="/sashvi_logo.png" alt="Sashvi Studio" className="h-40 w-auto rounded-full" />
        </div>
        
        {/* Failed icon */}
        <div className="mb-8 animate-in scale-in duration-500 delay-200">
          <svg
            className="h-20 w-20 text-[#D9534F]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </div>

        <h1 className="font-serif text-5xl md:text-6xl text-[#4A2B24] mb-10 text-center animate-in slide-in-from-bottom duration-500 delay-300">
          Payment Failed
        </h1>

        <p className="text-center text-base text-[#6B6B6B] max-w-xl mb-12 space-y-2 animate-in slide-in-from-bottom duration-500 delay-400">
          <p>Unfortunately, your payment could not be completed.</p>
          <p>Don't worry — your order has not been confirmed yet.</p>
          <p>If any amount was deducted from your account, it will be automatically refunded by your bank within 5–7 business days (if applicable).</p>
          <p>Please try again using the same or a different payment method.</p>
        </p>

        <div className="bg-white rounded-[20px] p-8 w-full max-w-md mb-12 shadow-lg border border-[#ECE7E1] animate-in slide-in-from-bottom duration-500 delay-500">
          <dl className="space-y-4 text-sm text-[#6B6B6B]">
            <div className="flex justify-between items-center">
              <dt className="font-medium">Order ID</dt>
              <dd className="text-[#4A2B24] font-semibold">{orderId ?? "—"}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="font-medium">Payment Status</dt>
              <dd className="text-[#D9534F] font-semibold">Failed</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="font-medium">Total Amount</dt>
              <dd className="text-[#4A2B24] font-semibold">{total ? formatINR(Number(total)) : "—"}</dd>
            </div>
            {paidAmount && paidAmount !== total && (
              <>
                <div className="flex justify-between items-center">
                  <dt className="font-medium">Amount to Pay</dt>
                  <dd className="text-[#C79A42] font-semibold">{formatINR(Number(paidAmount))}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="font-medium">Remaining Amount</dt>
                  <dd className="text-[#C79A42] font-semibold">{formatINR(Number(total) - Number(paidAmount))}</dd>
                </div>
              </>
            )}
            <div className="flex justify-between items-center">
              <dt className="font-medium">Failure Reason</dt>
              <dd className="text-[#D9534F] font-semibold">{failureReason}</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in duration-500 delay-600">
          <Link
            to="/checkout"
            className="inline-block rounded-full bg-[#4A2B24] text-white px-8 py-3.5 text-sm font-medium hover:bg-[#3A1F1A] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-center"
          >
            Try Payment Again
          </Link>
          <Link
            to="/cart"
            className="inline-block rounded-full bg-white text-[#4A2B24] border-2 border-[#4A2B24] px-8 py-3.5 text-sm font-medium hover:bg-[#4A2B24] hover:text-white transition-all duration-300 text-center"
          >
            Back to Cart
          </Link>
        </div>

        <Link
          to="/"
          className="mt-6 text-sm text-[#6B6B6B] hover:text-[#4A2B24] transition-colors animate-in fade-in duration-500 delay-700"
        >
          Contact Support
        </Link>
      </section>
    </Layout>
  );
}
