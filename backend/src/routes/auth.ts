import express from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { supabase } from "../lib/supabase";
import { sendEmail } from "../lib/email";
import { signAccess, signAdminAccess, signRefresh, verifyToken } from "../utils/jwt";

import { requireAuth, AuthedRequest } from "../middleware/auth";

export const authRouter = express.Router();

authRouter.get("/me", requireAuth as any, async (req: AuthedRequest, res) => {
  console.log('GET /auth/me - returning user:', req.user);
  return res.json({ user: req.user });
});

// Update user profile (PUT)
authRouter.put("/me", requireAuth as any, async (req: AuthedRequest, res) => {
  const { name, email, mobile } = req.body;
  console.log('Profile update request:', { userId: req.user?.id, name, email, mobile });
  const updates: any = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (mobile !== undefined && mobile !== null) updates.mobile = String(mobile).trim();

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", req.user?.id)
    .select("id, name, email, mobile, role")
    .maybeSingle();

  if (error) {
    console.error("profile update error:", error);
    return res.status(500).json({ error: "db_error", detail: error.message });
  }

  console.log('Profile update successful:', data);
  return res.json({ user: data });
});

// Update user profile (PATCH) – alias for flexibility
authRouter.patch("/me", requireAuth as any, async (req: AuthedRequest, res) => {
  // Reuse the same logic as PUT
  const { name, email, mobile } = req.body;
  const updates: any = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (mobile !== undefined && mobile !== null) updates.mobile = String(mobile).trim();

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", req.user?.id)
    .select("id, name, email, mobile, role")
    .maybeSingle();

  if (error) {
    console.error("profile update error (PATCH):", error);
    return res.status(500).json({ error: "db_error", detail: error.message });
  }

  return res.json({ user: data });
});


const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  mobile: z.string().optional(),
});

// ── Register ──────────────────────────────────────────────────────────────────
authRouter.post("/register", async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "invalid_input" });
  const { name, email, password, mobile } = parse.data;

  // Check duplicate
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) return res.status(400).json({ error: "Email already registered" });

  const hash = await bcrypt.hash(password, 12);

  const { data, error } = await supabase
    .from("users")
    .insert({
      name,
      email,
      password: hash,
      mobile: mobile || "0000000000",
      role: "user",
    })
    .select("id, email, name")
    .maybeSingle();

  if (error) {
    console.error("register db error:", error);
    return res.status(500).json({ error: "db_error", detail: error.message });
  }

  // Auto-issue tokens (email verified on first login for simplicity)
  const access = signAccess({ sub: data?.id, email: data?.email });
  const refresh = signRefresh({ sub: data?.id });
  return res.json({
    ok: true,
    access,
    refresh,
    user: { id: data?.id, email: data?.email, name: data?.name },
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

authRouter.post("/login", async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "invalid_input" });
  const { email, password } = parse.data;

  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, password, role")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("login db error:", error);
    return res.status(500).json({ error: "db_error", detail: error.message });
  }
  if (!data) return res.status(400).json({ error: "invalid_credentials" });

  const match = await bcrypt.compare(password, data.password);
  if (!match) return res.status(400).json({ error: "invalid_credentials" });

  const access = signAccess({ sub: data.id, email: data.email, role: data.role });
  const refresh = signRefresh({ sub: data.id });
  const { data: profile } = await supabase
    .from("users")
    .select("id, email, name, mobile, role")
    .eq("id", data.id)
    .maybeSingle();

  return res.json({
    access,
    refresh,
    user: profile ?? { id: data.id, email: data.email, name: data.name },
  });
});

// ── Admin Login ─────────────────────────────────────────────────────────────────────
authRouter.post("/admin/login", async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "invalid_input" });
  const { email, password } = parse.data;

  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, password, role")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("admin login db error:", error);
    return res.status(500).json({ error: "db_error", detail: error.message });
  }
  if (!data) return res.status(400).json({ error: "invalid_credentials" });

  const match = await bcrypt.compare(password, data.password);
  if (!match) return res.status(400).json({ error: "invalid_credentials" });

  // Check if user has admin role
  if (data.role !== "admin") {
    return res.status(403).json({ error: "forbidden", message: "Admin access required" });
  }

  const access = signAdminAccess({ sub: data.id, email: data.email, role: data.role });
  const refresh = signRefresh({ sub: data.id });
  console.log("Admin login successful:", data.email);
  return res.json({
    token: access,
    refresh,
    user: { id: data.id, email: data.email, name: data.name, role: data.role },
  });
});

// ── Refresh token ─────────────────────────────────────────────────────────────
authRouter.post("/refresh", async (req, res) => {
  const { refresh } = req.body;
  if (!refresh) return res.status(400).json({ error: "missing_refresh" });

  const payload = verifyToken(refresh);
  if (!payload || typeof payload !== "object" || !("sub" in payload)) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const userId = (payload as { sub: string }).sub;
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, mobile, role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return res.status(401).json({ error: "unauthorized" });

  const access =
    data.role === "admin"
      ? signAdminAccess({ sub: data.id, email: data.email, role: data.role })
      : signAccess({ sub: data.id, email: data.email, role: data.role });
  const newRefresh = signRefresh({ sub: data.id });

  return res.json({
    access,
    refresh: newRefresh,
    token: access,
    user: data,
  });
});

// ── Admin Me ─────────────────────────────────────────────────────────────────────
authRouter.get("/admin/me", requireAuth as any, async (req: AuthedRequest, res) => {
  console.log('GET /auth/admin/me - returning user:', req.user);
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "forbidden" });
  }
  return res.json({ user: req.user });
});

// ── Promote to Admin (TEMPORARY - for development only) ───────────────────────
authRouter.post("/promote-admin", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "email required" });

  const { data, error } = await supabase
    .from("users")
    .update({ role: "admin" })
    .eq("email", email)
    .select("id, email, name, role")
    .maybeSingle();

  if (error) {
    console.error("promote admin error:", error);
    return res.status(500).json({ error: "db_error", detail: error.message });
  }
  if (!data) return res.status(404).json({ error: "user not found" });

  console.log('User promoted to admin:', data);
  return res.json({ user: data });
});

// ── Create Admin User (TEMPORARY - for development only) ───────────────────────
authRouter.post("/create-admin", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "email, password, and name required" });
  }

  // Check if user exists
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existing) return res.status(400).json({ error: "Email already registered" });

  const hash = await bcrypt.hash(password, 12);

  const { data, error } = await supabase
    .from("users")
    .insert({
      name,
      email,
      password: hash,
      mobile: "0000000000",
      role: "admin",
    })
    .select("id, email, name, role")
    .maybeSingle();

  if (error) {
    console.error("create admin error:", error);
    return res.status(500).json({ error: "db_error", detail: error.message });
  }

  console.log('Admin user created:', data);
  return res.json({ user: data });
});

// ── Set Password (TEMPORARY - for development only) ─────────────────────────────
authRouter.post("/set-password", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }

  const hash = await bcrypt.hash(password, 12);

  const { data, error } = await supabase
    .from("users")
    .update({ password: hash })
    .eq("email", email)
    .select("id, email, name, role")
    .maybeSingle();

  if (error) {
    console.error("set password error:", error);
    return res.status(500).json({ error: "db_error", detail: error.message });
  }
  if (!data) return res.status(404).json({ error: "user not found" });

  console.log('Password updated for:', data.email);
  return res.json({ user: { id: data.id, email: data.email, name: data.name, role: data.role } });
});

// ── Password Reset Flow ─────────────────────────────────────────────────────────────

// Generate and send password reset email (admin-only for testing)
authRouter.post("/password-reset/request", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "email required" });
  }

  // Find user by email
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("email", email)
    .maybeSingle();

  if (userError) {
    console.error("password reset user lookup error:", userError);
    return res.status(500).json({ error: "db_error", detail: userError.message });
  }
  if (!user) return res.status(404).json({ error: "user not found" });

  // Generate cryptographically secure random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Hash the token for storage
  const tokenHash = await bcrypt.hash(token, 12);
  
  // Set expiration to far future (essentially unlimited lifetime)
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

  // Store token in database
  const { error: tokenError } = await supabase
    .from("password_reset_tokens")
    .insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      used: false,
    });

  if (tokenError) {
    console.error("password reset token storage error:", tokenError);
    return res.status(500).json({ error: "db_error", detail: tokenError.message });
  }

  // Send email with reset link
  const resetUrl = `https://sashvistudio.in/reset-password?token=${token}`;
  
  const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password Reset — Sashvi Studio</title>
</head>
<body style="margin:0;padding:0;background:#faf6f1;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf6f1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">
          <!-- Header -->
          <tr>
            <td style="background:#2c1a0e;padding:32px 40px;text-align:center;">
              <div style="font-family:'Georgia',serif;font-size:22px;font-weight:bold;color:#f5e6c8;letter-spacing:2px;">SASHVI STUDIO</div>
              <div style="font-size:11px;color:#c9a87c;letter-spacing:3px;margin-top:4px;">SAREES &amp; JEWELLERY</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:15px;color:#7a5c44;">Hello <strong style="color:#2c1a0e;">${user.name || user.email?.split("@")[0] || "Customer"}</strong>,</p>
              <p style="margin:0 0 24px;font-size:14px;color:#5a4438;line-height:1.6;">
                We received a request to reset your password. Click the button below to set a new password.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${resetUrl}" style="display:inline-block;background:#8b4513;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:14px;font-weight:bold;letter-spacing:1px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;color:#5a4438;">
                This link is valid for a long time, so you can use it whenever you're ready.
              </p>
              <p style="margin:0 0 24px;font-size:13px;color:#5a4438;">
                If you didn't request this password reset, please ignore this email.
              </p>
              <p style="margin:0;font-size:13px;color:#9a7a60;">
                For assistance, contact us at sashvistudio.in
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f5ede3;padding:20px 40px;text-align:center;border-top:1px solid #e8d5c0;">
              <p style="margin:0 0 6px;font-size:11px;color:#9a7a60;font-style:italic;">
                This is an automated email. Please do not reply.
              </p>
              <p style="margin:0;font-size:11px;color:#9a7a60;">
                sashvistudio© ${new Date().getFullYear()}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await sendEmail(user.email, "Reset Your Password — Sashvi Studio", emailHtml);
    console.log(`Password reset email sent to: ${user.email}`);
    return res.json({ 
      ok: true, 
      message: "Password reset email sent successfully",
      resetUrl // Only for testing - remove in production
    });
  } catch (emailError) {
    console.error("Failed to send password reset email:", emailError);
    return res.status(500).json({ error: "email_failed", detail: "Failed to send reset email" });
  }
});

// Validate password reset token
authRouter.post("/password-reset/validate", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "token required" });
  }

  // Get all unused, non-expired tokens
  const { data: tokens, error: tokensError } = await supabase
    .from("password_reset_tokens")
    .select("*")
    .eq("used", false)
    .gt("expires_at", new Date().toISOString());

  if (tokensError) {
    console.error("password reset token validation error:", tokensError);
    return res.status(500).json({ error: "db_error", detail: tokensError.message });
  }

  // Check each token hash against the provided token
  let validToken = null;
  for (const tokenRecord of tokens || []) {
    const isValid = await bcrypt.compare(token, tokenRecord.token_hash);
    if (isValid) {
      validToken = tokenRecord;
      break;
    }
  }

  if (!validToken) {
    return res.status(400).json({ error: "invalid_or_expired_token" });
  }

  return res.json({ 
    valid: true, 
    userId: validToken.user_id 
  });
});

// Confirm password reset
authRouter.post("/password-reset/confirm", async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: "token and password required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "password must be at least 6 characters" });
  }

  // Get all unused, non-expired tokens
  const { data: tokens, error: tokensError } = await supabase
    .from("password_reset_tokens")
    .select("*")
    .eq("used", false)
    .gt("expires_at", new Date().toISOString());

  if (tokensError) {
    console.error("password reset confirm error:", tokensError);
    return res.status(500).json({ error: "db_error", detail: tokensError.message });
  }

  // Check each token hash against the provided token
  let validToken = null;
  for (const tokenRecord of tokens || []) {
    const isValid = await bcrypt.compare(token, tokenRecord.token_hash);
    if (isValid) {
      validToken = tokenRecord;
      break;
    }
  }

  if (!validToken) {
    return res.status(400).json({ error: "invalid_or_expired_token" });
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(password, 12);

  // Update user password
  const { error: updateError } = await supabase
    .from("users")
    .update({ password: passwordHash })
    .eq("id", validToken.user_id);

  if (updateError) {
    console.error("password update error:", updateError);
    return res.status(500).json({ error: "db_error", detail: updateError.message });
  }

  // Mark token as used
  const { error: tokenUpdateError } = await supabase
    .from("password_reset_tokens")
    .update({ used: true })
    .eq("id", validToken.id);

  if (tokenUpdateError) {
    console.error("token update error:", tokenUpdateError);
    // Don't fail the request if token update fails, password was already updated
  }

  console.log(`Password reset successful for user_id: ${validToken.user_id}`);
  return res.json({ 
    ok: true, 
    message: "Password reset successfully" 
  });
});
