import { supabase, supabaseConfigured } from "./supabase-client.js";

const $ = id => document.getElementById(id);

function showMessage(text, type = "info") {
  const el = $("seller-message");
  if (!el) return;

  el.textContent = text;
  el.className = `seller-message ${type}`;
  el.hidden = false;
}

document.addEventListener("DOMContentLoaded", () => {
  const forgotToggle = $("toggle-forgot-password");
  const forgotPanel = $("forgot-password-panel");
  const phoneToggle = $("toggle-phone-recovery");
  const phoneNote = $("phone-recovery-note");
  const forgotForm = $("forgot-password-form");

  if (forgotToggle && forgotPanel) {
    forgotToggle.addEventListener("click", () => {
      const shouldOpen = forgotPanel.hidden;
      forgotPanel.hidden = !shouldOpen;
      forgotToggle.setAttribute("aria-expanded", String(shouldOpen));
      if (shouldOpen) $("forgot-email")?.focus();
    });
  }

  if (phoneToggle && phoneNote) {
    phoneToggle.addEventListener("click", () => {
      const shouldOpen = phoneNote.hidden;
      phoneNote.hidden = !shouldOpen;
      phoneToggle.setAttribute("aria-expanded", String(shouldOpen));
    });
  }

  if (!forgotForm) return;

  forgotForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!supabaseConfigured || !supabase) {
      showMessage("Chưa cấu hình kết nối Supabase.", "error");
      return;
    }

    const email = $("forgot-email")?.value.trim();
    if (!email) {
      showMessage("Vui lòng nhập địa chỉ email đã đăng ký.", "error");
      return;
    }

    const button = forgotForm.querySelector('button[type="submit"]');
    if (button) button.disabled = true;

    try {
      // Giữ đúng hostname đang sử dụng (Production hoặc Preview).
      const redirectTo = new URL("./reset-password.html", window.location.href).href;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
      });

      if (error) throw error;

      showMessage(
        "Yêu cầu đã được tiếp nhận. Nếu email này thuộc một tài khoản hợp lệ, hệ thống sẽ gửi liên kết đặt lại mật khẩu. Hãy kiểm tra cả hộp thư Spam/Thư rác.",
        "success"
      );
      forgotForm.reset();
    } catch (error) {
      console.error("Password recovery request failed:", error);
      showMessage(
        error.message || "Không gửi được email khôi phục. Vui lòng thử lại sau.",
        "error"
      );
    } finally {
      if (button) button.disabled = false;
    }
  });
});

