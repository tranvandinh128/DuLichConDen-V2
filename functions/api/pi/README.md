
# API Pi Network

Các endpoint phía máy chủ dùng để xác minh danh tính Pi Network và hỗ trợ đăng nhập, liên kết tài khoản Pi với DuLichConDen.

## Các endpoint

### Đăng nhập bằng Pi

`POST /api/pi/login`

- Nhận Pi Access Token.
- Xác minh token với Pi Platform API.
- Kiểm tra UID Pi đã liên kết trong Supabase.
- Tạo mã đăng nhập một lần cho tài khoản Supabase.

### Liên kết tài khoản Pi

`POST /api/pi/link`

- Yêu cầu người dùng đã đăng nhập DuLichConDen.
- Xác minh phiên Supabase.
- Xác minh Pi Access Token.
- Lưu liên kết Pi UID với tài khoản DuLichConDen.

## Bảo mật

- Không đưa Pi Access Token hoặc Supabase Secret Key vào mã giao diện.
- Chỉ lưu Pi UID và tên người dùng Pi trong cơ sở dữ liệu.
- Không lưu Pi Wallet Passphrase hoặc khóa bí mật ví.
- Chỉ xử lý yêu cầu xác thực ở phía máy chủ.

## Cấu hình Cloudflare

Các biến môi trường cần có:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

Không ghi giá trị bí mật vào README hoặc GitHub.
