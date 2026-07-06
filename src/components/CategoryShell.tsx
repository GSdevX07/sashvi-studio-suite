import { Link, useNavigate } from "@tanstack/react-router";
import { ReactNode, useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface CategoryFilter {
  name: string;
  image?: string;
}

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  filters: (string | CategoryFilter)[];
  activeTag?: string;
  activeSort?: string;
  minPrice?: number;
  maxPrice?: number;
  basePath: string;
  children?: ReactNode;
}

export function CategoryShell({
  eyebrow,
  title,
  description,
  filters,
  activeTag,
  activeSort,
  minPrice,
  maxPrice,
  basePath,
  children,
}: Props) {
  const navigate = useNavigate();
  const [localRange, setLocalRange] = useState<[number, number]>([
    minPrice ?? 0,
    maxPrice ?? 10000,
  ]);

  useEffect(() => {
    setLocalRange([minPrice ?? 0, maxPrice ?? 10000]);
  }, [minPrice, maxPrice]);

  const handleSortChange = (newSort: string) => {
    navigate({
      to: basePath as any,
      search: {
        tag: activeTag,
        sort: newSort === "featured" ? undefined : newSort,
        minPrice,
        maxPrice,
      } as any,
    });
  };

  const handlePriceCommit = (val: [number, number]) => {
    navigate({
      to: basePath as any,
      search: {
        tag: activeTag,
        sort: activeSort,
        minPrice: val[0] === 0 ? undefined : val[0],
        maxPrice: val[1] === 10000 ? undefined : val[1],
      } as any,
    });
  };

  return (
    <>
      <section className="border-b border-border bg-secondary/40">
        <div className="container-luxe py-14 md:py-20">
          <div className="eyebrow mb-4">{eyebrow}</div>
          <div className="grid items-end gap-6 md:grid-cols-[1fr_auto]">
            <h1 className="font-display text-4xl md:text-6xl text-foreground">{title}</h1>
            <p className="max-w-md text-muted-foreground">{description}</p>
          </div>
        </div>
      </section>

      <section className="container-luxe py-10">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-border/60 pb-6">
          <div className="flex flex-wrap gap-2 items-center">
            <Link
              to={basePath as any}
              search={{ sort: activeSort, minPrice, maxPrice } as any}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition-all duration-300 ${
                !activeTag
                  ? "border-foreground bg-foreground text-background shadow-sm scale-102"
                  : "border-border bg-card text-foreground/70 hover:border-accent hover:text-accent hover:scale-[1.01]"
              }`}
            >
              All
            </Link>
            {filters.map((f) => {
              const filterName = typeof f === "string" ? f : f.name;
              return (
                <Link
                  key={filterName}
                  to={basePath as any}
                  search={{ tag: filterName, sort: activeSort, minPrice, maxPrice } as any}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest transition-all duration-300 ${
                    activeTag === filterName
                      ? "border-foreground bg-foreground text-background shadow-sm scale-102"
                      : "border-border bg-card text-foreground/70 hover:border-accent hover:text-accent hover:scale-[1.01]"
                  }`}
                >
                  {filterName}
                </Link>
              );
            })}
          </div>

          <div className="flex flex-col gap-4 w-full md:w-auto min-w-[280px] md:items-end">
            <div className="flex items-center gap-3 w-full md:justify-end">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                Sort By
              </span>
              <Select value={activeSort || "featured"} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px] h-10 rounded-full border-border bg-card text-foreground cursor-pointer text-xs font-semibold uppercase tracking-widest hover:border-accent hover:text-accent transition-all duration-300 shadow-soft">
                  <SelectValue placeholder="Featured" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground shadow-xl">
                  <SelectItem value="featured" className="text-xs uppercase tracking-widest py-2">Featured</SelectItem>
                  <SelectItem value="price-asc" className="text-xs uppercase tracking-widest py-2">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc" className="text-xs uppercase tracking-widest py-2">Price: High to Low</SelectItem>
                  <SelectItem value="newest" className="text-xs uppercase tracking-widest py-2">Newest First</SelectItem>
                  <SelectItem value="popularity" className="text-xs uppercase tracking-widest py-2">Popularity</SelectItem>
                  <SelectItem value="discount" className="text-xs uppercase tracking-widest py-2">Highest Discount</SelectItem>
                  <SelectItem value="rating" className="text-xs uppercase tracking-widest py-2">Customer Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-[280px] md:max-w-[240px]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                  Price Range
                </span>
                <span className="font-semibold text-brown dark:text-gold-soft">
                  ₹{localRange[0]} - ₹{localRange[1]}
                </span>
              </div>
              <Slider
                min={0}
                max={10000}
                step={100}
                value={localRange}
                onValueChange={(val) => setLocalRange(val as [number, number])}
                onValueCommit={handlePriceCommit}
                className="py-2"
              />
            </div>
          </div>
        </div>
        {children}
      </section>
    </>
  );
}
