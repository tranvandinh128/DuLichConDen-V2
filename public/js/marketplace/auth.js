
import { supabase, supabaseConfigured } from "./supabase-client.js";

/**
 * Lấy người dùng hiện tại.
 * Nếu chưa đăng nhập, trả về null để giao diện hiển thị form đăng nhập.
 * Nếu đã đăng nhập, xác minh người dùng với Supabase Auth.
 */
export async function getCurrentUser() {
  if (!supabaseConfigured || !supabase) {
    return null;
  }

  // Kiểm tra có phiên đăng nhập hay chưa.
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  // Chưa đăng nhập: không xem đây là lỗi.
  if (!session?.access_token) {
    return null;
  }

  // Xác minh người dùng với máy chủ Supabase.
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    if (
      userError.name === "AuthSessionMissingError" ||
      userError.code === "session_not_found"
    ) {
      return null;
    }

    throw userError;
  }

  return user || null;
}

export async function signIn(email, password) {
  if (!supabaseConfigured || !supabase) {
    throw new Error("Chưa cấu hình kết nối Supabase.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  return data;
}

export async function signUp(email, password, fullName) {
  if (!supabaseConfigured || !supabase) {
    throw new Error("Chưa cấu hình kết nối Supabase.");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  });

  if (error) throw error;

  return data;
}

export async function signOut() {
  if (!supabaseConfigured || !supabase) {
    throw new Error("Chưa cấu hình kết nối Supabase.");
  }

  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}
