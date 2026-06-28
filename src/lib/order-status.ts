/** Maps between admin UI labels and database snake_case statuses. */

export const ORDER_STATUS_FLOW = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
] as const;

const DISPLAY_MAP: Record<string, string> = {
  pending: "Pending",
  partially_paid: "Partially Paid",
  confirmed: "Confirmed",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  replacement_requested: "Replacement Requested",
  replacement_approved: "Replacement Approved",
  replacement_packed: "Replacement Packed",
  replacement_shipped: "Replacement Shipped",
  replacement_delivered: "Replacement Delivered",
  refund_pending: "Refund Pending",
  refund_initiated: "Refund Initiated",
  refund_completed: "Refund Completed",
};

const SNAKE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(DISPLAY_MAP).map(([k, v]) => [v.toLowerCase(), k]),
);

// Manually add reverse mapping for partially paid
SNAKE_MAP["partially paid"] = "partially_paid";

export function statusToDisplay(status: string): string {
  return DISPLAY_MAP[status] ?? status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function statusToSnake(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (DISPLAY_MAP[normalized]) return normalized;
  return SNAKE_MAP[normalized] ?? normalized.replace(/\s+/g, "_");
}

export const ADMIN_ORDER_STATUSES = [
  "Pending",
  "Partially Paid",
  "Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Refunded",
  "Replacement Requested",
  "Replacement Approved",
  "Replacement Packed",
  "Replacement Shipped",
  "Replacement Delivered",
  "Refund Pending",
  "Refund Initiated",
  "Refund Completed",
];
