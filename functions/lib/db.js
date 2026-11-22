
const DEFAULT_TIMEOUT_MS = 15000;
const MAX_TIMEOUT_MS = 30000;

export class DatabaseError extends Error {
  constructor(status, message, details = {}) {
    super(message);
    this.name = "DatabaseError";
    this.status = status;
    this.code = details.code || null;
    this.details = details.details || null;
  }
}

/**
 * Đọc và kiểm tra cấu hình Supabase.
 * SUPABASE_SECRET_KEY chỉ được sử dụng ở phía máy chủ.
 */
export function getSupabaseConfig(env) {
  const url = String(env?.SUPABASE_URL || "")
    .trim()
    .replace(/\/+$/, "");

  const secretKey = String(env?.SUPABASE_SECRET_KEY || "").trim();

  if (!url || !secretKey) {
    throw new DatabaseError(
      500,
      "Máy chủ chưa cấu hình Supabase."
    );
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new DatabaseError(
      500,
      "SUPABASE_URL không hợp lệ."
    );
  }

  if (parsedUrl.protocol !== "https:") {
    throw new DatabaseError(
      500,
      "SUPABASE_URL phải sử dụng HTTPS."
    );
  }

  if (!secretKey.startsWith("sb_secret_")) {
    throw new DatabaseError(
      500,
      "SUPABASE_SECRET_KEY không đúng định dạng."
    );
  }

  return { url, secretKey };
}

/**
 * Xác định chế độ truy cập.
 *
 * Chế độ người dùng:
 *   { accessToken: userJwt }
 *
 * Chế độ đặc quyền máy chủ:
 *   { admin: true }
 *
 * Không cho phép mặc định sử dụng quyền đặc biệt.
 */
function getAccessMode(options = {}) {
  const hasAccessToken =
    typeof options.accessToken === "string" &&
    options.accessToken.trim().length > 0;

  const isAdmin = options.admin === true;

  if (hasAccessToken && isAdmin) {
    throw new DatabaseError(
      400,
      "Không được sử dụng đồng thời quyền người dùng và quyền đặc quyền."
    );
  }

  if (!hasAccessToken && !isAdmin) {
    throw new DatabaseError(
      401,
      "Thiếu JWT người dùng hoặc quyền đặc quyền máy chủ."
    );
  }

  if (
    hasAccessToken &&
    options.accessToken.length > 8192
  ) {
    throw new DatabaseError(
      401,
      "JWT người dùng không hợp lệ."
    );
  }

  return {
    accessToken: hasAccessToken
      ? options.accessToken.trim()
      : null,
    admin: isAdmin
  };
}

/**
 * Tạo headers an toàn.
 *
 * Không cho phép headers bên ngoài ghi đè:
 * - apikey
 * - Authorization
 */
function buildHeaders(env, options = {}) {
  const { secretKey } = getSupabaseConfig(env);
  const mode = getAccessMode(options);

  const headers = new Headers({
    apikey: secretKey,
    "Content-Type": "application/json",
    Accept: "application/json"
  });

  const extraHeaders = options.headers || {};

  for (const [key, value] of Object.entries(extraHeaders)) {
    const normalizedKey = key.toLowerCase();

    if (
      normalizedKey === "apikey" ||
      normalizedKey === "authorization"
    ) {
      throw new DatabaseError(
        400,
        "Không được ghi đè header xác thực Supabase."
      );
    }

    if (value !== undefined && value !== null) {
      headers.set(key, String(value));
    }
  }

  if (mode.accessToken) {
    headers.set(
      "Authorization",
      `Bearer ${mode.accessToken}`
    );
  }

  return headers;
}

/**
 * Chỉ cho phép Supabase REST API và Auth API.
 */
function buildUrl(baseUrl, path) {
  if (
    typeof path !== "string" ||
    !path.startsWith("/") ||
    path.startsWith("//")
  ) {
    throw new DatabaseError(
      400,
      "Đường dẫn Supabase không hợp lệ."
    );
  }

  if (
    !path.startsWith("/rest/v1/") &&
    !path.startsWith("/auth/v1/")
  ) {
    throw new DatabaseError(
      400,
      "API Supabase không được phép."
    );
  }

  return `${baseUrl}${path}`;
}

/**
 * Kiểm tra tên bảng để tránh đưa đường dẫn tùy ý vào API.
 */
function validateTableName(table) {
  if (
    typeof table !== "string" ||
    !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)
  ) {
    throw new DatabaseError(
      400,
      "Tên bảng dữ liệu không hợp lệ."
    );
  }

  return encodeURIComponent(table);
}

async function parseResponse(response) {
  const raw = await response.text();

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return {
      message: raw.slice(0, 500)
    };
  }
}

/**
 * Hàm gọi Supabase trung tâm.
 *
 * Bắt buộc chọn một trong hai:
 * options.accessToken = JWT người dùng
 * options.admin = true (chỉ dành cho xử lý đặc quyền phía máy chủ)
 */
export async function supabaseRequest(
  env,
  path,
  options = {}
) {
  const { url } = getSupabaseConfig(env);

  const method = String(
    options.method || "GET"
  ).toUpperCase();

  const allowedMethods = [
    "GET",
    "POST",
    "PATCH",
    "DELETE"
  ];

  if (!allowedMethods.includes(method)) {
    throw new DatabaseError(
      405,
      "Phương thức truy cập Supabase không được hỗ trợ."
    );
  }

  const timeoutMs = Math.min(
    Math.max(
      Number(options.timeoutMs) || DEFAULT_TIMEOUT_MS,
      1000
    ),
    MAX_TIMEOUT_MS
  );

  const headers = buildHeaders(env, options);

  const fetchOptions = {
    method,
    headers,
    signal: AbortSignal.timeout(timeoutMs)
  };

  if (
    options.body !== undefined &&
    options.body !== null
  ) {
    fetchOptions.body =
      typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body);
  }

  let response;

  try {
    response = await fetch(
      buildUrl(url, path),
      fetchOptions
    );
  } catch (error) {
    console.error("Supabase connection failed:", {
      method,
      path,
      error: error?.name || "NetworkError"
    });

    throw new DatabaseError(
      503,
      "Không thể kết nối đến Supabase."
    );
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    const code = data?.code || null;

    console.error("Supabase request failed:", {
      method,
      path,
      status: response.status,
      code
    });

    throw new DatabaseError(
      response.status,
      data?.message ||
        data?.msg ||
        "Supabase từ chối yêu cầu.",
      {
        code,
        details: data?.details || null
      }
    );
  }

  return data;
}

/**
 * Đọc dữ liệu.
 */
export async function selectRows(
  env,
  table,
  query = {},
  options = {}
) {
  const tableName = validateTableName(table);
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }

  const path =
    `/rest/v1/${tableName}` +
    (params.size ? `?${params.toString()}` : "");

  return supabaseRequest(env, path, options);
}

/**
 * Thêm dữ liệu.
 */
export async function insertRows(
  env,
  table,
  rows,
  options = {}
) {
  validateTableName(table);

  if (
    !Array.isArray(rows) &&
    (!rows || typeof rows !== "object")
  ) {
    throw new DatabaseError(
      400,
      "Dữ liệu thêm mới không hợp lệ."
    );
  }

  const headers = {
    ...(options.headers || {}),
    Prefer: options.returnRepresentation
      ? "return=representation"
      : "return=minimal"
  };

  return supabaseRequest(
    env,
    `/rest/v1/${validateTableName(table)}`,
    {
      ...options,
      headers,
      method: "POST",
      body: rows
    }
  );
}

/**
 * Cập nhật dữ liệu.
 * Bắt buộc có điều kiện lọc.
 */
export async function updateRows(
  env,
  table,
  filters,
  values,
  options = {}
) {
  const tableName = validateTableName(table);

  if (
    !filters ||
    typeof filters !== "object" ||
    Array.isArray(filters) ||
    Object.keys(filters).length === 0
  ) {
    throw new DatabaseError(
      400,
      "Cập nhật dữ liệu phải có điều kiện lọc."
    );
  }

  if (
    !values ||
    typeof values !== "object" ||
    Array.isArray(values) ||
    Object.keys(values).length === 0
  ) {
    throw new DatabaseError(
      400,
      "Dữ liệu cập nhật không hợp lệ."
    );
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) {
      throw new DatabaseError(
        400,
        "Điều kiện lọc cập nhật không hợp lệ."
      );
    }

    params.set(key, String(value));
  }

  const headers = {
    ...(options.headers || {}),
    Prefer: options.returnRepresentation
      ? "return=representation"
      : "return=minimal"
  };

  return supabaseRequest(
    env,
    `/rest/v1/${tableName}?${params.toString()}`,
    {
      ...options,
      method: "PATCH",
      headers,
      body: values
    }
  );
}

/**
 * Xóa dữ liệu.
 * Bắt buộc có điều kiện lọc.
 */
export async function deleteRows(
  env,
  table,
  filters,
  options = {}
) {
  const tableName = validateTableName(table);

  if (
    !filters ||
    typeof filters !== "object" ||
    Array.isArray(filters) ||
    Object.keys(filters).length === 0
  ) {
    throw new DatabaseError(
      400,
      "Xóa dữ liệu phải có điều kiện lọc."
    );
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) {
      throw new DatabaseError(
        400,
        "Điều kiện lọc xóa không hợp lệ."
      );
    }

    params.set(key, String(value));
  }

  const headers = {
    ...(options.headers || {}),
    Prefer: options.returnRepresentation
      ? "return=representation"
      : "return=minimal"
  };

  return supabaseRequest(
    env,
    `/rest/v1/${tableName}?${params.toString()}`,
    {
      ...options,
      method: "DELETE",
      headers
    }
  );
}
