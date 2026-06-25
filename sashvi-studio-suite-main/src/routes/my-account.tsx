import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "@/components/Layout";
import { useState } from "react";
import { apiJson, setAuthTokens } from "@/lib/backend";

export const Route = createFileRoute("/my-account")({
  head: () => ({ meta: [{ title: "My Account — Sashvi Studio" }] }),
  component: MyAccountPage,
});

function MyAccountPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);

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
        setMessage("Account created successfully. Check your email to verify your account.");
        setIsSignUp(false);
      } else {
        const data = await apiJson<{ access: string; refresh: string }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setAuthTokens(data.access, data.refresh);
        setMessage("Logged in successfully.");
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Unable to sign in. Please try again.";
      setError(errorMessage);
      if (errorMessage === "email_not_verified") {
        setMessage("Please verify your email first. You can resend the verification link.");
        setShowResend(true);
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

  const handleGoogleLogin = () => {
    alert("Google login is not configured in this build. Please use email and password.");
  };

  return (
    <Layout>
      <section className="container-luxe pt-12 pb-24">
        <div className="max-w-md mx-auto">
          <div className="eyebrow mb-3 text-center">My Account</div>
          <h1 className="font-display text-3xl md:text-4xl text-center mb-8">
            {isSignUp ? "Create Account" : "Sign In"}
          </h1>

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
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {message ? <p className="text-sm text-foreground">{message}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background py-2.5 font-semibold rounded-lg hover:bg-accent transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          {showResend ? (
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
          ) : null}

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-border rounded-lg hover:bg-secondary transition font-medium"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
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
