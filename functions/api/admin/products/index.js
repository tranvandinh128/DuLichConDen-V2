
const PENDING_BUCKET = "product-images-pending";
const PUBLIC_BUCKET = "product-images";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}

function makeUrl(base, path) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function publicImageUrl(base, path) {
  const encodedPath = path
    .split("/")
    .map(segment => encodeURIComponent(segment))
    .join("/");
  return `${base.replace(/\/+$/, "")}/storage/v1/object/public/${PUBLIC_BUCKET}/${encodedPath}`;
}

async function readResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 500) };
  }
}

function serviceHeaders(env) {
  return {
    apikey: env.SUPABASE_SECRET_KEY,
    "Content-Type": "application/json"
  };
}

async function authUser(base, env, accessToken) {
  const response = await fetch(makeUrl(base, "/auth/v1/user"), {
    method: "GET",
    headers: {
      ...serviceHeaders(env),
      Authorization: `Bearer ${accessToken}`
    }
  });

  const data = await readResponse(response);

  if (!response.ok || !data?.id) {
    throw new ApiError(401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.");
  }

  return data;
}

async function restRequest(base, env, method, resource, query = "", body = null) {
  const url = makeUrl(
    base,
    `/rest/v1/${resource}${query ? `?${query}` : ""}`
  );

  const headers = {
    ...serviceHeaders(env),
    Prefer: "return=representation"
  };

  const response = await fetch(url, {
    method,
    headers,
    ...(body !== null ? { body: JSON.stringify(body) } : {})
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new ApiError(
      502,
      data?.message || data?.hint || `Supabase Data API trả về lỗi ${response.status}.`
    );
  }

  return data;
}

async function storageRequest(base, env, endpoint, body) {
  const response = await fetch(makeUrl(base, endpoint), {
    method: "POST",
    headers: serviceHeaders(env),
    body: JSON.stringify(body)
  });

  const data = await readResponse(response);

  if (!response.ok) {
    throw new ApiError(
      502,
      data?.message || `Supabase Storage trả về lỗi ${response.status}.`
    );
  }

  return data;
}

async function removeStorageObjects(base, env, bucket, paths) {
  if (!paths.length) return;

  const response = await fetch(
    makeUrl(base, `/storage/v1/object/${bucket}`),
    {
      method: "DELETE",
      headers: serviceHeaders(env),
      body: JSON.stringify({ prefixes: paths })
    }
  );

  const data = await readResponse(response);

  if (!response.ok) {
    throw new ApiError(
      502,
      data?.message || `Không xóa được tệp trong bucket ${bucket}.`
    );
  }

  return data;
}

async function requireAdmin(base, env, accessToken) {
  const user = await authUser(base, env, accessToken);

  const params = new URLSearchParams({
    id: `eq.${user.id}`,
    select: "id,role"
  });

  // Yêu cầu bằng Secret Key chỉ được thực hiện sau khi
  // đã xác thực phiên người dùng ở bước authUser().
  const profiles = await restRequest(
    base,
    env,
    "GET",
    "profiles",
    params.toString()
  );

  if (!Array.isArray(profiles) || profiles[0]?.role !== "admin") {
    throw new ApiError(403, "Tài khoản không có quyền quản trị.");
  }

  return user;
}

function validateStoragePath(path, storeId, productId) {
  if (typeof path !== "string") return false;
  if (path.length > 500) return false;

  const parts = path.split("/");
  if (parts.length !== 3) return false;

  if (parts[0] !== storeId || parts[1] !== productId) {
    return false;
  }

  return /^[A-Za-z0-9._-]+$/.test(parts[2]) &&
    parts[2] !== "." &&
    parts[2] !== "..";
}

async function getProduct(base, env, productId) {
  const params = new URLSearchParams({
    id: `eq.${productId}`,
    select: "id,store_id,name,status,image_url"
  });

  const rows = await restRequest(
    base,
    env,
    "GET",
    "products",
    params.toString()
  );

  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new ApiError(404, "Không tìm thấy sản phẩm.");
  }

  return rows[0];
}

async function getStore(base, env, storeId) {
  const params = new URLSearchParams({
    id: `eq.${storeId}`,
    select: "id,status"
  });

  const rows = await restRequest(
    base,
    env,
    "GET",
    "stores",
    params.toString()
  );

  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new ApiError(404, "Không tìm thấy gian hàng.");
  }

  if (rows[0].status !== "approved") {
    throw new ApiError(409, "Gian hàng chưa được duyệt hoặc đang bị khóa.");
  }

  return rows[0];
}

async function getPendingImages(base, env, productId) {
  const params = new URLSearchParams({
    product_id: `eq.${productId}`,
    select: "id,product_id,bucket_id,storage_path,status,uploaded_by",
    order: "created_at.asc"
  });

  const rows = await restRequest(
    base,
    env,
    "GET",
    "product_images",
    params.toString()
  );

  return Array.isArray(rows) ? rows : [];
}

async function patchProduct(base, env, productId, patch) {
  const params = new URLSearchParams({
    id: `eq.${productId}`,
    status: "eq.pending"
  });

  const rows = await restRequest(
    base,
    env,
    "PATCH",
    "products",
    params.toString(),
    patch
  );

  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new ApiError(
      409,
      "Sản phẩm không còn ở trạng thái pending hoặc đã được xử lý."
    );
  }

  return rows[0];
}

async function patchImage(base, env, imageId, patch) {
  const params = new URLSearchParams({
    id: `eq.${imageId}`
  });

  const rows = await restRequest(
    base,
    env,
    "PATCH",
    "product_images",
    params.toString(),
    patch
  );

  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new ApiError(409, "Không cập nhật được bản ghi ảnh.");
  }

  return rows[0];
}

async function approveProduct(base, env, product, adminId) {
  const store = await getStore(base, env, product.store_id);
  const images = await getPendingImages(base, env, product.id);

  for (const image of images) {
    if (
      image.bucket_id !== PENDING_BUCKET ||
      image.status !== "pending"
    ) {
      throw new ApiError(
        409,
        "Có ảnh không ở trạng thái chờ duyệt. Vui lòng kiểm tra dữ liệu ảnh."
      );
    }

    if (
      !validateStoragePath(
        image.storage_path,
        store.id,
        product.id
      )
    ) {
      throw new ApiError(
        400,
        "Đường dẫn ảnh không đúng cấu trúc cửa hàng/sản phẩm."
      );
    }
  }

  const copiedPaths = [];
  const updatedImages = [];

  try {
    // 1. Sao chép từng ảnh từ kho Private sang kho Public.
    for (const image of images) {
      await storageRequest(
        base,
        env,
        "/storage/v1/object/copy",
        {
          bucketId: PENDING_BUCKET,
          sourceKey: image.storage_path,
          destinationBucket: PUBLIC_BUCKET,
          destinationKey: image.storage_path
        }
      );

      copiedPaths.push(image.storage_path);
    }

    // 2. Cập nhật bản ghi ảnh thành approved.
    const approvedAt = new Date().toISOString();

    for (const image of images) {
      const imageUrl = publicImageUrl(
        base,
        image.storage_path
      );

      await patchImage(base, env, image.id, {
        bucket_id: PUBLIC_BUCKET,
        status: "approved",
        image_url: imageUrl,
        approved_at: approvedAt,
        approved_by: adminId
      });

      updatedImages.push(image);
    }

    // 3. Chỉ mở bán sau khi các ảnh đã được xử lý.
    const firstImageUrl = images.length
      ? publicImageUrl(base, images[0].storage_path)
      : product.image_url || null;

    await patchProduct(base, env, product.id, {
      status: "active",
      image_url: firstImageUrl
    });
  } catch (error) {
    // Khôi phục bản ghi ảnh về trạng thái chờ duyệt
    // nếu có lỗi trước khi sản phẩm được kích hoạt.
    for (const image of updatedImages.reverse()) {
      try {
        await patchImage(base, env, image.id, {
          bucket_id: PENDING_BUCKET,
          status: "pending",
          image_url: null,
          approved_at: null,
          approved_by: null
        });
      } catch (rollbackError) {
        console.error("Image rollback failed:", rollbackError.message);
      }
    }

    // Xóa các bản sao Public đã tạo để tránh ảnh mồ côi.
    try {
      await removeStorageObjects(
        base,
        env,
        PUBLIC_BUCKET,
        copiedPaths
      );
    } catch (rollbackError) {
      console.error("Storage rollback failed:", rollbackError.message);
    }

    throw error;
  }

  // 4. Sau khi database đã cập nhật thành công,
  // xóa bản gốc trong kho Private.
  let privateCleanup = "success";

  try {
    await removeStorageObjects(
      base,
      env,
      PENDING_BUCKET,
      images.map(image => image.storage_path)
    );
  } catch (error) {
    privateCleanup = "needs_cleanup";
    console.error("Private image cleanup failed:", error.message);
  }

  return {
    productId: product.id,
    status: "active",
    imageCount: images.length,
    privateCleanup
  };
}

async function rejectProduct(base, env, product, adminId) {
  const images = await getPendingImages(base, env, product.id);
  const changedImages = [];

  try {
    for (const image of images) {
      if (
        image.bucket_id !== PENDING_BUCKET ||
        image.status !== "pending"
      ) {
        throw new ApiError(
          409,
          "Có ảnh không ở trạng thái chờ duyệt. Vui lòng kiểm tra dữ liệu ảnh."
        );
      }

      await patchImage(base, env, image.id, {
        status: "rejected",
        bucket_id: PENDING_BUCKET,
        image_url: null,
        approved_at: null,
        approved_by: null
      });

      changedImages.push(image);
    }

    await patchProduct(base, env, product.id, {
      status: "rejected",
      image_url: null
    });
  } catch (error) {
    for (const image of changedImages.reverse()) {
      try {
        await patchImage(base, env, image.id, {
          status: "pending",
          bucket_id: PENDING_BUCKET,
          image_url: null,
          approved_at: null,
          approved_by: null
        });
      } catch (rollbackError) {
        console.error("Reject rollback failed:", rollbackError.message);
      }
    }

    throw error;
  }

  return {
    productId: product.id,
    status: "rejected",
    imageCount: images.length
  };
}

export async function onRequest(context) {
  const request = context.request;
  const env = context.env;
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");

  // Chỉ nhận yêu cầu từ chính website Pages này.
  if (origin && origin !== url.origin) {
    return json({ error: "Origin không được phép." }, 403);
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Allow": "POST, OPTIONS",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
        "Access-Control-Allow-Origin": url.origin,
        "Vary": "Origin"
      }
    });
  }

  if (request.method !== "POST") {
    return json(
      { error: "Phương thức không được hỗ trợ." },
      405,
      { Allow: "POST, OPTIONS" }
    );
  }

  const base = env.SUPABASE_URL;
  const secretKey = env.SUPABASE_SECRET_KEY;

  if (!base || !secretKey) {
    return json(
      { error: "Máy chủ chưa được cấu hình Supabase URL hoặc Secret Key." },
      500
    );
  }

  const authorization = request.headers.get("Authorization") || "";
  const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);

  if (!tokenMatch) {
    return json({ error: "Thiếu phiên đăng nhập." }, 401);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: "Dữ liệu JSON không hợp lệ." }, 400);
  }

  const productId = body?.productId;
  const action = body?.action;

  if (!UUID_RE.test(productId || "")) {
    return json({ error: "Mã sản phẩm không hợp lệ." }, 400);
  }

  if (!["approve", "reject"].includes(action)) {
    return json({ error: "Thao tác chỉ được là approve hoặc reject." }, 400);
  }

  try {
    // Xác thực người dùng trước khi dùng quyền Service Role.
    const admin = await requireAdmin(base, env, tokenMatch[1]);

    const product = await getProduct(base, env, productId);

    if (product.status !== "pending") {
      throw new ApiError(
        409,
        "Sản phẩm không còn ở trạng thái chờ duyệt."
      );
    }

    const result = action === "approve"
      ? await approveProduct(base, env, product, admin.id)
      : await rejectProduct(base, env, product, admin.id);

    return json({
      success: true,
      message: action === "approve"
        ? "Đã duyệt sản phẩm."
        : "Đã từ chối sản phẩm.",
      data: result
    });
  } catch (error) {
    console.error("Admin product operation failed:", error.message);

    const status = error instanceof ApiError
      ? error.status
      : 500;

    return json(
      {
        success: false,
        error: status === 500
          ? "Máy chủ gặp lỗi khi xử lý sản phẩm."
          : error.message
      },
      status
    );
  }
}
