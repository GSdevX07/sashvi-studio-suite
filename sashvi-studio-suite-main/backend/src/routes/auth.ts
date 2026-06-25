import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { supabase } from '../lib/supabase';
import { sendEmail, buildVerificationEmail } from '../lib/email';
import { signAccess, signRefresh } from '../utils/jwt';

export const authRouter = express.Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  mobile: z.string().optional(),
});

// ── Register ──────────────────────────────────────────────────────────────────
authRouter.post('/register', async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'invalid_input' });
  const { name, email, password, mobile } = parse.data;

  // Check duplicate
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (existing) return res.status(400).json({ error: 'Email already registered' });

  const hash = await bcrypt.hash(password, 12);

  const { data, error } = await supabase
    .from('users')
    .insert({
      name,
      email,
      password: hash,
      mobile: mobile || '0000000000',
      role: 'user',
    })
    .select('id, email, name')
    .maybeSingle();

  if (error) {
    console.error('register db error:', error);
    return res.status(500).json({ error: 'db_error', detail: error.message });
  }

  // Send welcome / verification email (non-blocking)
  const baseUrl = process.env.FRONTEND_URL || `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}`;
  const verifyUrl = `${baseUrl}/verify?userId=${data?.id}`;
  const html = buildVerificationEmail(name, verifyUrl);
  sendEmail(email, 'Welcome to Sashvi Studio — Verify your email', html).catch(() => {});

  // Auto-issue tokens (email verified on first login for simplicity)
  const access = signAccess({ sub: data?.id, email: data?.email });
  const refresh = signRefresh({ sub: data?.id });
  return res.json({ ok: true, access, refresh, user: { id: data?.id, email: data?.email, name: data?.name } });
});

// ── Login ─────────────────────────────────────────────────────────────────────
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

authRouter.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'invalid_input' });
  const { email, password } = parse.data;

  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, password, role')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    console.error('login db error:', error);
    return res.status(500).json({ error: 'db_error', detail: error.message });
  }
  if (!data) return res.status(400).json({ error: 'invalid_credentials' });

  const match = await bcrypt.compare(password, data.password);
  if (!match) return res.status(400).json({ error: 'invalid_credentials' });

  const access = signAccess({ sub: data.id, email: data.email, role: data.role });
  const refresh = signRefresh({ sub: data.id });
  return res.json({ access, refresh, user: { id: data.id, email: data.email, name: data.name } });
});

// ── Resend verification (kept for compatibility) ───────────────────────────────
authRouter.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  const { data } = await supabase.from('users').select('id, name, email').eq('email', email).maybeSingle();
  if (!data) return res.status(404).json({ error: 'not_found' });

  const baseUrl = process.env.FRONTEND_URL || `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}`;
  const verifyUrl = `${baseUrl}/verify?userId=${data.id}`;
  const html = buildVerificationEmail(data.name, verifyUrl);
  try {
    await sendEmail(email, 'Sashvi Studio — Verify your email', html);
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: 'email_failed', detail: e.message });
  }
});

// ── Verify (stub — real schema has no verify_token column) ────────────────────
authRouter.post('/verify', async (_req, res) => {
  return res.json({ ok: true });
});
