import {
  PiAuthError,
  checkMethod,
  createSupabaseMagicLink,
  findPiAccountByUid,
  handlePiAuthError,
  piJson,
  verifyPiAccessToken
} from "../../lib/pi-auth.js";

export async function onRequest({ request, env }) {
  try {
    const early = checkMethod(request);
    if (early) return early;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new PiAuthError(400, "Dữ liệu đăng nhập không hợp lệ.");
    }

    // Never trust the UID or username sent by the browser; verify accessToken with Pi /v2/me.
    const piUser = await verifyPiAccessToken(body.accessToken);
    const account = await findPiAccountByUid(env, piUser.uid);

    if (!account) {
      throw new PiAuthError(404, "Tài khoản Pi này chưa được liên kết. Hãy đăng nhập bằng email/mật khẩu trước, vào mục Liên kết tài khoản Pi Network, rồi thử đăng nhập bằng Pi.");
    }

    const tokenHash = await createSupabaseMagicLink(env, account.user_id);
    return piJson({ success: true, tokenHash, username: piUser.username });
  } catch (error) {
    return handlePiAuthError(error);
  }
}
