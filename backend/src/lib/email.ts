import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
const FROM = process.env.EMAIL_FROM || "Sashvi Studio <orders@sashvistudio.in>";

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping email");
    return;
  }
  const { error } = await getResend().emails.send({ from: FROM, to, subject, html });
  if (error) console.warn("Resend error:", error);
}

function formatINR(n: number) {
  return (
    "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

export function buildOrderConfirmationEmail(opts: {
  customerName: string;
  orderId: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  deliveryCharge: number;
  gatewayCharge: number;
  grandTotal: number;
  address: string;
  mobile: string;
}) {
  const {
    customerName,
    orderId,
    items,
    subtotal,
    deliveryCharge,
    gatewayCharge,
    grandTotal,
    address,
    mobile,
  } = opts;

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0e8de;color:#3d2b1f;font-size:14px;">${item.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0e8de;color:#3d2b1f;font-size:14px;text-align:center;">${item.qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0e8de;color:#3d2b1f;font-size:14px;text-align:right;">${formatINR(item.price)}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmation — Sashvi Studio</title>
</head>
<body style="margin:0;padding:0;background:#faf6f1;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:#2c1a0e;padding:32px 40px;text-align:center;">
              <div style="font-family:'Georgia',serif;font-size:22px;font-weight:bold;color:#f5e6c8;letter-spacing:2px;">SASHVI STUDIO</div>
              <div style="font-size:11px;color:#c9a87c;letter-spacing:3px;margin-top:4px;">SAREES &amp; JEWELLERY</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:15px;color:#7a5c44;">Hello <strong style="color:#2c1a0e;">${customerName}</strong>,</p>
              <p style="margin:0 0 24px;font-size:14px;color:#5a4438;line-height:1.6;">
                Thank you for shopping with us! We are thrilled to confirm that your payment has been verified.
                Your order is now registered under ID <strong style="color:#8b4513;">${orderId}</strong>. Below are your invoice details:
              </p>

              <!-- Invoice Table -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0e8de;border-radius:8px;overflow:hidden;margin-bottom:24px;">
                <thead>
                  <tr style="background:#faf0e4;">
                    <th style="padding:12px;text-align:left;font-size:12px;color:#8b6040;letter-spacing:1px;text-transform:uppercase;border-bottom:2px solid #e8d5c0;">Saree / Product Description</th>
                    <th style="padding:12px;text-align:center;font-size:12px;color:#8b6040;letter-spacing:1px;text-transform:uppercase;border-bottom:2px solid #e8d5c0;">Qty</th>
                    <th style="padding:12px;text-align:right;font-size:12px;color:#8b6040;letter-spacing:1px;text-transform:uppercase;border-bottom:2px solid #e8d5c0;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                  <tr>
                    <td colspan="2" style="padding:10px 12px;text-align:right;font-size:13px;color:#5a4438;border-top:1px solid #f0e8de;">Subtotal:</td>
                    <td style="padding:10px 12px;text-align:right;font-size:13px;color:#3d2b1f;">${formatINR(subtotal)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding:10px 12px;text-align:right;font-size:13px;color:#5a4438;">Delivery Charges:</td>
                    <td style="padding:10px 12px;text-align:right;font-size:13px;color:#3d2b1f;">${formatINR(deliveryCharge)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="padding:10px 12px;text-align:right;font-size:13px;color:#5a4438;">Payment gateway charges:</td>
                    <td style="padding:10px 12px;text-align:right;font-size:13px;color:#3d2b1f;">${formatINR(gatewayCharge)}</td>
                  </tr>
                  <tr style="background:#faf0e4;">
                    <td colspan="2" style="padding:14px 12px;text-align:right;font-size:15px;font-weight:bold;color:#2c1a0e;">Grand Total:</td>
                    <td style="padding:14px 12px;text-align:right;font-size:15px;font-weight:bold;color:#8b4513;">${formatINR(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>

              <!-- Shipping -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf0e4;border-radius:8px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:12px;color:#8b6040;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Shipping Destination</div>
                    <div style="font-size:14px;color:#3d2b1f;line-height:1.8;">
                      <strong>${customerName}</strong><br/>
                      ${address}<br/>
                      Contact: ${mobile}
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 4px;font-size:13px;color:#5a4438;line-height:1.7;">
                We will email you with tracking updates as soon as your sarees are shipped. You can track this order directly in your dashboard anytime.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5ede3;padding:20px 40px;text-align:center;border-top:1px solid #e8d5c0;">
              <p style="margin:0 0 6px;font-size:11px;color:#9a7a60;font-style:italic;">
                This is an automated transaction confirmation email. Please do not reply.
              </p>
              <p style="margin:0;font-size:11px;color:#9a7a60;">
                sashvistudio© ${new Date().getFullYear()}. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
