/* DuLichConDen 2.0 - Seller tools
 * Requires Supabase JS v2 client exposed as window.supabaseClient
 * or window.DuLichConDenSupabase. No service-role key belongs in browser code.
 */
(function (global) {
  "use strict";

  const NS = (global.DuLichConDenMarketplace = global.DuLichConDenMarketplace || {});
  const SHOPS = "marketplace_shops";
  const PRODUCTS = "marketplace_products";

  function client() {
    const c = global.supabaseClient || global.DuLichConDenSupabase;
    if (!c || typeof c.from !== "function" || !c.auth) {
      throw new Error("Chưa cấu hình Supabase client (window.supabaseClient).");
    }
    return c;
  }

  async function user() {
    const { data, error } = await client().auth.getUser();
    if (error) throw error;
    if (!data || !data.user) throw new Error("Bạn cần đăng nhập để sử dụng chức năng người bán.");
    return data.user;
  }

  function required(value, label) {
    if (value === undefined || value === null || String(value).trim() === "") {
      throw new Error("Vui lòng nhập " + label + ".");
    }
    return String(value).trim();
  }

  async function myShops() {
    const u = await user();
    const { data, error } = await client()
      .from(SHOPS)
      .select("*")
      .eq("owner_id", u.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function registerShop(input) {
    const u = await user();
    const payload = {
      owner_id: u.id,
      shop_name: required(input.shop_name, "tên gian hàng"),
      owner_name: required(input.owner_name, "tên chủ gian hàng"),
      business_type: required(input.business_type, "loại hình người bán"),
      phone: required(input.phone, "số điện thoại"),
      email: input.email || u.email || null,
      address: required(input.address, "địa chỉ"),
      description: input.description || null,
      status: "pending"
    };
    if (!["individual", "household_business", "company"].includes(payload.business_type)) {
      throw new Error("Loại hình phải là cá nhân, hộ kinh doanh hoặc doanh nghiệp.");
    }
    const { data, error } = await client().from(SHOPS).insert(payload).select("*").single();
    if (error) throw error;
    return data;
  }

  async function updateShop(shopId, input) {
    const u = await user();
    const allowed = ["shop_name", "owner_name", "business_type", "phone", "email", "address", "description"];
    const payload = {};
    for (const key of allowed) if (input[key] !== undefined) payload[key] = input[key];
    if (payload.business_type && !["individual", "household_business", "company"].includes(payload.business_type)) {
      throw new Error("Loại hình người bán không hợp lệ.");
    }
    const { data, error } = await client()
      .from(SHOPS)
      .update(payload)
      .eq("id", shopId)
      .eq("owner_id", u.id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  async function myProducts(shopId) {
    const u = await user();
    let q = client()
      .from(PRODUCTS)
      .select("*, marketplace_shops!inner(owner_id, shop_name)")
      .eq("marketplace_shops.owner_id", u.id)
      .order("created_at", { ascending: false });
    if (shopId) q = q.eq("shop_id", shopId);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  async function createProduct(input) {
    const u = await user();
    const shopId = required(input.shop_id, "gian hàng");
    const price = Number(input.price_vnd);
    if (!Number.isFinite(price) || price < 0) throw new Error("Giá bán phải là số không âm.");
    const { data: shop, error: shopError } = await client()
      .from(SHOPS).select("id, status").eq("id", shopId).eq("owner_id", u.id).single();
    if (shopError) throw shopError;
    if (shop.status !== "approved") throw new Error("Gian hàng cần được quản trị viên duyệt trước khi đăng sản phẩm.");
    const payload = {
      shop_id: shopId,
      name: required(input.name, "tên sản phẩm"),
      description: input.description || null,
      price_vnd: price,
      stock: Math.max(0, Number.parseInt(input.stock || 0, 10)),
      category: input.category || null,
      image_url: input.image_url || null,
      status: "pending"
    };
    const { data, error } = await client().from(PRODUCTS).insert(payload).select("*").single();
    if (error) throw error;
    return data;
  }

  async function updateProduct(productId, input) {
    await user();
    const allowed = ["name", "description", "price_vnd", "stock", "category", "image_url"];
    const payload = {};
    for (const key of allowed) if (input[key] !== undefined) payload[key] = input[key];
    if (payload.price_vnd !== undefined) {
      payload.price_vnd = Number(payload.price_vnd);
      if (!Number.isFinite(payload.price_vnd) || payload.price_vnd < 0) throw new Error("Giá bán không hợp lệ.");
    }
    if (payload.stock !== undefined) {
      payload.stock = Number.parseInt(payload.stock, 10);
      if (!Number.isInteger(payload.stock) || payload.stock < 0) throw new Error("Số lượng tồn kho không hợp lệ.");
    }
    // Editing a product sends it back for review so unapproved changes are not published.
    payload.status = "pending";
    const { data, error } = await client()
      .from(PRODUCTS).update(payload).eq("id", productId).select("*").single();
    if (error) throw error;
    return data;
  }

  async function deleteProduct(productId) {
    await user();
    const { error } = await client().from(PRODUCTS).delete().eq("id", productId);
    if (error) throw error;
    return true;
  }

  NS.seller = { myShops, registerShop, updateShop, myProducts, createProduct, updateProduct, deleteProduct };
})(window);
