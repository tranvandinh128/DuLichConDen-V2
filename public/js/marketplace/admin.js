
import {
  supabase,
  supabaseConfigured,
  showConfigWarning
} from "./supabase-client.js";

import {
  getCurrentUser,
  signIn
} from "./auth.js";

const $ = id => document.getElementById(id);

const esc = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));

const msg = text => {
  const element = $("admin-message");
  if (element) element.textContent = text;
};

/**
 * Gọi Cloudflare Pages Function để duyệt hoặc từ chối sản phẩm.
 * Access token lấy từ phiên đăng nhập Supabase hiện tại.
 */
async function reviewProduct(productId, action) {
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error("Không đọc được phiên đăng nhập.");
  }

  if (!session?.access_token) {
    throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  }

  const response = await fetch("/api/admin/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session.access_token}`
    },
    cache: "no-store",
    body: JSON.stringify({
      productId,
      action
    })
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Máy chủ trả về dữ liệu không hợp lệ.");
  }

  if (!response.ok || !result?.success) {
    throw new Error(
      result?.error || `Không xử lý được sản phẩm (${response.status}).`
    );
  }

  return result;
}

/**
 * Tải danh sách hồ sơ người bán, gian hàng và sản phẩm chờ duyệt.
 */
async function loadReviewQueues() {
  msg("Đang tải danh sách chờ duyệt...");

  const [apps, stores, products] = await Promise.all([
    supabase
      .from("seller_applications")
      .select("*")
      .eq("status", "pending")
      .order("created_at"),

    supabase
      .from("stores")
      .select("id,name,slug,description,owner_id")
      .eq("status", "pending")
      .order("created_at"),

    supabase
      .from("products")
      .select("id,name,description,price,store_id")
      .eq("status", "pending")
      .order("created_at")
  ]);

  if (apps.error || stores.error || products.error) {
    console.error(
      apps.error || stores.error || products.error
    );

    msg("Không tải được danh sách duyệt. Vui lòng kiểm tra RLS và kết nối Supabase.");
    return;
  }

  // Hồ sơ đăng ký người bán
  $("application-list").innerHTML =
    (apps.data || []).map(application => `
      <article class="admin-application">
        <div>
          <strong>${esc(application.legal_name)}</strong>
          <p>
            ${esc(application.applicant_type)}
            · ${esc(application.phone)}
            · ${esc(application.address)}
          </p>
          <p>${esc(application.description)}</p>
          <small>User ID: ${esc(application.user_id)}</small>
        </div>

        <div class="admin-actions">
          <button
            data-table="seller_applications"
            data-id="${esc(application.id)}"
            data-status="approved"
            class="button button-primary">
            Duyệt hồ sơ
          </button>

          <button
            data-table="seller_applications"
            data-id="${esc(application.id)}"
            data-status="rejected"
            class="button button-muted">
            Từ chối
          </button>
        </div>
      </article>
    `).join("") || "<p>Không có hồ sơ người bán chờ duyệt.</p>";

  // Gian hàng chờ duyệt
  $("store-list").innerHTML =
    (stores.data || []).map(store => `
      <article class="admin-application">
        <div>
          <strong>${esc(store.name)}</strong>
          <p>${esc(store.description)}</p>
          <small>
            Slug: ${esc(store.slug)}
            · Chủ gian hàng: ${esc(store.owner_id)}
          </small>
        </div>

        <div class="admin-actions">
          <button
            data-table="stores"
            data-id="${esc(store.id)}"
            data-status="approved"
            class="button button-primary">
            Duyệt gian hàng
          </button>

          <button
            data-table="stores"
            data-id="${esc(store.id)}"
            data-status="suspended"
            class="button button-muted">
            Tạm khóa
          </button>
        </div>
      </article>
    `).join("") || "<p>Không có gian hàng chờ duyệt.</p>";

  // Sản phẩm chờ duyệt
  $("product-list").innerHTML =
    (products.data || []).map(product => `
      <article class="admin-application">
        <div>
          <strong>${esc(product.name)}</strong>
          <p>${esc(product.description)}</p>

          <small>
            Giá:
            ${
              product.price == null
                ? "Chưa đặt"
                : new Intl.NumberFormat("vi-VN").format(product.price) + " ₫"
            }
            · Store: ${esc(product.store_id)}
          </small>
        </div>

        <div class="admin-actions">
          <button
            data-table="products"
            data-id="${esc(product.id)}"
            data-status="active"
            class="button button-primary">
            Duyệt sản phẩm
          </button>

          <button
            data-table="products"
            data-id="${esc(product.id)}"
            data-status="rejected"
            class="button button-muted">
            Từ chối
          </button>
        </div>
      </article>
    `).join("") || "<p>Không có sản phẩm chờ duyệt.</p>";

  msg("Đã tải xong danh sách chờ duyệt.");
}

/**
 * Kiểm tra tài khoản hiện tại có phải admin không.
 */
async function loadApplications() {
  const user = await getCurrentUser();

  if (!user) {
    $("admin-login").hidden = false;
    $("admin-content").hidden = true;
    return;
  }

  const {
    data: profile,
    error: profileError
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    $("admin-login").hidden = true;
    $("admin-content").hidden = true;

    msg("Tài khoản hiện tại không có quyền quản trị.");
    return;
  }

  $("admin-login").hidden = true;
  $("admin-content").hidden = false;

  await loadReviewQueues();
}

/**
 * Xử lý khi quản trị viên nhấn nút.
 */
async function handleAdminAction(event) {
  const button = event.target.closest("button[data-table]");

  if (!button) return;

  if (button.disabled) return;

  const table = button.dataset.table;
  const id = button.dataset.id;
  const status = button.dataset.status;

  if (!id || !status) return;

  button.disabled = true;

  try {
    if (table === "products") {
      const action = status === "active"
        ? "approve"
        : status === "rejected"
          ? "reject"
          : null;

      if (!action) {
        throw new Error("Trạng thái duyệt sản phẩm không hợp lệ.");
      }

      msg(
        action === "approve"
          ? "Đang kiểm tra và duyệt sản phẩm, vui lòng chờ..."
          : "Đang xử lý từ chối sản phẩm..."
      );

      const result = await reviewProduct(id, action);

      if (
        action === "approve" &&
        result.data?.privateCleanup === "needs_cleanup"
      ) {
        msg("Sản phẩm đã được duyệt nhưng cần kiểm tra lại ảnh còn trong kho chờ duyệt.");
      } else {
        msg(result.message || "Đã xử lý sản phẩm thành công.");
      }

      await loadReviewQueues();
      return;
    }

    // Hồ sơ người bán và gian hàng giữ nguyên cách xử lý hiện tại.
    if (!["seller_applications", "stores"].includes(table)) {
      throw new Error("Bảng dữ liệu không được phép cập nhật.");
    }

    const patch = table === "seller_applications"
      ? {
          status,
          reviewed_at: new Date().toISOString()
        }
      : {
          status
        };

    const { error } = await supabase
      .from(table)
      .update(patch)
      .eq("id", id);

    if (error) throw error;

    msg("Đã cập nhật trạng thái.");

    await loadReviewQueues();

  } catch (error) {
    console.error("Admin action failed:", error);
    msg("Không xử lý được: " + error.message);
  } finally {
    button.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  showConfigWarning();

  if (!supabaseConfigured) return;

  const loginForm = $("admin-login-form");
  const adminContent = $("admin-content");

  if (!loginForm || !adminContent) {
    console.error("Không tìm thấy thành phần giao diện quản trị.");
    return;
  }

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    try {
      await signIn(
        $("admin-email").value,
        $("admin-password").value
      );

      await loadApplications();

    } catch (error) {
      msg(error.message);
    }
  });

  adminContent.addEventListener("click", handleAdminAction);

  loadApplications().catch(error => {
    console.error(error);
    msg("Không tải được trang quản trị: " + error.message);
  });
});
