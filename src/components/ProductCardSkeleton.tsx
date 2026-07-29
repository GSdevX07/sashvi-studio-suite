export function ProductCardSkeleton() {
  return (
    <div className="group relative flex flex-col">
      <div className="relative block overflow-hidden rounded-2xl bg-card ring-1 ring-border">
        <div className="aspect-[3/4] w-full overflow-hidden bg-secondary rounded-[18px] animate-pulse" />
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-center justify-between opacity-100 transition">
          <div className="pointer-events-auto flex gap-1.5">
            <div className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full shadow-soft bg-muted animate-pulse" />
          </div>
          <div className="pointer-events-auto h-8 w-20 rounded-full bg-muted animate-pulse" />
        </div>
      </div>
      <div className="mt-4 px-1">
        <div className="h-6 w-3/4 bg-muted rounded animate-pulse mb-2" />
        <div className="h-5 w-1/3 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}
