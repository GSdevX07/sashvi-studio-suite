export const DELIVERY_THRESHOLD = 1999;
export const DELIVERY_FEE = 100;
export const GATEWAY_PERCENTAGE = 0.03;

export function calculateDelivery(productTotal: number) {
  return productTotal >= DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

export function calculateGatewayCharge(amount: number) {
  return Math.ceil(amount * GATEWAY_PERCENTAGE);
}

export function calculateOrderTotals(
  productTotal: number,
  paymentMode: "cod" | "prepaid",
  couponDiscount = 0,
) {
  const discountedProduct = Math.max(0, productTotal - couponDiscount);
  const delivery = calculateDelivery(discountedProduct);
  const subtotalBeforeGateway = discountedProduct + delivery;
  const gatewayCharge =
    paymentMode === "prepaid" ? calculateGatewayCharge(subtotalBeforeGateway) : 0;
  const total = subtotalBeforeGateway + gatewayCharge;
  
  // For COD: advance is 10% of product total + delivery + gateway on (advance + delivery)
  let advance = total;
  if (paymentMode === "cod") {
    const advanceBase = Math.ceil(discountedProduct * 0.1);
    const advanceDelivery = delivery; // Include delivery charges
    const advanceGateway = calculateGatewayCharge(advanceBase + advanceDelivery); // 3% on advance + delivery
    advance = advanceBase + advanceDelivery + advanceGateway;
  }
  
  return {
    productTotal,
    couponDiscount,
    delivery,
    codCharge: 0,
    gatewayCharge,
    total,
    advance,
  };
}
