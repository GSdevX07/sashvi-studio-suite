import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_KEY || '';

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.warn('Supabase URL or SERVICE KEY not set. Some features may fail.');
}

export const supabase = createClient(url, key, { auth: { persistSession: false } });
