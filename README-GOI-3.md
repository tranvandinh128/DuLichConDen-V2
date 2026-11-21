
# DuLichConDen-V2 – GÓI 3: SÀN THƯƠNG MẠI ĐIỆN TỬ NHIỀU NGƯỜI BÁN

## 1. GIỚI THIỆU

Gói 3 là phân hệ thương mại điện tử nhiều người bán thuộc dự án DuLichConDen-V2.

Phân hệ được xây dựng nhằm kết nối khách hàng, cá nhân, hộ kinh doanh và doanh nghiệp trên cùng một nền tảng.

Mục tiêu:

- Giới thiệu và kinh doanh sản phẩm.
- Xây dựng hệ thống gian hàng nhiều người bán.
- Quản lý sản phẩm và danh mục.
- Quản lý hồ sơ đăng ký người bán.
- Quản lý đơn hàng và thanh toán.
- Hỗ trợ quản trị, kiểm duyệt và phân quyền.
- Từng bước tích hợp thanh toán và các dịch vụ mở rộng.

Tên thương hiệu hiển thị: DuLichConDen.

Tên dự án kỹ thuật: DuLichConDen-V2.

Phiên bản nền tảng đang phát triển: 3.0.

## 2. PHẠM VI CHỨC NĂNG

### 2.1. Khách hàng

- Xem danh sách gian hàng.
- Khám phá sản phẩm.
- Tìm kiếm và lọc sản phẩm.
- Xem thông tin chi tiết sản phẩm.
- Quản lý giỏ hàng.
- Tạo và theo dõi đơn hàng.
- Quản lý thông tin tài khoản.
- Đánh giá sản phẩm và gian hàng theo chức năng được triển khai.

### 2.2. Người bán

- Đăng ký tài khoản.
- Gửi hồ sơ đăng ký người bán.
- Chờ quản trị viên xét duyệt.
- Quản lý thông tin cửa hàng.
- Quản lý danh mục và sản phẩm.
- Cập nhật hình ảnh sản phẩm.
- Quản lý đơn hàng.
- Theo dõi thông tin kinh doanh theo quyền được cấp.

### 2.3. Quản trị viên

- Quản lý tài khoản người dùng.
- Xét duyệt hồ sơ người bán.
- Quản lý gian hàng.
- Xét duyệt sản phẩm.
- Quản lý danh mục.
- Theo dõi đơn hàng.
- Quản lý các chức năng quản trị theo phân quyền.

### 2.4. Hệ thống thương mại điện tử

Các thành phần dữ liệu được định hướng quản lý:

- Hồ sơ người dùng.
- Hồ sơ đăng ký người bán.
- Gian hàng.
- Danh mục sản phẩm.
- Sản phẩm và hình ảnh.
- Giỏ hàng và chi tiết giỏ hàng.
- Đơn hàng và chi tiết đơn hàng.
- Thanh toán.
- Phí giao dịch và hoa hồng.
- Đánh giá sản phẩm.

Các chức năng phải được kiểm tra theo mã nguồn và cấu trúc cơ sở dữ liệu thực tế trước khi xác nhận hoàn thành.

## 3. CẤU TRÚC THƯ MỤC LIÊN QUAN

Cấu trúc phân hệ thương mại điện tử được tổ chức theo các nhóm sau:

```text
public/
  config/
    supabase.js

  css/
    marketplace.css

  js/
    marketplace/
      supabase-client.js
      auth.js
      marketplace.js
      seller.js
      admin.js
      pi-auth.js

  pages/
    marketplace/
      index.html

    seller/
      index.html

    shop/
      index.html

    admin/
      sellers.html

functions/
  api/
    admin/
    pi-auth/

  lib/
    pi-auth.js

supabase/
  migrations/

```

Lưu ý:

- Đây là cấu trúc tham chiếu của các thành phần liên quan.
- Không tự ý tạo lại file đã tồn tại.
- Không xóa hoặc ghi đè các file đang được website sử dụng.
- Khi bổ sung chức năng mới phải kiểm tra đường dẫn API và module hiện có để tránh trùng lặp.

## 4. CÔNG NGHỆ SỬ DỤNG

| Thành phần | Công nghệ |
|---|---|
| Giao diện | HTML, CSS, JavaScript |
| API máy chủ | Cloudflare Pages Functions |
| Triển khai | Cloudflare Pages |
| Cơ sở dữ liệu | Supabase PostgreSQL |
| Xác thực | Supabase Auth |
| Lưu trữ hình ảnh | Supabase Storage |
| Quản lý mã nguồn | GitHub |
| Xác thực Pi | Pi Network SDK |

Các công nghệ mở rộng sẽ được tích hợp theo từng giai đoạn.

## 5. CƠ SỞ DỮ LIỆU

Các bảng thương mại điện tử hiện có trong dự án cần được rà soát và quản lý thống nhất.

Nhóm bảng chính:

| Bảng | Chức năng |
|---|---|
| `profiles` | Hồ sơ và vai trò người dùng |
| `seller_applications` | Hồ sơ đăng ký người bán |
| `stores` | Thông tin gian hàng |
| `categories` | Danh mục sản phẩm |
| `products` | Thông tin sản phẩm |
| `product_images` | Hình ảnh sản phẩm |
| `carts` | Giỏ hàng |
| `cart_items` | Sản phẩm trong giỏ hàng |
| `orders` | Đơn hàng |
| `order_items` | Chi tiết đơn hàng |
| `payments` | Thông tin thanh toán |
| `commissions` | Phí và hoa hồng |
| `reviews` | Đánh giá |

Danh sách trên là danh mục các bảng đã được ghi nhận trong cấu trúc dự án. Trước khi thay đổi hoặc tạo thêm bảng phải kiểm tra schema thực tế trên Supabase.

Không tạo bảng trùng tên hoặc chạy lại migration cũ một cách tùy tiện.

## 6. CẤU HÌNH SUPABASE

### 6.1. Cấu hình công khai trên giao diện

File:

`public/config/supabase.js`

Các thông tin cấu hình:

- `SUPABASE_URL`: Project URL.
- `SUPABASE_ANON_KEY` hoặc publishable key tương ứng với cấu hình hiện tại.

Chỉ sử dụng khóa công khai dành cho trình duyệt.

Tuyệt đối không đưa các khóa bí mật sau vào JavaScript công khai:

- Supabase Secret Key.
- Legacy service_role key.
- Các thông tin xác thực phía máy chủ.

### 6.2. Cấu hình phía máy chủ

Các biến môi trường được quản lý trong Cloudflare:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

Khóa bí mật chỉ được lưu trong Cloudflare Workers & Pages Environment Variables and Secrets.

Không lưu khóa bí mật trong GitHub, HTML, CSS hoặc JavaScript công khai.

## 7. BẢO MẬT VÀ PHÂN QUYỀN

### 7.1. Người mua

- Được xem các sản phẩm và gian hàng công khai.
- Chỉ được truy cập dữ liệu cá nhân của mình.
- Chỉ được thao tác với giỏ hàng và đơn hàng thuộc tài khoản của mình.

### 7.2. Người bán

- Chỉ quản lý gian hàng thuộc quyền sở hữu.
- Chỉ quản lý sản phẩm được phép thao tác.
- Không được tự phê duyệt hồ sơ của mình.
- Không được truy cập dữ liệu riêng tư của người bán khác.

### 7.3. Quản trị viên

- Có quyền quản trị theo vai trò được xác minh ở phía máy chủ.
- Được xét duyệt hồ sơ và sản phẩm theo chức năng được cấp.
- Không cấp quyền admin thông qua dữ liệu do trình duyệt tự gửi.

### 7.4. Row Level Security

Supabase RLS là lớp bảo vệ dữ liệu quan trọng.

Các nguyên tắc bắt buộc:

- Bật RLS cho các bảng cần bảo vệ.
- Xây dựng policy theo đúng vai trò.
- Kiểm tra quyền sở hữu dữ liệu.
- Không xem việc ẩn nút trên giao diện là biện pháp bảo mật.
- Kiểm tra quyền tại API máy chủ đối với thao tác quản trị.

## 8. QUẢN LÝ HÌNH ẢNH SẢN PHẨM

Hình ảnh sản phẩm được quản lý thông qua Supabase Storage.

Định hướng:

- Tách khu vực lưu ảnh chờ duyệt và ảnh công khai.
- Kiểm tra quyền tải lên.
- Kiểm tra định dạng và dung lượng file.
- Chỉ công khai hình ảnh hợp lệ sau khi được phê duyệt.
- Không cho phép người bán tùy ý truy cập hoặc xóa hình ảnh của tài khoản khác.

## 9. PHÍ GIAO DỊCH VÀ THANH TOÁN

Định hướng phát triển:

- Thanh toán COD.
- Thanh toán chuyển khoản ngân hàng.
- Nghiên cứu tích hợp thanh toán Pi Network.
- Quản lý phí giao dịch.
- Quản lý doanh thu và đối soát.

Định hướng phân bổ phí sàn đã thống nhất:

- 50% quỹ phát triển hệ thống.
- 50% quỹ hoạt động thiện nguyện.

Mức phí giao dịch dự kiến là 0,01% trên đơn hàng đủ điều kiện hoàn thành.

Việc thu phí, phân bổ và đối soát chỉ được thực hiện khi đã có quy tắc nghiệp vụ, địa chỉ nhận tiền, cơ chế xác nhận giao dịch và kiểm thử đầy đủ.

Không xem tỷ lệ phí hoặc phương án phân bổ là chức năng đã vận hành nếu chưa có triển khai thực tế.

## 10. QUY TRÌNH CÀI ĐẶT VÀ CẬP NHẬT

### Bước 1. Sao lưu

- Kiểm tra nhánh GitHub.
- Sao lưu mã nguồn.
- Kiểm tra trạng thái triển khai Production.
- Không chỉnh sửa trực tiếp nhánh `main` khi đang phát triển phiên bản mới.

### Bước 2. Phát triển mã nguồn

Nhánh phát triển hiện tại:

`feature/dulichconden-3.0`

Nguyên tắc:

- Giữ nguyên chức năng đang hoạt động.
- Kiểm tra file trước khi tạo mới.
- Thay toàn bộ nội dung file khi thực hiện yêu cầu thay thế.
- Không tạo endpoint trùng với chức năng đã có.
- Kiểm tra lỗi trước khi triển khai.

### Bước 3. Cập nhật cơ sở dữ liệu

Trước khi chạy migration:

1. Kiểm tra dự án Supabase.
2. Kiểm tra môi trường Production hay thử nghiệm.
3. Đối chiếu các bảng hiện có.
4. Kiểm tra migration và các ràng buộc.
5. Sao lưu dữ liệu cần thiết.
6. Chỉ chạy SQL sau khi đã được rà soát và phê duyệt.

Không chạy lại migration khởi tạo gói 3 nếu các bảng tương ứng đã tồn tại.

### Bước 4. Kiểm tra sau cập nhật

- Kiểm tra đăng nhập.
- Kiểm tra đăng ký người bán.
- Kiểm tra gian hàng.
- Kiểm tra sản phẩm.
- Kiểm tra quyền quản trị.
- Kiểm tra RLS.
- Kiểm tra giỏ hàng và đơn hàng.
- Kiểm tra hình ảnh.
- Kiểm tra các API liên quan.

### Bước 5. Triển khai

Chỉ triển khai lên Production sau khi kiểm thử thành công và xác nhận các chức năng quan trọng không bị ảnh hưởng.

## 11. CÁC NGUYÊN TẮC PHÁT TRIỂN PHIÊN BẢN 3.0

- Kế thừa hệ thống thương mại điện tử hiện có.
- Không xây dựng lại những chức năng đã hoạt động tốt.
- Không làm mất dữ liệu người dùng và người bán.
- Không tự ý thay đổi cấu trúc cơ sở dữ liệu Production.
- Tích hợp Pi Network theo luồng xác thực riêng.
- Phát triển tin tức số và mạng xã hội theo từng mô-đun.
- Kiểm thử từng chức năng trước khi tích hợp toàn hệ thống.

## 12. TRẠNG THÁI VÀ PHẠM VI TÀI LIỆU

Tài liệu này mô tả phân hệ thương mại điện tử nhiều người bán của dự án DuLichConDen-V2.

Đây là tài liệu kiến trúc và hướng dẫn vận hành. Nội dung mô tả chức năng không đồng nghĩa với việc tất cả chức năng đã hoàn thành hoặc đang hoạt động trên Production.

Trạng thái từng chức năng phải được xác nhận bằng mã nguồn, cấu hình, cơ sở dữ liệu và kết quả kiểm thử thực tế.

---

**Dự án:** DuLichConDen-V2

**Thương hiệu:** DuLichConDen

**Phiên bản phát triển:** 3.0

**Phân hệ:** Sàn thương mại điện tử nhiều người bán

**Cơ sở dữ liệu:** Supabase

**Nền tảng triển khai:** Cloudflare Pages & Workers

**Quản lý mã nguồn:** GitHub
