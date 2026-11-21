
# DuLichConDen-V2
## Nền tảng du lịch sinh thái – Thương mại điện tử – Cộng đồng số

**Tên thương hiệu:** DuLichConDen

**Tên dự án:** DuLichConDen-V2

**Phiên bản nền tảng đang phát triển:** 3.0

**Repository:** tranvandinh128/DuLichConDen-V2

---

## 1. GIỚI THIỆU DỰ ÁN

DuLichConDen-V2 là dự án xây dựng nền tảng số phục vụ du lịch sinh thái Cồn Đen, kết hợp quảng bá điểm đến, cung cấp dịch vụ du lịch, thương mại điện tử nhiều người bán và kết nối cộng đồng.

Dự án hướng tới xây dựng một hệ sinh thái số có khả năng mở rộng, hỗ trợ người dân, hộ kinh doanh, doanh nghiệp và khách du lịch cùng tham gia.

Định hướng phát triển:

**Khám phá thiên nhiên – Kết nối trải nghiệm – Lan tỏa giá trị xanh.**

## 2. MỤC TIÊU PHÁT TRIỂN

- Quảng bá du lịch sinh thái Cồn Đen.
- Giới thiệu điểm đến, trải nghiệm và dịch vụ du lịch.
- Kết nối khách du lịch với cơ sở lưu trú, ẩm thực và các đơn vị cung cấp dịch vụ.
- Xây dựng sàn thương mại điện tử nhiều người bán.
- Hỗ trợ người dân và doanh nghiệp giới thiệu, kinh doanh sản phẩm.
- Phát triển hệ thống tin tức số và truyền thông cộng đồng.
- Nghiên cứu ứng dụng tài sản số NLD.
- Phát triển mạng xã hội và các tính năng kết nối người dùng.

## 3. CÁC PHÂN HỆ CHỨC NĂNG

### 3.1. Du lịch và khám phá

- Giới thiệu Cồn Đen.
- Thông tin điểm đến.
- Trải nghiệm du lịch sinh thái.
- Thư viện hình ảnh và video.
- Tin tức và sự kiện du lịch.
- Hướng dẫn tham quan.

### 3.2. Dịch vụ du lịch

- Dịch vụ khách sạn và lưu trú.
- Dịch vụ ẩm thực.
- Dịch vụ chăm sóc sức khỏe.
- Chăm sóc khách hàng 24/7.
- Các dịch vụ hỗ trợ khách du lịch.

### 3.3. Sàn thương mại điện tử

- Đăng ký tài khoản khách hàng.
- Đăng ký người bán.
- Quản lý gian hàng.
- Quản lý danh mục và sản phẩm.
- Giỏ hàng và đơn hàng.
- Quản lý thanh toán.
- Quản lý phí giao dịch.
- Hệ thống quản trị và phê duyệt người bán, sản phẩm.

Mô hình định hướng: nhiều người bán cùng tham gia trên một nền tảng.

### 3.4. Tin tức số

- Quản trị viên tạo và quản lý tin tức.
- Tải lên một hoặc nhiều hình ảnh.
- Hỗ trợ nhận dạng văn bản từ hình ảnh khi tích hợp OCR.
- Biên tập và xem trước bài viết.
- Lưu bản nháp và xuất bản.
- Quản lý danh mục và thư viện ảnh.

Nội dung nhận dạng tự động phải được kiểm tra trước khi xuất bản.

### 3.5. Tài sản số NLD

Nghiên cứu và thử nghiệm tài sản số NLD trên Stellar Testnet.

Các định hướng:

- Quản lý thông tin tài sản NLD.
- Nghiên cứu cơ chế khai thác.
- Quản lý giới hạn tổng cung.
- Hỗ trợ liên kết ví tự quản.
- Kiểm tra giao dịch và phân phối token.

Chưa xem NLD là tài sản đã phát hành chính thức trên Mainnet.

### 3.6. Mạng xã hội cộng đồng

Định hướng phát triển:

- Hồ sơ cá nhân.
- Tìm kiếm và kết bạn.
- Bài viết, hình ảnh và video.
- Bình luận và tương tác.
- Tin nhắn trực tiếp.
- Cuộc gọi thoại và video.
- Cuộc gọi cá nhân và nhóm.

Các chức năng được triển khai theo từng giai đoạn và có kiểm soát quyền riêng tư.

## 4. CÔNG NGHỆ SỬ DỤNG

| Thành phần | Công nghệ |
|---|---|
| Giao diện | HTML, CSS, JavaScript |
| Lưu trữ và triển khai | Cloudflare Pages |
| API phía máy chủ | Cloudflare Workers / Pages Functions |
| Cơ sở dữ liệu | Supabase PostgreSQL |
| Xác thực | Supabase Auth |
| Lưu trữ hình ảnh | Supabase Storage |
| Quản lý mã nguồn | GitHub |
| Tài sản số NLD | Stellar |
| Xác thực Pi | Pi Network SDK |
| Gọi video nhóm | LiveKit (dự kiến tích hợp) |
| Kết nối WebRTC | STUN/TURN |

Việc sử dụng từng công nghệ phụ thuộc vào giai đoạn tích hợp và kiểm thử thực tế.

## 5. KIẾN TRÚC VÀ QUẢN LÝ DỮ LIỆU

Hệ thống được tổ chức theo mô hình:

- Giao diện người dùng.
- API và xử lý nghiệp vụ phía máy chủ.
- Cơ sở dữ liệu tập trung.
- Dịch vụ lưu trữ tệp.
- Các dịch vụ tích hợp bên ngoài.

Nguyên tắc triển khai:

- Phân quyền theo vai trò người dùng.
- Bảo vệ dữ liệu bằng Supabase RLS.
- Kiểm tra dữ liệu đầu vào tại máy chủ.
- Không đưa khóa bí mật vào mã nguồn công khai.
- Sử dụng migration khi thay đổi cấu trúc cơ sở dữ liệu.
- Có phương án sao lưu và khôi phục.

## 6. CÁC NHÓM TÀI KHOẢN

Hệ thống định hướng phục vụ:

- Khách hàng và người mua.
- Người bán và chủ gian hàng.
- Quản trị viên.
- Thành viên cộng đồng.

Mỗi nhóm tài khoản có quyền truy cập và chức năng phù hợp.

## 7. LỘ TRÌNH PHÁT TRIỂN PHIÊN BẢN 3.0

### Giai đoạn 1: Hoàn thiện nền tảng

- Rà soát mã nguồn phiên bản 2.0.
- Kiểm tra cơ sở dữ liệu.
- Chuẩn hóa xác thực và phân quyền.
- Hoàn thiện cấu hình triển khai.

### Giai đoạn 2: Tin tức số

- Quản lý bài viết.
- Tải ảnh và xử lý nội dung.
- Biên tập, xem trước và xuất bản.

### Giai đoạn 3: Tài sản số NLD

- Hoàn thiện thiết kế.
- Kiểm thử Stellar Testnet.
- Kiểm soát phát hành và tổng cung.

### Giai đoạn 4: Mạng xã hội

- Hồ sơ và kết bạn.
- Bài viết và tương tác.
- Nhắn tin.
- Gọi thoại và video.

### Giai đoạn 5: Tích hợp và kiểm thử

- Kiểm tra toàn bộ hệ thống.
- Kiểm thử bảo mật.
- Kiểm thử trên điện thoại và máy tính.
- Đánh giá hiệu năng.
- Chuẩn bị triển khai chính thức.

## 8. NGUYÊN TẮC PHÁT TRIỂN

- Kế thừa và bảo toàn chức năng đang hoạt động của phiên bản 2.0.
- Phát triển phiên bản 3.0 trên nhánh riêng.
- Không tự ý ghi đè dữ liệu sản xuất.
- Không chạy SQL trên Production khi chưa kiểm tra.
- Không công khai thông tin xác thực và khóa bí mật.
- Kiểm thử từng chức năng trước khi tích hợp.
- Chỉ đưa tính năng vào sử dụng sau khi hoàn thành kiểm thử.

## 9. CẤU TRÚC TÀI LIỆU

| Tài liệu | Nội dung |
|---|---|
| `docs-v3/01-LO-TRINH.md` | Lộ trình phát triển |
| `docs-v3/02-KIEN-TRUC.md` | Kiến trúc hệ thống |
| `docs-v3/03-BAO-MAT.md` | Chính sách bảo mật |
| `docs-v3/04-THONG-SO-NLD.md` | Thông số NLD |
| `docs-v3/05-TIN-TUC-SO.md` | Đặc tả tin tức số |

## 10. THÔNG TIN DỰ ÁN

- Tên dự án: DuLichConDen-V2
- Thương hiệu: DuLichConDen
- Phiên bản nền tảng: 3.0
- Chủ sở hữu repository: tranvandinh128
- Nhánh phát triển: feature/dulichconden-3.0
- Nền tảng triển khai: Cloudflare Pages
- Cơ sở dữ liệu: Supabase

## 11. TRẠNG THÁI DỰ ÁN

Phiên bản 3.0 đang trong quá trình rà soát, hoàn thiện và tích hợp các mô-đun mới.

Các nội dung trong tài liệu này là mục tiêu và định hướng phát triển. Một tính năng chỉ được xác nhận hoàn thành sau khi có mã nguồn, cấu hình và kết quả kiểm thử thực tế.

---

**DuLichConDen – Khám phá thiên nhiên, kết nối trải nghiệm và phát triển hệ sinh thái du lịch xanh.**
