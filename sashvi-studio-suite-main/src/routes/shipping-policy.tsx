import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/shipping-policy")({
  head: () => ({ meta: [{ title: "Shipping Policy — Sashvi Studio" }] }),
  component: ShippingPolicyPage,
});

function ShippingPolicyPage() {
  return (
    <Layout>
      <section className="container-luxe pt-16 pb-24">
        <div className="eyebrow mb-3">Shipping Policy</div>
        <h1 className="font-display text-4xl md:text-5xl">Shipping Policy</h1>
        <div className="prose prose-invert mt-8 max-w-none text-sm leading-relaxed text-muted-foreground">
          <p>
            At Sashvi Studio, every order is thoughtfully packed with care to ensure it reaches you
            safely and beautifully.
          </p>
          <h2>Order Processing</h2>
          <ul>
            <li>
              Orders are typically processed and dispatched within 1–3 business days after
              confirmation.
            </li>
            <li>
              Orders with stitched blouses or customized products may require additional processing
              time. The estimated dispatch timeline will be communicated wherever applicable.
            </li>
          </ul>
          <h2>Shipping Timeline</h2>
          <ul>
            <li>
              Delivery within India usually takes 3–7 business days after dispatch, depending on
              your location.
            </li>
            <li>
              Delivery timelines may vary during festivals, public holidays, adverse weather
              conditions, or due to unforeseen courier delays.
            </li>
          </ul>
          <h2>Shipping Charges</h2>
          <ul>
            <li>Free shipping on all prepaid orders above ₹1,000 across India.</li>
            <li>
              For orders below ₹1,000, applicable shipping charges will be calculated and displayed
              during checkout.
            </li>
          </ul>
          <h2>Cash on Delivery (COD)</h2>
          <p>We offer Cash on Delivery (COD) service for eligible locations.</p>
          <ul>
            <li>A 10% advance payment of the order value is required to confirm all COD orders.</li>
            <li>The remaining balance can be paid in cash at the time of delivery.</li>
            <li>
              Applicable shipping charges, along with a nominal COD handling fee, will be displayed
              during checkout wherever applicable.
            </li>
          </ul>
          <h2>Order Tracking</h2>
          <p>
            Once your order is dispatched, you will receive a tracking link via Email or WhatsApp to
            monitor your shipment.
          </p>
          <h2>Delivery &amp; Unboxing</h2>
          <p>
            Please ensure that your shipping address and contact details are accurate while placing
            the order.
          </p>
          <p>
            If your package appears tampered with or damaged upon delivery, we recommend recording
            an unboxing video before opening the parcel and contacting us within 24 hours of
            delivery. This helps us assist you promptly in case of any transit-related issues.
          </p>
          <h2>Contact Us</h2>
          <p>For any shipping-related queries or assistance, please reach out to us at:</p>
          <p>Email: sashvistudio26@gmail.com</p>
        </div>
      </section>
    </Layout>
  );
}
