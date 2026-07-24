import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Star, Sparkles, Play, ChevronDown, ShoppingBag, Truck, Shield, Gem, Flower2, Trash2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { formatINR, PRODUCTS } from "@/lib/products";
import { useCatalogProducts } from "@/lib/catalog";
import { useRealtime } from "@/lib/realtime-context";
import { useAuth } from "@/lib/auth-context";
import { BRAND } from "@/lib/contact";
import { InstagramFeed } from "@/components/InstagramFeed";
import { HandloomEdit } from "@/components/HandloomEdit";
import { apiJson } from "@/lib/backend";
import { toast } from "sonner";
import type { InstagramFeedItem } from "@/lib/instagram";
import hero from "/saree_hero_banner.png";
import catSarees from "/saree-category.jpeg";
import catJewellery from "/jewellery-category.jpeg";
import catCombos from "/combo-category.jpeg";
import editorial from "@/assets/editorial.jpg";
import p2 from "/under999saree.jpeg";
import p4 from "/under599jewellery.jpeg";
import budgetSareeMobile from "/budget-saree-mobile.jpeg";
import budgetJewelleryMobile from "/budget-jewellery-mobile.jpeg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sashvi Studio — Sarees & Jewellery" },
      {
        name: "description",
        content: "Curated sarees, South Indian jewellery & styled combos. Styled to Complete You.",
      },
      { property: "og:title", content: "Sashvi Studio — Styled to Complete You" },
      {
        property: "og:description",
        content: "Luxury sarees, jewellery & combos curated for every occasion.",
      },
    ],
  }),
  component: Home,
});

function SectionHeading({
  eyebrow,
  title,
  link,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  link?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-6 sm:mb-10 flex items-end justify-between gap-6">
      <div>
        <div className="eyebrow mb-2 sm:mb-3">{eyebrow}</div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-foreground">{title}</h2>
      </div>
      {link && (
        <Link
          to={link}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-foreground/70 hover:text-accent"
        >
          {linkLabel ?? "View all"} <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Link>
      )}
    </div>
  );
}

function Home() {
  const { products } = useCatalogProducts();
  const { instagramFeedVersion } = useRealtime();
  const { isLoggedIn } = useAuth();
  const [instagramFeed, setInstagramFeed] = useState<InstagramFeedItem[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const reviewsScrollRef = useRef<HTMLDivElement>(null);
  const newArrivals = products.filter((p) => p.isNew).slice(0, 6);
  const featured = products.filter((p) => p.isFeatured).slice(0, 4);
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 6);

  // Auto-scroll reviews every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % 15);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to current review when index changes
  useEffect(() => {
    if (reviewsScrollRef.current) {
      const scrollAmount = reviewsScrollRef.current.clientWidth * currentReviewIndex;
      
      // If wrapping around (going from last to first), temporarily disable animation
      if (currentReviewIndex === 0) {
        reviewsScrollRef.current.scrollTo({
          left: 0,
          behavior: 'auto'
        });
      } else {
        reviewsScrollRef.current.scrollTo({
          left: scrollAmount,
          behavior: 'smooth'
        });
      }
    }
  }, [currentReviewIndex]);

  // Fetch Instagram feed from database
  useEffect(() => {
    fetch("/backend-api/instagram-feed")
      .then((res) => {
        console.log("Instagram feed response status:", res.status);
        return res.json();
      })
      .then((data) => {
        console.log("Instagram feed raw data:", data);
        // Backend already transforms data to correct format
        const transformed = (data.feed || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          url: item.url,
          mediaType: item.mediaType,
          thumbnail: item.thumbnail,
          productMap: item.productMap || {},
          caption: item.caption,
          isActive: item.isActive,
          linkedProducts: item.linkedProducts || [],
        }));
        console.log("Instagram feed transformed:", transformed);
        if (transformed.length > 0) {
          console.log("First item linkedProducts:", transformed[0].linkedProducts);
        }
        setInstagramFeed(transformed);
      })
      .catch((err) => {
        console.warn("Failed to fetch Instagram feed:", err);
        setInstagramFeed([]);
      });
  }, [instagramFeedVersion]);

  // Fetch user's reviews when logged in
  useEffect(() => {
    if (!isLoggedIn) {
      setMyReviews([]);
      return;
    }

    apiJson<{ reviews: any[] }>("/reviews/my-reviews", {}, true)
      .then((res) => setMyReviews(res.reviews || []))
      .catch((err) => {
        console.error('Failed to fetch reviews:', err);
        setMyReviews([]);
      });
  }, [isLoggedIn]);

  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden" style={{ backgroundColor: '#FFF9F4' }}>
        {/* Desktop: Full width banner */}
        <div className="hidden md:block relative px-8 py-12">
          <div className="overflow-hidden rounded-[2rem] shadow-luxe">
            <img
              src={hero}
              alt="Model in deep maroon Mysore silk saree with temple gold jewellery"
              width={1536}
              height={1024}
              className="h-[650px] w-full object-cover object-center"
            />
          </div>
        </div>

        {/* Mobile/Tablet: Original layout */}
        <div className="container-luxe grid items-center gap-6 py-8 sm:py-12 md:hidden">
          <div className="order-2">
            {/* Brand Introduction */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex items-center justify-center gap-2 sm:gap-4 mb-3 sm:mb-6">
                <span style={{ color: '#C79A42', fontSize: '12px sm:text-xl' }}>✦</span>
                <span className="uppercase tracking-widest" style={{ color: '#C79A42', fontSize: '10px sm:text-[15px]', letterSpacing: '2px sm:tracking-widest' }}>
                  THE SASHVI EDIT
                </span>
                <span style={{ color: '#C79A42', fontSize: '12px sm:text-xl' }}>✦</span>
              </div>
              
              <h2 className="font-display font-semibold leading-tight mb-3 sm:mb-6 text-center" style={{ color: '#4A2B24', fontSize: '20px sm:text-4xl' }}>
                Styled to Complete You.
              </h2>
              
              <div className="w-12 sm:w-24 h-0.5 mx-auto mb-3 sm:mb-6" style={{ backgroundColor: '#C79A42' }} />
              
              <p className="leading-relaxed text-center px-2" style={{ color: '#5B463C', fontSize: '12px sm:text-lg', lineHeight: '1.6' }}>
                At Sashvi Studio, every piece is thoughtfully curated with care and intention.
                <br className="hidden sm:block" />
                From handpicked sarees for every mood and moment, to our Handloom & Artisanal collections celebrating India's rich textile heritage, and our unique imitation jewellery inspired by both trending and classic designs — we bring you timeless elegance with a touch of today.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="rounded-[16px] sm:rounded-[24px] bg-white p-1.5 sm:p-6 mb-2 sm:mb-8" style={{ boxShadow: '0 4px 20px rgba(74, 43, 36, 0.08)', border: '1px solid #E7D8C6' }}>
              <div className="grid grid-cols-3 gap-0.5 sm:gap-6">
                <div className="text-center">
                  <div className="w-3 h-3 sm:w-12 sm:h-12 rounded-full mx-auto mb-0.5 sm:mb-3 flex items-center justify-center" style={{ backgroundColor: '#FFF9F4' }}>
                    <ShoppingBag className="h-3 w-3 sm:h-8 sm:w-8" style={{ color: '#C79A42' }} />
                  </div>
                  <div className="w-2 sm:w-12 h-0.5 mx-auto mb-0.5 sm:mb-3" style={{ backgroundColor: '#C79A42' }} />
                  <h3 className="font-display font-semibold mb-0.5 sm:mb-2 text-[12px] sm:text-base" style={{ color: '#4A2B24' }}>
                    HANDPICKED SAREE COLLECTIONS
                  </h3>
                </div>

                <div className="text-center">
                  <div className="w-3 h-3 sm:w-12 sm:h-12 rounded-full mx-auto mb-0.5 sm:mb-3 flex items-center justify-center" style={{ backgroundColor: '#FFF9F4' }}>
                    <Flower2 className="h-3 w-3 sm:h-8 sm:w-8" style={{ color: '#C79A42' }} />
                  </div>
                  <div className="w-2 sm:w-12 h-0.5 mx-auto mb-0.5 sm:mb-3" style={{ backgroundColor: '#C79A42' }} />
                  <h3 className="font-display font-semibold mb-0.5 sm:mb-2 text-[12px] sm:text-base" style={{ color: '#4A2B24' }}>
                    HANDLOOM & ARTISANAL COLLECTION
                  </h3>
                </div>

                <div className="text-center">
                  <div className="w-3 h-3 sm:w-12 sm:h-12 rounded-full mx-auto mb-0.5 sm:mb-3 flex items-center justify-center" style={{ backgroundColor: '#FFF9F4' }}>
                    <Gem className="h-3 w-3 sm:h-8 sm:w-8" style={{ color: '#C79A42' }} />
                  </div>
                  <div className="w-2 sm:w-12 h-0.5 mx-auto mb-0.5 sm:mb-3" style={{ backgroundColor: '#C79A42' }} />
                  <h3 className="font-display font-semibold mb-0.5 sm:mb-2 text-[12px] sm:text-base" style={{ color: '#4A2B24' }}>
                    TRENDING & CLASSIC JEWELLERY
                  </h3>
                </div>
              </div>
            </div>

            {/* Trust Strip */}
            <div className="rounded-[16px] sm:rounded-[20px] bg-white p-3 sm:p-6" style={{ border: '1px solid #E7D8C6' }}>
              <div className="grid grid-cols-3 gap-2 sm:gap-6">
                <div className="flex flex-col items-center text-center">
                  <Sparkles className="h-4 w-4 sm:h-8 sm:w-8 mb-1 sm:mb-2" style={{ color: '#C79A42' }} />
                  <p className="text-[9px] sm:text-sm font-medium" style={{ color: '#4A2B24' }}>
                    Quality you can trust and rely on
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Truck className="h-4 w-4 sm:h-8 sm:w-8 mb-1 sm:mb-2" style={{ color: '#C79A42' }} />
                  <p className="text-[9px] sm:text-sm font-medium" style={{ color: '#4A2B24' }}>
                    Secure payments<br />you can count on
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <Shield className="h-4 w-4 sm:h-8 sm:w-8 mb-1 sm:mb-2" style={{ color: '#C79A42' }} />
                  <p className="text-[9px] sm:text-sm font-medium" style={{ color: '#4A2B24' }}>
                    Customer support<br />always available
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1">
            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-secondary/70" />
              <div className="overflow-hidden rounded-[1.75rem] shadow-luxe">
                <img
                  src={hero}
                  alt="Model in deep maroon Mysore silk saree with temple gold jewellery"
                  width={1536}
                  height={1024}
                  className="h-[260px] w-full object-cover object-center sm:h-[460px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: Content below banner */}
        <div className="hidden md:block container-luxe pt-2 pb-6">
          {/* Brand Introduction */}
          <div className="text-left mb-8">
            <div className="flex items-center justify-start gap-4 mb-6">
              <span style={{ color: '#C79A42', fontSize: '20px' }}>✦</span>
              <span className="uppercase tracking-widest" style={{ color: '#C79A42', fontSize: '15px', letterSpacing: 'tracking-widest' }}>
                THE SASHVI EDIT
              </span>
              <span style={{ color: '#C79A42', fontSize: '20px' }}>✦</span>
            </div>
            
            <h2 className="font-display font-semibold leading-tight mb-6 text-left" style={{ color: '#4A2B24', fontSize: '48px' }}>
              Styled to Complete You.
            </h2>
            
            <div className="w-24 h-0.5 mb-6" style={{ backgroundColor: '#C79A42' }} />
            
            <p className="leading-relaxed text-left" style={{ color: '#5B463C', fontSize: '20px', lineHeight: '1.6' }}>
              At Sashvi Studio, every piece is thoughtfully curated with care and intention.
              <br />
              From handpicked sarees for every mood and moment, to our Handloom & Artisanal collections celebrating India's rich textile heritage, and our unique imitation jewellery inspired by both trending and classic designs — we bring you timeless elegance with a touch of today.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="rounded-[24px] bg-white p-8 mb-8" style={{ boxShadow: '0 4px 20px rgba(74, 43, 36, 0.08)', border: '1px solid #E7D8C6' }}>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-left">
                <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center" style={{ backgroundColor: '#FFF9F4' }}>
                  <ShoppingBag className="h-8 w-8" style={{ color: '#C79A42' }} />
                </div>
                <div className="w-12 h-0.5 mb-3" style={{ backgroundColor: '#C79A42' }} />
                <h3 className="font-display font-semibold mb-2 text-base" style={{ color: '#4A2B24' }}>
                  HANDPICKED SAREE COLLECTIONS
                </h3>
              </div>

              <div className="text-left">
                <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center" style={{ backgroundColor: '#FFF9F4' }}>
                  <Flower2 className="h-8 w-8" style={{ color: '#C79A42' }} />
                </div>
                <div className="w-12 h-0.5 mb-3" style={{ backgroundColor: '#C79A42' }} />
                <h3 className="font-display font-semibold mb-2 text-base" style={{ color: '#4A2B24' }}>
                  HANDLOOM & ARTISANAL COLLECTION
                </h3>
              </div>

              <div className="text-left">
                <div className="w-12 h-12 rounded-full mb-3 flex items-center justify-center" style={{ backgroundColor: '#FFF9F4' }}>
                  <Gem className="h-8 w-8" style={{ color: '#C79A42' }} />
                </div>
                <div className="w-12 h-0.5 mb-3" style={{ backgroundColor: '#C79A42' }} />
                <h3 className="font-display font-semibold mb-2 text-base" style={{ color: '#4A2B24' }}>
                  TRENDING & CLASSIC JEWELLERY
                </h3>
              </div>
            </div>
          </div>

          {/* Trust Strip */}
          <div className="rounded-[20px] bg-white p-6" style={{ border: '1px solid #E7D8C6' }}>
            <div className="grid grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <Sparkles className="h-8 w-8 mb-2" style={{ color: '#C79A42' }} />
                <p className="text-sm font-medium" style={{ color: '#4A2B24' }}>
                  Quality you can trust and rely on
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Truck className="h-8 w-8 mb-2" style={{ color: '#C79A42' }} />
                <p className="text-sm font-medium" style={{ color: '#4A2B24' }}>
                  Secure payments<br />you can count on
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Shield className="h-8 w-8 mb-2" style={{ color: '#C79A42' }} />
                <p className="text-sm font-medium" style={{ color: '#4A2B24' }}>
                  Customer support<br />always available
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Free Shipping Banner */}
      <section className="container-luxe py-6 sm:py-8">
        <div className="rounded-2xl bg-accent/10 border border-accent/20 p-4 sm:p-6 text-center">
          <p className="text-sm sm:text-base font-medium" style={{ color: '#4A2B24' }}>
            Free shipping on orders above ₹1000
          </p>
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="container-luxe py-8 sm:py-12">
        <SectionHeading eyebrow="Curated Worlds" title="Shop By Category" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 sm:gap-5">
          {[
            {
              to: "/sarees",
              title: "Sarees",
              img: catSarees,
              copy: "Silks, mul cottons, designer, handlooms & more",
            },
            {
              to: "/jewellery",
              title: "Jewellery",
              img: catJewellery,
              copy: "Temple, Antique, Jadau Kundan, Oxidised & more",
            },
            {
              to: "/combos",
              title: "Combos",
              img: catCombos,
              copy: "Saree & Jewellery sets",
            },
          ].map((c) => (
            <Link
              key={c.title}
              to={c.to}
              className="group relative overflow-hidden rounded-[1.5rem] ring-1 ring-border"
            >
              <div className="aspect-[3/4] sm:aspect-[4/5] overflow-hidden bg-secondary">
                <img
                  src={c.img}
                  alt={c.title}
                  loading="lazy"
                  className="h-full w-full object-cover object-center sm:object-cover transition duration-[1200ms] group-hover:scale-105"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent p-3 sm:p-6 text-background">
                <div className="font-display text-lg sm:text-2xl sm:text-3xl">{c.title}</div>
                <div className="mt-1 text-[0.6rem] sm:text-[0.65rem] uppercase tracking-widest opacity-90">{c.copy}</div>
                <div className="mt-2 sm:mt-3 inline-flex items-center gap-1 text-[0.65rem] sm:text-xs font-medium">
                  Explore <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="container-luxe py-8 sm:py-12">
        <SectionHeading eyebrow="Just In" title="New Arrivals" link="/new-arrivals" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6 overflow-x-auto sm:overflow-visible flex sm:grid pb-4 sm:pb-0 scrollbar-hide">
          {newArrivals.map((p) => (
            <div key={p.id} className="min-w-[calc(50%-0.375rem)] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
              <ProductCard product={p} stock={p.stock} />
            </div>
          ))}
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="container-luxe py-8 sm:py-12">
        <SectionHeading eyebrow="Customer Favorites" title="Best Sellers" link="/best-sellers" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6 overflow-x-auto sm:overflow-visible flex sm:grid pb-4 sm:pb-0 scrollbar-hide">
          {bestSellers.map((p) => (
            <div key={p.id} className="min-w-[calc(50%-0.375rem)] sm:min-w-0 flex-shrink-0 sm:flex-shrink">
              <ProductCard product={p} stock={p.stock} />
            </div>
          ))}
        </div>
      </section>

      <HandloomEdit />

      {/* BUDGET STORE */}
      <section className="container-luxe py-8 sm:py-12">
        <SectionHeading eyebrow="Budget Store" title="Beautiful · Affordable · Effortless" />
        <div className="grid gap-3 sm:gap-5 md:grid-cols-2">
          {[
            { 
              to: "/sarees", 
              tag: "Sarees Under ₹999", 
              img: p2, 
              mobileImg: budgetSareeMobile,
              eyebrow: "Sarees", 
              price: "₹999" 
            },
            {
              to: "/jewellery",
              tag: "Jewellery Under ₹599",
              img: p4,
              mobileImg: budgetJewelleryMobile,
              eyebrow: "Jewellery",
              price: "₹599",
            },
          ].map((c) => (
            <Link
              key={c.tag}
              to={c.to}
              search={{ tag: c.tag }}
              className="group relative grid grid-cols-[1fr_1fr] sm:grid-cols-[1fr_1fr] overflow-hidden rounded-[1.5rem] bg-card ring-1 ring-border"
            >
              <div className="p-4 sm:p-7 md:p-10">
                <div className="eyebrow mb-2 sm:mb-4 text-[0.65rem] sm:text-xs">{c.eyebrow} · Budget Store</div>
                <h3 className="font-display text-xl sm:text-3xl md:text-4xl leading-tight text-foreground">
                  Under {c.price}
                </h3>
                <p className="mt-1.5 sm:mt-3 text-xs sm:text-sm text-muted-foreground">
                  Carefully curated styles at gentle prices — without compromising elegance.
                </p>
                <span className="mt-3 sm:mt-6 inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-accent h-8 sm:h-10">
                  Shop now <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </span>
              </div>
              <div className="overflow-hidden">
                <picture>
                  <source srcSet={c.mobileImg} media="(max-width: 640px)" />
                  <img
                    src={c.img}
                    alt={c.tag}
                    loading="lazy"
                    className="h-full w-full object-cover object-[10%_center] scale-100 transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </picture>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* MY REVIEWS - Only shown when logged in */}
      {isLoggedIn && myReviews.length > 0 && (
        <section className="container-luxe py-8 sm:py-12">
          <SectionHeading eyebrow="Your Reviews" title="My Reviews" link="/my-account" linkLabel="View all" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {myReviews.slice(0, 3).map((review) => {
              const productName = review.products?.name || "Product";
              const productSlug = review.products?.slug;
              return (
                <div
                  key={review.id}
                  className="rounded-[1.5rem] border border-border bg-card p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      {productSlug ? (
                        <Link
                          to="/product/$slug"
                          params={{ slug: productSlug }}
                          className="font-medium hover:text-accent transition"
                        >
                          {productName}
                        </Link>
                      ) : (
                        <span className="font-medium">{productName}</span>
                      )}
                      <div className="flex items-center gap-1 mt-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        {!review.has_edited && productSlug && (
                          <button
                            onClick={() => {
                              window.location.href = `/product/${productSlug}`;
                            }}
                            className="text-muted-foreground hover:text-accent transition"
                            title="Edit review"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this review?")) {
                              apiJson(`/reviews/${review.id}`, { method: "DELETE" }, true)
                                .then(() => {
                                  setMyReviews(myReviews.filter((r) => r.id !== review.id));
                                  toast.success("Review deleted successfully");
                                })
                                .catch(() => toast.error("Failed to delete review"));
                            }
                          }}
                          className="text-muted-foreground hover:text-destructive transition"
                          title="Delete review"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80">{review.review_text}</p>
                  {review.has_edited && (
                    <div className="mt-2 text-xs text-muted-foreground italic">
                      (Edited)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <InstagramFeed feed={instagramFeed} />

      {/* FAQ */}
      <FaqSection />

      {/* REVIEWS */}
      <section className="container-luxe py-6 sm:py-12">
        <SectionHeading eyebrow="Customer Stories" title="Loved by patrons across India" />
        <div 
          ref={reviewsScrollRef}
          className="flex gap-3 sm:gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {[
            {
              name: "Ananya R.",
              city: "Bengaluru",
              quote:
                "The Mysore silk is dreamy — the gold border catches the light beautifully. The packaging felt like a gift to myself.",
              rating: 5,
            },
            {
              name: "Lakshmi V.",
              city: "Chennai",
              quote:
                "Bought the temple necklace set for my wedding receptions. Quality is exceptional and styling tips were so helpful.",
              rating: 5,
            },
            {
              name: "Sneha K.",
              city: "Hyderabad",
              quote:
                "My go-to for everyday mul cottons. Soft, breathable, and the block prints are gorgeous.",
              rating: 5,
            },
            {
              name: "Priya M.",
              city: "Mumbai",
              quote:
                "The kundan set I ordered exceeded my expectations. The craftsmanship is stunning and it arrived beautifully packaged.",
              rating: 5,
            },
            {
              name: "Meera R.",
              city: "Pune",
              quote:
                "The jhumka earrings are lightweight yet elegant. Perfect for both daily wear and special occasions.",
              rating: 5,
            },
            {
              name: "Kavya N.",
              city: "Kolkata",
              quote:
                "Love the handloom collection! The texture and weave are authentic. Will definitely order again.",
              rating: 5,
            },
            {
              name: "Riya P.",
              city: "Ahmedabad",
              quote:
                "The combo set was perfect for my engagement. Saree and jewellery matched beautifully. Great value!",
              rating: 5,
            },
            {
              name: "Anjali T.",
              city: "Jaipur",
              quote:
                "The temple jewellery set looks even better in person. The gold plating is of excellent quality.",
              rating: 5,
            },
            {
              name: "Deepika S.",
              city: "Mysore",
              quote:
                "The long haaram I purchased is absolutely stunning. The length is perfect and the craftsmanship is impeccable.",
              rating: 5,
            },
            {
              name: "Neha K.",
              city: "Chandigarh",
              quote:
                "Fast delivery and amazing customer service. The product quality matches the description perfectly.",
              rating: 5,
            },
            {
              name: "Pooja S.",
              city: "Indore",
              quote:
                "The silk saree has a beautiful drape. The color is rich and the border work is intricate.",
              rating: 5,
            },
            {
              name: "Sonal M.",
              city: "Nagpur",
              quote:
                "Ordered a necklace set for my sister's birthday. She loved it! The design is elegant and the quality is premium.",
              rating: 5,
            },
            {
              name: "Tanvi R.",
              city: "Bhopal",
              quote:
                "The mul cotton sarees are perfect for summers. Lightweight, breathable, and beautiful prints.",
              rating: 5,
            },
            {
              name: "Ishita D.",
              city: "Coimbatore",
              quote:
                "The packaging was so elegant. The saree arrived in perfect condition. Highly recommend!",
              rating: 5,
            },
          ].map((r) => (
            <article 
              key={r.name} 
              className="rounded-[1.5rem] border border-border bg-card p-4 sm:p-7 flex-shrink-0 w-full sm:w-[calc(33.333%-0.67rem)] md:w-[calc(33.333%-1.33rem)] snap-start"
            >
              <div className="flex gap-0.5 text-accent">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current" />
                ))}
              </div>
              <p className="mt-3 sm:mt-4 text-[0.8rem] sm:text-base text-foreground/85 leading-relaxed">"{r.quote}"</p>
              <div className="mt-4 sm:mt-6 flex items-center gap-2 sm:gap-3 border-t border-border pt-3 sm:pt-4">
                <div className="grid h-8 w-8 sm:h-10 sm:w-10 place-items-center rounded-full bg-secondary font-display text-sm sm:text-base text-foreground">
                  {r.name[0]}
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-medium text-foreground">{r.name}</div>
                  <div className="text-[0.65rem] sm:text-xs text-muted-foreground">{r.city}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Layout>
  );
}

const FAQ_ITEMS = [
  {
    question: "Are your sarees authentic?",
    answer:
      "Yes. We carefully curate authentic sarees, including Mysore Silk, Mul Cotton, Handloom, and Artisanal collections sourced from skilled weavers and trusted artisans across India. We offer both Pure Silk and Semi Silk sarees. Fabric composition is clearly mentioned in each product description.",
  },
  {
    question: "Do all sarees come with a blouse piece?",
    answer:
      "No. While many sarees include a matching blouse piece, several Mul Cotton sarees and selected handcrafted collections may not. Please refer to the product description for complete details.",
  },
  {
    question: "Do you offer stitched blouses?",
    answer:
      "Yes. We offer ready-to-wear stitched blouses and curated saree & stitched blouse combos on selected products.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept UPI, Credit Cards, Debit Cards, Net Banking, Wallets, and Cash on Delivery (COD) for eligible locations. A 10% advance payment is required to confirm all COD orders. The remaining amount can be paid at the time of delivery.",
  },
  {
    question: "Do you offer free shipping?",
    answer:
      "Yes. We offer Free Shipping across India on all prepaid orders above ₹1,000. Applicable shipping charges for other orders will be displayed during checkout.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Orders are generally dispatched within 1–3 business days and delivered within 3–7 business days across India, depending on your location. A tracking link will be shared via Email or WhatsApp once your order is dispatched.",
  },
  {
    question: "Do you accept returns or exchanges?",
    answer:
      "We do not accept returns. Exchanges are offered only if you receive a damaged or incorrect product, and the request must be raised within 7 days from delivery. A clear, continuous, uncut unboxing video is mandatory for all exchange claims.",
  },
  {
    question: "Will the saree colour be exactly the same as shown?",
    answer:
      "We strive to display our products as accurately as possible. However, slight colour variations may occur due to photography, lighting, or individual screen settings.",
  },
  {
    question: "Do handcrafted and naturally dyed sarees require special care?",
    answer:
      "Yes. Handloom, block-printed, embroidered, and handcrafted sarees may have slight variations in weave, print, or texture — these are natural characteristics, not defects. Some sarees may release excess colour during the first few washes; wash separately with mild detergent and dry in shade.",
  },
  {
    question: "Can I request additional photos or videos before placing an order?",
    answer:
      "Absolutely! If you'd like additional photos, close-up details, or a drape video of any product, feel free to contact us via WhatsApp or Instagram before placing your order.",
  },
  {
    question: "How can I contact Sashvi Studio?",
    answer:
      "For any queries or assistance, please reach out to us at: Email — sashvistudio26@gmail.com",
  },
];

function FaqSection() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <section className="container-luxe py-20">
      <SectionHeading eyebrow="Help Center" title="Frequently Asked Questions" />
      <div className="divide-y divide-border rounded-[1.5rem] border border-border bg-card shadow-soft overflow-hidden">
        {FAQ_ITEMS.map((faq) => {
          const isOpen = openFaq === faq.question;
          return (
            <div key={faq.question}>
              <button
                onClick={() => setOpenFaq(isOpen ? null : faq.question)}
                className="flex w-full items-center justify-between gap-4 px-8 py-6 text-left hover:bg-secondary/50 transition-colors"
                aria-expanded={isOpen}
              >
                <span className="font-semibold text-foreground">{faq.question}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="px-8 pb-6 text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
