import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import type { DiscountType } from "./discount";
import {
  calculateDiscountedPrice,
  hasProductDiscount,
  normalizeDiscountFields,
} from "./discount";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
  discountType?: DiscountType;
  discountValue?: number;
  discountApplied?: boolean;
  stock?: number;
  available?: boolean;
  variant_id?: string;
  selected_color?: string;
}

interface CartContextValue {
  items: CartItem[];
  savedItems: CartItem[];
  addItem: (item: Omit<CartItem, "qty" | "discountApplied"> & { qty?: number }) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number, maxStock?: number) => void;
  clearCart: () => void;
  saveForLater: (id: string) => void;
  moveToCart: (id: string) => void;
  removeSavedItem: (id: string) => void;
  applyItemDiscount: (id: string) => void;
  refreshCartItems: () => Promise<void>;
  count: number;
  cartUpdateNotification: string | null;
  dismissCartNotification: () => void;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  savedItems: [],
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  clearCart: () => {},
  saveForLater: () => {},
  moveToCart: () => {},
  removeSavedItem: () => {},
  applyItemDiscount: () => {},
  refreshCartItems: async () => {},
  count: 0,
  cartUpdateNotification: null,
  dismissCartNotification: () => {},
});

const CART_KEY = "cart";
const SAVED_KEY = "saved_for_later";

export function getCartItemListPrice(item: CartItem): number {
  return item.price;
}

export function getCartItemEffectivePrice(item: CartItem): number {
  if (!item.discountApplied) return item.price;
  const discount = normalizeDiscountFields({
    discountType: item.discountType,
    discountValue: item.discountValue,
  });
  return calculateDiscountedPrice(item.price, discount.discountType, discount.discountValue);
}

export function cartItemHasDiscount(item: CartItem): boolean {
  return hasProductDiscount({
    discountType: item.discountType,
    discountValue: item.discountValue,
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedItems, setSavedItems] = useState<CartItem[]>([]);
  const [cartUpdateNotification, setCartUpdateNotification] = useState<string | null>(null);
  const isRefreshingRef = useRef(false);
  const initialLoadCompleteRef = useRef(false);
  const initialProductStateRef = useRef<Map<string, { price: number; stock?: number; discountType?: DiscountType; discountValue?: number }>>(new Map());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (Array.isArray(stored)) setItems(stored);
      const storedSaved = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]");
      if (Array.isArray(storedSaved)) setSavedItems(storedSaved);
    } catch {}
  }, []);

  const persist = (next: CartItem[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(CART_KEY, JSON.stringify(next));
    }
    return next;
  };

  const persistSaved = (next: CartItem[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    }
    return next;
  };

  const refreshCartItems = useCallback(async () => {
    if (isRefreshingRef.current || items.length === 0) return;
    isRefreshingRef.current = true;

    try {
      // Fetch latest product data for all cart items
      const productIds = items.map((item) => item.id);
      const res = await fetch(`/backend-api/products/catalog`, { cache: "no-store" });
      
      if (!res.ok) {
        console.error("Failed to fetch product catalog:", res.status);
        return;
      }
      
      const data = await res.json();

      if (Array.isArray(data.products)) {
        let hasActualChanges = false;
        const updatedItems = items.map((cartItem) => {
          const latestProduct = data.products.find((p: any) => p.id === cartItem.id);
          if (latestProduct) {
            const discount = normalizeDiscountFields({
              discountType: latestProduct.discountType,
              discountValue: latestProduct.discountValue,
              discountPercentage: latestProduct.discountPercentage,
              discountFixed: latestProduct.discountFixed,
            });

            // Get stock from variant if variant_id is present, otherwise use main product stock
            let currentStock = latestProduct.stock;
            if (cartItem.variant_id && latestProduct.colorVariants) {
              const variant = latestProduct.colorVariants.find((v: any) => v.id === cartItem.variant_id);
              if (variant) {
                currentStock = variant.stock;
              }
            }

            // Store initial state on first load
            if (!initialLoadCompleteRef.current) {
              initialProductStateRef.current.set(cartItem.id, {
                price: latestProduct.price,
                stock: currentStock,
                discountType: discount.discountType,
                discountValue: discount.discountValue,
              });
            }

            // Check if anything changed from current cart state
            const priceChanged = latestProduct.price !== cartItem.price;
            const stockChanged = currentStock !== cartItem.stock;
            const discountTypeChanged = discount.discountType !== cartItem.discountType;
            const discountValueChanged = discount.discountValue !== cartItem.discountValue;

            if (priceChanged || stockChanged || discountTypeChanged || discountValueChanged) {
              // Only count as actual change if initial load is complete
              if (initialLoadCompleteRef.current) {
                const initialState = initialProductStateRef.current.get(cartItem.id);
                // Check if this is different from the initial state (not just the current cart state)
                if (initialState) {
                  const changedFromInitial =
                    latestProduct.price !== initialState.price ||
                    currentStock !== initialState.stock ||
                    discount.discountType !== initialState.discountType ||
                    discount.discountValue !== initialState.discountValue;
                  
                  if (changedFromInitial) {
                    hasActualChanges = true;
                  }
                } else {
                  hasActualChanges = true;
                }
              }
              
              return {
                ...cartItem,
                price: latestProduct.price,
                stock: currentStock,
                discountType: discount.discountType,
                discountValue: discount.discountValue,
                available: currentStock > 0,
              };
            }
          }
          return cartItem;
        });

        // Always update items to keep them in sync with backend
        setItems(persist(updatedItems));

        // Mark initial load as complete after first refresh
        if (!initialLoadCompleteRef.current) {
          initialLoadCompleteRef.current = true;
        }

        // Only show notification if there are actual changes after initial load
        if (hasActualChanges && initialLoadCompleteRef.current) {
          setCartUpdateNotification(
            "Product updated: The price or availability of one or more items in your bag has changed. Your order summary has been refreshed automatically.",
          );
          // Auto-dismiss notification after 5 seconds
          setTimeout(() => setCartUpdateNotification(null), 5000);
        }
      }
    } catch (error) {
      console.error("Failed to refresh cart items:", error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [items]);

  const dismissCartNotification = useCallback(() => {
    setCartUpdateNotification(null);
  }, []);

  const addItem = useCallback((item: Omit<CartItem, "qty" | "discountApplied"> & { qty?: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      const discount = normalizeDiscountFields({
        discountType: item.discountType,
        discountValue: item.discountValue,
      });
      const nextItem: CartItem = {
        ...item,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
        qty: item.qty || 1,
        discountApplied: false,
      };
      return persist(
        existing
          ? prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    qty: i.qty + (item.qty || 1),
                    discountType: nextItem.discountType,
                    discountValue: nextItem.discountValue,
                  }
                : i,
            )
          : [...prev, nextItem],
      );
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => persist(prev.filter((i) => i.id !== id)));
  }, []);

  const updateQty = useCallback((id: string, qty: number, maxStock?: number) => {
    if (qty < 1) return;
    if (maxStock !== undefined && qty > maxStock) {
      qty = maxStock;
    }
    setItems((prev) => persist(prev.map((i) => (i.id === id ? { ...i, qty } : i))));
  }, []);

  const clearCart = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(CART_KEY);
    }
    setItems([]);
  }, []);

  const applyItemDiscount = useCallback((id: string) => {
    setItems((prev) =>
      persist(prev.map((i) => (i.id === id ? { ...i, discountApplied: true } : i))),
    );
  }, []);

  const saveForLater = useCallback((id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        setSavedItems((s) => {
          if (s.find((saved) => saved.id === id)) {
            return s;
          }
          return persistSaved([...s, item]);
        });
        return persist(prev.filter((i) => i.id !== id));
      }
      return prev;
    });
  }, []);

  const moveToCart = useCallback(
    (id: string) => {
      setSavedItems((prev) => {
        const item = prev.find((i) => i.id === id);
        if (item) {
          addItem(item);
          return persistSaved(prev.filter((i) => i.id !== id));
        }
        return prev;
      });
    },
    [addItem],
  );

  const removeSavedItem = useCallback((id: string) => {
    setSavedItems((prev) => persistSaved(prev.filter((i) => i.id !== id)));
  }, []);

  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        savedItems,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        saveForLater,
        moveToCart,
        removeSavedItem,
        applyItemDiscount,
        refreshCartItems,
        count,
        cartUpdateNotification,
        dismissCartNotification,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
