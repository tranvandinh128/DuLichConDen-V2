
# API xác thực người dùng DuLichConDen

## 1. Mục đích

Thư mục này dành cho các API phục vụ xác thực tài khoản và quản lý phiên đăng nhập của người dùng trên website DuLichConDen.

Hệ thống hướng tới việc hỗ trợ các nhóm tài khoản:

- Khách hàng và người mua.
- Người bán và chủ gian hàng.
- Quản trị viên.

## 2. Các phương thức xác thực

### Đăng nhập bằng email

Người dùng sử dụng email và mật khẩu để đăng nhập thông qua Supabase Auth.

### Đăng ký tài khoản

Người dùng tạo tài khoản mới bằng email và mật khẩu. Thông tin hồ sơ được quản lý theo cấu trúc dữ liệu của hệ thống.

### Đăng nhập bằng Pi Network

Đăng nhập Pi được xử lý tại các endpoint riêng:

- `POST /api/pi-auth/login`: xác minh Pi Access Token và hỗ trợ đăng nhập.
- `POST /api/pi-auth/link`: liên kết tài khoản Pi với tài khoản DuLichConDen đang đăng nhập.

Không lưu Pi Wallet Passphrase hoặc khóa bí mật ví.

## 3. Nguyên tắc bảo mật

- Xác minh phiên đăng nhập ở phía máy chủ khi xử lý dữ liệu cần bảo vệ.
- Không tin tưởng vai trò tài khoản do trình duyệt tự gửi lên.
- Phân quyền dựa trên dữ liệu hồ sơ trong Supabase.
- Bảo vệ các API quản trị bằng quyền admin.
- Không đưa Supabase Secret Key vào mã JavaScript công khai.
- Không lưu mật khẩu dưới dạng văn bản thông thường.

## 4. Cấu hình hệ thống

Các biến môi trường phía máy chủ:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

Không ghi giá trị thực của các khóa bí mật vào README hoặc mã nguồn công khai.

## 5. Trạng thái triển khai

Tài liệu này mô tả kiến trúc và nguyên tắc xác thực.

Các endpoint xác thực dùng chung trong thư mục này sẽ được bổ sung theo từng giai đoạn sau khi rà soát mã nguồn hiện tại.

Không tạo endpoint trùng với các chức năng đã có trong `functions/api/admin/auth/` và `functions/api/pi-auth/`.
