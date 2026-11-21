# THÔNG SỐ THIẾT KẾ TÀI SẢN SỐ NLD

## 1. Mục tiêu
NLD là tài sản số được nghiên cứu và thử nghiệm trong hệ sinh thái DuLichConDen. Giai đoạn đầu triển khai trên Stellar Testnet, chưa phát hành Mainnet.

## 2. Thông số cơ bản đã thống nhất

| Thông số | Giá trị |
|---|---|
| Tên tài sản | NLD |
| Tổng cung tối đa mục tiêu | 1.000.000 NLD |
| Mạng thử nghiệm | Stellar Testnet |
| Thời lượng một phiên khai thác | 24 giờ |
| Tốc độ khởi điểm | 0,0314 NLD/giờ |
| Sản lượng khởi điểm mỗi phiên | 0,7536 NLD |
| Mô hình ví người dùng | Ví tự quản lý khóa riêng |

## 3. Cơ chế khai thác
- Người dùng tham gia phiên khai thác theo chu kỳ 24 giờ.
- Tốc độ khởi điểm là 0,0314 NLD mỗi giờ.
- Sản lượng lý thuyết của một phiên đủ 24 giờ là 0,7536 NLD.
- Tốc độ khai thác giảm theo các giai đoạn đã được phê duyệt.
- Mỗi tài khoản phải được xác thực và kiểm tra điều kiện trước khi ghi nhận sản lượng.
- Hệ thống phải ngăn chặn ghi nhận trùng hoặc khai thác vượt quy tắc.

## 4. Cơ chế giới hạn tổng cung
- Mục tiêu tổng cung tối đa là 1.000.000 NLD.
- Phải kiểm tra lượng đã phát hành trước mỗi lần cấp phát.
- Không cấp phát vượt phần cung còn lại.
- Khi đạt giới hạn, dừng khai thác và phát hành mới.
- Việc thực thi giới hạn phải được kiểm soát ở phía máy chủ và quy trình phát hành Stellar.

## 5. Ví và bảo mật
- Người dùng tự quản lý ví và khóa bí mật.
- Website chỉ lưu thông tin công khai cần thiết như địa chỉ ví.
- Không yêu cầu người dùng cung cấp secret key.
- Khóa Issuing và Distribution phải được bảo vệ phía máy chủ hoặc môi trường quản lý bí mật an toàn.
- Kiểm thử Trustline và giao dịch trên Stellar Testnet trước khi xem xét Mainnet.

## 6. Cấu trúc tài khoản thử nghiệm
Dự kiến sử dụng ba tài khoản:
1. Issuing Account: tài khoản phát hành NLD.
2. Distribution Account: tài khoản phân phối NLD.
3. Personal Test Wallet: ví cá nhân dùng để thử nghiệm nhận và gửi NLD.

Các tài khoản trên chỉ phục vụ thử nghiệm; không công khai khóa bí mật.

## 7. Cơ chế giảm tốc độ khai thác
Tốc độ khai thác dự kiến giảm theo từng giai đoạn. Các ngưỡng chuyển giai đoạn và tỷ lệ giảm chưa được chốt.

Không tự ý đặt ngưỡng, tỷ lệ hoặc thời điểm giảm khi chưa có quyết định chính thức.

## 8. Định hướng giá trị và trao đổi
Ý tưởng định hướng ban đầu: 1.000.000 NLD tương ứng 100 Pi.

Đây chỉ là ý tưởng tham khảo, không phải tỷ giá thị trường, cam kết quy đổi, bảo đảm giá trị hay tỷ giá cố định. Mọi hoạt động trao đổi trong tương lai cần có cơ chế dự trữ, thanh khoản, thẩm định pháp lý và công bố minh bạch.

## 9. Các nội dung chờ quyết định
- Ngưỡng NLD của từng giai đoạn khai thác.
- Tỷ lệ giảm tốc độ qua mỗi giai đoạn.
- Thời điểm áp dụng từng giai đoạn.
- Quy tắc xử lý phiên khai thác bị gián đoạn.
- Quy trình kiểm toán và đối soát sản lượng.
- Điều kiện chuyển từ Testnet sang Mainnet.

## 10. Điều kiện trước khi triển khai thực tế
- Kiểm thử phát hành và phân phối trên Testnet.
- Kiểm thử Trustline và giao dịch.
- Kiểm tra giới hạn tổng cung.
- Kiểm tra bảo mật khóa phát hành.
- Công bố rõ quy tắc khai thác và rủi ro cho người dùng.

## 11. Trạng thái
Đây là tài liệu thông số thiết kế. NLD chưa được xác nhận phát hành Mainnet. Các nội dung đang chờ quyết định không được tự động coi là quy tắc đã triển khai.
