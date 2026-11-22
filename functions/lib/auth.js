
import {
  DatabaseError,
  supabaseRequest
} from "./db.js";

/**
 * Lỗi xác thực và phân quyền.
 */
export class AuthError extends Error {
  constructor(status, message) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

/**
 * Các vai trò hợp lệ trong hệ thống.
 */
export const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  SELLER: "seller",
  BUYER: "buyer"
});

/**
 * Lấy JWT từ Authorization Bearer.
 */
export function getBearerToken(request) {
  if (!request?.headers) {
    throw new AuthError(
      401,
      "Không xác định được yêu cầu đăng nhập."
    );
  }

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

  if (
    !token ||
    token.length > 8192
  ) {
    throw new AuthError(
      401,
      "Phiên đăng nhập không hợp lệ."
    );
  }

  return token;
}

/**
 * Xác minh JWT người dùng với Supabase Auth.
 *
 * Không sử dụng quyền admin.
 * JWT được gửi trực tiếp qua accessToken.
 */
export async function verifyUserToken(request, env) {
  const accessToken = getBearerToken(request);

  let user;

  try {
    user = await supabaseRequest(
      env,
      "/auth/v1/user",
      {
        method: "GET",
        accessToken
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

  if (
    !user ||
    typeof user.id !== "string" ||
    !user.id
  ) {
    throw new AuthError(
      401,
      "Không xác định được tài khoản đăng nhập."
    );
  }

  return {
    user,
    accessToken
  };
}

/**
 * Lấy hồ sơ người dùng.
 *
 * Truy vấn bằng JWT của chính người dùng.
 * RLS của bảng profiles phải cho phép người dùng
 * đọc hồ sơ của chính mình.
 */
export async function getUserProfile(
  env,
  userId,
  accessToken
) {
  if (
    typeof userId !== "string" ||
    !userId ||
    typeof accessToken !== "string" ||
    !accessToken
  ) {
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
        accessToken
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

  if (
    !Array.isArray(profiles) ||
    profiles.length !== 1
  ) {
    throw new AuthError(
      403,
      "Không tìm thấy hồ sơ tài khoản hợp lệ."
    );
  }

  const profile = profiles[0];

  if (
    !profile ||
    profile.id !== userId
  ) {
    throw new AuthError(
      403,
      "Thông tin hồ sơ không khớp với tài khoản đăng nhập."
    );
  }

  return profile;
}

/**
 * Xác thực người dùng và lấy vai trò từ Supabase.
 *
 * Không nhận role từ trình duyệt.
 * Không tự cấp role mặc định.
 */
export async function requireAuth(request, env) {
  const session = await verifyUserToken(
    request,
    env
  );

  const profile = await getUserProfile(
    env,
    session.user.id,
    session.accessToken
  );

  const role = String(profile.role || "")
    .trim()
    .toLowerCase();

  if (!Object.values(USER_ROLES).includes(role)) {
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

/**
 * Kiểm tra người dùng có phải Admin không.
 */
export async function requireAdminAuth(request, env) {
  const auth = await requireAuth(request, env);

  if (auth.role !== USER_ROLES.ADMIN) {
    throw new AuthError(
      403,
      "Chỉ quản trị viên mới được phép thực hiện thao tác này."
    );
  }

  return auth;
}
