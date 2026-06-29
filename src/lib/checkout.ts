export const DELIVERY_THRESHOLD = 1000;
export const DELIVERY_FEE = 100;
export const COD_CHARGE = 80;
export const GATEWAY_PERCENTAGE = 0.03;
export const COUPON_STORAGE_KEY = "sashvi_checkout_coupon";

export function calculateDelivery(subtotal: number) {
  return subtotal >= DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

export function calculateGatewayCharge(subtotal: number) {
  return Math.ceil(subtotal * GATEWAY_PERCENTAGE);
}

export function calculateCodCharge(paymentMode: "prepaid" | "cod") {
  return paymentMode === "cod" ? COD_CHARGE : 0;
}

export function calculateOrderTotals(
  productTotal: number,
  paymentMode: "prepaid" | "cod",
  couponDiscount = 0,
) {
  const discountedProduct = Math.max(0, productTotal - couponDiscount);
  const delivery = calculateDelivery(discountedProduct);
  const codCharge = calculateCodCharge(paymentMode);
  const subtotalBeforeGateway = discountedProduct + delivery + codCharge;
  const gatewayCharge = paymentMode === "prepaid" ? calculateGatewayCharge(subtotalBeforeGateway) : 0;
  const total = subtotalBeforeGateway + gatewayCharge;
  
  // For COD: calculate advance payment (10% + delivery + COD charge + gateway on advance+delivery+COD)
  let advance = total;
  if (paymentMode === "cod") {
    const advanceBase = Math.ceil(discountedProduct * 0.10);
    const advanceDelivery = delivery;
    const advanceCod = codCharge;
    const advanceGateway = Math.ceil((advanceBase + advanceDelivery + advanceCod) * 0.03);
    advance = advanceBase + advanceDelivery + advanceCod + advanceGateway;
  }
  
  return { productTotal, delivery, gatewayCharge, codCharge, couponDiscount, total, advance };
}
