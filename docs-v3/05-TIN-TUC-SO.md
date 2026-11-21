# ĐẶC TẢ MÔ-ĐUN TIN TỨC SỐ DULICHC​​ONDEN 3.0

## 1. Mục tiêu
Xây dựng hệ thống quản lý tin tức số, cho phép quản trị viên tải lên một hoặc nhiều hình ảnh chứa nội dung văn bản, chuyển nội dung thành bài viết dự thảo và biên tập trước khi xuất bản.

## 2. Quy trình đăng tin
1. Quản trị viên đăng nhập hệ thống.
2. Chọn chức năng tạo tin tức mới.
3. Tải lên một hoặc nhiều hình ảnh.
4. Hệ thống lưu ảnh gốc và tạo bản xem trước.
5. Nếu có tích hợp OCR, hệ thống nhận dạng chữ trong ảnh và đưa vào bản nháp.
6. Quản trị viên kiểm tra, chỉnh sửa và sắp xếp nội dung.
7. Quản trị viên xem trước bài viết.
8. Quản trị viên xác nhận xuất bản hoặc lưu bản nháp.

## 3. Chức năng tải ảnh
- Hỗ trợ tải lên một hoặc nhiều ảnh trong một lần.
- Hiển thị danh sách ảnh đã tải.
- Cho phép sắp xếp thứ tự ảnh.
- Cho phép chọn ảnh đại diện.
- Kiểm tra định dạng và dung lượng tệp.
- Lưu ảnh gốc để phục vụ đối chiếu và biên tập.

## 4. Nhận dạng nội dung OCR
- OCR là chức năng hỗ trợ nhận dạng văn bản từ ảnh.
- Nội dung OCR phải được xem là bản nháp.
- Không tự động xuất bản nội dung OCR.
- Cho phép quản trị viên sửa lỗi chính tả, dấu câu, tiêu đề và bố cục.
- Nếu OCR không nhận dạng được, vẫn cho phép nhập nội dung thủ công.

## 5. Biên tập bài viết
Các trường thông tin dự kiến:
- Tiêu đề bài viết.
- Đường dẫn thân thiện (slug).
- Danh mục tin tức.
- Ảnh đại diện.
- Nội dung bài viết.
- Danh sách ảnh đính kèm.
- Tác giả hoặc đơn vị cung cấp tin.
- Thời gian tạo và thời gian xuất bản.
- Trạng thái bài viết.

## 6. Chế độ hiển thị
### 6.1. Bài viết tiêu chuẩn
Hiển thị tiêu đề, ảnh đại diện, nội dung văn bản và ảnh minh họa theo bố cục bài báo.

### 6.2. Bài viết dạng bộ sưu tập
Hiển thị nhiều ảnh theo thứ tự, kèm tiêu đề và phần mô tả.

## 7. Trạng thái bài viết
- Draft: Bản nháp.
- Published: Đã xuất bản.
- Hidden: Đã ẩn.

Chỉ bài viết Published mới được hiển thị công khai. Bản nháp và bài viết đã ẩn không được phép truy cập công khai.

## 8. Phân quyền
- Quản trị viên: tạo, sửa, xem trước, xuất bản, ẩn và quản lý bài viết.
- Biên tập viên (nếu được cấp quyền): tạo và chỉnh sửa bản nháp.
- Khách truy cập: chỉ xem bài viết đã xuất bản.

## 9. Lưu trữ và lịch sử
- Lưu ảnh gốc và ảnh hiển thị.
- Lưu thời gian tạo, cập nhật và xuất bản.
- Có thể bổ sung lịch sử chỉnh sửa và người thực hiện.
- Có phương án sao lưu dữ liệu và hình ảnh.

## 10. Bảo mật
- Kiểm tra quyền quản trị trước mọi thao tác ghi và xuất bản.
- Kiểm tra loại tệp, dung lượng và nội dung tải lên.
- Không cho phép tải tệp thực thi nguy hiểm.
- Bảo vệ đường dẫn lưu trữ và thông tin người dùng.
- Kiểm tra quyền sử dụng hình ảnh trước khi xuất bản.

## 11. Giao diện
- Thiết kế ưu tiên điện thoại và máy tính.
- Quy trình tải ảnh, biên tập và xem trước dễ sử dụng.
- Có thông báo rõ ràng khi lưu nháp hoặc xuất bản.
- Hỗ trợ quản lý nhiều bài viết và danh mục.

## 12. Điều kiện nghiệm thu
- Tải được một hoặc nhiều ảnh.
- Sắp xếp được ảnh và chọn ảnh đại diện.
- Tạo và chỉnh sửa được bản nháp.
- OCR không tự động xuất bản.
- Có màn hình xem trước.
- Chỉ người có quyền mới được xuất bản.
- Khách truy cập chỉ xem được bài viết đã xuất bản.

## 13. Trạng thái
Đây là tài liệu đặc tả chức năng. Mô-đun chỉ được xem là hoàn thành sau khi lập trình, tích hợp, kiểm thử phân quyền và nghiệm thu.
