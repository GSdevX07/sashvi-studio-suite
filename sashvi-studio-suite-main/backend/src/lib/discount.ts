export type DiscountType = "none" | "fixed" | "percent";

export type DiscountFields = {
  discountType?: DiscountType;
  discountValue?: number;
  discountPercentage?: number;
  discountFixed?: number;
};

export function normalizeDiscountFields(fields: DiscountFields): {
  discountType: DiscountType;
  discountValue: number;
  discountPercentage: number;
  discountFixed: number;
} {
  let discountType = (fields.discountType ?? "none") as DiscountType;
  let discountValue = Number(fields.discountValue ?? 0);

  if (discountType === "none") {
    const pct = Number(fields.discountPercentage ?? 0);
    const fixed = Number(fields.discountFixed ?? 0);
    if (pct > 0) {
      discountType = "percent";
      discountValue = pct;
    } else if (fixed > 0) {
      discountType = "fixed";
      discountValue = fixed;
    }
  }

  if (discountType === "none" || discountValue <= 0) {
    return { discountType: "none", discountValue: 0, discountPercentage: 0, discountFixed: 0 };
  }

  return {
    discountType,
    discountValue,
    discountPercentage: discountType === "percent" ? discountValue : 0,
    discountFixed: discountType === "fixed" ? discountValue : 0,
  };
}

export function calculateDiscountedPrice(
  originalPrice: number,
  discountType: DiscountType,
  discountValue: number,
): number {
  if (originalPrice <= 0 || discountType === "none" || discountValue <= 0) return originalPrice;
  if (discountType === "percent") {
    return Math.max(0, originalPrice - (originalPrice * discountValue) / 100);
  }
  return Math.max(0, originalPrice - discountValue);
}
