import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useState } from "react";
import { apiJson, setAuthTokens, clearAuthTokens, getAuthToken } from "@/lib/backend";
import { useAuth } from "@/lib/auth-context";
import { User, LogOut } from "lucide-react";

type Search = { redirect?: string };

export const Route = createFileRoute("/my-account")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "My Account — Sashvi Studio" }] }),
  component: MyAccountPage,
});

function MyAccountPage() {
  const { isLoggedIn, login, logout } = useAuth();
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);

  if (isLoggedIn) {
    return (
      <Layout>
        <section className="container-luxe pt-12 pb-24">
          <div className="max-w-md mx-auto text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <User className="h-9 w-9 text-foreground/60" />
            </div>
            <div className="eyebrow mb-3">My Account</div>
            <h1 className="font-display text-3xl md:text-4xl mb-2">Welcome back!</h1>
            <p className="text-sm text-muted-foreground mb-8">You're signed in and ready to shop.</p>
            <div className="space-y-3">
              <button
                onClick={() => { logout(); navigate({ to: "/" }); }}
                className="w-full flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-secondary transition"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setShowResend(false);
    setLoading(true);

    try {
      if (isSignUp) {
        await apiJson("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name, email, password }),
        });
        setMessage("Account created! Check your email to verify before signing in.");
        setIsSignUp(false);
      } else {
        const data = await apiJson<{ access: string; refresh: string }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setAuthTokens(data.access, data.refresh);
        login();
        if (redirect) {
          navigate({ to: redirect as "/cart" | "/wishlist" });
        } else {
          setMessage("Signed in successfully!");
        }
      }
    } catch (err: any) {
      const msg = err?.message || "Unable to sign in. Please try again.";
      if (msg === "email_not_verified") {
        setError("Please verify your email first.");
        setShowResend(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      await apiJson("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMessage("Verification email resent. Check your inbox.");
      setShowResend(false);
    } catch (err: any) {
      setError(err?.message || "Unable to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <section className="container-luxe pt-12 pb-24">
        <div className="max-w-md mx-auto">
          <div className="eyebrow mb-3 text-center">My Account</div>
          <h1 className="font-display text-3xl md:text-4xl text-center mb-8">
            {isSignUp ? "Create Account" : "Sign In"}
          </h1>

          {redirect && (
            <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 text-sm text-center text-foreground">
              Please sign in to continue to your {redirect.replace("/", "")}.
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-card"
                  placeholder="Enter your name"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-card"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-card"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {message && <p className="text-sm text-foreground">{message}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background py-2.5 font-semibold rounded-lg hover:bg-accent transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          {showResend && (
            <div className="mb-6 text-sm text-center">
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={loading}
                className="font-semibold text-accent hover:underline disabled:cursor-not-allowed"
              >
                Resend verification email
              </button>
            </div>
          )}

          <p className="text-center mt-6 text-sm text-muted-foreground">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); setMessage(null); }}
              className="text-accent font-semibold hover:underline"
            >
              {isSignUp ? "Sign In" : "Create one"}
            </button>
          </p>
        </div>
      </section>
    </Layout>
  );
}
