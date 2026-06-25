import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";
import combo from "@/assets/cat-combos.jpg";

export type Category = "sarees" | "jewellery" | "combos";

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAt?: number;
  image: string;
  images?: string[];
  categories: Category[];
  tags: string[];
  stock: number;
  isNew?: boolean;
  isFeatured?: boolean;
  isBestSelling?: boolean;
  rating?: number;
  reviewCount?: number;
  description: string;
}

export const PRODUCTS: Product[] = [
  {
    id: "1",
    slug: "emerald-kanjivaram-silk-saree",
    name: "Emerald Kanjivaram Silk Saree",
    price: 8499,
    compareAt: 10999,
    image: p1,
    categories: ["sarees"],
    tags: ["Mysore Silk Sarees", "Fancy & Designer Sarees"],
    stock: 4,
    isFeatured: true,
    isNew: true,
    isBestSelling: true,
    rating: 4.9,
    reviewCount: 124,
    description:
      "Handwoven Kanjivaram silk in deep emerald with intricate gold zari pallu. A timeless heirloom piece styled for weddings and festive evenings.",
  },
  {
    id: "2",
    slug: "bagru-block-print-mul-cotton",
    name: "Bagru Block Print Mul Cotton Saree",
    price: 1799,
    compareAt: 2299,
    image: p2,
    categories: ["sarees"],
    tags: ["Mul Cotton Sarees", "Handloom & Artisanal Sarees"],
    stock: 10,
    isNew: true,
    rating: 4.8,
    reviewCount: 86,
    description:
      "Soft mul cotton hand-block printed in indigo using traditional Bagru techniques. Breathable, lightweight, perfect for everyday elegance.",
  },
  {
    id: "3",
    slug: "ruby-temple-necklace-set",
    name: "Ruby Temple Necklace Set",
    price: 3299,
    image: p3,
    categories: ["jewellery"],
    tags: ["Necklaces", "Bridal Sets"],
    stock: 6,
    isFeatured: true,
    isBestSelling: true,
    rating: 4.9,
    reviewCount: 212,
    description:
      "South Indian temple jewellery set with rubies and emerald accents in antique gold finish. Includes matching jhumkas.",
  },
  {
    id: "4",
    slug: "antique-gold-pearl-jhumkas",
    name: "Antique Gold Pearl Jhumkas",
    price: 549,
    compareAt: 799,
    image: p4,
    categories: ["jewellery"],
    tags: ["Earrings&Jhumkas", "Jewellery Under ₹599"],
    stock: 0,
    isNew: true,
    rating: 4.7,
    reviewCount: 158,
    description: "Statement jhumkas with intricate gold work and pearl drops. Versatile across festive and everyday looks.",
  },
  {
    id: "5",
    slug: "royal-blue-mysore-silk",
    name: "Royal Blue Mysore Silk Saree",
    price: 6499,
    image: p5,
    categories: ["sarees"],
    tags: ["Mysore Silk Sarees"],
    stock: 8,
    isFeatured: true,
    rating: 4.8,
    reviewCount: 91,
    description: "Pure Mysore silk in regal cobalt blue with a striking gold zari border. Comes with unstitched blouse piece.",
  },
  {
    id: "6",
    slug: "jadau-kundan-bridal-set",
    name: "Jadau Kundan Bridal Set",
    price: 9999,
    compareAt: 12999,
    image: p6,
    categories: ["jewellery"],
    tags: ["Jadau kundan jewellery", "Bridal Sets", "Long Haaram"],
    stock: 2,
    isFeatured: true,
    isNew: true,
    isBestSelling: true,
    rating: 5.0,
    reviewCount: 47,
    description: "Heirloom Jadau Kundan necklace set with uncut polki, pearls, and matching earrings. A bridal showstopper.",
  },
  {
    id: "7",
    slug: "pink-silk-saree-jhumka-combo",
    name: "Pink Silk Saree & Jhumka Combo",
    price: 3499,
    compareAt: 4599,
    image: combo,
    categories: ["combos", "sarees"],
    tags: ["Saree & Jewellery Combos", "Mysore Silk Sarees"],
    stock: 1,
    isFeatured: true,
    isBestSelling: true,
    rating: 4.9,
    reviewCount: 64,
    description: "A complete look — pastel pink silk saree paired with matching antique gold jhumkas. Styled to complete you.",
  },
  {
    id: "8",
    slug: "festive-mul-cotton-budget",
    name: "Festive Mul Cotton Saree",
    price: 899,
    image: p2,
    categories: ["sarees"],
    tags: ["Sarees Under ₹999", "Mul Cotton Sarees"],
    stock: 12,
    rating: 4.6,
    reviewCount: 38,
    description: "Lightweight festive mul cotton saree at a beautiful price. A daily favourite.",
  },
];

export const SAREE_CATEGORIES = [
  "Mysore Silk Sarees",
  "Mul Cotton Sarees",
  "Handloom & Artisanal Sarees",
  "Fancy & Designer Sarees",
  "Saree & Stitched Blouse Combos",
  "Sarees Under ₹999",
  "Other Sarees & Blouses",
];

export const JEWELLERY_CATEGORIES = [
  "Necklaces",
  "Long Haaram",
  "Bridal Sets",
  "Earrings&Jhumkas",
  "Jadau kundan jewellery",
  "Jewellery Under ₹599",
  "Other Jewellery",
];

export const COMBO_CATEGORIES = ["Saree & Jewellery Combos", "Buy 1 Get 1 Offers"];

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const byCategory = (cat: Category) => PRODUCTS.filter((p) => p.categories.includes(cat));
export const byTag = (tag: string) => PRODUCTS.filter((p) => p.tags.includes(tag));
