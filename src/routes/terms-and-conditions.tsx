import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/terms-and-conditions")({
  head: () => ({ meta: [{ title: "Terms & Conditions — Sashvi Studio" }] }),
  component: TermsAndConditionsPage,
});

function TermsAndConditionsPage() {
  return (
    <Layout>
      <section className="container-luxe pt-16 pb-24">
        <div className="eyebrow mb-3">Terms &amp; Conditions</div>
        <h1 className="font-display text-4xl md:text-5xl">Terms &amp; Conditions</h1>
        <div className="prose prose-invert mt-8 max-w-none text-sm leading-relaxed text-muted-foreground">
          <p>
            Welcome to Sashvi Studio. By accessing our website and placing an order, you agree to
            the following Terms & Conditions.
          </p>
          <h2>Products</h2>
          <ul>
            <li>
              We strive to display product colours as accurately as possible. However, slight
              variations may occur due to photography, lighting conditions, or individual screen
              settings.
            </li>
            <li>
              As many of our sarees and jewellery pieces are handcrafted or artisan-made, minor
              irregularities in weave, print, embroidery, texture, or finish are natural
              characteristics and should not be considered defects.
            </li>
          </ul>
          <h2>Pricing</h2>
          <ul>
            <li>All prices are displayed in Indian Rupees (INR).</li>
            <li>Prices are inclusive of applicable taxes unless stated otherwise.</li>
            <li>Sashvi Studio reserves the right to revise prices without prior notice.</li>
          </ul>
          <h2>Orders</h2>
          <ul>
            <li>
              Orders are confirmed only after successful payment or fulfillment of the applicable
              advance payment requirement for Cash on Delivery (COD) orders.
            </li>
            <li>
              We reserve the right to cancel or refuse any order due to product unavailability,
              pricing errors, suspected fraudulent activity, or any unforeseen circumstances. In
              such cases, any amount paid will be refunded to the original payment method.
            </li>
          </ul>
          <h2>Payments</h2>
          <ul>
            <li>We accept secure online payments through trusted payment gateways.</li>
            <li>
              Cash on Delivery (COD) is available for eligible locations. A 10% advance payment is
              mandatory for all COD orders, with the remaining amount payable upon delivery.
              Applicable shipping charges and COD handling charges will be displayed during
              checkout.
            </li>
          </ul>
          <h2>Shipping</h2>
          <p>
            Shipping timelines, charges, and delivery terms are governed by our Shipping Policy,
            available on our website.
          </p>
          <h2>Exchange Policy</h2>
          <p>
            We currently do not offer returns or refunds. Exchanges are governed by our Exchange
            Policy.
          </p>
          <h2>Intellectual Property</h2>
          <p>
            All website content, including product photographs, designs, graphics, logos, text, and
            other creative materials, are the exclusive property of Sashvi Studio. Unauthorized
            copying, reproduction, distribution, or commercial use is strictly prohibited.
          </p>
          <h2>Limitation of Liability</h2>
          <p>
            Sashvi Studio shall not be liable for delays or non-performance caused by events beyond
            our reasonable control, including courier delays, natural disasters, strikes, government
            restrictions, or other unforeseen circumstances.
          </p>
          <h2>Changes to Terms</h2>
          <p>
            Sashvi Studio reserves the right to modify these Terms & Conditions at any time without
            prior notice. Continued use of the website constitutes acceptance of the updated terms.
          </p>
        </div>
      </section>
    </Layout>
  );
}
