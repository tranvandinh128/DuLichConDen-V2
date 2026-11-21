import { supabase, supabaseConfigured, showConfigWarning } from "./supabase-client.js";
import { signIn, signUp, signOut, getCurrentUser } from "./auth.js";

const $ = id => document.getElementById(id);
const message = (text, type = "info") => {
  const el = $("seller-message");
  if (el) { el.textContent = text; el.className = `notice ${type}`; el.hidden = false; }
};

async function refreshSellerArea() {
  const user = await getCurrentUser();
  $("auth-panel").hidden = !!user;
  $("seller-panel").hidden = !user;
  if (!user) return;

  $("signed-in-email").textContent = user.email || "";
  const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle();
  $("profile-name").textContent = profile?.full_name || user.email;

  const { data: app } = await supabase.from("seller_applications").select("*").eq("user_id", user.id).maybeSingle();
  $("application-status").textContent = app
    ? `Hồ sơ: ${app.status === "pending" ? "Đang chờ quản trị viên duyệt" : app.status === "approved" ? "Đã duyệt" : app.status === "rejected" ? "Chưa được duyệt – xem ghi chú" : app.status}`
    : "Bạn chưa gửi hồ sơ đăng ký người bán.";

  const { data: store } = await supabase.from("stores").select("*").eq("owner_id", user.id).maybeSingle();
  $("store-form").hidden = !app || app.status !== "approved" || !!store;
  $("product-form").hidden = !store || store.status !== "approved";
  $("store-summary").hidden = !store;
  if (store) {
    $("store-id").value = store.id;
    $("store-summary").textContent = `Gian hàng: ${store.name} · Trạng thái: ${store.status === "pending" ? "Chờ quản trị viên duyệt" : store.status === "approved" ? "Đã duyệt" : "Tạm khóa"}`;
    await loadMyProducts(store.id);
  }
}

async function loadMyProducts(storeId) {
  const { data, error } = await supabase.from("products").select("id,name,price,status").eq("store_id", storeId).order("created_at", { ascending: false });
  if (error) return;
  $("my-products").innerHTML = (data || []).map(p =>
    `<li><span>${p.name.replace(/[&<>"']/g, "")}</span><small>${p.price == null ? "Chưa có giá" : new Intl.NumberFormat("vi-VN").format(p.price) + " ₫"} · ${p.status}</small></li>`
  ).join("") || "<li>Chưa có sản phẩm.</li>";
}

document.addEventListener("DOMContentLoaded", async () => {
  showConfigWarning();
  if (!supabaseConfigured) return;

  $("signup-form").addEventListener("submit", async e => {
    e.preventDefault();
    try {
      const result = await signUp($("signup-email").value, $("signup-password").value, $("signup-name").value);
      message(result.user?.identities?.length === 0 ? "Email này đã được đăng ký." : "Đăng ký thành công. Nếu xác nhận email đang bật, hãy mở email để xác nhận rồi đăng nhập.", "success");
    } catch (err) { message(err.message, "error"); }
  });

  $("login-form").addEventListener("submit", async e => {
    e.preventDefault();
    try { await signIn($("login-email").value, $("login-password").value); message("Đăng nhập thành công.", "success"); await refreshSellerArea(); }
    catch (err) { message(err.message, "error"); }
  });

  $("logout-button").addEventListener("click", async () => {
    await signOut(); await refreshSellerArea(); message("Đã đăng xuất.");
  });

  $("application-form").addEventListener("submit", async e => {
    e.preventDefault();
    try {
      const user = await getCurrentUser();
      const payload = {
        user_id: user.id,
        applicant_type: $("applicant-type").value,
        legal_name: $("legal-name").value.trim(),
        phone: $("seller-phone").value.trim(),
        address: $("seller-address").value.trim(),
        description: $("seller-description").value.trim(),
        status: "pending"
      };
      const { error } = await supabase.from("seller_applications").upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      message("Đã gửi hồ sơ. Gian hàng chỉ được mở sau khi quản trị viên duyệt.", "success");
      await refreshSellerArea();
    } catch (err) { message(err.message, "error"); }
  });

  $("store-form").addEventListener("submit", async e => {
    e.preventDefault();
    try {
      const user = await getCurrentUser();
      const { error } = await supabase.from("stores").insert({
        owner_id: user.id,
        name: $("store-name").value.trim(),
        slug: $("store-slug").value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        description: $("store-description").value.trim(),
        status: "pending"
      });
      if (error) throw error;
      message("Đã gửi thông tin gian hàng. Quản trị viên cần duyệt trước khi cửa hàng hiển thị công khai.", "success");
      await refreshSellerArea();
    } catch (err) { message(err.message, "error"); }
  });

  $("product-form").addEventListener("submit", async e => {
    e.preventDefault();
    try {
      const user = await getCurrentUser();
      const storeId = $("store-id").value;
      const file = $("product-image").files[0];
      let imageUrl = null;
      if (file) {
        if (!["image/jpeg","image/png","image/webp"].includes(file.type)) throw new Error("Chỉ nhận ảnh JPG, PNG hoặc WebP.");
        if (file.size > 5 * 1024 * 1024) throw new Error("Ảnh tối đa 5 MB.");
        const path = `${storeId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
        const { error: uploadError } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("products").insert({
        store_id: storeId, name: $("product-name").value.trim(),
        description: $("product-description").value.trim(),
        price: $("product-price").value ? Number($("product-price").value) : null,
        image_url: imageUrl, status: "pending"
      });
      if (error) throw error;
      message("Đã gửi sản phẩm. Sản phẩm ở trạng thái chờ duyệt trước khi hiển thị.", "success");
      e.target.reset(); await loadMyProducts(storeId);
    } catch (err) { message(err.message, "error"); }
  });

  try { await refreshSellerArea(); } catch (err) { message(err.message, "error"); }
});
