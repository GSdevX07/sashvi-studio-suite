import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { apiJson } from "@/lib/backend";
import { toast } from "sonner";

type Search = { token?: string };

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    token: typeof s.token === "string" ? s.token : undefined,
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const search = Route.useSearch() as Search;
  const token = search.token;
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await apiJson<{ ok: boolean; message: string }>("/auth/password-reset/confirm", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setSuccess(true);
        toast.success("Password reset successfully!");
        setTimeout(() => {
          navigate({ to: "/my-account" as any });
        }, 2000);
      }
    } catch (err: any) {
      console.error("Password reset error:", err);
      if (err?.error === "invalid_or_expired_token") {
        toast.error("Invalid or expired reset link. Please request a new password reset.");
      } else {
        toast.error("Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Layout>
        <div className="container-luxe flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="font-display text-2xl md:text-3xl mb-4">Invalid Reset Link</h1>
            <p className="text-muted-foreground mb-6">
              This password reset link is invalid or has expired.
            </p>
            <button
              onClick={() => navigate({ to: "/my-account" as any })}
              className="inline-flex items-center gap-2 text-accent hover:underline"
            >
              Go to My Account
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (success) {
    return (
      <Layout>
        <div className="container-luxe flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display text-2xl md:text-3xl mb-4">Password Reset Successful!</h1>
            <p className="text-muted-foreground mb-6">
              You can now log in with your new password.
            </p>
            <button
              onClick={() => navigate({ to: "/my-account" as any })}
              className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-full hover:bg-accent transition"
            >
              Go to My Account
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-luxe flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-2xl md:text-3xl mb-2">Reset Password</h1>
            <p className="text-muted-foreground">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background py-3 rounded-lg hover:bg-accent transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate({ to: "/my-account" as any })}
              className="text-sm text-muted-foreground hover:text-accent transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
