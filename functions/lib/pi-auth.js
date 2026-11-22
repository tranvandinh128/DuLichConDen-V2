
const PI_ME_URL = "https://api.minepi.com/v2/me";

export class PiAuthError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function piJson(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0"
    }
  });
}

export function checkMethod(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { "Allow": "POST, OPTIONS" }
    });
  }

  if (request.method !== "POST") {
    throw new PiAuthError(405, "Phương thức không được hỗ trợ.");
  }
}

function requiredEnv(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new PiAuthError(
      500,
      "Máy chủ chưa cấu hình đủ SUPABASE_URL và SUPABASE_SECRET_KEY."
    );
  }

  if (!env.SUPABASE_SECRET_KEY.startsWith("sb_secret_")) {
    throw new PiAuthError(
      500,
      "SUPABASE_SECRET_KEY không đúng định dạng Secret Key."
    );
  }
}

function apiUrl(base, path) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 400) };
  }
}

export async function verifyPiAccessToken(accessToken) {
  if (
    typeof accessToken !== "string" ||
    accessToken.length < 20 ||
    accessToken.length > 4096
  ) {
    throw new PiAuthError(400, "Pi access token không hợp lệ.");
  }

  let response;

  try {
    response = await fetch(PI_ME_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(10000)
    });
  } catch {
    throw new PiAuthError(
      503,
      "Không kết nối được Pi Platform API. Vui lòng thử lại."
    );
  }

  const payload = await readJson(response);

  if (response.status === 401 || response.status === 403) {
    throw new PiAuthError(
      401,
      "Pi Network không chấp nhận access token. Hãy đăng nhập Pi lại."
    );
  }

  if (!response.ok) {
    throw new PiAuthError(
      502,
      "Pi Platform API đang gặp sự cố khi xác minh tài khoản."
    );
  }

  const user = payload?.user || payload;
  const uid = typeof user?.uid === "string" ? user.uid.trim() : "";
  const username =
    typeof user?.username === "string" ? user.username.trim() : "";

  if (!uid || uid.length > 200) {
    throw new PiAuthError(
      502,
      "Pi Platform API không trả về UID hợp lệ."
    );
  }

  return {
    uid,
    username: username.slice(0, 100)
  };
}

function adminHeaders(env, extra = {}) {
  requiredEnv(env);

  return {
    apikey: env.SUPABASE_SECRET_KEY,
    "Content-Type": "application/json",
    ...extra
  };
}

async function supabaseRequest(env, path, options = {}) {
  const response = await fetch(apiUrl(env.SUPABASE_URL, path), {
    ...options,
    headers: adminHeaders(env, options.headers || {})
  });

  const data = await readJson(response);

  if (!response.ok) {
    console.error("Supabase Pi-auth request failed:", {
      path,
      status: response.status,
      code: data?.code || null,
      message: data?.message || data?.msg || "unknown"
    });

    if (response.status === 404) {
      throw new PiAuthError(
        500,
        "Chưa tạo bảng pi_accounts trong Supabase. Hãy kiểm tra migration."
      );
    }

    throw new PiAuthError(
      502,
      "Supabase chưa xử lý được yêu cầu đăng nhập Pi. Kiểm tra Secret Key và cấu hình bảng pi_accounts."
    );
  }

  return data;
}

export async function verifySupabaseSession(request, env) {
  requiredEnv(env);

  const auth = request.headers.get("Authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    throw new PiAuthError(
      401,
      "Bạn cần đăng nhập bằng email trước khi liên kết Pi."
    );
  }

  const response = await fetch(
    apiUrl(env.SUPABASE_URL, "/auth/v1/user"),
    {
      method: "GET",
      headers: {
        apikey: env.SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${match[1]}`
      }
    }
  );

  const user = await readJson(response);

  if (!response.ok || !user?.id) {
    throw new PiAuthError(
      401,
      "Phiên đăng nhập email không hợp lệ hoặc đã hết hạn."
    );
  }

  return user;
}

export async function findPiAccountByUid(env, uid) {
  const query = new URLSearchParams({
    select: "user_id,pi_uid,pi_username",
    pi_uid: `eq.${uid}`,
    limit: "1"
  });

  const rows = await supabaseRequest(
    env,
    `/rest/v1/pi_accounts?${query}`
  );

  return Array.isArray(rows) ? (rows[0] || null) : null;
}

export async function findPiAccountByUser(env, userId) {
  const query = new URLSearchParams({
    select: "user_id,pi_uid,pi_username",
    user_id: `eq.${userId}`,
    limit: "1"
  });

  const rows = await supabaseRequest(
    env,
    `/rest/v1/pi_accounts?${query}`
  );

  return Array.isArray(rows) ? (rows[0] || null) : null;
}

export async function savePiAccount(env, userId, piUser) {
  const existingPi = await findPiAccountByUid(env, piUser.uid);

  if (existingPi && existingPi.user_id !== userId) {
    throw new PiAuthError(
      409,
      "Tài khoản Pi này đã được liên kết với một tài khoản DuLichConDen khác."
    );
  }

  const existingUser = await findPiAccountByUser(env, userId);

  if (existingUser && existingUser.pi_uid !== piUser.uid) {
    throw new PiAuthError(
      409,
      "Tài khoản DuLichConDen này đã liên kết với một tài khoản Pi khác. Vui lòng liên hệ quản trị viên nếu cần thay đổi."
    );
  }

  if (existingPi) {
    const query = new URLSearchParams({
      pi_uid: `eq.${piUser.uid}`
    });

    await supabaseRequest(
      env,
      `/rest/v1/pi_accounts?${query}`,
      {
        method: "PATCH",
        headers: {
          Prefer: "return=representation"
        },
        body: JSON.stringify({
          pi_username: piUser.username,
          updated_at: new Date().toISOString()
        })
      }
    );

    return;
  }

  await supabaseRequest(
    env,
    "/rest/v1/pi_accounts",
    {
      method: "POST",
      headers: {
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        user_id: userId,
        pi_uid: piUser.uid,
        pi_username: piUser.username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  );
}

export async function createSupabaseMagicLink(env, userId) {
  const adminUser = await supabaseRequest(
    env,
    `/auth/v1/admin/users/${encodeURIComponent(userId)}`
  );

  const email = adminUser?.email || adminUser?.user?.email;

  if (!email) {
    throw new PiAuthError(
      500,
      "Tài khoản liên kết Pi không có email đăng nhập Supabase."
    );
  }

  const generated = await supabaseRequest(
    env,
    "/auth/v1/admin/generate_link",
    {
      method: "POST",
      body: JSON.stringify({
        type: "magiclink",
        email
      })
    }
  );

  const properties = generated?.properties || generated;
  const tokenHash =
    properties?.hashed_token || generated?.hashed_token;

  if (typeof tokenHash !== "string" || !tokenHash) {
    throw new PiAuthError(
      502,
      "Supabase không cấp được mã phiên đăng nhập một lần."
    );
  }

  return tokenHash;
}

export function handlePiAuthError(error) {
  console.error("Pi authentication error:", error?.message || error);

  const status = error instanceof PiAuthError ? error.status : 500;

  return piJson(
    {
      success: false,
      error:
        status === 500 && !(error instanceof PiAuthError)
          ? "Máy chủ gặp lỗi khi xử lý đăng nhập Pi."
          : error?.message || "Không thể xử lý đăng nhập Pi."
    },
    status
  );
}
