import { supabase, supabaseConfigured, showConfigWarning } from "./supabase-client.js";

const esc = (v = "") => String(v).replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));

function money(value) {
  if (value == null) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

async function loadMarketplace() {
  showConfigWarning();
  const storeGrid = document.getElementById("store-grid");
  const productGrid = document.getElementById("product-grid");
  const status = document.getElementById("market-status");
  if (!supabaseConfigured) return;

  const [{ data: stores, error: storeError }, { data: products, error: productError }] = await Promise.all([
    supabase.from("stores").select("id,name,slug,description,logo_url").eq("status", "approved").order("created_at", { ascending: false }).limit(24),
    supabase.from("products").select("id,store_id,name,description,price,image_url,categories(name),stores(name)").eq("status", "active").order("created_at", { ascending: false }).limit(48)
  ]);

  if (storeError || productError) {
    status.textContent = "Chưa tải được dữ liệu. Kiểm tra migration, RLS và cấu hình Supabase.";
    console.error(storeError || productError);
    return;
  }

  storeGrid.innerHTML = (stores || []).length ? stores.map(s => `
    <a class="store-card" href="../shop/?id=${encodeURIComponent(s.id)}">
      <span class="store-avatar">${esc((s.name || "G").slice(0,1).toUpperCase())}</span>
      <span><strong>${esc(s.name)}</strong><small>${esc(s.description || "Gian hàng địa phương")}</small></span>
    </a>`).join("") : `<p class="empty-state">Chưa có gian hàng được duyệt. Mời người bán đăng ký tham gia.</p>`;

  productGrid.innerHTML = (products || []).length ? products.map(p => `
    <article class="market-product" data-name="${esc((p.name || "").toLowerCase())}" data-category="${esc(p.categories?.name || "")}">
      <a class="market-product-image" href="../shop/?id=${encodeURIComponent(p.store_id)}">
        ${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">` : `<span>Ảnh sản phẩm</span>`}
      </a>
      <div class="market-product-body">
        <small>${esc(p.stores?.name || "Gian hàng")}</small>
        <h3>${esc(p.name)}</h3>
        <p>${esc(p.description || "")}</p>
        <strong>${money(p.price)}</strong>
      </div>
    </article>`).join("") : `<p class="empty-state">Chưa có sản phẩm được mở bán. Sản phẩm sẽ xuất hiện sau khi người bán đăng và được duyệt.</p>`;

  status.textContent = `${(stores || []).length} gian hàng · ${(products || []).length} sản phẩm đang hiển thị`;
}

document.addEventListener("DOMContentLoaded", () => {
  loadMarketplace().catch(err => {
    console.error(err);
    const status = document.getElementById("market-status");
    if (status) status.textContent = "Có lỗi khi tải dữ liệu. Vui lòng thử lại sau.";
  });

  document.getElementById("market-search")?.addEventListener("input", event => {
    const q = event.target.value.trim().toLowerCase();
    document.querySelectorAll(".market-product").forEach(card => {
      card.hidden = !card.dataset.name.includes(q);
    });
  });
});
