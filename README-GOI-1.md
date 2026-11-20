# DuLichConDen 2.0 – Gói 1: Trang chủ

## Nội dung
- `public/index.html`: trang chủ kết hợp giới thiệu du lịch và gian hàng.
- `public/css/style.css`: giao diện responsive cho máy tính và điện thoại.
- `public/js/app.js`: menu di động, tìm kiếm/lọc thẻ danh mục mẫu và thông báo tương tác.

## Cách cập nhật GitHub
1. Giải nén ZIP.
2. Trong repository `DuLichConDen-V2`, mở `public/`.
3. Tải `index.html` vào `public/`.
4. Tải thư mục `css` và `js` vào `public/` để hợp nhất với thư mục hiện có.
5. Không xóa `admin/`, `assets/`, `pages/`, `services/`, `404.html` hoặc `about.html`.
6. Commit các tệp mới/cập nhật lên nhánh `main`.

## Lưu ý trước khi phát hành
- Các thẻ gian hàng hiện là nội dung minh họa, chưa kết nối Supabase và chưa tạo đơn hàng thật.
- Nút “Quan tâm” chỉ tăng bộ đếm minh họa; không phải giỏ hàng/đơn đặt hàng thực tế.
- Hình nền dùng ảnh từ Unsplash qua URL bên ngoài; cần có Internet để hiển thị.
- Chưa có tích hợp COD, chuyển khoản tự động hoặc Pi SDK.
- Kiểm tra cấu hình Cloudflare Pages để bảo đảm thư mục gốc triển khai là `public`.
