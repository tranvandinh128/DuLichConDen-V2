# Bổ sung tài khoản người bán DuLichConDen 2.0

## Các tệp trong gói

1. `public/pages/seller/index.html` — phiên bản đã bổ sung giao diện quên mật khẩu, thông tin khôi phục bằng số điện thoại, trạng thái đăng nhập Pi Network sắp ra mắt và hướng dẫn mỗi người bán tự tạo tài khoản.
2. `public/js/marketplace/seller-recovery.js` — gửi liên kết đặt lại mật khẩu qua email bằng Supabase Auth.
3. `public/pages/seller/reset-password.html` — trang nhận liên kết email và cập nhật mật khẩu mới.

## Lưu ý cấu hình Supabase bắt buộc

Trong Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `https://dulichconden-v2.pages.dev`
- Thêm Redirect URL: `https://dulichconden-v2.pages.dev/pages/seller/reset-password.html`
- Để dùng các URL Preview Cloudflare, thêm mẫu: `https://*.dulichconden-v2.pages.dev/**`

Trong Supabase → Authentication → Email Templates, kiểm tra mẫu Reset Password có dùng biến xác minh/link khôi phục do Supabase cung cấp. Cần cấu hình SMTP gửi thư đáng tin cậy trước khi mở rộng cho nhiều người dùng.

## Chức năng số điện thoại

Hiện chỉ hiển thị trạng thái chuẩn bị, chưa gửi OTP. Không bật khôi phục qua số điện thoại cho đến khi:

- Số điện thoại của tài khoản được xác minh và liên kết với Supabase Auth (không chỉ lưu trong hồ sơ `seller_applications`).
- Bật Phone Auth và cấu hình nhà cung cấp SMS trong Supabase.
- Thêm luồng OTP có giới hạn tần suất, CAPTCHA và kiểm tra quyền sở hữu số điện thoại.

## Pi Network

Đã có gói tích hợp đăng nhập Pi Network riêng. Hãy làm theo tệp `README-PI-LOGIN.md` trong cùng gói để chạy SQL tạo bảng liên kết, bổ sung Cloudflare secret `SUPABASE_SERVICE_ROLE_KEY`, cấu hình Pi Developer Portal và kiểm thử trong Pi Browser/Pi Sandbox. Không bật Mainnet khi chưa đăng ký app Mainnet và chuyển `data-pi-sandbox` sang `false`.

## Cách áp dụng

Thay tệp `public/pages/seller/index.html` hiện có bằng tệp cùng đường dẫn trong gói; thêm hai tệp mới theo đúng đường dẫn. Giữ nguyên `seller.js`, `seller-pricing.js`, `auth.js`, `supabase-client.js` và `public/config/supabase.js`.
