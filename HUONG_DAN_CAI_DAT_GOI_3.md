
# DuLichConDen-V2 – HƯỚNG DẪN CÀI ĐẶT VÀ VẬN HÀNH GÓI 3

## 1. GIỚI THIỆU

Gói 3 là phân hệ sàn thương mại điện tử nhiều người bán của dự án DuLichConDen-V2.

Tài liệu này hướng dẫn kiểm tra mã nguồn, cấu hình Supabase, quản lý tài khoản, phân quyền và kiểm thử hệ thống.

Tên thương hiệu: DuLichConDen.

Tên dự án: DuLichConDen-V2.

Phiên bản phát triển: 3.0.

Repository:

`tranvandinh128/DuLichConDen-V2`

Nhánh phát triển:

`feature/dulichconden-3.0`

## 2. NGUYÊN TẮC TRƯỚC KHI CÀI ĐẶT

Trước khi thực hiện bất kỳ thay đổi nào:

1. Kiểm tra đúng repository DuLichConDen-V2.
2. Kiểm tra đang làm việc trên nhánh `feature/dulichconden-3.0`.
3. Kiểm tra file đã tồn tại hay chưa.
4. Không tạo file trùng chức năng.
5. Không ghi đè các file đang hoạt động nếu chưa kiểm tra.
6. Không chạy lại SQL cũ trên Production.
7. Sao lưu dữ liệu quan trọng trước khi thay đổi cấu trúc cơ sở dữ liệu.

Mọi chức năng mới phải được kiểm tra trước khi tích hợp vào website đang hoạt động.

## 3. CẤU TRÚC MÃ NGUỒN

Các thành phần thương mại điện tử chính:

### 3.1. Cấu hình Supabase

`config/supabase.js`

File chứa:

- Supabase Project URL.
- Supabase publishable key.

Chỉ sử dụng khóa công khai dành cho trình duyệt.

Không đưa Supabase Secret Key hoặc legacy service_role key vào file này.

### 3.2. Supabase Client

`public/js/marketplace/supabase-client.js`

Chức năng:

- Tải Supabase JavaScript SDK phiên bản 2.
- Đọc cấu hình từ `config/supabase.js`.
- Khởi tạo Supabase Client.
- Quản lý phiên đăng nhập.
- Kiểm tra trạng thái cấu hình.

Không tự tạo thêm Supabase Client khác nếu chưa kiểm tra kiến trúc hiện tại.

### 3.3. Xác thực người dùng

`public/js/marketplace/auth.js`

Chức năng:

- Lấy người dùng hiện tại.
- Đăng nhập bằng email và mật khẩu.
- Đăng ký tài khoản.
- Đăng xuất.
- Kiểm tra phiên Supabase.

### 3.4. Quản lý người bán

`public/js/marketplace/seller.js`

Chức năng:

- Kiểm tra tài khoản người bán.
- Đọc hồ sơ đăng ký.
- Quản lý gian hàng.
- Tạo sản phẩm.
- Tải ảnh sản phẩm vào khu vực chờ duyệt.
- Theo dõi trạng thái sản phẩm.

### 3.5. Quản trị viên

`public/js/marketplace/admin.js`

Chức năng:

- Tải danh sách hồ sơ người bán chờ duyệt.
- Tải danh sách gian hàng chờ duyệt.
- Tải danh sách sản phẩm chờ duyệt.
- Gửi yêu cầu duyệt hoặc từ chối sản phẩm đến API máy chủ.
- Kiểm tra quyền quản trị.

### 3.6. Trang khám phá sản phẩm

`public/js/marketplace/marketplace.js`

Chức năng:

- Hiển thị gian hàng đã được duyệt.
- Hiển thị sản phẩm đang hoạt động.
- Tìm kiếm sản phẩm.
- Hiển thị thông tin giá và gian hàng.

### 3.7. Trang người bán

`public/pages/seller/index.html`

Đây là khu vực người bán đăng nhập, gửi hồ sơ, quản lý gian hàng và sản phẩm theo chức năng hiện có.

Không thay thế trang này bằng bản cũ khi chưa kiểm tra các chức năng đang hoạt động.

## 4. CẤU HÌNH SUPABASE

### 4.1. Kiểm tra dự án

Mở Supabase Dashboard của dự án DuLichConDen-V2.

Kiểm tra đúng Project URL:

`https://xxzidzxgeppgbmyapwgi.supabase.co`

### 4.2. Cấu hình khóa công khai

File cấu hình hiện tại:

`config/supabase.js`

Các biến:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Trong cấu hình hiện tại, `SUPABASE_ANON_KEY` đang sử dụng publishable key mới.

Chỉ dùng khóa công khai trong mã trình duyệt.

### 4.3. Cấu hình khóa phía máy chủ

Cloudflare Pages / Workers sử dụng biến môi trường:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`

`SUPABASE_SECRET_KEY` là khóa bí mật phía máy chủ, không được đưa vào GitHub hoặc JavaScript công khai.

Không tự ý tạo thêm biến `SUPABASE_SERVICE_ROLE_KEY` nếu mã nguồn hiện tại không yêu cầu.

### 4.4. Kiểm tra kết nối

Mã nguồn `public/js/marketplace/supabase-client.js` đang sử dụng Supabase SDK v2 và import cấu hình từ `config/supabase.js`.

Không sử dụng hướng dẫn tạo `window.supabaseClient` hoặc `window.DuLichConDenSupabase` theo tài liệu cũ.

Không thêm các thẻ script thủ công nếu trang đã sử dụng JavaScript module và đã có cấu trúc import tương ứng.

## 5. CƠ SỞ DỮ LIỆU HIỆN TẠI

Các bảng đã được ghi nhận trong Supabase Production:

1. `carts`
2. `cart_items`
3. `categories`
4. `commissions`
5. `order_items`
6. `orders`
7. `payments`
8. `pi_pricing_settings`
9. `pi_rate_history`
10. `product_images`
11. `products`
12. `profiles`
13. `reviews`
14. `seller_applications`
15. `stores`

Đây là danh sách bảng đã được kiểm tra trước đó trong Supabase Table Editor.

### 5.1. Vai trò người dùng

Bảng `profiles` quản lý hồ sơ và vai trò tài khoản.

Các vai trò được sử dụng trong hệ thống:

- `buyer`: Người mua.
- `seller`: Người bán.
- `admin`: Quản trị viên.

Không tạo bảng `marketplace_admins` hoặc tự thay đổi vai trò khi chưa kiểm tra cấu trúc hiện tại.

### 5.2. Hồ sơ người bán

Bảng `seller_applications` lưu hồ sơ đăng ký người bán.

Hồ sơ cần được quản trị viên xét duyệt trước khi người dùng được thực hiện các chức năng dành cho người bán.

### 5.3. Gian hàng và sản phẩm

- `stores`: Thông tin gian hàng.
- `products`: Thông tin sản phẩm.
- `product_images`: Hình ảnh sản phẩm.
- `categories`: Danh mục sản phẩm.

### 5.4. Đơn hàng và thanh toán

- `carts`: Giỏ hàng.
- `cart_items`: Sản phẩm trong giỏ.
- `orders`: Đơn hàng.
- `order_items`: Chi tiết đơn hàng.
- `payments`: Thông tin thanh toán.
- `commissions`: Phí và hoa hồng.

## 6. NGUYÊN TẮC MIGRATION VÀ SQL

Không chạy lại file SQL khởi tạo cũ chỉ vì tài liệu hướng dẫn yêu cầu.

Trước khi chạy một migration mới:

1. Kiểm tra file SQL thực tế trong repository.
2. Kiểm tra các bảng và cột hiện có trong Supabase.
3. Kiểm tra khóa chính, khóa ngoại và chỉ mục.
4. Kiểm tra chính sách RLS.
5. Kiểm tra ảnh hưởng đến dữ liệu Production.
6. Sao lưu dữ liệu.
7. Chỉ chạy sau khi đã rà soát và phê duyệt.

Nếu không tìm thấy file migration được tài liệu đề cập, phải dừng và xác định đúng file trước khi thao tác.

Không tự tạo các bảng trùng với cấu trúc đang vận hành.

## 7. PHÂN QUYỀN VÀ BẢO MẬT

### 7.1. Người mua

- Xem gian hàng được công khai.
- Xem sản phẩm đang hoạt động.
- Quản lý giỏ hàng và đơn hàng của mình.
- Không được truy cập dữ liệu riêng tư của người khác.

### 7.2. Người bán

- Quản lý gian hàng thuộc quyền sở hữu.
- Quản lý sản phẩm của gian hàng.
- Không được tự duyệt hồ sơ hoặc sản phẩm của mình.
- Không được truy cập dữ liệu riêng tư của người bán khác.

### 7.3. Quản trị viên

- Được xác minh quyền quản trị phía máy chủ.
- Được duyệt hồ sơ, gian hàng và sản phẩm theo quyền được cấp.
- Không cấp quyền admin thông qua dữ liệu do trình duyệt tự gửi.

### 7.4. RLS

Supabase Row Level Security phải được kiểm tra đối với các bảng có dữ liệu người dùng.

Không xem việc ẩn nút hoặc ẩn trang trên giao diện là biện pháp bảo mật.

Các thao tác quản trị phải được kiểm tra quyền ở phía máy chủ.

## 8. QUẢN LÝ HÌNH ẢNH SẢN PHẨM

Hệ thống hiện sử dụng các khu vực lưu trữ hình ảnh:

- `product-images-pending`: Ảnh chờ duyệt.
- `product-images`: Ảnh được công khai sau khi duyệt.

Quy trình:

1. Người bán tải ảnh hợp lệ.
2. Ảnh được lưu trong khu vực chờ duyệt.
3. Thông tin ảnh được ghi vào `product_images`.
4. Quản trị viên kiểm tra sản phẩm và hình ảnh.
5. Ảnh được chuyển sang khu vực công khai khi được duyệt.

Yêu cầu bảo mật:

- Kiểm tra loại file.
- Giới hạn dung lượng.
- Kiểm tra quyền tải lên.
- Không cho người dùng truy cập ảnh chờ duyệt trái phép.
- Kiểm tra lỗi khi chuyển ảnh và cập nhật dữ liệu.

## 9. TÍCH HỢP PI NETWORK

Đăng nhập Pi Network được quản lý theo tài liệu riêng:

`README-PI-LOGIN.md`

Các endpoint hiện có trong mã nguồn:

- `/api/pi-auth/login`
- `/api/pi-auth/link`

Đăng nhập Pi phải được xác minh phía máy chủ và sử dụng Supabase session hiện có.

Không sử dụng Pi UID do trình duyệt tự gửi làm căn cứ xác thực.

Không lưu Pi Wallet Passphrase hoặc khóa bí mật ví.

Thanh toán Pi là chức năng riêng, không đồng nhất với đăng nhập Pi.

## 10. KIỂM THỬ HỆ THỐNG

Thực hiện kiểm thử theo thứ tự:

### 10.1. Kiểm tra kết nối

- Kiểm tra Supabase Project URL.
- Kiểm tra publishable key.
- Kiểm tra Cloudflare Secrets.
- Kiểm tra phiên đăng nhập.

### 10.2. Kiểm tra người mua

- Đăng ký tài khoản.
- Đăng nhập.
- Xem gian hàng.
- Xem sản phẩm.
- Kiểm tra giỏ hàng và đơn hàng theo chức năng đã triển khai.

### 10.3. Kiểm tra người bán

- Đăng nhập tài khoản người bán.
- Gửi hồ sơ đăng ký.
- Kiểm tra trạng thái hồ sơ.
- Kiểm tra gian hàng.
- Tạo sản phẩm.
- Tải ảnh sản phẩm.
- Kiểm tra trạng thái chờ duyệt.

### 10.4. Kiểm tra quản trị viên

- Đăng nhập tài khoản admin đã được cấp quyền.
- Tải danh sách hồ sơ chờ duyệt.
- Duyệt hoặc từ chối hồ sơ.
- Duyệt hoặc từ chối sản phẩm.
- Kiểm tra quyền truy cập API.
- Kiểm tra RLS.

### 10.5. Kiểm tra sau triển khai

- Kiểm tra trên máy tính.
- Kiểm tra trên điện thoại.
- Kiểm tra Pi Browser nếu có tích hợp Pi.
- Kiểm tra nhật ký lỗi Cloudflare.
- Kiểm tra dữ liệu Supabase.

## 11. QUY TRÌNH PHÁT TRIỂN PHIÊN BẢN 3.0

Nhánh phát triển:

`feature/dulichconden-3.0`

Nguyên tắc:

1. Phát triển trên nhánh riêng.
2. Giữ nguyên chức năng đang hoạt động.
3. Kiểm tra file trước khi tạo mới.
4. Không ghi đè file cũ khi chưa được rà soát.
5. Không chạy SQL Production khi chưa được phê duyệt.
6. Commit từng nhóm thay đổi rõ ràng.
7. Kiểm thử trước khi hợp nhất vào `main`.
8. Chỉ triển khai Production sau khi xác nhận an toàn.

## 12. TRẠNG THÁI TÀI LIỆU

Tài liệu này mô tả cách kiểm tra và vận hành phân hệ thương mại điện tử DuLichConDen-V2.

Danh sách bảng được ghi nhận từ lần kiểm tra Supabase trước đó. Cấu trúc thực tế cần được xác nhận lại trước khi chạy migration hoặc thay đổi dữ liệu.

Các chức năng chỉ được xem là hoàn thành sau khi mã nguồn, cấu hình, cơ sở dữ liệu và kết quả kiểm thử đã được xác nhận.

---

**Dự án:** DuLichConDen-V2

**Thương hiệu:** DuLichConDen

**Phiên bản phát triển:** 3.0

**Phân hệ:** Sàn thương mại điện tử nhiều người bán

**Cơ sở dữ liệu:** Supabase

**Nền tảng triển khai:** Cloudflare Pages & Workers

**Quản lý mã nguồn:** GitHub
