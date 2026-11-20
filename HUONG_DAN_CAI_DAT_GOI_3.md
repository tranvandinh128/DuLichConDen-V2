# HƯỚNG DẪN CÀI ĐẶT GÓI 3

## 1. Những gì cần chuẩn bị
- Repository GitHub `tranvandinh128/DuLichConDen-V2`.
- Dự án Supabase mà bạn quản lý.
- Quyền truy cập SQL Editor và Authentication trong Supabase.

## 2. Đưa tệp lên GitHub
Giải nén ZIP. Chép nội dung thư mục `public` trong gói vào thư mục `public` của repository; chép thư mục `supabase` vào thư mục gốc repository. Chỉ thêm tệp mới, không xóa/ghi đè các tệp trang chủ hoặc du lịch đang chạy.

## 3. Chạy SQL
Supabase Dashboard → SQL Editor → New query.
Mở tệp `supabase/migrations/202611210001_marketplace.sql`, sao chép toàn bộ và Run.

Nếu gặp lỗi, không tiếp tục các bước còn lại. Chụp ảnh hoặc sao chép thông báo lỗi gửi để kiểm tra.

## 4. Tạo tài khoản admin đầu tiên
1. Sau khi SQL chạy thành công, mở trang đăng ký người bán `/pages/seller/` và tạo tài khoản của chính bạn bằng email.
2. Xác nhận email nếu Supabase yêu cầu.
3. Trong Supabase Dashboard → SQL Editor, chạy câu lệnh sau, thay email bằng email bạn vừa đăng ký:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users
  where lower(email) = lower('EMAIL_CUA_BAN')
);
```

Chỉ cấp quyền admin cho tài khoản do bạn kiểm soát. Không gửi mật khẩu hoặc khóa bí mật cho bất kỳ ai.

## 5. Cấu hình Supabase cho website
Mở `public/config/supabase.js` và thay hai giá trị:
- `YOUR_SUPABASE_PROJECT_URL`: Project URL (Supabase → Project Settings → API).
- `YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY`: publishable key hoặc anon public key (cùng trang API).

Không sử dụng `service_role` hoặc secret key trong mã nguồn frontend. Các khóa public có thể xuất hiện trong trình duyệt; RLS phải được bật như migration đã cấu hình.

## 6. Bật xác thực email
Supabase → Authentication → URL Configuration:
- Site URL: `https://dulichconden-v2.pages.dev`
- Redirect URL: `https://dulichconden-v2.pages.dev/**`

Tùy chọn email confirmation theo chính sách vận hành của bạn. Nếu bật xác nhận email, người dùng phải xác nhận trước khi đăng nhập.

## 7. Storage ảnh sản phẩm
Migration tạo bucket `product-images` dạng public để trình duyệt hiển thị ảnh sản phẩm. Policy upload/update/delete chỉ cho người dùng đã đăng nhập và có đường dẫn đầu tiên là ID cửa hàng mà họ sở hữu. Không cấp quyền ghi công khai.

## 8. Kiểm tra
- Mở `/pages/marketplace/`: danh sách cửa hàng/sản phẩm đã duyệt.
- Mở `/pages/seller/`: đăng ký/đăng nhập, gửi hồ sơ người bán.
- Sau khi admin duyệt hồ sơ, người bán gửi gian hàng chờ duyệt; khi gian hàng được duyệt, người bán thêm sản phẩm chờ duyệt. Admin duyệt sản phẩm trước khi công khai.
- Mở `/pages/admin/sellers.html` bằng tài khoản admin để duyệt hồ sơ.

## 9. Giới hạn của Gói 3
Gói 3 chưa triển khai đặt hàng/giỏ hàng, thanh toán, quản lý vận chuyển, hoàn tiền, phí hoa hồng, chat, đánh giá, kiểm duyệt nội dung nâng cao hoặc quy trình xác minh pháp lý. Không nhận thanh toán thật trong gói này.
