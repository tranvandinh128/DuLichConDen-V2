
import {
  AuthError,
  USER_ROLES,
  requireAuth
} from "./auth.js";

/**
 * Các vai trò thống nhất trong toàn hệ thống.
 */
export const ROLES = USER_ROLES;

/**
 * Kiểm tra một tài khoản có vai trò hợp lệ không.
 */
export function hasRole(auth, allowedRoles = []) {
  if (
    !auth ||
    !Object.values(ROLES).includes(auth.role) ||
    !Array.isArray(allowedRoles)
  ) {
    return false;
  }

  return allowedRoles.includes(auth.role);
}

/**
 * Bắt buộc tài khoản phải có một trong các vai trò cho phép.
 */
export function requireRole(auth, allowedRoles = []) {
  if (!hasRole(auth, allowedRoles)) {
    throw new AuthError(
      403,
      "Bạn không có quyền thực hiện thao tác này."
    );
  }

  return auth;
}

/**
 * Xác thực người dùng và kiểm tra vai trò.
 *
 * Vai trò được lấy từ Supabase thông qua requireAuth,
 * không nhận role từ trình duyệt.
 */
export async function authorize(
  request,
  env,
  allowedRoles = []
) {
  if (
    !Array.isArray(allowedRoles) ||
    allowedRoles.length === 0
  ) {
    throw new AuthError(
      403,
      "Chưa cấu hình vai trò được phép truy cập."
    );
  }

  const auth = await requireAuth(request, env);

  return requireRole(auth, allowedRoles);
}

/**
 * Chỉ Admin được phép thực hiện.
 */
export async function requireAdmin(request, env) {
  return authorize(request, env, [
    ROLES.ADMIN
  ]);
}

/**
 * Seller được quản lý chức năng người bán.
 * Admin được phép quản lý thay khi cần.
 *
 * Hàm này không tự xác nhận quyền sở hữu gian hàng.
 * Phải kết hợp assertSellerOwnsResource khi thao tác dữ liệu.
 */
export async function requireSeller(request, env) {
  return authorize(request, env, [
    ROLES.ADMIN,
    ROLES.SELLER
  ]);
}

/**
 * Buyer được sử dụng chức năng khách hàng.
 * Admin được phép truy cập để hỗ trợ quản trị.
 */
export async function requireBuyer(request, env) {
  return authorize(request, env, [
    ROLES.ADMIN,
    ROLES.BUYER
  ]);
}

/**
 * Kiểm tra người dùng có phải chủ sở hữu dữ liệu không.
 */
export function isOwner(auth, resourceUserId) {
  if (
    !auth?.userId ||
    !resourceUserId
  ) {
    return false;
  }

  return String(auth.userId) === String(resourceUserId);
}

/**
 * Kiểm tra quyền sở hữu dữ liệu cá nhân.
 *
 * Admin có quyền quản trị toàn hệ thống.
 * Người dùng thông thường chỉ được truy cập dữ liệu của mình.
 */
export function assertOwner(auth, resourceUserId) {
  requireRole(auth, [
    ROLES.ADMIN,
    ROLES.SELLER,
    ROLES.BUYER
  ]);

  if (auth.role === ROLES.ADMIN) {
    return auth;
  }

  if (!isOwner(auth, resourceUserId)) {
    throw new AuthError(
      403,
      "Bạn không có quyền truy cập dữ liệu của tài khoản khác."
    );
  }

  return auth;
}

/**
 * Kiểm tra Seller có quyền quản lý tài nguyên thuộc mình không.
 *
 * sellerUserId phải được lấy từ dữ liệu đáng tin cậy
 * trong cơ sở dữ liệu, không lấy trực tiếp từ trình duyệt.
 */
export function assertSellerOwnsResource(
  auth,
  sellerUserId
) {
  requireRole(auth, [
    ROLES.ADMIN,
    ROLES.SELLER
  ]);

  if (auth.role === ROLES.ADMIN) {
    return auth;
  }

  if (!isOwner(auth, sellerUserId)) {
    throw new AuthError(
      403,
      "Bạn không có quyền quản lý dữ liệu của người bán khác."
    );
  }

  return auth;
}

/**
 * Kiểm tra quyền sở hữu đơn hàng hoặc dữ liệu khách hàng.
 *
 * Admin được quản trị.
 * Buyer chỉ được truy cập dữ liệu thuộc tài khoản mình.
 */
export function assertBuyerOwnsResource(
  auth,
  buyerUserId
) {
  requireRole(auth, [
    ROLES.ADMIN,
    ROLES.BUYER
  ]);

  if (auth.role === ROLES.ADMIN) {
    return auth;
  }

  if (!isOwner(auth, buyerUserId)) {
    throw new AuthError(
      403,
      "Bạn không có quyền truy cập dữ liệu của khách hàng khác."
    );
  }

  return auth;
}
