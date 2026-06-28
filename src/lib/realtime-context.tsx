import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { createClientOnlyFn } from "@tanstack/react-start";

export type RealtimeDomain =
  | "products"
  | "categories"
  | "orders"
  | "product_variants"
  | "order_items"
  | "reviews"
  | "cart_items"
  | "wishlists"
  | "instagram_feed";

interface RealtimeContextValue {
  isConnected: boolean;
  productsVersion: number;
  categoriesVersion: number;
  ordersVersion: number;
  productVariantsVersion: number;
  orderItemsVersion: number;
  reviewsVersion: number;
  cartItemsVersion: number;
  wishlistsVersion: number;
  instagramFeedVersion: number;
  refreshProducts: () => void;
  refreshCategories: () => void;
  refreshOrders: () => void;
  refreshProductVariants: () => void;
  refreshOrderItems: () => void;
  refreshReviews: () => void;
  refreshCartItems: () => void;
  refreshWishlists: () => void;
  refreshInstagramFeed: () => void;
  /** @deprecated use productsVersion */
  refreshTrigger: number;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  isConnected: false,
  productsVersion: 0,
  categoriesVersion: 0,
  ordersVersion: 0,
  productVariantsVersion: 0,
  orderItemsVersion: 0,
  reviewsVersion: 0,
  cartItemsVersion: 0,
  wishlistsVersion: 0,
  instagramFeedVersion: 0,
  refreshProducts: () => {},
  refreshCategories: () => {},
  refreshOrders: () => {},
  refreshProductVariants: () => {},
  refreshOrderItems: () => {},
  refreshReviews: () => {},
  refreshCartItems: () => {},
  refreshWishlists: () => {},
  refreshInstagramFeed: () => {},
  refreshTrigger: 0,
});

// Throttle delay in milliseconds to prevent excessive API requests
const THROTTLE_DELAY = 500;
const BATCH_DELAY = 1000;

function createThrottledSetter(
  setter: (updater: (prev: number) => number) => void,
  lastUpdateRef: React.MutableRefObject<number>,
  resourceKey: string,
  queueRef: React.MutableRefObject<Map<string, NodeJS.Timeout>>,
  activeRefreshesRef: React.MutableRefObject<Set<string>>,
): () => void {
  return () => {
    const now = Date.now();
    
    // If a refresh is already active for this resource, skip
    if (activeRefreshesRef.current.has(resourceKey)) {
      return;
    }
    
    // Clear any pending batched refresh for this resource
    const existingTimeout = queueRef.current.get(resourceKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      queueRef.current.delete(resourceKey);
    }
    
    // If within throttle window, batch the refresh
    if (now - lastUpdateRef.current < THROTTLE_DELAY) {
      const timeout = setTimeout(() => {
        lastUpdateRef.current = Date.now();
        setter((v) => v + 1);
        queueRef.current.delete(resourceKey);
        activeRefreshesRef.current.delete(resourceKey);
      }, BATCH_DELAY);
      queueRef.current.set(resourceKey, timeout);
    } else {
      // Immediate refresh
      lastUpdateRef.current = now;
      setter((v) => v + 1);
    }
  };
}

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [productsVersion, setProductsVersion] = useState(0);
  const [categoriesVersion, setCategoriesVersion] = useState(0);
  const [ordersVersion, setOrdersVersion] = useState(0);
  const [productVariantsVersion, setProductVariantsVersion] = useState(0);
  const [orderItemsVersion, setOrderItemsVersion] = useState(0);
  const [reviewsVersion, setReviewsVersion] = useState(0);
  const [cartItemsVersion, setCartItemsVersion] = useState(0);
  const [wishlistsVersion, setWishlistsVersion] = useState(0);
  const [instagramFeedVersion, setInstagramFeedVersion] = useState(0);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const mountedRef = useRef(true);
  const subscriptionRef = useRef<(() => void) | null>(null);
  const isSubscribedRef = useRef(false);
  const isInitializingRef = useRef(false);

  // Track last update time for throttling
  const lastProductsUpdate = useRef(0);
  const lastCategoriesUpdate = useRef(0);
  const lastOrdersUpdate = useRef(0);
  const lastProductVariantsUpdate = useRef(0);
  const lastOrderItemsUpdate = useRef(0);
  const lastReviewsUpdate = useRef(0);
  const lastCartItemsUpdate = useRef(0);
  const lastWishlistsUpdate = useRef(0);
  const lastInstagramFeedUpdate = useRef(0);

  // Refresh queue to batch requests
  const refreshQueueRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const activeRefreshesRef = useRef<Set<string>>(new Set());

  const refreshProducts = useCallback(
    createThrottledSetter(setProductsVersion, lastProductsUpdate, "products", refreshQueueRef, activeRefreshesRef),
    [],
  );

  const refreshCategories = useCallback(
    createThrottledSetter(setCategoriesVersion, lastCategoriesUpdate, "categories", refreshQueueRef, activeRefreshesRef),
    [],
  );

  const refreshOrders = useCallback(
    createThrottledSetter(setOrdersVersion, lastOrdersUpdate, "orders", refreshQueueRef, activeRefreshesRef),
    [],
  );

  const refreshProductVariants = useCallback(
    createThrottledSetter(setProductVariantsVersion, lastProductVariantsUpdate, "product_variants", refreshQueueRef, activeRefreshesRef),
    [],
  );

  const refreshOrderItems = useCallback(
    createThrottledSetter(setOrderItemsVersion, lastOrderItemsUpdate, "order_items", refreshQueueRef, activeRefreshesRef),
    [],
  );

  const refreshReviews = useCallback(
    createThrottledSetter(setReviewsVersion, lastReviewsUpdate, "reviews", refreshQueueRef, activeRefreshesRef),
    [],
  );

  const refreshCartItems = useCallback(
    createThrottledSetter(setCartItemsVersion, lastCartItemsUpdate, "cart_items", refreshQueueRef, activeRefreshesRef),
    [],
  );

  const refreshWishlists = useCallback(
    createThrottledSetter(setWishlistsVersion, lastWishlistsUpdate, "wishlists", refreshQueueRef, activeRefreshesRef),
    [],
  );

  const refreshInstagramFeed = useCallback(
    createThrottledSetter(setInstagramFeedVersion, lastInstagramFeedUpdate, "instagram_feed", refreshQueueRef, activeRefreshesRef),
    [],
  );

  const setupRealtime = createClientOnlyFn(
    async (
      callbacks: {
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
    ) => {
      const { setupRealtimeSubscriptions } = await import("./realtime.client");
      return setupRealtimeSubscriptions(callbacks);
    }
  );

  useEffect(() => {
    // Prevent duplicate subscriptions and concurrent initialization
    if (isSubscribedRef.current || isInitializingRef.current || !realtimeEnabled) return;
    
    mountedRef.current = true;
    if (typeof window === "undefined") return;

    isInitializingRef.current = true;

    setupRealtime({
      onProductsChange: () => {
        if (mountedRef.current) refreshProducts();
      },
      onCategoriesChange: () => {
        if (mountedRef.current) refreshCategories();
      },
      onOrdersChange: () => {
        if (mountedRef.current) refreshOrders();
      },
      onProductVariantsChange: () => {
        if (mountedRef.current) refreshProductVariants();
      },
      onOrderItemsChange: () => {
        if (mountedRef.current) refreshOrderItems();
      },
      onReviewsChange: () => {
        if (mountedRef.current) refreshReviews();
      },
      onCartItemsChange: () => {
        if (mountedRef.current) refreshCartItems();
      },
      onWishlistsChange: () => {
        if (mountedRef.current) refreshWishlists();
      },
      onInstagramFeedChange: () => {
        if (mountedRef.current) refreshInstagramFeed();
      },
      onConnectionChange: (connected: boolean) => {
        if (mountedRef.current) setIsConnected(connected);
      },
    }).then((unsub) => {
      if (mountedRef.current) {
        subscriptionRef.current = unsub;
        isSubscribedRef.current = true;
      }
      isInitializingRef.current = false;
    }).catch((error) => {
      console.error("Failed to initialize realtime subscriptions:", error);
      setRealtimeEnabled(false);
      isInitializingRef.current = false;
    });

    return () => {
      mountedRef.current = false;
      isInitializingRef.current = false;
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current();
        } catch (error) {
          console.error("Error cleaning up realtime subscription:", error);
        }
        subscriptionRef.current = null;
      }
      isSubscribedRef.current = false;
      // Clear all pending refresh timeouts
      refreshQueueRef.current.forEach((timeout) => clearTimeout(timeout));
      refreshQueueRef.current.clear();
    };
  }, []); // Empty dependency array - initialize only once

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        productsVersion,
        categoriesVersion,
        ordersVersion,
        productVariantsVersion,
        orderItemsVersion,
        reviewsVersion,
        cartItemsVersion,
        wishlistsVersion,
        instagramFeedVersion,
        refreshProducts,
        refreshCategories,
        refreshOrders,
        refreshProductVariants,
        refreshOrderItems,
        refreshReviews,
        refreshCartItems,
        refreshWishlists,
        refreshInstagramFeed,
        refreshTrigger: productsVersion,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}
