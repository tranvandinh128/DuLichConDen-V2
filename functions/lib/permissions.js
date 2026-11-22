
import { requireAuth, AuthError } from "./auth.js";

export const ROLES = Object.freeze({
  ADMIN: "admin",
  SELLER: "seller",
  CUSTOMER: "customer"
});

export function hasRole(auth, allowedRoles = []) {
  if (!auth?.role || !Array.isArray(allowedRoles)) {
    return false;
  }

  return allowedRoles.includes(auth.role);
}

export function requireRole(auth, allowedRoles = []) {
  if (!hasRole(auth, allowedRoles)) {
    throw new AuthError(
      403,
      "Bạn không có quyền thực hiện thao tác này."
    );
  }

  return auth;
}

export async function authorize(request, env, allowedRoles = []) {
  const auth = await requireAuth(request, env);

  return requireRole(auth, allowedRoles);
}

export async function requireAdmin(request, env) {
  return authorize(request, env, [ROLES.ADMIN]);
}

export async function requireSeller(request, env) {
  return authorize(request, env, [
    ROLES.ADMIN,
    ROLES.SELLER
  ]);
}

export async function requireCustomer(request, env) {
  return authorize(request, env, [
    ROLES.ADMIN,
    ROLES.CUSTOMER
  ]);
}

export function isOwner(auth, resourceUserId) {
  if (!auth?.userId || !resourceUserId) {
    return false;
  }

  return auth.userId === String(resourceUserId);
}

export function assertOwner(auth, resourceUserId) {
  if (auth?.role === ROLES.ADMIN) {
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

export function assertSellerOwnsResource(auth, sellerUserId) {
  requireRole(auth, [ROLES.ADMIN, ROLES.SELLER]);

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
