import {
  PiAuthError,
  checkMethod,
  handlePiAuthError,
  piJson,
  savePiAccount,
  verifyPiAccessToken,
  verifySupabaseSession
} from "../../lib/pi-auth.js";

export async function onRequest({ request, env }) {
  try {
    const early = checkMethod(request);
    if (early) return early;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new PiAuthError(400, "Dữ liệu liên kết không hợp lệ.");
    }

    // Require the current Supabase session so a user cannot link a Pi UID to another person's account.
    const supabaseUser = await verifySupabaseSession(request, env);
    const piUser = await verifyPiAccessToken(body.accessToken);
    await savePiAccount(env, supabaseUser.id, piUser);

    return piJson({ success: true, username: piUser.username });
  } catch (error) {
    return handlePiAuthError(error);
  }
}
