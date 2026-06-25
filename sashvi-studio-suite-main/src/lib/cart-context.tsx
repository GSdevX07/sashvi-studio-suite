import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  qty: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  count: number;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQty: () => {},
  clearCart: () => {},
  count: 0,
});

const CART_KEY = "cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (Array.isArray(stored)) setItems(stored);
    } catch {}
  }, []);

  const persist = (next: CartItem[]) => {
    localStorage.setItem(CART_KEY, JSON.stringify(next));
    return next;
  };

  const addItem = useCallback((item: Omit<CartItem, "qty">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      return persist(
        existing
          ? prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
          : [...prev, { ...item, qty: 1 }]
      );
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => persist(prev.filter((i) => i.id !== id)));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty < 1) return;
    setItems((prev) =>
      persist(prev.map((i) => (i.id === id ? { ...i, qty } : i)))
    );
  }, []);

  const clearCart = useCallback(() => {
    localStorage.removeItem(CART_KEY);
    setItems([]);
  }, []);

  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
