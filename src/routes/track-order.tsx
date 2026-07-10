import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/track-order")({
  head: () => ({ meta: [{ title: "Track Order — Sashvi Studio" }] }),
  component: TrackOrderPage,
});

function TrackOrderPage() {
  return (
    <Layout>
      <section className="container-luxe pt-16 pb-24">
        <div className="eyebrow mb-3">Track Your Order</div>
        <h1 className="font-display text-4xl md:text-5xl">Track Order Status</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Enter your order details or use the link shared via Email/WhatsApp once your order is
          dispatched.
        </p>
      </section>
    </Layout>
  );
}
