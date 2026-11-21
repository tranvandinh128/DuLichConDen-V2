import {
  supabase,
  supabaseConfigured
} from "./supabase-client.js";

const $ = id => document.getElementById(id);

let currentPricing = null;
let loadingPricing = false;

function formatPi(value) {
  if (!Number.isFinite(value) || value < 0) {
    return "---";
  }

  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  });
}

function showPrice(text) {
  const element = $("seller-pi-price");

  if (element) {
    element.textContent = text;
  }
}

function showRateInfo(text) {
  const element = $("seller-pi-rate-info");

  if (element) {
    element.textContent = text;
  }
}

// Lấy tỷ giá hiện hành từ Backend Cloudflare.
async function loadPiPricing() {
  if (loadingPricing) return currentPricing;

  loadingPricing = true;

  try {
    showPrice("Đang lấy tỷ giá Pi...");

    const response = await fetch("/api/pricing", {
      method: "GET",
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    });

    const result = await response.json().catch(() => null);

    if (
      !response.ok ||
      !result?.success ||
      !result?.available
    ) {
      throw new Error(
        result?.error || "Không lấy được tỷ giá Pi."
      );
    }

    const effectiveRate = Number(
      result.effectiveVndPerPi
    );

    if (
      !Number.isFinite(effectiveRate) ||
      effectiveRate <= 0
    ) {
      throw new Error(
        "Tỷ giá VNĐ/PI không hợp lệ."
      );
    }

    currentPricing = {
      effectiveVndPerPi: effectiveRate,
      pricingMode: result.pricingMode,
      piUsdtRate: result.piUsdtRate,
      usdtVndRate: result.usdtVndRate,
      rateSource: result.rateSource,
      rateTimestamp: result.rateTimestamp
    };

    showRateInfo(
      `Chế độ: ${
        result.pricingMode === "fixed"
          ? "FIXED – tỷ giá cố định"
          : "MARKET – theo thị trường"
      } · Nguồn: ${result.rateSource || "Máy chủ"} · 1 PI ≈ ${
        formatPi(effectiveRate)
      } VNĐ`
    );

    calculatePiPrice();

    return currentPricing;

  } catch (error) {
    currentPricing = null;

    showPrice("Chưa có tỷ giá Pi");

    showRateInfo(
      error.message +
      " Hãy báo quản trị viên kiểm tra cấu hình tỷ giá."
    );

    return null;

  } finally {
    loadingPricing = false;
  }
}

// Tính giá Pi dự kiến từ giá gốc VNĐ.
function calculatePiPrice() {
  const priceInput = $("product-price");

  if (!priceInput) return;

  const vndPrice = Number(priceInput.value);

  if (
    !priceInput.value ||
    !Number.isFinite(vndPrice) ||
    vndPrice < 0
  ) {
    showPrice("Chưa nhập giá sản phẩm");
    return;
  }

  if (!currentPricing) {
    showPrice("Chưa có tỷ giá Pi");
    return;
  }

  // Công thức:
  // Giá sản phẩm Pi = Giá gốc VNĐ / Tỷ giá VNĐ/PI
  const piPrice =
    vndPrice / currentPricing.effectiveVndPerPi;

  showPrice(`${formatPi(piPrice)} π`);
}

// Tránh để người bán gửi sản phẩm với giá
// không hợp lệ hoặc khi chưa có tỷ giá tham chiếu.
// seller.js vẫn chịu trách nhiệm tạo sản phẩm.
function validatePricingBeforeSubmit(event) {
  const form = $("product-form");

  if (!form || event.target !== form) return;

  const priceInput = $("product-price");
  const vndPrice = Number(priceInput?.value);

  if (
    !priceInput?.value ||
    !Number.isFinite(vndPrice) ||
    vndPrice < 0
  ) {
    event.preventDefault();

    showRateInfo(
      "Vui lòng nhập giá gốc VNĐ hợp lệ."
    );

    return;
  }

  if (!currentPricing) {
    event.preventDefault();

    showRateInfo(
      "Chưa lấy được tỷ giá Pi. Chưa thể gửi sản phẩm. Hãy thử tải lại trang hoặc báo quản trị viên."
    );

    return;
  }
}

// Ẩn form đăng ký khi hồ sơ đã được gửi
// hoặc đã được duyệt, tránh upsert ghi đè trạng thái.
async function syncApplicationForm() {
  if (!supabaseConfigured || !supabase) return;

  const form = $("application-form");
  if (!form) return;

  try {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) return;

    const { data, error } = await supabase
      .from("seller_applications")
      .select("id,status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(
        "Không kiểm tra được hồ sơ người bán:",
        error
      );
      return;
    }

    if (
      data &&
      ["pending", "approved"].includes(data.status)
    ) {
      form.hidden = true;
    } else {
      form.hidden = false;
    }

  } catch (error) {
    console.error(
      "Application form guard error:",
      error
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const priceInput = $("product-price");

  if (priceInput) {
    priceInput.addEventListener(
      "input",
      calculatePiPrice
    );
  }

  const productForm = $("product-form");

  if (productForm) {
    productForm.addEventListener(
      "submit",
      validatePricingBeforeSubmit,
      true
    );
  }

  // Tải tỷ giá khi mở trang người bán.
  loadPiPricing();

  // Cập nhật trạng thái hồ sơ khi đăng nhập hoặc đăng xuất.
  if (supabaseConfigured && supabase) {
    syncApplicationForm();

    supabase.auth.onAuthStateChange(() => {
      // Đưa truy vấn hồ sơ ra ngoài callback đồng bộ của Auth.
      setTimeout(() => {
        syncApplicationForm();
      }, 0);
    });
  }
});
