import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({ meta: [{ title: "Privacy Policy — Sashvi Studio" }] }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  return (
    <Layout>
      <section className="container-luxe pt-16 pb-24">
        <div className="eyebrow mb-3">Privacy Policy</div>
        <h1 className="font-display text-4xl md:text-5xl">Privacy Policy</h1>
        <div className="prose prose-invert mt-8 max-w-none text-sm leading-relaxed text-muted-foreground">
          <p>
            At Sashvi Studio, we value your privacy and are committed to protecting your personal
            information. This Privacy Policy explains how we collect, use, and safeguard your
            information when you visit or make a purchase from our website.
          </p>
          <h2>Information We Collect</h2>
          <p>When you place an order or contact us, we may collect the following information:</p>
          <ul>
            <li>Name</li>
            <li>Email Address</li>
            <li>Mobile Number</li>
            <li>Shipping &amp; Billing Address</li>
            <li>Payment Information (processed securely through our payment partners)</li>
            <li>Order History</li>
          </ul>
          <p>
            We may also collect basic website usage information through cookies and analytics tools
            to improve your shopping experience.
          </p>
          <h2>How We Use Your Information</h2>
          <ul>
            <li>Process and deliver your orders.</li>
            <li>Provide customer support.</li>
            <li>Send order confirmations, shipping updates, and tracking details.</li>
            <li>Respond to your enquiries.</li>
            <li>Improve our website, products, and services.</li>
            <li>Send promotional offers or updates (only if you choose to receive them).</li>
          </ul>
          <h2>Payment Security</h2>
          <p>
            We do not store your debit card, credit card, UPI PIN, or banking credentials. All
            online payments are securely processed through trusted payment gateway partners.
          </p>
          <h2>Sharing of Information</h2>
          <p>We do not sell, rent, or trade your personal information.</p>
          <p>
            Your information may be shared only with trusted third-party service providers such as
            courier partners, payment gateways, and technology providers solely for the purpose of
            processing your orders and operating our website.
          </p>
          <h2>Cookies</h2>
          <p>
            Our website may use cookies to enhance your browsing experience, remember your
            preferences, and analyse website traffic. You can disable cookies through your browser
            settings if you prefer.
          </p>
          <h2>Data Security</h2>
          <p>
            We take reasonable measures to protect your personal information against unauthorized
            access, misuse, or disclosure. However, no method of online transmission or electronic
            storage is completely secure.
          </p>
          <h2>Your Rights</h2>
          <p>
            You may contact us at any time to update or correct your personal information or to
            unsubscribe from promotional communications.
          </p>
          <h2>Changes to this Privacy Policy</h2>
          <p>
            Sashvi Studio reserves the right to update this Privacy Policy from time to time. Any
            changes will be published on this page.
          </p>
          <h2>Contact Us</h2>
          <p>If you have any questions regarding this Privacy Policy, please contact us at:</p>
          <p>Email: sashvistudio26@gmail.com</p>
        </div>
      </section>
    </Layout>
  );
}
