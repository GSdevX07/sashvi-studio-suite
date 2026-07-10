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
  linkedProducts?: Array<{ name: string; url: string }>;
}

export const INSTAGRAM_FEED: InstagramFeedItem[] = [];

export function getActiveInstagramFeed() {
  return INSTAGRAM_FEED.filter((item) => item.isActive);
}
