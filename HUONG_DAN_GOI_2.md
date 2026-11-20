# DuLichConDen 2.0 – Gói 2: Cổng thông tin du lịch

## Tệp trong gói
- `public/index.html`: bản cập nhật trang chủ, giữ nguyên bố cục và liên kết mục Khám phá Cồn Đen tới trang riêng.
- `public/pages/tourism/index.html`: trang giới thiệu du lịch Cồn Đen, trải nghiệm và nhóm dịch vụ.

## Cách tải lên GitHub
1. Giải nén ZIP.
2. Mở repository `DuLichConDen-V2` > thư mục `public`.
3. Tải tệp `index.html` ở gói này lên thư mục `public` (GitHub sẽ báo cập nhật tệp đã tồn tại).
4. Mở `public/pages/tourism` và tải tệp `index.html` trong gói lên đó.
5. Commit các thay đổi.

## Bảo toàn mã nguồn
- Không xóa `public/css/style.css`, `public/js/app.js`, `README.md`, `404.html`, `about.html` hoặc các thư mục hiện có.
- Trang du lịch dùng CSS hiện tại và CSS bổ sung nội tuyến; không cần thay thế stylesheet hiện có.
- Đường dẫn tương đối được thiết lập để chạy từ `/pages/tourism/index.html`.

## Phạm vi
Đây là trang thông tin tĩnh có thể chạy trên Cloudflare Pages. Chưa có dữ liệu đối tác, giá, lịch tour, đặt chỗ, tài khoản, Supabase hoặc thanh toán. Chỉ công bố thông tin cụ thể sau khi xác minh.
