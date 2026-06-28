import type { ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { RealtimeProvider } from "@/lib/realtime-context";

export function Layout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";

  const handleBack = () => {
    window.history.back();
  };

  return (
    <RealtimeProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        {!isHome && (
          <div className="border-b border-border/40 bg-secondary/30">
            <div className="container-luxe py-2.5">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>
            </div>
          </div>
        )}
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </RealtimeProvider>
  );
}
