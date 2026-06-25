import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Layout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      {!isHome && (
        <div className="border-b border-border/40 bg-secondary/30">
          <div className="container-luxe py-2.5">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to Storefront
            </Link>
          </div>
        </div>
      )}
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
