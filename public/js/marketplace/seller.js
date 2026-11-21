
import { supabase, supabaseConfigured, showConfigWarning } from "./supabase-client.js";
import { signIn, signUp, signOut, getCurrentUser } from "./auth.js";

const $ = id => document.getElementById(id);

const message = (text, type = "info") => {
  const el = $("seller-message");
  if (el) {
    el.textContent = text;
    el.className = `notice ${type}`;
    el.hidden = false;
  }
};

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[char]));

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};
const PENDING_BUCKET = "product-images-pending";

function buildPendingImagePath(storeId, productId, file) {
  const extension = ALLOWED_IMAGE_TYPES[file.type];
  if (!extension) {
    throw new Error("Chỉ nhận ảnh JPG, PNG hoặc WebP.");
  }

  return `${storeId}/${productId}/${crypto.randomUUID()}.${extension}`;
}

async function removePendingFile(path) {
  if (!path) return;

  const { error } = await supabase.storage
    .from(PENDING_BUCKET)
    .remove([path]);

  if (error) {
    console.error("Không dọn được ảnh chờ duyệt:", error);
  }
}

async function refreshSellerArea() {
  const user = await getCurrentUser();

  $("auth-panel").hidden = !!user;
  $("seller-panel").hidden = !user;

  if (!user) return;

  $("signed-in-email").textContent = user.email || "";

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;

  $("profile-name").textContent =
    profile?.full_name || user.email || "";

  const { data: app, error: appError } = await supabase
    .from("seller_applications")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (appError) throw appError;

  $("application-status").textContent = app
    ? `Hồ sơ: ${
        app.status === "pending"
          ? "Đang chờ quản trị viên duyệt"
          : app.status === "approved"
            ? "Đã duyệt"
            : app.status === "rejected"
              ? "Chưa được duyệt – xem ghi chú"
              : app.status
      }`
    : "Bạn chưa gửi hồ sơ đăng ký người bán.";

  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (storeError) throw storeError;

  $("store-form").hidden =
    !app || app.status !== "approved" || !!store;

  $("product-form").hidden =
    !store || store.status !== "approved";

  $("store-summary").hidden = !store;

  if (store) {
    $("store-id").value = store.id;

    $("store-summary").textContent =
      `Gian hàng: ${store.name} · Trạng thái: ${
        store.status === "pending"
          ? "Chờ quản trị viên duyệt"
          : store.status === "approved"
            ? "Đã duyệt"
            : "Tạm khóa"
      }`;

    await loadMyProducts(store.id);
  }
}

async function loadMyProducts(storeId) {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,price,status")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  $("my-products").innerHTML = (data || []).map(product =>
    `<li>
      <span>${escapeHtml(product.name)}</span>
      <small>
        ${
          product.price == null
            ? "Chưa có giá"
            : new Intl.NumberFormat("vi-VN").format(product.price) + " ₫"
        }
        · ${escapeHtml(product.status)}
      </small>
    </li>`
  ).join("") || "<li>Chưa có sản phẩm.</li>";
}

/**
 * Tạo sản phẩm và ảnh ở trạng thái chờ duyệt.
 */
async function createProductWithPendingImage({
  user,
  storeId,
  name,
  description,
  price,
  file
}) {
  const productId = crypto.randomUUID();
  let uploadedPath = null;

  // 1. Kiểm tra và tải ảnh vào bucket Private.
  if (file) {
    if (!Object.prototype.hasOwnProperty.call(
      ALLOWED_IMAGE_TYPES,
      file.type
    )) {
      throw new Error("Chỉ nhận ảnh JPG, PNG hoặc WebP.");
    }

    if (file.size <= 0 || file.size > MAX_IMAGE_SIZE) {
      throw new Error("Ảnh phải lớn hơn 0 byte và không vượt quá 5 MB.");
    }

    uploadedPath = buildPendingImagePath(
      storeId,
      productId,
      file
    );

    const { error: uploadError } = await supabase.storage
      .from(PENDING_BUCKET)
      .upload(uploadedPath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false
      });

    if (uploadError) throw uploadError;
  }

  // 2. Tạo sản phẩm với trạng thái pending.
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      id: productId,
      store_id: storeId,
      name,
      description,
      price,
      image_url: null,
      status: "pending"
    })
    .select("id")
    .single();

  if (productError) {
    await removePendingFile(uploadedPath);
    throw productError;
  }

  // 3. Lưu thông tin ảnh vào bảng product_images.
  if (uploadedPath) {
    const { error: imageRowError } = await supabase
      .from("product_images")
      .insert({
        product_id: product.id,
        image_url: null,
        bucket_id: PENDING_BUCKET,
        storage_path: uploadedPath,
        uploaded_by: user.id,
        status: "pending",
        sort_order: 0
      });

    if (imageRowError) {
      await removePendingFile(uploadedPath);

      throw new Error(
        `Sản phẩm đã được tạo ở trạng thái chờ duyệt nhưng chưa lưu được thông tin ảnh: ${imageRowError.message}. Hãy gửi thông báo này cho quản trị viên.`
      );
    }
  }

  return product;
}

document.addEventListener("DOMContentLoaded", async () => {
  showConfigWarning();

  if (!supabaseConfigured) return;

  // Đăng ký tài khoản người bán
  $("signup-form").addEventListener("submit", async event => {
    event.preventDefault();

    try {
      const result = await signUp(
        $("signup-email").value,
        $("signup-password").value,
        $("signup-name").value
      );

      message(
        result.user?.identities?.length === 0
          ? "Email này đã được đăng ký."
          : "Đăng ký thành công. Nếu xác nhận email đang bật, hãy mở email để xác nhận rồi đăng nhập.",
        "success"
      );
    } catch (error) {
      message(error.message, "error");
    }
  });

  // Đăng nhập
  $("login-form").addEventListener("submit", async event => {
    event.preventDefault();

    try {
      await signIn(
        $("login-email").value,
        $("login-password").value
      );

      message("Đăng nhập thành công.", "success");
      await refreshSellerArea();
    } catch (error) {
      message(error.message, "error");
    }
  });

  // Đăng xuất
  $("logout-button").addEventListener("click", async () => {
    try {
      await signOut();
      await refreshSellerArea();
      message("Đã đăng xuất.");
    } catch (error) {
      message(error.message, "error");
    }
  });

  // Gửi hồ sơ đăng ký người bán
  $("application-form").addEventListener("submit", async event => {
    event.preventDefault();

    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Vui lòng đăng nhập lại.");

      const payload = {
        user_id: user.id,
        applicant_type: $("applicant-type").value,
        legal_name: $("legal-name").value.trim(),
        phone: $("seller-phone").value.trim(),
        address: $("seller-address").value.trim(),
        description: $("seller-description").value.trim(),
        status: "pending"
      };

      const { error } = await supabase
        .from("seller_applications")
        .upsert(payload, { onConflict: "user_id" });

      if (error) throw error;

      message(
        "Đã gửi hồ sơ. Gian hàng chỉ được mở sau khi quản trị viên duyệt.",
        "success"
      );

      await refreshSellerArea();
    } catch (error) {
      message(error.message, "error");
    }
  });

  // Tạo gian hàng
  $("store-form").addEventListener("submit", async event => {
    event.preventDefault();

    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Vui lòng đăng nhập lại.");

      const { error } = await supabase.from("stores").insert({
        owner_id: user.id,
        name: $("store-name").value.trim(),
        slug: $("store-slug").value
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-"),
        description: $("store-description").value.trim(),
        status: "pending"
      });

      if (error) throw error;

      message(
        "Đã gửi thông tin gian hàng. Quản trị viên cần duyệt trước khi cửa hàng hiển thị công khai.",
        "success"
      );

      await refreshSellerArea();
    } catch (error) {
      message(error.message, "error");
    }
  });

  // Tạo sản phẩm và gửi ảnh chờ duyệt
  $("product-form").addEventListener("submit", async event => {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton =
      event.submitter || form.querySelector('button[type="submit"]');

    if (submitButton) submitButton.disabled = true;

    try {
      const user = await getCurrentUser();
      if (!user) throw new Error("Vui lòng đăng nhập lại.");

      const storeId = $("store-id").value;
      if (!storeId) {
        throw new Error("Không xác định được gian hàng.");
      }

      const file = $("product-image").files?.[0] || null;
      const name = $("product-name").value.trim();
      const description = $("product-description").value.trim();

      const rawPrice = $("product-price").value.trim();
      const price = rawPrice ? Number(rawPrice) : null;

      if (!name) {
        throw new Error("Vui lòng nhập tên sản phẩm.");
      }

      if (rawPrice && (!Number.isFinite(price) || price < 0)) {
        throw new Error("Giá sản phẩm không hợp lệ.");
      }

      message(
        file
          ? "Đang tải ảnh vào kho chờ duyệt và tạo sản phẩm..."
          : "Đang tạo sản phẩm chờ duyệt..."
      );

      await createProductWithPendingImage({
        user,
        storeId,
        name,
        description,
        price,
        file
      });

      message(
        file
          ? "Đã gửi sản phẩm và ảnh vào kho chờ duyệt. Quản trị viên sẽ kiểm tra trước khi công khai."
          : "Đã gửi sản phẩm chờ duyệt. Sản phẩm chưa có ảnh.",
        "success"
      );

      form.reset();
      await loadMyProducts(storeId);

    } catch (error) {
      console.error("Product submission failed:", error);

      message(
        error.message || "Không gửi được sản phẩm.",
        "error"
      );
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  try {
    await refreshSellerArea();
  } catch (error) {
    console.error("Could not initialize seller area:", error);

    message(
      error.message || "Không tải được khu vực người bán.",
      "error"
    );
  }
});
