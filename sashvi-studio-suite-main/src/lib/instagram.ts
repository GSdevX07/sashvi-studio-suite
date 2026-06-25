export type InstagramMediaType = "post" | "reel";

export interface InstagramFeedItem {
  id: string;
  title: string;
  url: string;
  mediaType: InstagramMediaType;
  thumbnail: string;
  productMap: {
    saree?: string;
    jewellery?: string;
  };
  caption: string;
  isActive: boolean;
}

export const INSTAGRAM_FEED: InstagramFeedItem[] = [
  {
    id: "ig-001",
    title: "Temple Gold Bridal Set",
    url: "https://www.instagram.com/reel/CsH2ZqLJYpB",
    mediaType: "reel",
    thumbnail: "/assets/p3.jpg",
    productMap: { jewellery: "ruby-temple-necklace-set", saree: "emerald-kanjivaram-silk-saree" },
    caption: "Our latest temple jewellery edit with bridal-inspired drape.",
    isActive: true,
  },
  {
    id: "ig-002",
    title: "Soft Mul Cotton Story",
    url: "https://www.instagram.com/p/CsH2ZqLJYpC",
    mediaType: "post",
    thumbnail: "/assets/p2.jpg",
    productMap: { saree: "bagru-block-print-mul-cotton" },
    caption: "Daywear comfort in an artisanal mul cotton saree.",
    isActive: true,
  },
  {
    id: "ig-003",
    title: "Bridal Combo Reveal",
    url: "https://www.instagram.com/reel/CsH2ZqLJYpD",
    mediaType: "reel",
    thumbnail: "/assets/cat-combos.jpg",
    productMap: { jewellery: "jadau-kundan-bridal-set", saree: "pink-silk-saree-jhumka-combo" },
    caption: "A styled combo for special celebrations.",
    isActive: true,
  },
];

export function getActiveInstagramFeed() {
  return INSTAGRAM_FEED.filter((item) => item.isActive);
}
