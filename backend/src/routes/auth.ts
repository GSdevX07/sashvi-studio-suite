import express from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
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
