export const DELIVERY_THRESHOLD = 1999;
export const DELIVERY_FEE = 100;
export const COD_CHARGE = 50;
export const GATEWAY_PERCENTAGE = 0.03;

export function calculateDelivery(subtotal: number) {
  return subtotal >= DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
}

export function calculateGatewayCharge(subtotal: number) {
  return Math.round(subtotal * GATEWAY_PERCENTAGE);
}

export function calculateCodCharge(paymentMode: "prepaid" | "cod") {
  return paymentMode === "cod" ? COD_CHARGE : 0;
}

export function calculateOrderTotals(productTotal: number, paymentMode: "prepaid" | "cod") {
  const delivery = calculateDelivery(productTotal);
  const subtotal = productTotal + delivery;
  const gatewayCharge = calculateGatewayCharge(subtotal);
  const codCharge = calculateCodCharge(paymentMode);
  const total = productTotal + delivery + gatewayCharge + codCharge;
  return { productTotal, delivery, gatewayCharge, codCharge, total };
}
