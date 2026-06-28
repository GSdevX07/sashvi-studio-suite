import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface WishlistContextValue {
  ids: string[];
  toggle: (id: string) => void;
  isWishlisted: (id: string) => boolean;
}

const WishlistContext = createContext<WishlistContextValue>({
  ids: [],
  toggle: () => {},
  isWishlisted: () => false,
});

const WISHLIST_KEY = "wishlist";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
      if (Array.isArray(stored)) setIds(stored);
    } catch {}
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isWishlisted = useCallback((id: string) => ids.includes(id), [ids]);

  return (
    <WishlistContext.Provider value={{ ids, toggle, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
