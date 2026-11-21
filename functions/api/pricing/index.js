const OKX_TICKER_URL =
  "https://www.okx.com/api/v5/market/ticker?instId=PI-USDT";

const MARKET_CACHE_SECONDS = 45;
const MAX_OKX_AGE_MS = 180_000;

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function json(data, status = 200, cacheControl = "no-store") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": cacheControl
    }
  });
}

function apiUrl(base, path) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function readJson(response) {
  const raw = await response.text();

  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw.slice(0, 500) };
  }
}

// Secret Key chỉ được gửi ở header apikey trên máy chủ.
// Không gửi Secret Key dưới dạng Bearer vì đây không phải JWT.
function serviceHeaders(env) {
  return {
    apikey: env.SUPABASE_SECRET_KEY,
    "Content-Type": "application/json",
    Prefer: "return=representation"
  };
}

async function dbRequest(
  base,
  env,
  method,
  resource,
  query = "",
  body = null
) {
  const url = apiUrl(
    base,
    `/rest/v1/${resource}${query ? `?${query}` : ""}`
  );

  const response = await fetch(url, {
    method,
    headers: serviceHeaders(env),
    ...(body !== null
      ? { body: JSON.stringify(body) }
      : {})
  });

  const data = await readJson(response);

  if (!response.ok) {
    console.error(
      "Supabase pricing API error:",
      response.status,
      data?.message || data?.hint || "unknown"
    );

    throw new ApiError(
      502,
      "Không thể truy cập dữ liệu tỷ giá trên Supabase. Kiểm tra quyền bảng và cấu hình Secret Key."
    );
  }

  return data;
}

// Đọc cấu hình tỷ giá hiện tại từ Supabase.
async function getSettings(base, env) {
  const query = new URLSearchParams({
    id: "eq.1",
    select:
      "id,pricing_mode,pi_usdt_rate,usdt_vnd_rate,fixed_vnd_per_pi,rate_source,rate_timestamp,is_active,updated_at"
  });

  const rows = await dbRequest(
    base,
    env,
    "GET",
    "pi_pricing_settings",
    query.toString()
  );

  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new ApiError(
      500,
      "Không tìm thấy bản ghi cấu hình tỷ giá Pi có id = 1."
    );
  }

  return rows[0];
}

// Xác thực người dùng Supabase và kiểm tra role admin.
async function authenticateAdmin(base, env, request) {
  const authorization =
    request.headers.get("Authorization") || "";

  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    throw new ApiError(
      401,
      "Thiếu phiên đăng nhập quản trị."
    );
  }

  // Bearer ở đây là access token đăng nhập của người dùng,
  // không phải Secret Key.
  const authResponse = await fetch(
    apiUrl(base, "/auth/v1/user"),
    {
      method: "GET",
      headers: {
        apikey: env.SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${match[1]}`
      }
    }
  );

  const user = await readJson(authResponse);

  if (!authResponse.ok || !user?.id) {
    throw new ApiError(
      401,
      "Phiên đăng nhập không hợp lệ hoặc đã hết hạn."
    );
  }

  const query = new URLSearchParams({
    id: `eq.${user.id}`,
    select: "id,role"
  });

  const profiles = await dbRequest(
    base,
    env,
    "GET",
    "profiles",
    query.toString()
  );

  if (
    !Array.isArray(profiles) ||
    profiles[0]?.role !== "admin"
  ) {
    throw new ApiError(
      403,
      "Tài khoản không có quyền quản trị tỷ giá Pi."
    );
  }

  return user;
}

// Kiểm tra số nhập vào.
function positiveDecimal(value, label, min, max) {
  const text = String(value ?? "").trim();

  if (!/^\d{1,15}(?:\.\d{1,12})?$/.test(text)) {
    throw new ApiError(
      400,
      `${label} phải là số dương hợp lệ.`
    );
  }

  const number = Number(text);

  if (
    !Number.isFinite(number) ||
    number < min ||
    number > max
  ) {
    throw new ApiError(
      400,
      `${label} nằm ngoài giới hạn cho phép.`
    );
  }

  return text;
}

function formatRate(number) {
  if (!Number.isFinite(number) || number <= 0) {
    throw new ApiError(
      503,
      "Không tính được tỷ giá Pi hợp lệ."
    );
  }

  return number.toFixed(8);
}

// Cấu trúc dữ liệu trả về cho website.
function publicRatePayload(settings, values = {}) {
  return {
    success: true,
    available: true,

    pricingMode: settings.pricing_mode,

    effectiveVndPerPi:
      values.effectiveVndPerPi ?? null,

    piUsdtRate:
      values.piUsdtRate ??
      settings.pi_usdt_rate ??
      null,

    usdtVndRate:
      values.usdtVndRate ??
      settings.usdt_vnd_rate ??
      null,

    fixedVndPerPi:
      settings.fixed_vnd_per_pi ?? null,

    rateSource:
      values.rateSource ??
      settings.rate_source ??
      null,

    rateTimestamp:
      values.rateTimestamp ??
      settings.rate_timestamp ??
      null,

    note:
      settings.pricing_mode === "market"
        ? "Giá PI tham chiếu từ OKX; tỷ giá USDT/VNĐ do quản trị viên cấu hình riêng."
        : "Tỷ giá VNĐ/PI do quản trị viên thiết lập cố định."
  };
}

// Lấy tỷ giá thị trường PI/USDT từ OKX.
async function getMarketRate(base, env, settings) {
  const usdtVnd = Number(settings.usdt_vnd_rate);

  if (!Number.isFinite(usdtVnd) || usdtVnd <= 0) {
    throw new ApiError(
      409,
      "Chưa cấu hình tỷ giá USDT/VNĐ. Quản trị viên cần nhập tỷ giá này trước khi hiển thị giá Pi."
    );
  }

  // Tái sử dụng tỷ giá thị trường mới lấy trong 45 giây gần nhất.
  const historyQuery = new URLSearchParams({
    pricing_mode: "eq.market",
    select:
      "pi_usdt_rate,usdt_vnd_rate,effective_vnd_per_pi,rate_source,captured_at",
    order: "captured_at.desc",
    limit: "1"
  });

  const history = await dbRequest(
    base,
    env,
    "GET",
    "pi_rate_history",
    historyQuery.toString()
  );

  const cached = Array.isArray(history)
    ? history[0]
    : null;

  if (cached) {
    const age =
      Date.now() -
      new Date(cached.captured_at).getTime();

    const sameFx =
      Number(cached.usdt_vnd_rate) === usdtVnd;

    const usable =
      Number(cached.pi_usdt_rate) > 0 &&
      Number(cached.effective_vnd_per_pi) > 0;

    if (
      usable &&
      sameFx &&
      age >= 0 &&
      age <= MARKET_CACHE_SECONDS * 1000
    ) {
      return publicRatePayload(settings, {
        effectiveVndPerPi:
          String(cached.effective_vnd_per_pi),

        piUsdtRate:
          String(cached.pi_usdt_rate),

        usdtVndRate:
          String(cached.usdt_vnd_rate),

        rateSource:
          cached.rate_source ||
          "OKX PI-USDT + USDT/VNĐ",

        rateTimestamp: cached.captured_at
      });
    }
  }

  let okxResponse;

  try {
    okxResponse = await fetch(OKX_TICKER_URL, {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      signal: AbortSignal.timeout(8000)
    });
  } catch {
    throw new ApiError(
      503,
      "Không kết nối được nguồn giá OKX."
    );
  }

  const tickerResult = await readJson(okxResponse);
  const ticker = tickerResult?.data?.[0];

  const piUsdt = Number(ticker?.last);
  const tickerTimestamp = Number(ticker?.ts);

  const age = Date.now() - tickerTimestamp;

  if (
    !okxResponse.ok ||
    tickerResult?.code !== "0" ||
    ticker?.instId !== "PI-USDT" ||
    !Number.isFinite(piUsdt) ||
    piUsdt <= 0
  ) {
    throw new ApiError(
      503,
      "OKX chưa trả về giá PI-USDT hợp lệ."
    );
  }

  if (
    !Number.isFinite(tickerTimestamp) ||
    age < -60_000 ||
    age > MAX_OKX_AGE_MS
  ) {
    throw new ApiError(
      503,
      "Dữ liệu PI-USDT từ OKX đã quá cũ hoặc thời gian không hợp lệ."
    );
  }

  // Công thức:
  // VNĐ/PI = Giá PI/USDT x Tỷ giá USDT/VNĐ.
  const effectiveRate = formatRate(
    piUsdt * usdtVnd
  );

  const rateTimestamp =
    new Date(tickerTimestamp).toISOString();

  const rateSource =
    "OKX PI-USDT ticker + USDT/VNĐ do quản trị viên cấu hình";

  // Lưu lịch sử tỷ giá.
  await dbRequest(
    base,
    env,
    "POST",
    "pi_rate_history",
    "",
    {
      pricing_mode: "market",
      pi_usdt_rate: String(ticker.last),
      usdt_vnd_rate: String(settings.usdt_vnd_rate),
      effective_vnd_per_pi: effectiveRate,
      rate_source: rateSource,
      captured_at: rateTimestamp,
      recorded_by: null
    }
  );

  // Cập nhật tỷ giá mới nhất.
  await dbRequest(
    base,
    env,
    "PATCH",
    "pi_pricing_settings",
    "id=eq.1",
    {
      pi_usdt_rate: String(ticker.last),
      rate_timestamp: rateTimestamp,
      rate_source: rateSource,
      updated_at: new Date().toISOString()
    }
  );

  return publicRatePayload(settings, {
    effectiveVndPerPi: effectiveRate,
    piUsdtRate: String(ticker.last),
    usdtVndRate: String(settings.usdt_vnd_rate),
    rateSource,
    rateTimestamp
  });
}

// API tỷ giá công khai cho website.
async function getPublicRate(base, env) {
  const settings = await getSettings(base, env);

  if (settings.is_active === false) {
    throw new ApiError(
      503,
      "Tính năng định giá Pi hiện đang tạm khóa."
    );
  }

  if (settings.pricing_mode === "fixed") {
    const fixed = Number(settings.fixed_vnd_per_pi);

    if (!Number.isFinite(fixed) || fixed <= 0) {
      throw new ApiError(
        409,
        "Chưa thiết lập tỷ giá cố định VNĐ/PI."
      );
    }

    return publicRatePayload(settings, {
      effectiveVndPerPi:
        String(settings.fixed_vnd_per_pi),

      rateSource:
        settings.rate_source ||
        "Quản trị viên thiết lập",

      rateTimestamp:
        settings.rate_timestamp ||
        settings.updated_at
    });
  }

  if (settings.pricing_mode !== "market") {
    throw new ApiError(
      500,
      "Chế độ định giá Pi trong cấu hình không hợp lệ."
    );
  }

  return getMarketRate(base, env, settings);
}

// Lưu cấu hình tỷ giá từ trang Admin.
async function updateSettings(base, env, request) {
  const admin = await authenticateAdmin(
    base,
    env,
    request
  );

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(
      400,
      "Nội dung gửi lên không phải JSON hợp lệ."
    );
  }

  if (!["market", "fixed"].includes(body.pricingMode)) {
    throw new ApiError(
      400,
      "pricingMode chỉ được là market hoặc fixed."
    );
  }

  const current = await getSettings(base, env);

  const now = new Date().toISOString();

  let usdtVndRate = current.usdt_vnd_rate;
  let fixedVndPerPi = null;
  let effectiveRate = null;
  let source;

  if (body.pricingMode === "market") {
    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "usdtVndRate"
      )
    ) {
      usdtVndRate = positiveDecimal(
        body.usdtVndRate,
        "Tỷ giá USDT/VNĐ",
        1000,
        1_000_000
      );
    }

    if (
      !Number.isFinite(Number(usdtVndRate)) ||
      Number(usdtVndRate) <= 0
    ) {
      throw new ApiError(
        400,
        "Bạn cần nhập tỷ giá USDT/VNĐ để dùng chế độ thị trường."
      );
    }

    source =
      "OKX PI-USDT ticker + USDT/VNĐ do quản trị viên cấu hình";

  } else {
    fixedVndPerPi = positiveDecimal(
      body.fixedVndPerPi,
      "Tỷ giá cố định VNĐ/PI",
      1,
      1_000_000_000_000
    );

    effectiveRate = fixedVndPerPi;

    source =
      "Quản trị viên thiết lập tỷ giá cố định";
  }

  const patch = {
    pricing_mode: body.pricingMode,
    usdt_vnd_rate: usdtVndRate,
    fixed_vnd_per_pi: fixedVndPerPi,
    pi_usdt_rate: null,
    rate_source: source,
    rate_timestamp:
      body.pricingMode === "fixed"
        ? now
        : null,
    is_active: true,
    updated_by: admin.id,
    updated_at: now
  };

  const updated = await dbRequest(
    base,
    env,
    "PATCH",
    "pi_pricing_settings",
    "id=eq.1",
    patch
  );

  if (!Array.isArray(updated) || updated.length !== 1) {
    throw new ApiError(
      409,
      "Không cập nhật được cấu hình tỷ giá Pi."
    );
  }

  // Lưu lịch sử thay đổi cấu hình.
  await dbRequest(
    base,
    env,
    "POST",
    "pi_rate_history",
    "",
    {
      pricing_mode: body.pricingMode,
      pi_usdt_rate: null,
      usdt_vnd_rate: usdtVndRate,
      fixed_vnd_per_pi: fixedVndPerPi,
      effective_vnd_per_pi: effectiveRate,
      rate_source: source,
      captured_at: now,
      recorded_by: admin.id
    }
  );

  return json({
    success: true,
    message: "Đã lưu cấu hình tỷ giá Pi.",
    data: {
      pricingMode: body.pricingMode,
      usdtVndRate,
      fixedVndPerPi,
      effectiveVndPerPi: effectiveRate,
      updatedAt: now
    }
  });
}

// Điểm vào của Cloudflare Pages Function.
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const origin = request.headers.get("Origin");

  // Chỉ nhận yêu cầu từ chính website.
  if (origin && origin !== url.origin) {
    return json(
      {
        success: false,
        error: "Origin không được phép."
      },
      403
    );
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        Allow: "GET, POST, OPTIONS"
      }
    });
  }

  if (
    request.method !== "GET" &&
    request.method !== "POST"
  ) {
    return json(
      {
        success: false,
        error: "Phương thức không được hỗ trợ."
      },
      405
    );
  }

  if (
    !env.SUPABASE_URL ||
    !env.SUPABASE_SECRET_KEY
  ) {
    return json(
      {
        success: false,
        error: "Máy chủ chưa được cấu hình Supabase."
      },
      500
    );
  }

  try {
    if (request.method === "GET") {

      // GET ?admin=1:
      // Chỉ Admin đã đăng nhập mới được đọc cấu hình đầy đủ.
      if (url.searchParams.get("admin") === "1") {
        await authenticateAdmin(
          env.SUPABASE_URL,
          env,
          request
        );

        const settings = await getSettings(
          env.SUPABASE_URL,
          env
        );

        return json({
          success: true,
          data: settings
        });
      }

      // GET công khai:
      // Chỉ trả về tỷ giá tham chiếu cần thiết cho website.
      const result = await getPublicRate(
        env.SUPABASE_URL,
        env
      );

      return json(
        result,
        200,
        "public, max-age=15, s-maxage=30"
      );
    }

    return await updateSettings(
      env.SUPABASE_URL,
      env,
      request
    );

  } catch (error) {
    console.error(
      "Pi pricing API error:",
      error.message
    );

    const status =
      error instanceof ApiError
        ? error.status
        : 500;

    return json(
      {
        success: false,
        available: false,
        error:
          status === 500
            ? "Máy chủ gặp lỗi khi xử lý tỷ giá Pi."
            : error.message
      },
      status
    );
  }
}
