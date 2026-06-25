import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import type { InstagramFeedItem } from "@/lib/instagram";

function getEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts[0] === "reel") return `https://www.instagram.com/reel/${parts[1]}/embed/`;
    if (parts[0] === "p") return `https://www.instagram.com/p/${parts[1]}/embed/`;
    return url;
  } catch {
    return url;
  }
}

export function InstagramFeed({ feed }: { feed: InstagramFeedItem[] }) {
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <section className="container-luxe py-16">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <div className="eyebrow mb-3">@sashvi.studio</div>
          <h2 className="text-3xl md:text-4xl font-medium text-foreground">Instagram Feed</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Shop the looks from our Instagram journal without leaving the website. View premium posts and reels, then tap to shop the featured saree or jewellery.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {feed.map((item) => {
          const isOpen = openItem === item.id;
          const embedUrl = getEmbedUrl(item.url);

          return (
            <article key={item.id} className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-soft">
              <div className="relative bg-secondary">
                {item.mediaType === "reel" ? (
                  <button
                    type="button"
                    onClick={() => setOpenItem(isOpen ? null : item.id)}
                    className="group relative aspect-[4/5] w-full overflow-hidden"
                  >
                    {!isOpen ? (
                      <>
                        <img src={item.thumbnail} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.03]" />
                        <div className="absolute inset-0 grid place-items-center bg-gradient-to-b from-black/10 to-black/40">
                          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-background/90 text-foreground shadow-soft">
                            <Play className="h-6 w-6" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <iframe
                        title={item.title}
                        src={embedUrl}
                        className="h-[450px] w-full"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                      />
                    )}
                  </button>
                ) : (
                  <div className="aspect-[4/5] overflow-hidden bg-secondary">
                    <img src={item.thumbnail} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
                  <span>{item.mediaType === "reel" ? "Reel" : "Post"}</span>
                  <span className="rounded-full border border-border px-2 py-1">Live</span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-xl text-foreground">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.caption}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {item.productMap.saree ? (
                    <Link
                      to="/product/$slug"
                      params={{ slug: item.productMap.saree }}
                      className="inline-flex items-center justify-center rounded-full border border-border bg-secondary px-4 py-3 text-xs font-medium uppercase tracking-widest text-foreground transition hover:border-accent hover:text-accent"
                    >
                      Shop This Saree
                    </Link>
                  ) : null}
                  {item.productMap.jewellery ? (
                    <Link
                      to="/product/$slug"
                      params={{ slug: item.productMap.jewellery }}
                      className="inline-flex items-center justify-center rounded-full border border-border bg-secondary px-4 py-3 text-xs font-medium uppercase tracking-widest text-foreground transition hover:border-accent hover:text-accent"
                    >
                      Shop This Jewellery
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
