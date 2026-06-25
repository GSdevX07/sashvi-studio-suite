export const BRAND = {
  name: "Sashvi Studio",
  tagline: "Sarees & Jewellery",
  subline: "Styled to Complete You",
  phone: "+91 7483821247",
  whatsapp: "917483821247",
  instagram: "https://www.instagram.com/sashvi.studio?igsh=ZXp1djQ3MzQyazQz",
  instagramHandle: "@sashvi.studio",
  email: "hello@sashvi.studio",
  devWhatsApp: "919502252440",
  devMessage: "Hi Sathwik, I want a website for my business so please help me build something",
};

export const waLink = (msg: string, phone = BRAND.whatsapp) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
