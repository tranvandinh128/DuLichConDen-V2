
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
    checkMethod(request);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204 });
    }

    let body;

    try {
      body = await request.json();
    } catch {
      throw new PiAuthError(400, "Dữ liệu đăng nhập không hợp lệ.");
    }

    const accessToken =
      typeof body?.accessToken === "string"
        ? body.accessToken.trim()
        : "";

    if (!accessToken) {
      throw new PiAuthError(
        400,
        "Thiếu Pi access token. Vui lòng đăng nhập Pi lại."
      );
    }

    // Xác minh access token trực tiếp với Pi Network.
    const piUser = await verifyPiAccessToken(accessToken);

    // Chỉ cho phép đăng nhập nếu UID Pi đã được liên kết.
    const linkedAccount = await findPiAccountByUid(
      env,
      piUser.uid
    );

    if (!linkedAccount?.user_id) {
      throw new PiAuthError(
        403,
        "Tài khoản Pi chưa được liên kết với DuLichConDen. Vui lòng đăng nhập bằng email và thực hiện liên kết Pi trước."
      );
    }

    // Tạo mã đăng nhập một lần cho tài khoản Supabase.
    const tokenHash = await createSupabaseMagicLink(
      env,
      linkedAccount.user_id
    );

    return piJson({
      success: true,
      tokenHash,
      piUsername: piUser.username,
      message: "Xác minh tài khoản Pi thành công."
    });
  } catch (error) {
    return handlePiAuthError(error);
  }
}
