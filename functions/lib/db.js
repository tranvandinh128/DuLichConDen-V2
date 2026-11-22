
const DEFAULT_TIMEOUT_MS = 15000;

export class DatabaseError extends Error {
  constructor(status, message, details = {}) {
    super(message);
    this.name = "DatabaseError";
    this.status = status;
    this.code = details.code || null;
    this.details = details.details || null;
  }
}

export function getSupabaseConfig(env) {
  const url = String(env?.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const secretKey = String(env?.SUPABASE_SECRET_KEY || "").trim();

  if (!url || !secretKey) {
    throw new DatabaseError(
      500,
      "Máy chủ chưa cấu hình Supabase."
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

function buildHeaders(env, extraHeaders = {}) {
  const { secretKey } = getSupabaseConfig(env);

  return {
    apikey: secretKey,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extraHeaders
  };
}

function buildUrl(baseUrl, path) {
  if (typeof path !== "string" || !path.startsWith("/")) {
    throw new DatabaseError(400, "Đường dẫn Supabase không hợp lệ.");
  }

  if (
    !path.startsWith("/rest/v1/") &&
    !path.startsWith("/auth/v1/")
  ) {
    throw new DatabaseError(400, "API Supabase không được phép.");
  }

  return `${baseUrl}${path}`;
}

async function parseResponse(response) {
  const raw = await response.text();

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw.slice(0, 500) };
  }
}

export async function supabaseRequest(env, path, options = {}) {
  const { url } = getSupabaseConfig(env);

  const method = String(options.method || "GET").toUpperCase();
  const timeoutMs = Math.min(
    Math.max(Number(options.timeoutMs) || DEFAULT_TIMEOUT_MS, 1000),
    30000
  );

  const headers = buildHeaders(env, options.headers || {});
  const fetchOptions = {
    method,
    headers,
    signal: AbortSignal.timeout(timeoutMs)
  };

  if (options.body !== undefined && options.body !== null) {
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
      data?.message || data?.msg || "Supabase từ chối yêu cầu.",
      {
        code,
        details: data?.details || null
      }
    );
  }

  return data;
}

export async function selectRows(env, table, query = {}, options = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  }

  const path =
    `/rest/v1/${encodeURIComponent(table)}` +
    (params.size ? `?${params.toString()}` : "");

  const headers = {};

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  return supabaseRequest(env, path, { headers });
}

export async function insertRows(env, table, rows, options = {}) {
  if (!Array.isArray(rows) && (!rows || typeof rows !== "object")) {
    throw new DatabaseError(400, "Dữ liệu thêm mới không hợp lệ.");
  }

  const headers = {
    Prefer: options.returnRepresentation
      ? "return=representation"
      : "return=minimal"
  };

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  return supabaseRequest(
    env,
    `/rest/v1/${encodeURIComponent(table)}`,
    {
      method: "POST",
      headers,
      body: rows
    }
  );
}

export async function updateRows(
  env,
  table,
  filters,
  values,
  options = {}
) {
  if (!filters || typeof filters !== "object" ||
      Object.keys(filters).length === 0) {
    throw new DatabaseError(
      400,
      "Cập nhật dữ liệu phải có điều kiện lọc."
    );
  }

  if (!values || typeof values !== "object" ||
      Array.isArray(values) || Object.keys(values).length === 0) {
    throw new DatabaseError(400, "Dữ liệu cập nhật không hợp lệ.");
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    params.set(key, String(value));
  }

  const headers = {
    Prefer: options.returnRepresentation
      ? "return=representation"
      : "return=minimal"
  };

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  return supabaseRequest(
    env,
    `/rest/v1/${encodeURIComponent(table)}?${params.toString()}`,
    {
      method: "PATCH",
      headers,
      body: values
    }
  );
}

export async function deleteRows(
  env,
  table,
  filters,
  options = {}
) {
  if (!filters || typeof filters !== "object" ||
      Object.keys(filters).length === 0) {
    throw new DatabaseError(
      400,
      "Xóa dữ liệu phải có điều kiện lọc."
    );
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    params.set(key, String(value));
  }

  const headers = {
    Prefer: options.returnRepresentation
      ? "return=representation"
      : "return=minimal"
  };

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  return supabaseRequest(
    env,
    `/rest/v1/${encodeURIComponent(table)}?${params.toString()}`,
    {
      method: "DELETE",
      headers
    }
  );
}
