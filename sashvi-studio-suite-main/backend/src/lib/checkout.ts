export const COD_CHARGE = 50;
export function calculateDelivery(productTotal: number) {
  return productTotal > 1999 ? 0 : 100;
}

export function calculateGatewayCharge(amount: number) {
  return Math.ceil(amount * 0.03);
}

export function calculateCodCharge(paymentMode: 'cod' | 'prepaid') {
  return paymentMode === 'cod' ? COD_CHARGE : 0;
}

export function calculateOrderTotals(productTotal: number, paymentMode: 'cod' | 'prepaid') {
  const delivery = calculateDelivery(productTotal);
  const codCharge = calculateCodCharge(paymentMode);
  const subtotal = productTotal + delivery + codCharge;
  const gatewayCharge = calculateGatewayCharge(subtotal);
  const total = subtotal + gatewayCharge;
  const advance = paymentMode === 'cod' ? Math.ceil((total * 0.1)) : total;
  return { productTotal, delivery, codCharge, gatewayCharge, total, advance };
}
