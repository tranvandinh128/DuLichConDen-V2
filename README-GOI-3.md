# DuLichConDen 2.0 – Gói 3: Sàn thương mại điện tử nhiều người bán

## Phạm vi gói
Gói này **bổ sung** các trang và mã nguồn cho:
- Trang khám phá gian hàng/sản phẩm.
- Đăng ký/đăng nhập bằng Supabase Auth.
- Gửi hồ sơ đăng ký người bán.
- Trang quản lý cơ bản của người bán: cửa hàng, sản phẩm.
- Trang quản trị duyệt hồ sơ người bán, gian hàng và sản phẩm.
- SQL tạo bảng, chỉ mục, RLS và Storage policy.

Gói này không thay thế các tệp đang chạy trong `public/index.html`, `public/css/style.css`, `public/js/app.js` hoặc trang du lịch `public/pages/tourism/index.html`.

## Cấu trúc khi giải nén
```text
public/
  config/
    supabase.js
  css/
    marketplace.css
  js/
    marketplace/
      supabase-client.js
      auth.js
      marketplace.js
      seller.js
      admin.js
  pages/
    marketplace/
      index.html
    seller/
      index.html
    shop/
      index.html
    admin/
      sellers.html
supabase/
  migrations/
    202611210001_marketplace.sql
HUONG_DAN_CAI_DAT_GOI_3.md
```

## Cài đặt theo thứ tự

### A. Sao lưu
Trước khi tải lên GitHub, tải ZIP repository hiện tại hoặc tạo một nhánh Git riêng. Không xóa các tệp cũ.

### B. Tải mã nguồn lên GitHub
Tải các thư mục/tệp trong gói vào đúng vị trí tương ứng của repository `DuLichConDen-V2`.
- Tệp mới trong `public/config/`, `public/css/`, `public/js/marketplace/`.
- Các trang mới trong `public/pages/marketplace/`, `seller/`, `shop/`, `admin/`.
- Tệp SQL trong `supabase/migrations/` ở thư mục gốc repository.

Nếu GitHub upload web không giữ được cây thư mục khi chọn nhiều cấp, dùng GitHub Desktop: chép các thư mục từ gói đã giải nén vào thư mục local repository, kiểm tra Changes rồi Commit và Push.

### C. Tạo cấu trúc Supabase
1. Mở Supabase Dashboard của dự án.
2. Vào SQL Editor > New query.
3. Mở `supabase/migrations/202611210001_marketplace.sql`, sao chép toàn bộ nội dung và chạy.
4. Kiểm tra SQL chạy thành công. Nếu báo lỗi, dừng và gửi nguyên văn lỗi; không chạy lặp lại tùy tiện.

SQL tạo các bảng `profiles`, `seller_applications`, `stores`, `categories`, `products`; bật RLS và tạo policy.
Tài khoản quản trị đầu tiên phải được cấp role `admin` thủ công theo hướng dẫn trong `HUONG_DAN_CAI_DAT_GOI_3.md`.

### D. Cấu hình khóa Supabase công khai
Mở `public/config/supabase.js` và thay:
- `SUPABASE_URL`: Project URL của dự án.
- `SUPABASE_ANON_KEY`: publishable/anon key của dự án.

Chỉ dùng publishable/anon key ở trình duyệt. **Tuyệt đối không đưa service_role key hoặc secret key vào GitHub hay JavaScript.**

### E. Kiểm tra sau khi deploy
- Trang gian hàng: `/pages/marketplace/`
- Đăng ký người bán: `/pages/seller/`
- Trang quản lý người bán: `/pages/seller/` (đăng nhập trước)
- Trang quản trị duyệt hồ sơ: `/pages/admin/sellers.html` (chỉ tài khoản có role admin đọc/duyệt được)
- Trang chi tiết cửa hàng: `/pages/shop/?id=STORE_UUID`

## Lưu ý bảo mật và trạng thái
- Người bán là cá nhân, hộ kinh doanh hoặc doanh nghiệp đều có thể gửi hồ sơ.
- Hồ sơ ở trạng thái `pending`; chỉ quản trị viên được duyệt.
- Người bán chỉ quản lý cửa hàng/sản phẩm của mình.
- Người chưa đăng nhập chỉ đọc được cửa hàng đã duyệt và sản phẩm đang hoạt động.
- RLS là lớp bảo vệ dữ liệu; ẩn nút trên giao diện không thay thế RLS.
- Đây là nền tảng khởi đầu. Chưa có giỏ hàng đa người bán, đơn hàng, COD/Bank/Pi, phí sàn, vận chuyển, hóa đơn hoặc đối soát. Các phần này thuộc gói tiếp theo.
