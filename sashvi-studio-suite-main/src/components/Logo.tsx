import logo from "/sashvi_logo.png";
import { BRAND } from "@/lib/contact";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={logo}
        alt={`${BRAND.name} logo`}
        width={48}
        height={48}
        className="h-11 w-11 rounded-full ring-1 ring-border shadow-soft bg-card"
      />
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-[1.05rem] sm:text-lg tracking-[0.22em] text-foreground uppercase">
            {BRAND.name}
          </div>
          <div className="eyebrow text-[0.55rem] sm:text-[0.6rem] mt-0.5">
            {BRAND.tagline}
          </div>
        </div>
      )}
    </div>
  );
}
