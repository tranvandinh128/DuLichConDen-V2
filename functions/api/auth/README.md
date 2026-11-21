
# DuLichConDen-V2 – API XÁC THỰC NGƯỜI DÙNG

## 1. GIỚI THIỆU

Thư mục này chứa tài liệu về hệ thống API xác thực tài khoản và quản lý phiên đăng nhập của dự án DuLichConDen-V2.

Hệ thống được thiết kế phục vụ ba nhóm người dùng chính:

- Khách hàng và người mua.
- Người bán và chủ gian hàng.
- Quản trị viên hệ thống.

Mục tiêu là xây dựng hệ thống xác thực thống nhất, an toàn và có khả năng mở rộng.

## 2. CÁC PHƯƠNG THỨC ĐĂNG NHẬP

### 2.1. Đăng nhập bằng Email

Người dùng sử dụng email và mật khẩu để đăng nhập thông qua Supabase Auth.

### 2.2. Đăng ký tài khoản

Người dùng có thể đăng ký tài khoản mới bằng email và mật khẩu.

Thông tin hồ sơ được quản lý trong cơ sở dữ liệu Supabase.

### 2.3. Đăng nhập bằng Pi Network

Hệ thống hỗ trợ xác thực danh tính bằng Pi Network.

Các API hiện có:

- `POST /api/pi-auth/login`: Xác minh Pi Access Token và hỗ trợ đăng nhập.
- `POST /api/pi-auth/link`: Liên kết tài khoản Pi với tài khoản DuLichConDen-V2 đang đăng nhập.

Quy trình xác thực:

1. Người dùng mở ứng dụng trong Pi Browser.
2. Pi SDK xác thực tài khoản và cấp Access Token.
3. Máy chủ DuLichConDen-V2 xác minh token với Pi Platform API.
4. Hệ thống kiểm tra Pi UID đã liên kết với tài khoản Supabase hay chưa.
5. Nếu hợp lệ, hệ thống cấp phiên đăng nhập Supabase.

## 3. QUẢN LÝ VAI TRÒ NGƯỜI DÙNG

Hệ thống sử dụng hồ sơ người dùng trong bảng `profiles` của Supabase để quản lý vai trò.

Các vai trò dự kiến:

- `buyer`: Khách hàng và người mua.
- `seller`: Người bán và chủ gian hàng.
- `admin`: Quản trị viên.

Việc xác định quyền truy cập phải được kiểm tra ở phía máy chủ.

Không sử dụng vai trò do trình duyệt tự gửi lên làm căn cứ cấp quyền.

## 4. CẤU TRÚC API LIÊN QUAN

### API xác thực người dùng

`functions/api/auth/`

### API quản trị

`functions/api/admin/auth/`

### API Pi Network

`functions/api/pi-auth/`

### Thư viện xác thực

`functions/lib/auth.js`

`functions/lib/pi-auth.js`

### Giao diện xác thực Pi

`public/js/marketplace/pi-auth.js`

## 5. CƠ SỞ DỮ LIỆU

Bảng hồ sơ người dùng:

`public.profiles`

Bảng liên kết tài khoản Pi:

`public.pi_accounts`

Bảng `pi_accounts` dùng để liên kết Pi UID với tài khoản Supabase.

Mỗi tài khoản DuLichConDen-V2 chỉ được liên kết với một tài khoản Pi và mỗi Pi UID chỉ được liên kết với một tài khoản DuLichConDen-V2.

## 6. CẤU HÌNH MÔI TRƯỜNG

Các biến môi trường phía máy chủ:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

Các khóa bí mật chỉ được lưu trong Cloudflare Workers & Pages Environment Variables and Secrets.

Không đưa khóa bí mật vào HTML, JavaScript công khai hoặc GitHub.

## 7. NGUYÊN TẮC BẢO MẬT

- Xác minh danh tính người dùng ở phía máy chủ.
- Kiểm tra quyền truy cập trước khi thực hiện thao tác quan trọng.
- Bật Row Level Security (RLS) cho các bảng dữ liệu cần bảo vệ.
- Không lưu mật khẩu dưới dạng văn bản thông thường.
- Không lưu Pi Wallet Passphrase hoặc khóa bí mật ví.
- Không cho phép một Pi UID liên kết với nhiều tài khoản.
- Không tiết lộ Supabase Secret Key cho trình duyệt.
- Không tự động cấp quyền quản trị cho tài khoản mới.

## 8. TRẠNG THÁI TRIỂN KHAI

Tài liệu này mô tả kiến trúc và các thành phần xác thực của DuLichConDen-V2.

Các chức năng sẽ được kiểm tra, hoàn thiện và thử nghiệm theo từng giai đoạn.

Việc đăng nhập Pi Network chỉ được xác nhận hoàn tất sau khi:

1. Cấu hình Supabase đầy đủ.
2. Tạo và kiểm tra bảng `pi_accounts`.
3. Cấu hình Cloudflare Secrets.
4. Kiểm tra Pi Developer Portal.
5. Thử nghiệm đăng nhập và liên kết trong Pi Browser hoặc Pi Sandbox.

---

**Dự án:** DuLichConDen-V2

**Phiên bản phát triển:** 3.0

**Hệ thống cơ sở dữ liệu:** Supabase

**Nền tảng triển khai:** Cloudflare Pages & Workers

**Mạng xác thực:** Pi Network
