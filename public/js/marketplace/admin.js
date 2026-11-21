/* DuLichConDen 2.0 - Marketplace Admin
 * Requires a Supabase JS v2 client exposed as:
 *   window.supabaseClient
 * or window.DuLichConDenSupabase
 *
 * This module never uses a service-role key in the browser.
 */
(function (global) {
  "use strict";

  const NS = (global.DuLichConDenMarketplace = global.DuLichConDenMarketplace || {});
  const TABLES = { admins: "marketplace_admins", shops: "marketplace_shops", products: "marketplace_products" };

  function client() {
    const c = global.supabaseClient || global.DuLichConDenSupabase;
    if (!c || typeof c.from !== "function" || !c.auth) {
      throw new Error("Chưa tìm thấy Supabase client. Hãy cấu hình window.supabaseClient trước khi dùng marketplace.");
    }
    return c;
  }

  async function currentUser() {
    const { data, error } = await client().auth.getUser();
    if (error) throw error;
    if (!data || !data.user) throw new Error("Bạn cần đăng nhập trước.");
    return data.user;
  }

  async function requireAdmin() {
    const user = await currentUser();
    const { data, error } = await client()
      .from(TABLES.admins)
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("Tài khoản này chưa được cấp quyền quản trị sàn.");
    return user;
  }

  async function listShops(status) {
    await requireAdmin();
    let q = client().from(TABLES.shops).select("*").order("created_at", { ascending: false });
    if (status && status !== "all") q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async function reviewShop(shopId, status, note) {
    await requireAdmin();
    if (!["approved", "rejected", "suspended", "pending"].includes(status)) {
      throw new Error("Trạng thái gian hàng không hợp lệ.");
    }
    const { data, error } = await client()
      .from(TABLES.shops)
      .update({
        status,
        admin_note: note || null,
        reviewed_at: new Date().toISOString()
      })
      .eq("id", shopId)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  async function listProducts(status) {
    await requireAdmin();
    let q = client()
      .from(TABLES.products)
      .select("*, marketplace_shops(id, shop_name, owner_id)")
      .order("created_at", { ascending: false });
    if (status && status !== "all") q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async function reviewProduct(productId, status, note) {
    await requireAdmin();
    if (!["approved", "rejected", "pending", "hidden"].includes(status)) {
      throw new Error("Trạng thái sản phẩm không hợp lệ.");
    }
    const { data, error } = await client()
      .from(TABLES.products)
      .update({
        status,
        admin_note: note || null,
        reviewed_at: new Date().toISOString()
      })
      .eq("id", productId)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  async function dashboard() {
    await requireAdmin();
    const [pendingShops, approvedShops, pendingProducts, approvedProducts] = await Promise.all([
      client().from(TABLES.shops).select("id", { count: "exact", head: true }).eq("status", "pending"),
      client().from(TABLES.shops).select("id", { count: "exact", head: true }).eq("status", "approved"),
      client().from(TABLES.products).select("id", { count: "exact", head: true }).eq("status", "pending"),
      client().from(TABLES.products).select("id", { count: "exact", head: true }).eq("status", "approved")
    ]);
    for (const r of [pendingShops, approvedShops, pendingProducts, approvedProducts]) {
      if (r.error) throw r.error;
    }
    return {
      pendingShops: pendingShops.count || 0,
      approvedShops: approvedShops.count || 0,
      pendingProducts: pendingProducts.count || 0,
      approvedProducts: approvedProducts.count || 0
    };
  }

  NS.admin = { requireAdmin, dashboard, listShops, reviewShop, listProducts, reviewProduct };
})(window);
