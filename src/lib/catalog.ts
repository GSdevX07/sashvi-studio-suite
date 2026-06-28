import { useEffect, useState, useCallback } from "react";
import { PRODUCTS, type Category, type Product, type ColorVariant } from "./products";
import { useRealtime } from "./realtime-context";
import { normalizeDiscountFields } from "./discount";

type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountedPrice?: number;
  discountType?: "none" | "fixed" | "percent";
  discountValue?: number;
  discountPercentage?: number;
  discountFixed?: number;
  discountBadge?: string;
  image: string;
  images?: string[];
  categories: Category[];
  tags: string[];
  stock: number;
  description: string;
  featured?: boolean;
  active?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  color?: string;
  colorVariants?: ColorVariant[];
};

function toProduct(row: CatalogProduct): Product {
  const discount = normalizeDiscountFields({
    discountType: row.discountType,
    discountValue: row.discountValue,
    discountPercentage: row.discountPercentage,
    discountFixed: row.discountFixed,
    discountBadge: row.discountBadge,
  });
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    compareAt: row.originalPrice,
    originalPrice: row.originalPrice ?? row.price,
    discountedPrice: row.discountedPrice,
    discountType: discount.discountType,
    discountValue: discount.discountValue,
    discountPercentage: discount.discountPercentage,
    discountFixed: discount.discountFixed,
    discountBadge: row.discountBadge,
    image: row.image,
    images: row.images,
    categories: row.categories,
    tags: row.tags,
    stock: row.stock,
    description: row.description,
    isFeatured: row.featured,
    isNew: row.isNew,
    isBestSeller: row.isBestSeller,
    color: row.color,
    colorVariants: row.colorVariants,
  };
}

async function fetchCatalogProducts(category?: Category): Promise<Product[]> {
  const query = category ? `?type=${category}` : "";
  const res = await fetch(`/backend-api/products/catalog${query}`, { cache: "no-store" });
  
  if (!res.ok) {
    console.error("Failed to fetch catalog:", res.status);
    return category ? PRODUCTS.filter((p) => p.categories.includes(category)) : PRODUCTS;
  }
  
  const data = await res.json();
  if (Array.isArray(data.products) && data.products.length > 0) {
    return data.products.map(toProduct);
  }
  return category ? PRODUCTS.filter((p) => p.categories.includes(category)) : PRODUCTS;
}

export function useCatalogProducts(category?: Category) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDatabase, setFromDatabase] = useState(false);
  const { productsVersion } = useRealtime();

  const load = useCallback(async () => {
    try {
      const query = category ? `?type=${category}` : "";
      const res = await fetch(`/backend-api/products/catalog${query}`, { cache: "no-store" });
      
      if (!res.ok) {
        console.error("Failed to fetch catalog:", res.status);
        setProducts([]);
        setFromDatabase(false);
        return;
      }
      
      const data = await res.json();
      if (Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products.map(toProduct));
        setFromDatabase(true);
      } else {
        setProducts([]);
        setFromDatabase(false);
      }
    } catch {
      setProducts([]);
      setFromDatabase(false);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load().then(() => {
      if (cancelled) return;
    });
    return () => {
      cancelled = true;
    };
  }, [load, productsVersion]);

  return { products, loading, fromDatabase, refresh: load };
}

export function useCatalogProductIds(ids: string[]) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { productsVersion } = useRealtime();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (ids.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }
      try {
        const all = await fetchCatalogProducts();
        if (cancelled) return;
        const matched = all.filter((p) => ids.includes(p.id));
        setProducts(matched.length > 0 ? matched : PRODUCTS.filter((p) => ids.includes(p.id)));
      } catch {
        if (!cancelled) setProducts(PRODUCTS.filter((p) => ids.includes(p.id)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [ids.join(","), productsVersion]);

  return { products, loading };
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`/backend-api/products/slug/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (res.ok && data.product) return toProduct(data.product);
  } catch {
    /* fallback below */
  }
  return PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export type CategoryFilter = { name: string; image?: string };

export function useCategoryFilters(section: Category) {
  const [filters, setFilters] = useState<CategoryFilter[]>([]);
  const { categoriesVersion } = useRealtime();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/backend-api/categories?type=${section}`, { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && Array.isArray(data.categories) && data.categories.length > 0) {
          setFilters(
            data.categories.map((c: { name: string; image?: string }) => ({
              name: c.name,
              image: c.image,
            })),
          );
        }
      } catch {
        /* keep empty — pages pass static fallback */
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [section, categoriesVersion]);

  return filters;
}

export async function fetchPublicCategories(section?: Category) {
  try {
    const query = section ? `?type=${section}` : "";
    const res = await fetch(`/backend-api/categories${query}`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok && Array.isArray(data.categories)) return data.categories;
  } catch {
    /* ignore */
  }
  return [];
}
