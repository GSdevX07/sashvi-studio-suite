import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { supabase } from '../lib/supabase';
import { sendEmail } from '../lib/email';
import { signAccess, signRefresh } from '../utils/jwt';
import fetch from 'node-fetch';

export const authRouter = express.Router();

const registerSchema = z.object({ name: z.string().min(1), email: z.string().email(), password: z.string().min(6) });

authRouter.post('/register', async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'invalid' });
  const { name, email, password } = parse.data;

  const { data: existing } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
  if (existing) return res.status(400).json({ error: 'Email already registered' });

  const hash = await bcrypt.hash(password, 12);
  const token = randomBytes(24).toString('hex');

  const { data, error } = await supabase.from('users').insert({ name, email, password_hash: hash, is_verified: false, verify_token: token, verify_expires: new Date(Date.now() + 1000 * 60 * 60 * 24) }).select('*').maybeSingle();
  if (error) return res.status(500).json({ error: 'db_error' });

  // send verification email
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify?token=${token}`;
  const html = `<p>Hi ${name},</p><p>Click to verify your email: <a href="${verifyUrl}">Verify email</a></p>`;
  try {
    await sendEmail(email, 'Verify your Sashvi Studio account', html);
  } catch (e) {
    // ignore email errors for now
    // eslint-disable-next-line no-console
    console.warn('email send failed', e);
  }

  return res.json({ ok: true, user: { id: data?.id, email: data?.email } });
});

authRouter.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  const { data } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  if (!data) return res.status(404).json({ error: 'not_found' });
  if (data.is_verified) return res.status(400).json({ error: 'already_verified' });

  const token = randomBytes(24).toString('hex');
  await supabase.from('users').update({ verify_token: token, verify_expires: new Date(Date.now() + 1000 * 60 * 60 * 24) }).eq('id', data.id);
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify?token=${token}`;
  const html = `<p>Hi ${data.name},</p><p>Click to verify your email: <a href="${verifyUrl}">Verify email</a></p>`;
  try {
    await sendEmail(email, 'Verify your Sashvi Studio account', html);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('email send failed', e);
  }
  return res.json({ ok: true });
});

authRouter.post('/verify', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token required' });
  const { data } = await supabase.from('users').select('*').eq('verify_token', token).maybeSingle();
  if (!data) return res.status(400).json({ error: 'invalid token' });
  if (data.verify_expires && new Date(data.verify_expires) < new Date()) return res.status(400).json({ error: 'token expired' });
  await supabase.from('users').update({ is_verified: true, verify_token: null, verify_expires: null }).eq('id', data.id);
  return res.json({ ok: true });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

authRouter.post('/login', async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'invalid' });
  const { email, password } = parse.data;
  const { data } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  if (!data) return res.status(400).json({ error: 'invalid_credentials' });
  const match = await bcrypt.compare(password, data.password_hash);
  if (!match) return res.status(400).json({ error: 'invalid_credentials' });
  if (!data.is_verified) return res.status(403).json({ error: 'email_not_verified' });

  const access = signAccess({ sub: data.id, email: data.email });
  const refresh = signRefresh({ sub: data.id });
  return res.json({ access, refresh });
});

// Google Sign-In: client obtains id_token and POSTs to this endpoint
authRouter.post('/google', async (req, res) => {
  const { id_token } = req.body;
  if (!id_token) return res.status(400).json({ error: 'id_token required' });

  try {
    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(id_token)}`);
    if (!resp.ok) return res.status(400).json({ error: 'invalid_token' });
    const payload = await resp.json();
    const email = payload.email;
    const name = payload.name || payload.email?.split('@')[0];
    if (!email) return res.status(400).json({ error: 'no_email' });

    // upsert user
    const { data: existing } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (!existing) {
      const { data } = await supabase.from('users').insert({ name, email, is_verified: true }).select('*').maybeSingle();
      const access = signAccess({ sub: data.id, email: data.email });
      const refresh = signRefresh({ sub: data.id });
      return res.json({ access, refresh });
    }

    const access = signAccess({ sub: existing.id, email: existing.email });
    const refresh = signRefresh({ sub: existing.id });
    return res.json({ access, refresh });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('google verify error', e);
    return res.status(500).json({ error: 'google_verify_failed' });
  }
});
