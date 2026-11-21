import { supabase, supabaseConfigured } from "./supabase-client.js";

export async function getCurrentUser() {
  if (!supabaseConfigured) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function signIn(email, password) {
  if (!supabaseConfigured) throw new Error("Chưa cấu hình kết nối Supabase.");
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email, password, fullName) {
  if (!supabaseConfigured) throw new Error("Chưa cấu hình kết nối Supabase.");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabaseConfigured) throw new Error("Chưa cấu hình kết nối Supabase.");
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
