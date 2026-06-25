import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface Props {
  eyebrow: string;
  title: string;
  description: string;
  filters: string[];
  activeTag?: string;
  basePath: string;
  children: ReactNode;
}

export function CategoryShell({ eyebrow, title, description, filters, activeTag, basePath, children }: Props) {
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
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            to={basePath}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-widest transition ${
              !activeTag
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-foreground/70 hover:border-accent hover:text-accent"
            }`}
          >
            All
          </Link>
          {filters.map((f) => (
            <Link
              key={f}
              to={basePath}
              search={{ tag: f }}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-widest transition ${
                activeTag === f
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-foreground/70 hover:border-accent hover:text-accent"
              }`}
            >
              {f}
            </Link>
          ))}
        </div>
        {children}
      </section>
    </>
  );
}
