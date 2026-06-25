import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/exchange-policy")({
  head: () => ({ meta: [{ title: "Exchange Policy — Sashvi Studio" }] }),
  component: ExchangePolicyPage,
});

function ExchangePolicyPage() {
  return (
    <Layout>
      <section className="container-luxe pt-16 pb-24">
        <div className="eyebrow mb-3">Exchange Policy</div>
        <h1 className="font-display text-4xl md:text-5xl">Exchange Policy</h1>
        <div className="prose prose-invert mt-8 max-w-none text-sm leading-relaxed text-muted-foreground">
          <p>At Sashvi Studio, we take utmost care in ensuring that every order reaches you in perfect condition.</p>
          <h2>No Returns</h2>
          <p>We do not accept returns or offer refunds on any products once they have been delivered.</p>
          <h2>Exchange Eligibility</h2>
          <ul>
            <li>We offer exchange only in cases where the product received is damaged during transit or a wrong product has been delivered.</li>
            <li>Exchange requests must be raised within 7 days from the date of delivery.</li>
            <li>The product must be unused, unworn, unwashed, and returned with its original tags, packaging, and accessories.</li>
          </ul>
          <h2>Important</h2>
          <p>A clear, continuous, and uncut unboxing video recorded from the moment the sealed package is opened is MANDATORY for any damage or exchange claim.</p>
          <p>Claims submitted without a complete uncut unboxing video will not be eligible for exchange.</p>
          <h2>Exchange Approval</h2>
          <p>Once the claim is verified by our team, we will arrange an exchange for the same product or an equivalent product, subject to stock availability.</p>
          <h2>Non-Exchangeable Items</h2>
          <ul>
            <li>Minor colour variations due to photography or screen settings.</li>
            <li>Handloom or handcrafted irregularities that are inherent to artisanal products.</li>
            <li>Incorrect size selection by the customer (unless there is a manufacturing defect).</li>
            <li>Damage caused after delivery due to improper handling or usage.</li>
          </ul>
          <h2>Contact Us</h2>
          <p>For exchange requests or assistance, please contact us at:</p>
          <p>Email: sashvistudio26@gmail.com</p>
        </div>
      </section>
    </Layout>
  );
}
