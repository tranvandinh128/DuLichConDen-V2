/* DuLichConDen 2.0 - Public marketplace
 * Public pages may call window.DuLichConDenMarketplace.store methods.
 */
(function (global) {
  "use strict";

  const NS = (global.DuLichConDenMarketplace = global.DuLichConDenMarketplace || {});
  const SHOPS = "marketplace_shops";
  const PRODUCTS = "marketplace_products";

  function client() {
    const c = global.supabaseClient || global.DuLichConDenSupabase;
    if (!c || typeof c.from !== "function") {
      throw new Error("Chưa cấu hình Supabase client (window.supabaseClient).");
    }
    return c;
  }

  async function listProducts(options) {
    const opts = options || {};
    const page = Math.max(1, Number(opts.page) || 1);
    const pageSize = Math.min(48, Math.max(1, Number(opts.pageSize) || 12));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let q = client()
      .from(PRODUCTS)
      .select("id, shop_id, name, description, price_vnd, stock, category, image_url, created_at, marketplace_shops!inner(id, shop_name)", { count: "exact" })
      .eq("status", "approved")
      .eq("marketplace_shops.status", "approved")
      .gt("stock", 0)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (opts.category) q = q.eq("category", opts.category);
    if (opts.shopId) q = q.eq("shop_id", opts.shopId);
    if (opts.search) {
      const term = String(opts.search).trim().replace(/[,%()]/g, " ");
      if (term) q = q.or("name.ilike.%" + term + "%,description.ilike.%" + term + "%");
    }
    if (opts.minPrice !== undefined && opts.minPrice !== "") q = q.gte("price_vnd", Number(opts.minPrice));
    if (opts.maxPrice !== undefined && opts.maxPrice !== "") q = q.lte("price_vnd", Number(opts.maxPrice));

    const { data, error, count } = await q;
    if (error) throw error;
    return { items: data || [], total: count || 0, page, pageSize };
  }

  async function getProduct(productId) {
    const { data, error } = await client()
      .from(PRODUCTS)
      .select("*, marketplace_shops(id, shop_name, phone, address, description)")
      .eq("id", productId)
      .eq("status", "approved")
      .single();
    if (error) throw error;
    return data;
  }

  async function listShops(options) {
    const opts = options || {};
    let q = client()
      .from(SHOPS)
      .select("id, shop_name, owner_name, business_type, address, description, created_at")
      .eq("status", "approved")
      .order("shop_name", { ascending: true });
    if (opts.search) {
      const term = String(opts.search).trim().replace(/[,%()]/g, " ");
      if (term) q = q.ilike("shop_name", "%" + term + "%");
    }
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  function formatVND(value) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value) || 0);
  }

  // Optional rendering helper: writes escaped product cards into an element.
  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }

  function renderProductCards(container, products) {
    const el = typeof container === "string" ? document.querySelector(container) : container;
    if (!el) throw new Error("Không tìm thấy vùng hiển thị sản phẩm.");
    el.innerHTML = (products || []).map(p => `
      <article class="dlcd-product-card" data-product-id="${escapeHTML(p.id)}">
        <a class="dlcd-product-card__image" href="/pages/product/?id=${encodeURIComponent(p.id)}">
          ${p.image_url ? `<img src="${escapeHTML(p.image_url)}" alt="${escapeHTML(p.name)}" loading="lazy">` : `<span>Chưa có hình ảnh</span>`}
        </a>
        <div class="dlcd-product-card__body">
          <p class="dlcd-product-card__shop">${escapeHTML(p.marketplace_shops && p.marketplace_shops.shop_name || "")}</p>
          <h3>${escapeHTML(p.name)}</h3>
          <p class="dlcd-product-card__price">${formatVND(p.price_vnd)}</p>
          <p class="dlcd-product-card__stock">Còn ${Number(p.stock) || 0} sản phẩm</p>
        </div>
      </article>
    `).join("");
    return el;
  }

  NS.store = { listProducts, getProduct, listShops, formatVND, renderProductCards };
})(window);
