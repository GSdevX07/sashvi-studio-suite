import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import type { InstagramFeedItem } from "@/lib/instagram";

export function InstagramFeed({ feed }: { feed: InstagramFeedItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Detect mobile/desktop
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const cardsPerSlide = isMobile ? 1 : 3;

  const handleNext = useCallback(() => {
    if (isAnimating || feed.length === 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => {
      const nextIndex = (prev + cardsPerSlide) % feed.length;
      return nextIndex;
    });
    setTimeout(() => setIsAnimating(false), 400);
  }, [isAnimating, feed.length, cardsPerSlide]);

  const handlePrevious = useCallback(() => {
    if (isAnimating || feed.length === 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => {
      const prevIndex = prev - cardsPerSlide;
      return prevIndex < 0 ? 0 : prevIndex;
    });
    setTimeout(() => setIsAnimating(false), 400);
  }, [isAnimating, feed.length, cardsPerSlide]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;
    
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        handleNext(); // Swipe left -> next
      } else {
        handlePrevious(); // Swipe right -> previous
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrevious]);

  // Auto-scroll every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [handleNext]);

  if (feed.length === 0) return null;

  const currentItem = feed[currentIndex];

  return (
    <section className="container-luxe py-8">
      <div className="mb-6 flex items-end justify-between gap-6">
        <div>
          <div className="eyebrow mb-3 text-xs">@sashvi.studio</div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-foreground">Instagram Feed</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Shop the looks from our Instagram journal. Swipe or use arrows to navigate.
          </p>
        </div>
      </div>

      <div className="relative">
        {/* Navigation Buttons */}
        <button
          onClick={handlePrevious}
          disabled={isAnimating}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -translate-x-1/2 md:-translate-x-4 lg:-translate-x-6 h-8 w-8 md:h-12 md:w-12 rounded-full bg-background/90 border border-border flex items-center justify-center text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed shadow-soft transition-all"
          aria-label="Previous"
        >
          <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
        </button>
        <button
          onClick={handleNext}
          disabled={isAnimating}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 translate-x-1/2 md:translate-x-4 lg:translate-x-6 h-8 w-8 md:h-12 md:w-12 rounded-full bg-background/90 border border-border flex items-center justify-center text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed shadow-soft transition-all"
          aria-label="Next"
        >
          <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
        </button>

        {/* Carousel Container */}
        <div
          ref={containerRef}
          className="relative overflow-hidden py-8"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={`flex transition-transform duration-400 ease-out ${isMobile ? 'items-center' : ''}`}
            style={{
              transform: isMobile 
                ? `translateX(calc(50vw - 50% - ${currentIndex * 100}%))`
                : `translateX(-${currentIndex * (100 / cardsPerSlide)}%)`,
              transitionDuration: isAnimating ? "400ms" : "0ms",
            }}
          >
            {feed.map((item, idx) => {
              // Mobile: Cover flow style
              if (isMobile) {
                const isCenter = idx === currentIndex;
                const distance = Math.abs(idx - currentIndex);
                const scale = isCenter ? 1 : 0.7;
                const opacity = isCenter ? 1 : 0.5;
                const zIndex = feed.length - distance;

                return (
                  <div
                    key={item.id}
                    className="min-w-full flex items-center justify-center px-2"
                    style={{
                      transform: `scale(${scale})`,
                      opacity,
                      zIndex,
                      transition: isAnimating ? "transform 400ms ease-out, opacity 400ms ease-out" : "none",
                    }}
                  >
                    <article className="max-w-[200px] md:max-w-[280px] lg:max-w-[320px] w-full overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-soft">
                      <div className="relative bg-secondary aspect-[4/5]">
                        {item.thumbnail ? (
                          item.mediaType === "reel" ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="group relative aspect-[4/5] w-full overflow-hidden block"
                            >
                              <img
                                src={item.thumbnail}
                                alt={item.title}
                                loading="lazy"
                                className="h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.03]"
                              />
                              <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-black/10 to-black/40">
                                <div className="inline-flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft">
                                  <Play className="h-5 w-5 md:h-6 md:w-6" />
                                </div>
                              </div>
                            </a>
                          ) : (
                            <div className="aspect-[4/5] overflow-hidden bg-secondary">
                              <img
                                src={item.thumbnail}
                                alt={item.title}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )
                        ) : (
                          <div className="aspect-[4/5] w-full flex items-center justify-center bg-secondary">
                            <span className="text-muted-foreground text-sm">No image available</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3 md:space-y-4 p-3 md:p-5">
                        <div className="flex items-center justify-between gap-3 text-[10px] md:text-xs uppercase tracking-[0.25em] text-muted-foreground">
                          <span>{item.mediaType === "reel" ? "Reel" : "Post"}</span>
                          <span className="rounded-full border border-border px-1.5 py-0.5 md:px-2 md:py-1">Live</span>
                        </div>
                        <div className="space-y-1 md:space-y-2">
                          <h3 className="font-display text-base md:text-xl text-foreground">{item.title}</h3>
                          <p className="text-xs md:text-sm leading-relaxed text-muted-foreground line-clamp-2">{item.caption}</p>
                        </div>
                        <div className="grid gap-2 md:gap-3 sm:grid-cols-2">
                          {(item.linkedProducts || []).map((lp: any, idx: number) => (
                            <a
                              key={idx}
                              href={lp.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center rounded-full border border-border bg-secondary px-3 py-2 md:px-4 md:py-2.5 text-[10px] md:text-xs font-medium uppercase tracking-widest text-foreground transition hover:border-accent hover:text-accent"
                            >
                              {lp.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    </article>
                  </div>
                );
              }

              // Desktop: Regular 3-card carousel
              return (
                <div
                  key={item.id}
                  className="min-w-[33.333%] px-3"
                >
                  <article className="max-w-[200px] md:max-w-[250px] lg:max-w-[280px] mx-auto w-full overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-soft">
                    <div className="relative bg-secondary aspect-[4/5]">
                      {item.thumbnail ? (
                        item.mediaType === "reel" ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group relative aspect-[4/5] w-full overflow-hidden block"
                          >
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              loading="lazy"
                              className="h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.03]"
                            />
                            <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-black/10 to-black/40">
                              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft">
                                <Play className="h-6 w-6" />
                              </div>
                            </div>
                          </a>
                        ) : (
                          <div className="aspect-[4/5] overflow-hidden bg-secondary">
                            <img
                              src={item.thumbnail}
                              alt={item.title}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )
                      ) : (
                        <div className="aspect-[4/5] w-full flex items-center justify-center bg-secondary">
                          <span className="text-muted-foreground text-sm">No image available</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4 p-5">
                      <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                        <span>{item.mediaType === "reel" ? "Reel" : "Post"}</span>
                        <span className="rounded-full border border-border px-2 py-1">Live</span>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-display text-xl text-foreground">{item.title}</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">{item.caption}</p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(item.linkedProducts || []).map((lp: any, idx: number) => (
                          <a
                            key={idx}
                            href={lp.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-full border border-border bg-secondary px-4 py-2.5 text-xs font-medium uppercase tracking-widest text-foreground transition hover:border-accent hover:text-accent"
                          >
                            {lp.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.ceil(feed.length / cardsPerSlide) }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (!isAnimating) {
                  setIsAnimating(true);
                  setCurrentIndex(idx * cardsPerSlide);
                  setTimeout(() => setIsAnimating(false), 400);
                }
              }}
              disabled={isAnimating}
              className={`h-2 rounded-full transition-all ${
                Math.floor(currentIndex / cardsPerSlide) === idx
                  ? "w-8 bg-accent"
                  : "w-2 bg-border hover:bg-border/80"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* CTA at end of feed */}
        {currentIndex >= feed.length - cardsPerSlide && (
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              You've reached the end of our feed
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              To watch new collections, please visit our Instagram
            </p>
            <a
              href="https://www.instagram.com/sashvi.studio"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium uppercase tracking-widest text-accent-foreground hover:bg-accent/90 transition shadow-soft"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069 3.204 0 3.584.012 4.85.069 3.252.148 4.771 1.699 4.919 4.92.058 1.265.07 1.645.07 4.849 0 3.204-.012 3.584-.069 4.849-.149 3.227-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.645-.07-4.849zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              @sashvi.studio
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
