import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error("Missing Razorpay credentials in environment variables.");
}

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export async function createRazorpayOrder(
  amountInPaise: number,
  currency = "INR",
  receipt = "receipt",
) {
  return await razorpay.orders.create({
    amount: amountInPaise,
    currency,
    receipt,
    payment_capture: true,
  });
}

export function verifyRazorpaySignature(payload: {
  order_id: string;
  payment_id: string;
  signature: string;
}) {
  const { order_id, payment_id, signature } = payload;
  const expected = Razorpay.validateWebhookSignature(
    order_id + "|" + payment_id,
    signature,
    keySecret as string,
  );
  return expected;
}
