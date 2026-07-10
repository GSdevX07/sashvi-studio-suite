export type DiscountType = "none" | "fixed" | "percent";

export type DiscountFields = {
  discountType?: DiscountType;
  discountValue?: number;
  discountPercentage?: number;
  discountFixed?: number;
  discountBadge?: string;
};

export function normalizeDiscountFields(fields: DiscountFields): {
  discountType: DiscountType;
  discountValue: number;
  discountPercentage: number;
  discountFixed: number;
  discountBadge: string;
} {
  let discountType = fields.discountType ?? "none";
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
    return { discountType: "none", discountValue: 0, discountPercentage: 0, discountFixed: 0, discountBadge: fields.discountBadge ?? "" };
  }

  return {
    discountType,
    discountValue,
    discountPercentage: discountType === "percent" ? discountValue : 0,
    discountFixed: discountType === "fixed" ? discountValue : 0,
    discountBadge: fields.discountBadge ?? "",
  };
}

export function hasProductDiscount(fields: DiscountFields): boolean {
  const { discountType, discountValue } = normalizeDiscountFields(fields);
  return discountType !== "none" && discountValue > 0;
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

export function getDiscountBadgeText(fields: DiscountFields): string | null {
  const { discountType, discountValue } = normalizeDiscountFields(fields);
  if (discountType === "none" || discountValue <= 0) return null;
  if (discountType === "percent") return `${discountValue}% OFF`;
  return `Save ₹${discountValue}`;
}

export function getDiscountOffLabel(fields: DiscountFields): string | null {
  const { discountType, discountValue } = normalizeDiscountFields(fields);
  if (discountType === "none" || discountValue <= 0) return null;
  if (discountType === "percent") return `${discountValue}% OFF`;
  return `₹${discountValue} OFF`;
}

export function getPremiumDiscountBadge(fields: DiscountFields): string | null {
  const normalized = normalizeDiscountFields(fields);
  
  // Use custom badge if provided
  if (normalized.discountBadge && normalized.discountBadge.trim() !== "") {
    return normalized.discountBadge;
  }
  
  // Otherwise auto-generate based on discount
  const { discountType, discountValue } = normalized;
  if (discountType === "none" || discountValue <= 0) return null;
  if (discountType === "percent") {
    if (discountValue >= 25) return "Limited Offer";
    return `${discountValue}% OFF`;
  }
  if (discountValue >= 500) return "🎉 Discount Available";
  if (discountValue >= 200) return `Save ₹${discountValue}`;
  return `Save ₹${discountValue}`;
}
