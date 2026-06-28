import { Link } from "@tanstack/react-router";
import { Sparkles, Leaf, Scissors, Hand } from "lucide-react";

export function HandloomEdit() {
  return (
    <section className="py-12 sm:py-16 md:py-20" style={{ backgroundColor: "#FDF7F2" }}>
      <div className="container-luxe">
        {/* Section Title */}
        <div className="text-center mb-6 sm:mb-8">
          <p
            className="text-[13px] sm:text-[15px] font-medium uppercase tracking-[0.25em] mb-4"
            style={{ color: "#C79A42", fontFamily: "Inter, sans-serif" }}
          >
            ✦ THE HANDLOOM EDIT ✦
          </p>

          {/* Main Heading */}
          <h2
            className="text-[38px] sm:text-[48px] md:text-[64px] font-bold leading-tight mb-6"
            style={{
              color: "#3E241C",
              fontFamily: "Playfair Display, serif",
              fontWeight: 700,
            }}
          >
            Timeless Weaves.
            <br />
            Thoughtful Craft.
          </h2>

          {/* Premium Square Image Collage */}
          <div className="mx-auto mb-10 sm:mb-12 md:mb-16 w-full max-w-[720px]">
            <div
              className="relative aspect-square rounded-[24px] sm:rounded-[32px] overflow-hidden group"
              style={{ transition: "transform 700ms ease-out" }}
            >
              <img
                src="/assets/handloom-edit-collage.jpeg"
                alt="Handloom Weaving Collage"
                className="w-full h-full object-cover group-hover:scale-[1.03]"
                style={{ transition: "transform 700ms ease-out" }}
              />
            </div>
          </div>

          {/* Decorative Divider */}
          <div className="flex justify-center mb-8">
            <div
              className="h-px"
              style={{ width: "90px", backgroundColor: "#C79A42" }}
            />
          </div>

          {/* Paragraph 1 */}
          <p
            className="text-[16px] sm:text-[18px] leading-relaxed mb-6 mx-auto max-w-[720px] text-center"
            style={{
              color: "#6B5A4A",
              fontFamily: "Inter, sans-serif",
              lineHeight: 1.9,
            }}
          >
            Discover thoughtfully curated handloom and artisanal sarees, where
            every weave carries a story of heritage, craftsmanship, and timeless
            elegance. From traditional weaving techniques to handcrafted
            detailing, every creation celebrates India's rich textile legacy with
            authenticity and care.
          </p>

          {/* Paragraph 2 */}
          <p
            className="text-[16px] sm:text-[18px] leading-relaxed mb-8 mx-auto max-w-[720px] text-center"
            style={{
              color: "#6B5A4A",
              fontFamily: "Inter, sans-serif",
              lineHeight: 1.9,
            }}
          >
            Explore Ilkal, Narayanpet, Kanchi Cotton, Jamdani, Sungudi Cotton,
            Ajrakh, Bagru block prints, Kasuti embroidery, Patteda Anchu, and
            many other artisan traditions that beautifully preserve India's
            centuries-old weaving heritage while embracing contemporary elegance.
          </p>

          {/* Quote */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <Sparkles className="w-5 h-5" style={{ color: "#A67C2E" }} />
            <p
              className="text-[22px] sm:text-[28px] italic"
              style={{
                color: "#A67C2E",
                fontFamily: "Playfair Display, serif",
                fontStyle: "italic",
              }}
            >
              Slow fashion for a better tomorrow.
            </p>
            <Sparkles className="w-5 h-5" style={{ color: "#A67C2E" }} />
          </div>

          {/* Divider */}
          <div className="flex justify-center mb-10">
            <div
              className="h-px"
              style={{ width: "60px", backgroundColor: "#C79A42" }}
            />
          </div>
        </div>

        {/* Four Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-10 sm:mb-12">
          {/* Feature 1 */}
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <Scissors className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: "#C79A42" }} />
            </div>
            <h3
              className="text-[14px] sm:text-[16px] font-semibold mb-2"
              style={{ color: "#3E241C", fontFamily: "Inter, sans-serif" }}
            >
              Slow-made
            </h3>
            <p
              className="text-[12px] sm:text-[14px] leading-relaxed"
              style={{ color: "#6B5A4A", fontFamily: "Inter, sans-serif" }}
            >
              Every saree is thoughtfully woven with patience, care, and
              traditional craftsmanship.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <Leaf className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: "#C79A42" }} />
            </div>
            <h3
              className="text-[14px] sm:text-[16px] font-semibold mb-2"
              style={{ color: "#3E241C", fontFamily: "Inter, sans-serif" }}
            >
              Conscious
            </h3>
            <p
              className="text-[12px] sm:text-[14px] leading-relaxed"
              style={{ color: "#6B5A4A", fontFamily: "Inter, sans-serif" }}
            >
              Supporting ethical production, natural materials, and mindful
              fashion choices.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: "#C79A42" }} />
            </div>
            <h3
              className="text-[14px] sm:text-[16px] font-semibold mb-2"
              style={{ color: "#3E241C", fontFamily: "Inter, sans-serif" }}
            >
              Sustainable
            </h3>
            <p
              className="text-[12px] sm:text-[14px] leading-relaxed"
              style={{ color: "#6B5A4A", fontFamily: "Inter, sans-serif" }}
            >
              Celebrating eco-friendly weaving practices that preserve culture
              and nature together.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="text-center">
            <div className="flex justify-center mb-3">
              <Hand className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: "#C79A42" }} />
            </div>
            <h3
              className="text-[14px] sm:text-[16px] font-semibold mb-2"
              style={{ color: "#3E241C", fontFamily: "Inter, sans-serif" }}
            >
              Supporting Artisans
            </h3>
            <p
              className="text-[12px] sm:text-[14px] leading-relaxed"
              style={{ color: "#6B5A4A", fontFamily: "Inter, sans-serif" }}
            >
              Empowering skilled Indian artisans while preserving generations of
              textile heritage.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="flex justify-center mb-10">
          <div
            className="h-px"
            style={{ width: "90px", backgroundColor: "#C79A42" }}
          />
        </div>

        {/* Collection Title */}
        <div className="text-center mb-8">
          <h2
            className="text-[28px] sm:text-[32px] md:text-[38px] font-bold"
            style={{
              color: "#3E241C",
              fontFamily: "Playfair Display, serif",
              fontWeight: 700,
            }}
          >
            HANDLOOM & ARTISANAL COLLECTION
          </h2>
        </div>

        {/* Button */}
        <div className="flex justify-center">
          <Link
            to="/sarees"
            search={{ tag: "Handloom & Artisanal Sarees" }}
            className="inline-flex items-center justify-center rounded-full text-sm font-medium uppercase tracking-widest text-white transition-all hover:translate-y-[-2px] hover:shadow-lg w-full sm:w-[300px] h-[56px] sm:h-[58px]"
            style={{
              backgroundColor: "#4A2B24",
              fontFamily: "Inter, sans-serif",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#5A342A";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#4A2B24";
            }}
          >
            EXPLORE COLLECTIONS →
          </Link>
        </div>
      </div>
    </section>
  );
}
