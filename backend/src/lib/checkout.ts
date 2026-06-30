export const DELIVERY_THRESHOLD = 1000;
export const DELIVERY_FEE = 100;
export const COD_CHARGE = 80;
export const GATEWAY_PERCENTAGE = 0; // Removed 3% gateway charge

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
  const codCharge = paymentMode === "cod" ? COD_CHARGE : 0;
  const subtotalBeforeGateway = discountedProduct + delivery + codCharge;
  const gatewayCharge = 0; // No gateway charge
  const total = subtotalBeforeGateway + gatewayCharge;
  
  // For COD: calculate advance payment (10% of product + COD charge, no gateway charge)
  let advance = total;
  let remainingAmount = 0;
  if (paymentMode === "cod") {
    const advanceBase = Math.ceil(discountedProduct * 0.10);
    const advanceCod = codCharge;
    advance = advanceBase + advanceCod; // No gateway charge
    // Remaining amount = product subtotal - advance (only product price, not including service charges)
    remainingAmount = discountedProduct - advanceBase;
  }
  
  return {
    productTotal,
    couponDiscount,
    delivery,
    codCharge,
    gatewayCharge,
    total,
    advance,
    remainingAmount,
  };
}
