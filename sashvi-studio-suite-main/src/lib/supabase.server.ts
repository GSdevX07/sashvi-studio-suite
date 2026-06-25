import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? "";
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";

if (!supabaseUrl || !supabaseKey) {
  console.warn("[supabase.server] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY — Supabase will not be available.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: { transport: ws } as never,
});
