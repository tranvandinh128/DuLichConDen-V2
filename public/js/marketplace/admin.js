import { supabase, supabaseConfigured, showConfigWarning } from "./supabase-client.js";
import { getCurrentUser, signIn } from "./auth.js";

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const msg = text => { $("admin-message").textContent = text; };

async function loadReviewQueues() {
  const [apps, stores, products] = await Promise.all([
    supabase.from("seller_applications").select("*").eq("status", "pending").order("created_at"),
    supabase.from("stores").select("id,name,slug,description,owner_id").eq("status", "pending").order("created_at"),
    supabase.from("products").select("id,name,description,price,store_id").eq("status", "pending").order("created_at")
  ]);
  if (apps.error || stores.error || products.error) {
    msg("Không tải được danh sách duyệt. Kiểm tra migration và RLS.");
    console.error(apps.error || stores.error || products.error);
    return;
  }
  $("application-list").innerHTML = (apps.data || []).map(a => `
    <article class="admin-application">
      <div><strong>${esc(a.legal_name)}</strong><p>${esc(a.applicant_type)} · ${esc(a.phone)} · ${esc(a.address)}</p><p>${esc(a.description)}</p><small>User ID: ${esc(a.user_id)}</small></div>
      <div class="admin-actions"><button data-table="seller_applications" data-id="${a.id}" data-status="approved" class="button button-primary">Duyệt hồ sơ</button><button data-table="seller_applications" data-id="${a.id}" data-status="rejected" class="button button-muted">Từ chối</button></div>
    </article>`).join("") || "<p>Không có hồ sơ người bán chờ duyệt.</p>";

  $("store-list").innerHTML = (stores.data || []).map(s => `
    <article class="admin-application">
      <div><strong>${esc(s.name)}</strong><p>${esc(s.description)}</p><small>Slug: ${esc(s.slug)} · Chủ gian hàng: ${esc(s.owner_id)}</small></div>
      <div class="admin-actions"><button data-table="stores" data-id="${s.id}" data-status="approved" class="button button-primary">Duyệt gian hàng</button><button data-table="stores" data-id="${s.id}" data-status="suspended" class="button button-muted">Tạm khóa</button></div>
    </article>`).join("") || "<p>Không có gian hàng chờ duyệt.</p>";

  $("product-list").innerHTML = (products.data || []).map(p => `
    <article class="admin-application">
      <div><strong>${esc(p.name)}</strong><p>${esc(p.description)}</p><small>Giá: ${p.price == null ? "Chưa đặt" : new Intl.NumberFormat("vi-VN").format(p.price) + " ₫"} · Store: ${esc(p.store_id)}</small></div>
      <div class="admin-actions"><button data-table="products" data-id="${p.id}" data-status="active" class="button button-primary">Duyệt sản phẩm</button><button data-table="products" data-id="${p.id}" data-status="rejected" class="button button-muted">Từ chối</button></div>
    </article>`).join("") || "<p>Không có sản phẩm chờ duyệt.</p>";
}

async function loadApplications() {
  const user = await getCurrentUser();
  if (!user) { $("admin-login").hidden = false; $("admin-content").hidden = true; return; }
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") {
    $("admin-login").hidden = true; $("admin-content").hidden = true;
    msg("Tài khoản hiện tại không có quyền quản trị. Quyền admin phải được cấp trong Supabase.");
    return;
  }
  $("admin-login").hidden = true; $("admin-content").hidden = false;
  await loadReviewQueues();
}

document.addEventListener("DOMContentLoaded", () => {
  showConfigWarning();
  if (!supabaseConfigured) return;
  $("admin-login-form").addEventListener("submit", async e => {
    e.preventDefault();
    try { await signIn($("admin-email").value, $("admin-password").value); await loadApplications(); }
    catch (err) { msg(err.message); }
  });
  $("admin-content").addEventListener("click", async e => {
    const btn = e.target.closest("button[data-table]");
    if (!btn) return;
    btn.disabled = true;
    const { table, id, status } = btn.dataset;
    const patch = table === "seller_applications"
      ? { status, reviewed_at: new Date().toISOString() }
      : { status };
    const { error } = await supabase.from(table).update(patch).eq("id", id);
    if (error) msg("Không cập nhật được: " + error.message);
    else { msg("Đã cập nhật trạng thái."); await loadReviewQueues(); }
    btn.disabled = false;
  });
  loadApplications().catch(err => msg(err.message));
});
