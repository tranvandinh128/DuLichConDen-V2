
# DuLichConDen-V2 – TÍCH HỢP ĐĂNG NHẬP PI NETWORK

## 1. GIỚI THIỆU

Tài liệu mô tả kiến trúc, cấu hình và quy trình tích hợp đăng nhập Pi Network vào dự án DuLichConDen-V2.

Mục tiêu là cho phép người dùng liên kết tài khoản Pi Network với tài khoản DuLichConDen-V2 hiện có và sử dụng Pi Network để đăng nhập ở những lần tiếp theo.

Hệ thống sử dụng:

- Pi Network SDK.
- Pi Platform API.
- Cloudflare Pages Functions.
- Supabase Auth.
- Supabase PostgreSQL.

## 2. CƠ CHẾ HOẠT ĐỘNG

### 2.1. Liên kết tài khoản Pi

1. Người dùng đăng nhập DuLichConDen-V2 bằng email và mật khẩu.
2. Người dùng mở chức năng Liên kết tài khoản Pi Network.
3. Pi SDK xác thực người dùng trong Pi Browser hoặc Pi Sandbox.
4. Pi SDK trả về Pi Access Token.
5. Cloudflare Function gửi token đến Pi Platform API `/v2/me` để xác minh danh tính.
6. Máy chủ nhận Pi UID và username đã được Pi xác thực.
7. Hệ thống lưu mối liên kết giữa Pi UID và Supabase User ID trong bảng `public.pi_accounts`.

### 2.2. Đăng nhập bằng Pi Network

1. Người dùng mở DuLichConDen-V2 trong Pi Browser.
2. Người dùng chọn Đăng nhập bằng Pi Network.
3. Pi SDK xác thực và cấp Pi Access Token.
4. Cloudflare Function xác minh token với Pi Platform API.
5. Máy chủ tìm Pi UID trong bảng `public.pi_accounts`.
6. Nếu tài khoản đã liên kết, máy chủ tạo Supabase Magic Link một lần.
7. Giao diện sử dụng `token_hash` để xác thực với Supabase Auth.
8. Supabase tạo phiên đăng nhập cho đúng tài khoản đã liên kết.

Người dùng tiếp tục sử dụng tài khoản Supabase hiện có, không tạo tài khoản hoặc gian hàng mới trong quá trình đăng nhập Pi.

### 2.3. Nguyên tắc liên kết một-một

- Một tài khoản DuLichConDen-V2 chỉ được liên kết với một Pi UID.
- Một Pi UID chỉ được liên kết với một tài khoản DuLichConDen-V2.
- Không cho phép liên kết Pi UID đã thuộc tài khoản khác.
- Không cho phép tự ý thay đổi Pi UID đã liên kết.

Pi UID và username do trình duyệt gửi lên không được xem là dữ liệu xác thực. Máy chủ phải xác minh Pi Access Token trực tiếp với Pi Platform API.

## 3. CẤU TRÚC FILE LIÊN QUAN

### 3.1. Giao diện Pi Network

`public/js/marketplace/pi-auth.js`

Chức năng:

- Khởi tạo Pi SDK.
- Xác thực tài khoản Pi.
- Gửi Access Token đến máy chủ.
- Thực hiện đăng nhập Pi.
- Liên kết tài khoản Pi với phiên Supabase hiện tại.

### 3.2. Thư viện xác thực phía máy chủ

`functions/lib/pi-auth.js`

Chức năng:

- Xác minh Pi Access Token.
- Xác minh phiên Supabase.
- Tra cứu tài khoản Pi đã liên kết.
- Lưu thông tin liên kết Pi.
- Tạo Supabase Magic Link.
- Xử lý lỗi xác thực.

### 3.3. API đăng nhập Pi

`functions/api/pi-auth/login.js`

Endpoint:

`POST /api/pi-auth/login`

Chức năng:

- Nhận Pi Access Token.
- Xác minh danh tính Pi.
- Tìm tài khoản Pi đã liên kết.
- Tạo mã đăng nhập Supabase một lần.

### 3.4. API liên kết Pi

`functions/api/pi-auth/link.js`

Endpoint:

`POST /api/pi-auth/link`

Chức năng:

- Kiểm tra phiên Supabase hiện tại.
- Xác minh Pi Access Token.
- Kiểm tra trùng lặp tài khoản.
- Lưu liên kết Pi UID với Supabase User ID.

### 3.5. Migration cơ sở dữ liệu

`supabase/migrations/20261121_create_pi_accounts.sql`

Tạo bảng:

`public.pi_accounts`

Bảng này lưu:

- `id`
- `user_id`
- `pi_uid`
- `pi_username`
- `created_at`
- `updated_at`

Các ràng buộc UNIQUE bảo đảm một-một giữa tài khoản Supabase và Pi UID.

## 4. CẤU HÌNH SUPABASE

### 4.1. Tạo bảng pi_accounts

Mở Supabase Dashboard của dự án DuLichConDen-V2.

Thực hiện:

1. Chọn SQL Editor.
2. Chọn New query.
3. Mở file `supabase/migrations/20261121_create_pi_accounts.sql`.
4. Sao chép toàn bộ nội dung SQL.
5. Dán vào SQL Editor.
6. Kiểm tra kỹ dự án và môi trường đang sử dụng.
7. Chỉ nhấn Run sau khi đã sao lưu và xác nhận migration phù hợp.

Sau khi chạy thành công, kiểm tra bảng `public.pi_accounts` trong Table Editor.

Lưu ý: Không chạy migration trên Production khi chưa kiểm tra và phê duyệt.

### 4.2. Quyền truy cập

Bảng `pi_accounts` bật Row Level Security (RLS).

Theo migration hiện tại:

- `anon` và `authenticated` không được truy cập trực tiếp bảng.
- Quyền truy cập dữ liệu liên kết được thực hiện qua máy chủ có thẩm quyền.
- Không cung cấp khóa máy chủ cho trình duyệt.

## 5. CẤU HÌNH CLOUDFLARE

Mở:

Cloudflare Dashboard → Workers & Pages → `dulichconden-v2` → Settings → Variables and Secrets.

Các biến môi trường cần có:

| Tên biến | Mục đích |
|---|---|
| `SUPABASE_URL` | Địa chỉ dự án Supabase |
| `SUPABASE_SECRET_KEY` | Khóa bí mật phía máy chủ |

Yêu cầu đối với `SUPABASE_SECRET_KEY`:

- Sử dụng Secret Key mới có tiền tố `sb_secret_`.
- Chỉ lưu trong Cloudflare dưới dạng Secret.
- Không đưa vào GitHub.
- Không đưa vào HTML hoặc JavaScript công khai.
- Không gửi giá trị khóa qua ảnh chụp hoặc tin nhắn.

Mã nguồn `functions/lib/pi-auth.js` hiện sử dụng `SUPABASE_SECRET_KEY` qua header `apikey`.

Không cần tạo thêm biến `SUPABASE_SERVICE_ROLE_KEY` theo cấu hình mã nguồn hiện tại.

Không gửi `sb_secret_` dưới dạng Bearer JWT. Khi xác minh phiên người dùng, header Bearer phải chứa access token phiên Supabase của chính người dùng.

Sau khi thay đổi cấu hình môi trường, cần triển khai lại và kiểm tra trên môi trường thử nghiệm trước.

## 6. CẤU HÌNH PI DEVELOPER PORTAL

1. Mở Pi Developer Portal.
2. Kiểm tra ứng dụng DuLichConDen-V2.
3. Khai báo đúng domain triển khai.
4. Kiểm tra cấu hình Pi SDK.
5. Kiểm tra môi trường Sandbox/Testnet.
6. Chỉ chuyển sang Mainnet sau khi đã hoàn thành kiểm thử và được phê duyệt.

Trong mã giao diện, chế độ Sandbox được xác định bằng thuộc tính:

`data-pi-sandbox="true"`

Không tự ý chuyển sang `false` khi chưa kiểm tra cấu hình ứng dụng Mainnet.

Pi SDK cần được kiểm thử trong Pi Browser hoặc môi trường Pi Sandbox phù hợp. Không dùng kết quả trên Chrome thông thường để kết luận toàn bộ luồng Pi đăng nhập đã hoạt động.

## 7. PHÂN QUYỀN TÀI KHOẢN

Định hướng sử dụng Pi Network cho các nhóm tài khoản:

- Khách hàng và người mua.
- Người bán và chủ gian hàng.
- Quản trị viên.

Tài khoản Pi phải được liên kết với tài khoản Supabase hiện có.

Việc đăng nhập Pi không được tự động cấp quyền seller hoặc admin.

Vai trò người dùng tiếp tục được kiểm soát bằng hồ sơ và chính sách phân quyền của hệ thống.

Lưu ý: Mã giao diện Pi hiện tại được tích hợp tại khu vực người bán. Muốn hỗ trợ đầy đủ các nhóm tài khoản, cần tích hợp và kiểm thử thêm giao diện đăng nhập ở từng khu vực phù hợp.

## 8. QUY TRÌNH KIỂM THỬ

Chỉ tiến hành kiểm thử khi đã hoàn thiện mã nguồn, cấu hình và cơ sở dữ liệu.

### Bước 1: Kiểm tra cấu hình

- Kiểm tra `SUPABASE_URL`.
- Kiểm tra `SUPABASE_SECRET_KEY`.
- Kiểm tra Pi Developer Portal.
- Kiểm tra domain triển khai.

### Bước 2: Kiểm tra cơ sở dữ liệu

- Kiểm tra bảng `public.pi_accounts`.
- Kiểm tra các ràng buộc UNIQUE.
- Kiểm tra RLS.
- Kiểm tra quyền truy cập phía máy chủ.

### Bước 3: Kiểm tra liên kết Pi

- Mở website trong Pi Browser hoặc Pi Sandbox.
- Đăng nhập bằng email và mật khẩu.
- Chọn Liên kết tài khoản Pi Network.
- Xác nhận quyền username.
- Kiểm tra thông báo liên kết thành công.
- Kiểm tra dữ liệu trong `public.pi_accounts`.

### Bước 4: Kiểm tra đăng nhập Pi

- Đăng xuất khỏi DuLichConDen-V2.
- Chọn Đăng nhập bằng Pi Network.
- Xác nhận tài khoản trong Pi Browser.
- Kiểm tra Supabase session.
- Kiểm tra đúng tài khoản cũ được đăng nhập.

### Bước 5: Kiểm tra bảo mật

- Thử liên kết một Pi UID với hai tài khoản khác nhau.
- Thử liên kết hai Pi UID với cùng một tài khoản.
- Thử đăng nhập bằng Pi UID chưa liên kết.
- Thử dùng Pi Access Token không hợp lệ.
- Kiểm tra người dùng không thể tự nâng quyền thành admin.

## 9. NGUYÊN TẮC BẢO MẬT

- Không lưu Pi Wallet Passphrase.
- Không lưu khóa bí mật ví người dùng.
- Không tin tưởng Pi UID do trình duyệt tự gửi.
- Không đưa Supabase Secret Key xuống frontend.
- Không trả về thông tin nhạy cảm trong thông báo lỗi.
- Không tự động cấp quyền quản trị.
- Kiểm tra phiên Supabase trước khi liên kết tài khoản.
- Bảo vệ mã Magic Link một lần và không lưu trữ công khai.

Pi Network login chỉ phục vụ xác thực tài khoản. Quy trình thanh toán Pi sẽ được tích hợp riêng và phải có cơ chế xác minh giao dịch độc lập.

## 10. TRẠNG THÁI TRIỂN KHAI

Các file mã nguồn xác thực Pi đã được bổ sung vào nhánh phát triển `feature/dulichconden-3.0`.

Tuy nhiên, chức năng chỉ được xác nhận hoàn thành sau khi:

1. Migration được kiểm tra và chạy thành công trên môi trường phù hợp.
2. Cloudflare Secrets được cấu hình đúng.
3. Pi Developer Portal được cấu hình.
4. Giao diện được tích hợp đầy đủ.
5. Đăng nhập và liên kết được kiểm thử thực tế.
6. Các trường hợp lỗi và bảo mật được kiểm tra.

Không xem chức năng Pi Login là hoàn tất chỉ dựa trên việc đã tạo file mã nguồn.

---

**Dự án:** DuLichConDen-V2

**Thương hiệu:** DuLichConDen

**Phiên bản phát triển:** 3.0

**Mạng xác thực:** Pi Network

**Cơ sở dữ liệu:** Supabase

**Nền tảng triển khai:** Cloudflare Pages & Workers
