# KIẾN TRÚC HỆ THỐNG DULICHC​​ONDEN 3.0

## 1. Tổng quan
DuLichConDen 3.0 được phát triển kế thừa nền tảng website phiên bản 2.0. Hệ thống hướng tới mô hình du lịch sinh thái kết hợp thương mại điện tử, tin tức số, tài sản số NLD và mạng xã hội cộng đồng.

## 2. Kiến trúc tổng thể

### 2.1. Giao diện người dùng
- Website tương thích máy tính và điện thoại.
- Các trang giới thiệu du lịch, điểm đến, trải nghiệm và dịch vụ.
- Khu vực thương mại điện tử và quản lý cửa hàng.
- Khu vực tin tức số và mạng xã hội.

### 2.2. Máy chủ và API
- Cloudflare Pages: lưu trữ và phân phối website.
- Cloudflare Workers: xử lý các API và nghiệp vụ phía máy chủ khi được tích hợp.
- Các API phải kiểm tra quyền truy cập và dữ liệu đầu vào.

### 2.3. Cơ sở dữ liệu
- Supabase PostgreSQL: lưu trữ dữ liệu ứng dụng.
- Supabase Auth: xác thực tài khoản khi được tích hợp.
- Row Level Security (RLS): kiểm soát quyền đọc và ghi dữ liệu.
- Supabase Storage: lưu trữ hình ảnh và tệp khi được cấu hình.

## 3. Các mô-đun chức năng

### 3.1. Du lịch và dịch vụ
Quản lý điểm đến, bài giới thiệu, trải nghiệm, dịch vụ lưu trú, ẩm thực và chăm sóc khách hàng.

### 3.2. Thương mại điện tử
Quản lý người bán, cửa hàng, sản phẩm, giỏ hàng, đơn hàng, thanh toán và phí giao dịch.

### 3.3. Tin tức số
Quản trị viên tải ảnh tài liệu, sắp xếp nội dung, tạo bản xem trước, chỉnh sửa và duyệt trước khi xuất bản. OCR có thể được tích hợp để hỗ trợ nhận dạng chữ từ ảnh.

### 3.4. Tài sản số NLD
Nghiên cứu và thử nghiệm tài sản NLD trên Stellar Testnet. Khóa bí mật phải được bảo vệ phía máy chủ hoặc trong ví tự quản của người dùng, không lưu trong mã nguồn công khai.

### 3.5. Mạng xã hội
Hồ sơ cá nhân, kết bạn, bài viết, hình ảnh, video, bình luận, tương tác và nhắn tin giữa những người được phép kết nối.

### 3.6. Gọi thoại và video
- WebRTC cho cuộc gọi trực tiếp.
- LiveKit dự kiến phục vụ cuộc gọi nhóm.
- TURN/STUN hỗ trợ kết nối qua các loại mạng khác nhau.
- Chỉ tích hợp sau khi kiểm thử bảo mật, kết nối và chi phí vận hành.

## 4. Nguyên tắc kết nối hệ thống
- Giao tiếp giữa giao diện và máy chủ thông qua API.
- Không đưa khóa bí mật, mật khẩu hoặc thông tin nhạy cảm vào mã nguồn công khai.
- Phân quyền theo vai trò người dùng.
- Kiểm tra dữ liệu trước khi ghi vào cơ sở dữ liệu.
- Ghi nhật ký các thao tác quản trị quan trọng.

## 5. Nguyên tắc mở rộng
Các mô-đun mới được phát triển độc lập, hạn chế ảnh hưởng đến chức năng cũ. Mọi thay đổi cơ sở dữ liệu phải có migration, phương án sao lưu và kiểm thử trước khi áp dụng chính thức.

## 6. Trạng thái triển khai
Tài liệu mô tả kiến trúc mục tiêu. Các dịch vụ và chức năng nêu trên chỉ được xem là đã tích hợp sau khi có mã nguồn, cấu hình và kết quả kiểm thử xác nhận.
