import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
);

type RealtimePostgresChangesPayload<T = any> = {
  new: T;
  old: T | null;
  errors: string[] | null;
};

type RealtimeSubscriptionStatus = 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'JOINING';

// Singleton pattern to ensure only one subscription exists
let globalChannel: ReturnType<typeof supabase.channel> | null = null;
let globalUnsubscribe: (() => void) | null = null;
let isInitialized = false;

interface RealtimeCallbacks {
  onProductsChange: () => void;
  onCategoriesChange: () => void;
  onOrdersChange: () => void;
  onProductVariantsChange: () => void;
  onOrderItemsChange: () => void;
  onReviewsChange: () => void;
  onCartItemsChange: () => void;
  onWishlistsChange: () => void;
  onInstagramFeedChange: () => void;
  onConnectionChange: (connected: boolean) => void;
}

/**
 * Subscribe to order status change events for a specific user.
 * Returns an unsubscribe function.
 *
 * Creates a fresh channel each call so that `.on()` is always called
 * BEFORE `.subscribe()`, avoiding the "cannot add callbacks after subscribe" error.
 */
export function subscribeOrderStatus(
  userId: string,
  onUpdate: (payload: { order_id: string; new_status: string }) => void,
): () => void {
  // Use a unique channel name to avoid re-using a previously subscribed channel
  const channelName = `order_status_change:${userId}:${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
      (payload: RealtimePostgresChangesPayload) => {
        const record = payload.new;
        if (record?.order_id && record?.order_status) {
          onUpdate({ order_id: record.order_id, new_status: record.order_status });
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Setup all realtime subscriptions for the application.
 * Uses singleton pattern to ensure only one subscription exists.
 * Returns an unsubscribe function.
 */
export function setupRealtimeSubscriptions(callbacks: RealtimeCallbacks): () => void {
  // If already initialized, return existing unsubscribe
  if (isInitialized && globalChannel) {
    return globalUnsubscribe || (() => {});
  }

  // Clean up existing subscription if any
  if (globalChannel && globalUnsubscribe) {
    try {
      globalUnsubscribe();
    } catch (error) {
      console.error("Error cleaning up previous realtime subscription:", error);
    }
    globalChannel = null;
    globalUnsubscribe = null;
  }

  // Mark as initialized
  isInitialized = true;

  // Create channel with all listeners BEFORE subscribe
  const channelName = "realtime:sashvi-full-sync";
  globalChannel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "products" },
      () => {
        callbacks.onProductsChange();
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "categories" },
      () => {
        callbacks.onCategoriesChange();
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      () => {
        callbacks.onOrdersChange();
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "product_variants" },
      () => {
        callbacks.onProductVariantsChange();
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "order_items" },
      () => {
        callbacks.onOrderItemsChange();
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "reviews" },
      () => {
        callbacks.onReviewsChange();
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "cart_items" },
      () => {
        callbacks.onCartItemsChange();
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "wishlists" },
      () => {
        callbacks.onWishlistsChange();
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "instagram_feed" },
      () => {
        callbacks.onInstagramFeedChange();
      },
    )
    .subscribe((status: RealtimeSubscriptionStatus) => {
      callbacks.onConnectionChange(status === "SUBSCRIBED");
    });

  // Create unsubscribe function
  globalUnsubscribe = () => {
    if (globalChannel) {
      supabase.removeChannel(globalChannel);
      globalChannel = null;
      globalUnsubscribe = null;
      isInitialized = false;
    }
  };

  return globalUnsubscribe;
}
