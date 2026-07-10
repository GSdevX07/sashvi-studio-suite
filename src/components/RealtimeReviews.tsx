import { useEffect, useMemo, useState } from "react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import { Star, Image, Send } from "lucide-react";
import { PRODUCTS } from "@/lib/products";
import { supabase } from "@/lib/supabase.client";

interface ReviewRecord {
  id: number;
  name: string;
  rating: number;
  comment: string;
  product_slug: string;
  product_image_url?: string;
  verified: boolean;
  created_at: string;
}

const DEFAULT_REVIEWS: ReviewRecord[] = [
  {
    id: 1,
    name: "Ananya R.",
    rating: 5,
    comment: "The Mysore silk is dreamy — the gold border catches the light beautifully.",
    product_slug: "emerald-kanjivaram-silk-saree",
    product_image_url: PRODUCTS[0]?.image,
    verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Lakshmi V.",
    rating: 5,
    comment: "Bought the temple necklace set for my wedding receptions. Quality is exceptional.",
    product_slug: "ruby-temple-necklace-set",
    product_image_url: PRODUCTS[2]?.image,
    verified: true,
    created_at: new Date().toISOString(),
  },
];

export function RealtimeReviews() {
  const [reviews, setReviews] = useState<ReviewRecord[]>(DEFAULT_REVIEWS);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [productSlug, setProductSlug] = useState(PRODUCTS[0]?.slug ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productOptions = useMemo(
    () => PRODUCTS.map((product) => ({ label: product.name, value: product.slug })),
    [],
  );

  useEffect(() => {
    let subscription: RealtimeChannel | null = null;

    async function loadReviews() {
      const { data, error } = await supabase
        .from("reviews")
        .select("id,name,rating,comment,product_slug,product_image_url,verified,created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && data) {
        setReviews(data.filter((review) => review.verified));
      }
    }

    loadReviews();

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      subscription = supabase
        .channel("public:reviews")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "reviews" },
          (payload) => {
            const newReview = payload.new as ReviewRecord;
            if (newReview.verified) {
              setReviews((prev) => [newReview, ...prev]);
            }
          },
        )
        .subscribe();
    } catch (err) {
      console.warn("Realtime subscription failed", err);
    }

    return () => {
      if (subscription) {
        void subscription.unsubscribe();
      }
    };
  }, []);

  async function uploadImage(file: File) {
    try {
      const filename = `reviews/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage.from("review-images").upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error || !data) {
        throw error ?? new Error("Upload failed");
      }
      const { data: urlData } = supabase.storage.from("review-images").getPublicUrl(filename);
      return urlData.publicUrl;
    } catch (err) {
      console.warn("Image upload failed", err);
      return null;
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const payload = {
        name: name.trim() || "Guest",
        email: email.trim(),
        rating,
        comment: comment.trim(),
        product_slug: productSlug,
        product_image_url: imageUrl,
        verified: true,
      };

      const { error } = await supabase.from("reviews").insert(payload);
      if (error) {
        setError(error.message);
      } else {
        setName("");
        setEmail("");
        setRating(5);
        setComment("");
        setImageFile(null);
      }
    } catch (err) {
      setError("Could not submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="container-luxe py-20">
      <div className="grid gap-10 xl:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="eyebrow mb-3">Real-Time Reviews</div>
          <h2 className="font-display text-3xl md:text-4xl text-foreground">
            Verified customer reviews that refresh instantly.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Share your experience with Sashvi Studio and see customer responses appear without
            refreshing the page.
          </p>

          <div className="mt-10 grid gap-4">
            {reviews.slice(0, 4).map((review) => {
              const product = PRODUCTS.find((p) => p.slug === review.product_slug);
              return (
                <article
                  key={review.id}
                  className="rounded-[1.5rem] border border-border bg-card p-6 shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-accent">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-current" />
                        ))}
                        <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                          Verified Purchase
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/85">
                        “{review.comment}”
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{review.name}</span>
                        <span>·</span>
                        <span>{product?.name ?? "Sashvi Studio"}</span>
                      </div>
                    </div>
                    {review.product_image_url ? (
                      <img
                        src={review.product_image_url}
                        alt={product?.name ?? "Review image"}
                        className="h-20 w-20 rounded-2xl object-cover"
                      />
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-card p-6 shadow-soft">
          <div className="mb-6 space-y-2">
            <div className="eyebrow">Leave a Review</div>
            <h3 className="font-display text-2xl text-foreground">Add your voice</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Submit a star rating, optional product image, and your favorite Sashvi Studio
              purchase.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Product
              </label>
              <select
                value={productSlug}
                onChange={(event) => setProductSlug(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
              >
                {productOptions.map((product) => (
                  <option key={product.value} value={product.value}>
                    {product.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Rating
              </label>
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setRating(index + 1)}
                    className={`rounded-full border px-3 py-2 text-sm ${rating === index + 1 ? "border-accent bg-accent/10 text-accent" : "border-border text-foreground/80"}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Review
              </label>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                placeholder="Share your experience"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Product Image (optional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                  className="w-full text-sm text-foreground"
                />
                <Image className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium uppercase tracking-widest text-background transition hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Submitting..." : "Submit review"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
