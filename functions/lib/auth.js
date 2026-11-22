
import {
  DatabaseError,
  getSupabaseConfig,
  supabaseRequest
} from "./db.js";

export class AuthError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export function getBearerToken(request) {
  const authorization =
    request.headers.get("Authorization") || "";

  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    throw new AuthError(
      401,
      "Bạn cần đăng nhập để tiếp tục."
    );
  }

  const token = match[1].trim();

  if (!token || token.length > 8192) {
    throw new AuthError(
      401,
      "Phiên đăng nhập không hợp lệ."
    );
  }

  return token;
}

export async function verifyUserToken(request, env) {
  const { url } = getSupabaseConfig(env);
  const accessToken = getBearerToken(request);

  let user;

  try {
    user = await supabaseRequest(
      env,
      "/auth/v1/user",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
  } catch (error) {
    if (
      error instanceof DatabaseError &&
      [400, 401, 403].includes(error.status)
    ) {
      throw new AuthError(
        401,
        "Phiên đăng nhập không hợp lệ hoặc đã hết hạn."
      );
    }

    throw error;
  }

  if (!user?.id) {
    throw new AuthError(
      401,
      "Không xác định được tài khoản đăng nhập."
    );
  }

  return {
    user,
    accessToken,
    supabaseUrl: url
  };
}

export async function getUserProfile(env, userId, accessToken) {
  if (!userId || !accessToken) {
    throw new AuthError(
      401,
      "Thiếu thông tin xác minh tài khoản."
    );
  }

  const query = new URLSearchParams({
    id: `eq.${userId}`,
    select: "id,role",
    limit: "1"
  });

  let profiles;

  try {
    profiles = await supabaseRequest(
      env,
      `/rest/v1/profiles?${query.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
  } catch (error) {
    if (
      error instanceof DatabaseError &&
      [401, 403].includes(error.status)
    ) {
      throw new AuthError(
        403,
        "Không có quyền đọc hồ sơ tài khoản."
      );
    }

    throw error;
  }

  if (!Array.isArray(profiles) || profiles.length !== 1) {
    throw new AuthError(
      403,
      "Không tìm thấy hồ sơ tài khoản hợp lệ."
    );
  }

  return profiles[0];
}

export async function requireAuth(request, env) {
  const session = await verifyUserToken(request, env);

  const profile = await getUserProfile(
    env,
    session.user.id,
    session.accessToken
  );

  const role = String(profile.role || "")
    .trim()
    .toLowerCase();

  if (!["admin", "seller", "customer"].includes(role)) {
    throw new AuthError(
      403,
      "Tài khoản chưa được cấp vai trò hợp lệ."
    );
  }

  return {
    user: session.user,
    profile,
    userId: session.user.id,
    role,
    accessToken: session.accessToken
  };
}
