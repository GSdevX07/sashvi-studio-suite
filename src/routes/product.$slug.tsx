import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  Heart,
  MessageCircle,
  Minus,
  Plus,
  Share2,
  Star,
  Truck,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { getProduct, formatINR } from "@/lib/products";
import { fetchProductBySlug, useCatalogProducts } from "@/lib/catalog";
import { BRAND, waLink } from "@/lib/contact";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { toast } from "sonner";
import { apiJson, getAuthToken } from "@/lib/backend";
import { useRealtime } from "@/lib/realtime-context";
import { getPremiumDiscountBadge, hasProductDiscount, normalizeDiscountFields } from "@/lib/discount";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const fallback = getProduct(params.slug);
    // Don't throw notFound - let the component fetch from database
    return { slug: params.slug, fallback };
  },
  head: ({ loaderData }) => ({
    meta: loaderData?.fallback
      ? [
          { title: `${loaderData.fallback.name} — Sashvi Studio` },
          { name: "description", content: loaderData.fallback.description },
          { property: "og:title", content: loaderData.fallback.name },
          { property: "og:description", content: loaderData.fallback.description },
          { property: "og:image", content: loaderData.fallback.image },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <Layout>
      <div className="container-luxe py-32 text-center">
        <h1 className="font-display text-4xl">Product not found</h1>
        <Link
          to="/sarees"
          className="mt-6 inline-flex rounded-full bg-foreground px-6 py-3 text-sm uppercase tracking-widest text-background"
        >
          Continue shopping
        </Link>
      </div>
    </Layout>
  ),
  errorComponent: ({ error }) => (
    <Layout>
      <div className="container-luxe py-24 text-center text-muted-foreground">{error.message}</div>
    </Layout>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug, fallback } = Route.useLoaderData() as {
    slug: string;
    fallback: ReturnType<typeof getProduct>;
  };
  
  // ALL hooks must be called at the top level
  const [product, setProduct] = useState(fallback);
  const [loading, setLoading] = useState(!fallback);
  const [notFound, setNotFound] = useState(false);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [stock, setStock] = useState<number>(999);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const { productsVersion } = useRealtime();
  const { addItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, review_text: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Call hooks at the top level - no conditional hooks
  const category = fallback?.categories?.[0];
  const { products: catalogProducts } = useCatalogProducts(category);

  useEffect(() => {
    if (fallback) {
      setProduct(fallback);
      setLoading(false);
      // If product has variants, select first variant's color, otherwise use main color
      if (fallback.colorVariants && fallback.colorVariants.length > 0) {
        setSelectedColor(fallback.colorVariants[0].color);
      } else {
        setSelectedColor(fallback.color || "");
      }
      return;
    }

    // Fetch from database if not in static list
    fetchProductBySlug(slug).then((p) => {
      if (p) {
        setProduct(p);
        setLoading(false);
        // If product has variants, select first variant's color, otherwise use main color
        if (p.colorVariants && p.colorVariants.length > 0) {
          setSelectedColor(p.colorVariants[0].color);
        } else {
          setSelectedColor(p.color || "");
        }
      } else {
        setNotFound(true);
        setLoading(false);
      }
    });
  }, [slug, fallback]);

  useEffect(() => {
    if (!product) return;

    // If a color is selected, use variant stock, otherwise use main product stock
    if (selectedColor && product.colorVariants) {
      const selectedVariant = product.colorVariants.find((v: any) => v.color === selectedColor);
      if (selectedVariant) {
        setStock(selectedVariant.stock ?? 0);
        return;
      }
    }

    // Fallback to main product stock
    apiJson<{ product: { stock: number } }>(`/products/${product.id}`, {}, false)
      .then((res) => {
        if (res.product?.stock !== undefined) {
          setStock(res.product.stock);
        }
      })
      .catch(() => {
        setStock(product.stock ?? 999);
      });
  }, [product, productsVersion, selectedColor]);

  // Fetch reviews for the product
  useEffect(() => {
    if (!product) return;

    apiJson<{ reviews: any[] }>(`/reviews/product/${product.id}`, {}, false)
      .then((res) => {
        setReviews(res.reviews || []);
      })
      .catch(() => {
        setReviews([]);
      });
  }, [product]);

  // Submit review
  const handleSubmitReview = async () => {
    if (!product) return;

    // Check if user is logged in
    const token = getAuthToken();
    if (!token) {
      toast.error("Please login to submit a review");
      return;
    }

    if (!reviewForm.review_text.trim()) {
      toast.error("Please write a review");
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await apiJson<{ review: any }>(
        "/reviews",
        {
          method: "POST",
          body: JSON.stringify({
            product_id: product.id,
            rating: reviewForm.rating,
            review_text: reviewForm.review_text,
          }),
        },
        true,
      );

      if (res.review) {
        setReviews([res.review, ...reviews]);
        setReviewForm({ rating: 5, review_text: "" });
        toast.success("Review submitted successfully");
      }
    } catch (err: any) {
      if (err?.error === "already_reviewed") {
        toast.error("You have already reviewed this product");
      } else {
        toast.error("Failed to submit review");
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  // Conditional returns AFTER all hooks
  if (loading) {
    return (
      <Layout>
        <div className="container-luxe py-32 text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (notFound || !product) {
    return (
      <Layout>
        <div className="container-luxe py-32 text-center">
          <h1 className="font-display text-4xl">Product not found</h1>
          <Link
            to="/sarees"
            className="mt-6 inline-flex rounded-full bg-foreground px-6 py-3 text-sm uppercase tracking-widest text-background"
          >
            Continue shopping
          </Link>
        </div>
      </Layout>
    );
  }

  const images =
    product.images && product.images.length
      ? product.images
      : [product.image, product.image, product.image];
  const related = (catalogProducts ?? [])
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  const wishlisted = isWishlisted(product.id);
  const discountBadge = getPremiumDiscountBadge(product);

  const handleAddToCart = () => {
    const discount = normalizeDiscountFields(product);
    
    // Find the selected variant if a color is selected
    const selectedVariant = product.colorVariants?.find((v: any) => v.color === selectedColor);
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      qty,
      discountType: discount.discountType,
      discountValue: discount.discountValue,
      variant_id: selectedVariant?.id,
      selected_color: selectedColor || selectedVariant?.color,
      buyOneGetOne: product.buyOneGetOne,
    });
    toast.success("Added to cart");
  };

  // Safe access to categories
  const firstCategory = product.categories?.[0];
  const categoryPath = firstCategory === "sarees"
    ? "/sarees"
    : firstCategory === "jewellery"
      ? "/jewellery"
      : "/combos";

  return (
    <Layout>
      <div className="container-luxe py-4 sm:py-6">
        <nav className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>{" "}
          /{" "}
          <Link
            to={categoryPath}
            className="hover:text-foreground capitalize"
          >
            {firstCategory || "Products"}
          </Link>{" "}
          / <span className="text-foreground">{product.name}</span>
        </nav>
      </div>

      <section className="container-luxe grid gap-6 pb-12 md:gap-10 md:pb-16 md:grid-cols-[1.05fr_1fr]">
        <div className="grid gap-3 md:grid-cols-[80px_1fr]">
          <div className="order-2 flex gap-2 overflow-x-auto md:order-1 md:flex-col md:gap-3">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`shrink-0 overflow-hidden rounded-xl ring-1 transition ${activeImg === i ? "ring-accent" : "ring-border"}`}
              >
                <img
                  src={src}
                  alt={`${product.name} ${i + 1}`}
                  className="h-16 w-16 sm:h-20 sm:w-20 object-cover"
                />
              </button>
            ))}
          </div>
          <div className="order-1 overflow-hidden rounded-[1.5rem] ring-1 ring-border md:order-2 relative">
            <img
              src={images[activeImg]}
              alt={product.name}
              className="aspect-[4/5] w-full object-cover transition duration-700 hover:scale-105"
            />
            {stock === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="rounded-full bg-destructive px-6 py-3 text-lg font-semibold text-destructive-foreground shadow-lg">
                  Out of Stock
                </span>
              </div>
            )}
            {hasProductDiscount(product) && discountBadge ? (
              <span className="absolute right-4 top-4 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent-foreground shadow-soft">
                {discountBadge}
              </span>
            ) : null}
          </div>
        </div>

        <div>
          <div className="eyebrow mb-2 sm:mb-3">{product.tags[0]}</div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-5xl leading-tight">{product.name}</h1>

          <div className="mt-3 sm:mt-4 flex items-center gap-3">
            <div className="flex gap-0.5 text-accent">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.round(product.rating ?? 5) ? "fill-current" : ""}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {product.rating?.toFixed(1)} · {product.reviewCount} reviews
            </span>
          </div>

          <div className="mt-4 sm:mt-5 flex items-baseline gap-3">
            {(() => {
              const d = normalizeDiscountFields(product);
              const hasDiscount = d.discountType !== "none" && d.discountValue > 0;
              const salePrice = hasDiscount 
                ? (d.discountType === "percent" 
                    ? Math.max(0, product.price - (product.price * d.discountValue / 100))
                    : Math.max(0, product.price - d.discountValue))
                : product.price;
              return (
                <>
                  <span className="font-display text-2xl sm:text-3xl text-foreground">
                    {formatINR(salePrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-lg text-muted-foreground line-through">{formatINR(product.price)}</span>
                  )}
                </>
              );
            })()}
          </div>

          <p className="mt-4 sm:mt-6 text-sm sm:text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">{product.description}</p>

          <div className="mt-4 sm:mt-6 flex flex-wrap gap-2">
            {product.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-secondary px-3 py-1 text-xs text-foreground/70"
              >
                {t}
              </span>
            ))}
          </div>

          {product.colorVariants && product.colorVariants.length > 0 && (
            <div className="mt-4 sm:mt-6">
              <div className="text-sm font-medium text-foreground mb-2">Color</div>
              <div className="flex flex-wrap items-center gap-2">
                {product.colorVariants.map((variant, index) => (
                  <button
                    key={variant.id || index}
                    onClick={() => setSelectedColor(variant.color)}
                    className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition ${
                      selectedColor === variant.color
                        ? "border-accent scale-110"
                        : "border-border hover:border-accent"
                    }`}
                  >
                    <div
                      className="h-6 w-6 rounded-full"
                      style={{ backgroundColor: variant.color }}
                    />
                  </button>
                ))}
              </div>
              {selectedColor && (
                <span className="mt-2 text-sm text-foreground/80 capitalize">{selectedColor}</span>
              )}
            </div>
          )}

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div className="inline-flex items-center rounded-full border border-border bg-card w-full sm:w-auto justify-center">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-11 w-11 place-items-center hover:text-accent"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center text-sm">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(q + 1, stock))}
                disabled={qty >= stock}
                className="grid h-11 w-11 place-items-center hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={stock <= 0}
              className="flex-1 sm:flex-none w-full rounded-full bg-foreground px-6 py-3.5 text-sm font-medium uppercase tracking-widest text-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {stock <= 0 ? "Out of Stock" : "Add to Cart"}
            </button>
            {stock < 999 && stock > 0 && (
              <div className={`text-xs ${stock < 5 ? "text-orange-500 font-medium" : "text-muted-foreground"}`}>
                {stock < 5 ? `Only ${stock} left in stock` : `${stock} in stock`}
              </div>
            )}
            <button
              aria-label="Wishlist"
              onClick={() => toggle(product.id)}
              className="grid h-12 w-12 place-items-center rounded-full border border-border bg-card hover:border-accent hover:text-accent"
            >
              <Heart className={`h-5 w-5 ${wishlisted ? "fill-accent text-accent" : ""}`} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={waLink(
                `Hi Sashvi Studio, I'd like to enquire about ${product.name} (${formatINR(product.price)}).`,
              )}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-5 py-3 text-sm font-medium hover:border-accent hover:text-accent"
            >
              <MessageCircle className="h-4 w-4 text-accent" /> Enquire on WhatsApp
            </a>
            <button
              onClick={() => {
                const url = window.location.href;
                if (navigator.share) {
                  navigator
                    .share({
                      title: `${product.name} — Sashvi Studio`,
                      text: product.description,
                      url,
                    })
                    .catch(() => {
                      // Ignore abort errors
                    });
                } else {
                  navigator.clipboard.writeText(url);
                  toast.success("Link copied to clipboard");
                }
              }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm hover:border-accent hover:text-accent"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>

        </div>
      </section>

      <section className="container-luxe pb-20">
        <h2 className="mb-8 font-display text-2xl md:text-3xl">You may also love</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4 overflow-x-auto sm:overflow-visible flex sm:grid pb-4 sm:pb-0 scrollbar-hide">
          {related.map((p) => (
            <div key={p.id} className="min-w-[calc(50%-0.375rem)] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
              <ProductCard product={p} stock={p.stock} />
            </div>
          ))}
        </div>
      </section>

      {/* Reviews Section */}
      <section className="container-luxe pb-20">
        <h2 className="mb-8 font-display text-2xl md:text-3xl">Customer Reviews</h2>

        {/* Review Submission Form */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 font-medium text-lg">Write a Review</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    className="text-2xl hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`h-6 w-6 ${star <= reviewForm.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Your Review</label>
              <textarea
                value={reviewForm.review_text}
                onChange={(e) => setReviewForm({ ...reviewForm, review_text: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
                rows={3}
                placeholder="Share your experience with this product..."
              />
            </div>
            <button
              onClick={handleSubmitReview}
              disabled={submittingReview}
              className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium uppercase tracking-widest text-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No reviews yet. Be the first to review this product!
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-medium">{review.user_name}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-sm text-foreground/80">{review.review_text}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </Layout>
  );
}
