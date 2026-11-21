import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../../config/supabase.js";

const configured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR_") &&
  SUPABASE_ANON_KEY.length > 30 &&
  !SUPABASE_ANON_KEY.includes("YOUR_");

export const supabaseConfigured = configured;
export const supabase = configured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null;

export function showConfigWarning(target = "page-alert") {
  const el = document.getElementById(target);
  if (el && !supabaseConfigured) {
    el.hidden = false;
    el.textContent = "Website đã tải giao diện nhưng chưa kết nối Supabase. Quản trị viên cần điền Project URL và publishable/anon key trong public/config/supabase.js.";
  }
}
