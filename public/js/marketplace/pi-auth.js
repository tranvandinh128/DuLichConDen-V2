import { supabase, supabaseConfigured } from "./supabase-client.js";

const $ = id => document.getElementById(id);
let piInitPromise = null;

function showPiMessage(message, type = "info") {
  const el = $("seller-message");
  if (!el) return;
  el.textContent = message;
  el.className = `seller-message ${type}`;
  el.hidden = false;
  el.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function getPiSandboxMode() {
  return document.documentElement.dataset.piSandbox === "true";
}

async function ensurePiReady() {
  if (!window.Pi || typeof window.Pi.authenticate !== "function") {
    throw new Error("Không tìm thấy Pi SDK. Hãy mở trang này trong Pi Browser hoặc Pi Sandbox.");
  }

  if (!piInitPromise) {
    piInitPromise = Promise.resolve(
      window.Pi.init({
        version: "2.0",
        sandbox: getPiSandboxMode()
      })
    ).catch(error => {
      piInitPromise = null;
      throw error;
    });
  }

  await piInitPromise;
}

async function authenticateWithPi() {
  await ensurePiReady();

  // Login only needs the username scope. Do not request payments permission here.
  const result = await window.Pi.authenticate(["username"], () => {});

  if (!result?.accessToken) {
    throw new Error("Pi Network không trả về access token hợp lệ.");
  }

  return result.accessToken;
}

async function postJson(path, body, accessToken = null) {
  const headers = { "Content-Type": "application/json" };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const response = await fetch(path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
    credentials: "same-origin"
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) {
    throw new Error(data.error || `Máy chủ phản hồi lỗi HTTP ${response.status}.`);
  }
  return data;
}

async function loginByPi(button) {
  if (!supabaseConfigured || !supabase) {
    throw new Error("Website chưa được cấu hình Supabase.");
  }

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Đang kết nối Pi Network...";

  try {
    const piAccessToken = await authenticateWithPi();
    showPiMessage("Đã xác thực tại Pi Browser. Đang xác minh tài khoản trên máy chủ DuLichConDen...");

    const result = await postJson("/api/pi-auth/login", {
      accessToken: piAccessToken
    });

    if (!result.tokenHash) {
      throw new Error("Máy chủ chưa cấp được phiên đăng nhập. Vui lòng thử lại.");
    }

    // Exchange the one-time Supabase magic-link hash for a real Supabase session.
    const { error } = await supabase.auth.verifyOtp({
      token_hash: result.tokenHash,
      type: "magiclink"
    });

    if (error) throw error;

    showPiMessage(`Đăng nhập thành công bằng Pi Network${result.username ? ` · @${result.username}` : ""}.`, "success");
    window.location.reload();
  } catch (error) {
    console.error("Pi login failed:", error);
    showPiMessage(error.message || "Không thể đăng nhập bằng Pi Network.", "error");
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

async function linkPiAccount(button) {
  if (!supabaseConfigured || !supabase) {
    throw new Error("Website chưa được cấu hình Supabase.");
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const session = sessionData?.session;
  if (!session?.access_token) {
    throw new Error("Phiên đăng nhập email đã hết hạn. Vui lòng đăng nhập lại trước khi liên kết Pi.");
  }

  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = "Đang liên kết với Pi Network...";

  try {
    const piAccessToken = await authenticateWithPi();
    const result = await postJson(
      "/api/pi-auth/link",
      { accessToken: piAccessToken },
      session.access_token
    );

    showPiMessage(
      `Đã liên kết Pi Network${result.username ? ` · @${result.username}` : ""} với tài khoản người bán hiện tại. Từ lần sau, bạn có thể dùng Pi để đăng nhập.`,
      "success"
    );
    button.textContent = "Đã liên kết tài khoản Pi";
  } catch (error) {
    console.error("Pi account linking failed:", error);
    showPiMessage(error.message || "Không thể liên kết tài khoản Pi.", "error");
    button.disabled = false;
    button.textContent = originalText;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const loginButton = $("pi-login-button");
  const linkButton = $("pi-link-account-button");

  if (loginButton) {
    loginButton.addEventListener("click", () => loginByPi(loginButton));
  }

  if (linkButton) {
    linkButton.addEventListener("click", () => linkPiAccount(linkButton));
  }
});

