# CHÍNH SÁCH VÀ KIẾN TRÚC BẢO MẬT DULICHC​​ONDEN 3.0

## 1. Mục tiêu
Bảo vệ tài khoản, dữ liệu cá nhân, dữ liệu giao dịch, tài sản số và hoạt động quản trị của hệ thống DuLichConDen.

## 2. Bảo vệ thông tin xác thực
- Không lưu mật khẩu dạng văn bản thuần.
- Không đưa API key bí mật, khóa riêng tư hoặc mật khẩu vào GitHub.
- Không đưa thông tin bí mật vào mã JavaScript chạy trên trình duyệt.
- Sử dụng biến môi trường phía máy chủ để lưu thông tin xác thực.
- Thu hồi và thay thế khóa ngay khi nghi ngờ bị lộ.

## 3. Bảo vệ Supabase
- Bật Row Level Security (RLS) cho các bảng chứa dữ liệu người dùng.
- Chỉ cấp quyền đọc, ghi, sửa và xóa theo vai trò phù hợp.
- Người dùng chỉ được truy cập dữ liệu thuộc quyền của mình.
- Kiểm tra chính sách RLS trước khi triển khai migration.
- Không sử dụng Service Role Key ở phía trình duyệt.

## 4. Bảo vệ tài khoản
- Xác thực người dùng trước khi truy cập chức năng riêng tư.
- Phân quyền khách truy cập, thành viên, người bán và quản trị viên.
- Có cơ chế khôi phục tài khoản an toàn.
- Ghi nhật ký các hoạt động đăng nhập và thay đổi quyền quan trọng.

## 5. Bảo vệ giao dịch
- Kiểm tra trạng thái đơn hàng và thanh toán ở phía máy chủ.
- Không tin tưởng số tiền hoặc trạng thái thanh toán do trình duyệt tự gửi.
- Lưu thông tin giao dịch và giá tại thời điểm đặt hàng.
- Tính phí giao dịch bằng quy tắc thống nhất, có nhật ký đối soát.
- Không tự động coi giao dịch là hoàn tất khi chưa xác minh.

## 6. Bảo vệ tài sản số NLD
- Thử nghiệm trên Stellar Testnet trước khi xem xét Mainnet.
- Không lưu khóa bí mật của ví người dùng trên website.
- Khóa Issuing và Distribution phải được bảo vệ nghiêm ngặt.
- Giới hạn quyền phát hành token và ghi nhật ký mọi lần phát hành.
- Kiểm soát tổng lượng phát hành theo giới hạn được phê duyệt.
- Không cam kết giá trị hoặc tỷ giá NLD khi chưa có cơ sở và cơ chế bảo đảm phù hợp.

## 7. Bảo vệ mạng xã hội và cuộc gọi
- Chỉ người được cấp quyền mới xem nội dung riêng tư.
- Chỉ bạn bè mới được gửi tin nhắn hoặc khởi tạo cuộc gọi trực tiếp theo quy tắc sản phẩm.
- Người nhận phải chấp nhận trước khi kết nối cuộc gọi.
- Kiểm tra quyền tham gia phòng gọi và thời hạn của token truy cập.
- Không công khai thông tin kết nối hoặc thông tin xác thực cuộc gọi.

## 8. Bảo vệ tin tức và tệp tải lên
- Chỉ quản trị viên được phép xuất bản và ẩn bài viết.
- Kiểm tra loại tệp, dung lượng và quyền truy cập khi tải ảnh.
- Không tự động xuất bản nội dung OCR chưa được con người kiểm duyệt.
- Không cho phép tệp tải lên thực thi mã trên máy chủ.

## 9. Sao lưu và khôi phục
- Có lịch sao lưu cơ sở dữ liệu.
- Kiểm tra khả năng khôi phục từ bản sao lưu.
- Ghi nhận thay đổi cấu trúc dữ liệu bằng migration.
- Không chạy migration trên môi trường chính thức khi chưa kiểm tra và có phương án khôi phục.

## 10. Xử lý sự cố
Khi phát hiện sự cố:
1. Xác định phạm vi ảnh hưởng.
2. Tạm khóa chức năng hoặc thông tin xác thực có nguy cơ.
3. Thu hồi và thay thế khóa bị lộ.
4. Kiểm tra nhật ký và dữ liệu liên quan.
5. Khôi phục dịch vụ an toàn.
6. Lập biên bản và biện pháp phòng ngừa tái diễn.

## 11. Kiểm tra trước khi triển khai
- Kiểm tra quyền truy cập và RLS.
- Kiểm tra API và xác thực.
- Kiểm tra tệp tải lên.
- Kiểm tra giao dịch và dữ liệu.
- Kiểm tra sao lưu và khôi phục.
- Không triển khai chính thức khi còn lỗi bảo mật nghiêm trọng.

## 12. Trạng thái
Đây là tài liệu yêu cầu bảo mật cho phiên bản 3.0. Các biện pháp chỉ được xác nhận đã thực hiện sau khi cấu hình, kiểm thử và đánh giá thực tế.
