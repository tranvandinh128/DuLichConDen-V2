# Bổ sung đăng nhập Pi Network cho DuLichConDen 2.0

## Cơ chế hoạt động

- Người bán tạo tài khoản DuLichConDen bằng email/mật khẩu như hiện tại.
- Người bán đăng nhập email, mở mục **Liên kết tài khoản Pi Network**, rồi xác thực bằng Pi Browser.
- Cloudflare Function gửi Pi access token đến `https://api.minepi.com/v2/me` để xác minh UID thật.
- Backend lưu cặp `pi_uid` ↔ `user_id` trong bảng `public.pi_accounts`.
- Những lần sau, người bán bấm **Đăng nhập bằng tài khoản Pi Network**. Backend xác minh token Pi lần nữa, tạo Supabase magic link một lần và trình duyệt đổi `token_hash` thành Supabase session. Vì vậy seller.js và các RLS policy hiện tại tiếp tục dùng Supabase session bình thường.
- Mỗi tài khoản DuLichConDen chỉ liên kết một tài khoản Pi; mỗi Pi UID chỉ được liên kết một tài khoản DuLichConDen.

Pi UID/username do trình duyệt trả về không được tin cậy. Backend chỉ dùng kết quả từ Pi Platform API `/v2/me` sau khi xác minh access token.

## Tệp trong gói

### Tệp cần thay thế

- `public/pages/seller/index.html`

### Tệp mới cần thêm

- `public/js/marketplace/pi-auth.js`
- `functions/lib/pi-auth.js`
- `functions/api/pi-auth/login.js`
- `functions/api/pi-auth/link.js`
- `supabase/migrations/20261121_create_pi_accounts.sql`

Giữ nguyên `seller.js`, `seller-pricing.js`, `seller-recovery.js`, `auth.js`, `supabase-client.js`, `public/config/supabase.js` và các tệp đang có.

## Bước 1 — Tạo bảng trong Supabase

Mở Supabase → SQL Editor → New query. Mở tệp `supabase/migrations/20261121_create_pi_accounts.sql`, sao chép toàn bộ SQL, dán vào SQL Editor và nhấn Run. Kết quả cần có bảng `public.pi_accounts`.

## Bước 2 — Thêm secret cho Cloudflare

Cloudflare → Workers & Pages → `dulichconden-v2` → Settings → Variables and Secrets → Production.

Giữ nguyên các biến đang có và thêm:

- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: service_role JWT key trong Supabase → Project Settings → API Keys → Legacy API Keys → `service_role`.

Nếu dashboard đang hiển thị tab/khối **Legacy API keys**, lấy đúng `service_role` key ở đó. Không dùng publishable/anon key. Không đưa giá trị khóa vào HTML, JavaScript công khai, GitHub hoặc ảnh chụp gửi qua chat. Nếu Cloudflare có lựa chọn Secret, chọn Secret.

Backend dùng `SUPABASE_SECRET_KEY` hiện có làm apikey và `SUPABASE_SERVICE_ROLE_KEY` chỉ ở phía máy chủ cho Auth Admin API và bảng liên kết. Không cần thêm Pi Server API Key cho riêng bước xác minh đăng nhập; Pi access token được gửi đến `/v2/me` bằng `Authorization: Bearer`.

Sau khi thêm secret, deploy lại Production.

## Bước 3 — Cấu hình Pi Developer Portal

Mở Pi Developer Portal trong Pi Browser. Đăng ký/kiểm tra app DuLichConDen và khai báo đúng URL triển khai mà bạn muốn chạy. Pi SDK xác thực chỉ hoạt động đúng khi ứng dụng được đăng ký và mở trong Pi Browser hoặc Pi Sandbox đã được cấp quyền.

Trong bản này `public/pages/seller/index.html` đặt `data-pi-sandbox="true"` để kiểm thử Sandbox/Testnet. Chỉ đổi thành `false` sau khi app đã đăng ký cho môi trường Mainnet và sẵn sàng chạy production trên Mainnet.

Không dùng trình duyệt Chrome thông thường để kết luận Pi login bị lỗi. Hãy mở app bằng Pi Browser; khi thử Sandbox, thực hiện bước Authorize Sandbox trong Pi Utilities theo hướng dẫn Developer Portal.

## Bước 4 — Commit GitHub

Commit message:

`Add verified Pi Network sign-in for sellers`

Extended description:

- Add Pi SDK authentication to the seller center.
- Verify Pi access tokens on Cloudflare through Pi Platform API /v2/me.
- Allow sellers to link a verified Pi UID to their existing Supabase account.
- Add Pi login using a one-time Supabase magic-link token exchange.
- Keep Supabase Auth sessions for existing seller data and RLS policies.
- Prevent one Pi account from being linked to multiple seller accounts.
- Keep Supabase service-role credentials on the server only.

## Bước 5 — Kiểm thử theo đúng trình tự

1. Deploy đủ các tệp và thêm Cloudflare secret.
2. Chạy SQL tạo bảng `pi_accounts`.
3. Mở website trong Pi Browser hoặc Pi Sandbox.
4. Đăng nhập bằng email/mật khẩu của tài khoản người bán hiện có.
5. Trong **Thông tin tài khoản**, nhấn **Liên kết tài khoản Pi Network** và chấp thuận quyền username trong Pi.
6. Xác nhận thông báo liên kết thành công.
7. Đăng xuất khỏi DuLichConDen.
8. Trên trang đăng nhập, nhấn **Đăng nhập bằng tài khoản Pi Network** và xác nhận trong Pi Browser.
9. Kiểm tra tài khoản được đưa về đúng hồ sơ người bán cũ, không tạo hồ sơ/gian hàng mới.

## Lưu ý bảo mật và giới hạn

- Nếu chưa liên kết Pi trước đó, login bằng Pi trả về thông báo yêu cầu đăng nhập email và liên kết Pi trước.
- Nếu một Pi UID đã liên kết với tài khoản khác, hệ thống từ chối để tránh chiếm đoạt tài khoản.
- Pi SDK chỉ cấp quyền username trong luồng login. Không xin quyền payments vì hiện tại chỉ dùng để đăng nhập; tích hợp thanh toán Pi sẽ có luồng riêng.
- Magic link Supabase được tạo bởi backend và chỉ trả về hash dùng một lần cho trình duyệt. Service-role key không bao giờ gửi xuống frontend.
- Chưa thể xác nhận luồng thực tế cho tới khi app được cấu hình trong Pi Developer Portal, SQL đã chạy, Cloudflare secret đã thêm và kiểm thử bên trong Pi Browser/Sandbox.
