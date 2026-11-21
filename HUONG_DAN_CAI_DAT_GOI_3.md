# HƯỚNG DẪN CÀI ĐẶT GÓI 3 – DuLichConDen 2.0

## 1. Các tệp trong gói

Giải nén ZIP. Đưa đúng các tệp sau vào repository `tranvandinh128/DuLichConDen-V2`:

| Tệp trên máy tính | Vị trí đích trong GitHub |
|---|---|
| `public/js/marketplace/admin.js` | `public/js/marketplace/admin.js` |
| `public/js/marketplace/seller.js` | `public/js/marketplace/seller.js` |
| `public/js/marketplace/marketplace.js` | `public/js/marketplace/marketplace.js` |
| `supabase/marketplace_schema.sql` | `supabase/marketplace_schema.sql` |

Không tải đè `public/index.html`, `public/js/app.js`, CSS, `auth.js` hoặc các tệp hiện đang chạy.

Nếu thư mục `public/js/marketplace` chưa có trên GitHub, hãy tạo đúng thư mục này bằng cách tải các tệp có kèm đường dẫn tương đối. GitHub sẽ tạo thư mục khi commit.

## 2. Tạo bảng trên Supabase

1. Mở Supabase Dashboard của đúng dự án DuLichConDen.
2. Chọn **SQL Editor**.
3. Chọn **New query**.
4. Mở tệp `supabase/marketplace_schema.sql` trên máy tính, sao chép toàn bộ nội dung.
5. Dán vào SQL Editor và nhấn **Run**.
6. Mở **Table Editor**, kiểm tra có ba bảng:
   - `marketplace_admins`
   - `marketplace_shops`
   - `marketplace_products`

Chỉ chạy SQL một lần trên đúng dự án. Nếu đã có bảng trùng tên hoặc dữ liệu sàn trước đó, hãy sao lưu và kiểm tra trước khi chạy.

## 3. Điều kiện kết nối Supabase

Ba tệp JavaScript tìm Supabase client theo một trong hai tên toàn cục:
- `window.supabaseClient`
- `window.DuLichConDenSupabase`

Client phải được khởi tạo bằng Supabase JavaScript SDK v2 trước khi gọi các hàm marketplace. Tệp hiện tại không tự khởi tạo client vì chưa xác nhận cấu trúc thực tế của `public/config/supabase.js`.

Chỉ sử dụng **Project URL** và **anon/publishable key** ở trình duyệt. Tuyệt đối không đưa `service_role` key vào HTML hoặc JavaScript công khai.

## 4. Cấp quyền quản trị viên

Quản trị viên phải có tài khoản Supabase Auth trước.

1. Đăng nhập Supabase Dashboard.
2. Mở **Authentication → Users**.
3. Sao chép UUID của tài khoản quản trị.
4. Trong SQL Editor chạy lệnh sau, thay UUID mẫu bằng UUID thật:

```sql
insert into public.marketplace_admins (user_id)
values ('PASTE-ADMIN-USER-UUID-HERE')
on conflict (user_id) do nothing;
```

Không cấp quyền admin bằng cách cho người dùng tự chọn vai trò trong biểu mẫu đăng ký.

## 5. Nạp các tệp JavaScript

Khi tích hợp vào trang HTML, tải Supabase SDK và cấu hình client trước, rồi mới tải ba tệp:

```html
<script src="ĐƯỜNG_DẪN_SUPABASE_SDK_V2"></script>
<script src="/config/supabase.js"></script>
<script src="/js/marketplace/admin.js"></script>
<script src="/js/marketplace/seller.js"></script>
<script src="/js/marketplace/marketplace.js"></script>
```

Đường dẫn trên là ví dụ theo thư mục `public` được xuất bản làm gốc website. Chỉ thêm các thẻ script sau khi kiểm tra `supabase.js` hiện tại đang khởi tạo client như thế nào. Không thay thế cấu hình đang chạy chỉ để làm theo ví dụ.

## 6. Các hàm có sẵn

### Quản trị viên

```js
await DuLichConDenMarketplace.admin.dashboard();
await DuLichConDenMarketplace.admin.listShops("pending");
await DuLichConDenMarketplace.admin.reviewShop(shopId, "approved", "Đã kiểm tra");
await DuLichConDenMarketplace.admin.listProducts("pending");
await DuLichConDenMarketplace.admin.reviewProduct(productId, "approved", "Đạt yêu cầu");
```

Trạng thái gian hàng: `pending`, `approved`, `rejected`, `suspended`.

Trạng thái sản phẩm: `pending`, `approved`, `rejected`, `hidden`.

### Người bán

```js
await DuLichConDenMarketplace.seller.myShops();

await DuLichConDenMarketplace.seller.registerShop({
  shop_name: "Tên gian hàng",
  owner_name: "Tên người đại diện",
  business_type: "individual", // individual | household_business | company
  phone: "Số điện thoại",
  email: "email@example.com",
  address: "Địa chỉ",
  description: "Giới thiệu gian hàng"
});

await DuLichConDenMarketplace.seller.myProducts(shopId);

await DuLichConDenMarketplace.seller.createProduct({
  shop_id: "UUID-GIAN-HANG",
  name: "Tên sản phẩm",
  description: "Mô tả",
  price_vnd: 100000,
  stock: 10,
  category: "Đặc sản địa phương",
  image_url: "https://..."
});
```

Gian hàng phải được duyệt trước khi người bán đăng sản phẩm. Sản phẩm mới sẽ ở trạng thái chờ duyệt.

### Khách mua hàng

```js
const result = await DuLichConDenMarketplace.store.listProducts({
  search: "đặc sản",
  page: 1,
  pageSize: 12
});

const product = await DuLichConDenMarketplace.store.getProduct(productId);
const shops = await DuLichConDenMarketplace.store.listShops();
```

## 7. Lưu ý trước khi đưa vào hoạt động

- Ba tệp này cung cấp các hàm nghiệp vụ, chưa tự tạo giao diện quản trị, biểu mẫu người bán hoặc giỏ hàng.
- Chưa có xử lý đơn hàng, thanh toán COD/ngân hàng/Pi, vận chuyển, hoàn tiền hoặc tải ảnh lên Storage.
- Cần tích hợp với hệ thống đăng nhập hiện có và kiểm thử RLS bằng tài khoản khách, người bán và quản trị viên riêng biệt.
- Kiểm tra các cột, bảng hiện có trước khi kết nối với dữ liệu sản xuất.
- Không dùng dữ liệu thử nghiệm hoặc tài khoản admin thật trên website công khai khi chưa kiểm thử bảo mật.

## 8. Thứ tự triển khai khuyến nghị

1. Tải ba tệp JavaScript lên GitHub.
2. Kiểm tra và chạy SQL trên Supabase.
3. Cấu hình kết nối client theo tệp Supabase hiện có.
4. Cấp quyền admin.
5. Hoàn thiện `auth.js` và tích hợp giao diện.
6. Kiểm thử đăng ký gian hàng → admin duyệt → người bán đăng sản phẩm → admin duyệt → sản phẩm hiển thị công khai.
