# QUIDELINES & RÀNG BUỘC HỆ THỐNG (BẮT BUỘC)

## 1. Môi Trường Hạ Tầng & Tương Thích
- **Hệ điều hành**: Windows Server 2012 R2.
- **Database**: SQL Server 2008 / 2008 R2 (Compatibility Level 100).
- **Ràng buộc SQL Server 2008**:
  - Trong EF Core: BẮT BUỘC cấu hình `sqlOptions.UseCompatibilityLevel(100)`.
  - KHÔNG sử dụng cú pháp SQL 2012+ như: `OFFSET...FETCH` (thay bằng `ROW_NUMBER() OVER()`), `STRING_AGG`, `TRY_CONVERT`, `IIF`, `FORMAT`, `CONCAT` (bỏ qua null), `DATEFROMPARTS`.
  - Phân trang ở cấp Database cho 100% các API danh sách. Tuyệt đối không nạp toàn bộ dữ liệu vào RAM Backend.

## 2. Ưu Tiên Thiết Kế Giao Diện Tablet & iPad (BẮT BUỘC)
- **Thiết bị mục tiêu chính**: Hệ thống được thiết kế và tối ưu **ƯU TIÊN HÀNG ĐẦU cho Tablet và iPad** (độ phân giải từ 768px - 1366px, cả 2 chiều Ngang Landscape và Dọc Portrait).
- **Touch-Friendly UI (Thao tác chạm cảm ứng)**:
  - Vùng chạm tối thiểu (Touch Target): Mọi nút bấm (Button), icon, checkbox, radio, menu item phải có kích thước tối thiểu **44x44px đến 48x48px** để bấm ngón tay dễ dàng, không bị bấm nhầm.
  - KHÔNG phụ thuộc vào hiệu ứng `hover` (do thiết bị cảm ứng không có trỏ chuột). Mọi thao tác phải có phản hồi rõ ràng ở trạng thái `active` / `tap`.
  - Khoảng cách (Spacing & Padding): Rộng rãi, thoáng đãng, dễ chạm lướt.
- **Tương thích Bàn phím ảo & Viewport**:
  - Khai báo đúng thuộc tính `inputmode` (`numeric`, `email`, `tel`, `decimal`) cho các ô nhập liệu để iPad bật đúng bàn phím phù hợp.
  - Đảm bảo bàn phím ảo bật lên không che khuất ô nhập liệu hoặc nút bấm xác nhận/submit.
  - Hỗ trợ vùng an toàn `env(safe-area-inset-*)` cho các dòng iPad tràn viền.
- **Bảng dữ liệu (Table/DataGrid) trên Tablet**:
  - Hỗ trợ cuộn ngang mượt mà (`touch-action: pan-x`, `-webkit-overflow-scrolling: touch`).
  - Cố định cột quan trọng (Pinned/Sticky Columns: Tên, Thao tác) khi cuộn bảng trên màn hình tablet.

## 3. Kiến Trúc & Bảo Mật Fullstack (.NET & React TypeScript)
- **Backend Authorization**: Mọi Controller/Action phải có `[Authorize(Policy = "...")]`. Mặc định Deny by default (401/403).
- **Data-level Security**: Luôn kèm `TenantId` / `UserId` trong mọi query để tránh lỗi BOLA / IDOR.
- **Async/Await**: Sử dụng 100% `async/await` từ Controller xuống DB để tránh Thread Starvation trên IIS / Windows Server 2012 R2.
- **Frontend Security UI**: Dùng `usePermission` và `<HasPermission>` để ẩn/disable nút bấm, menu; dùng `PrivateRoute` chặn URL trực tiếp.
- **Tối ưu hiển thị dữ liệu lớn**: Dùng Server-side Pagination hoặc Virtual Scrolling (`react-window`), kèm Skeleton loading.
- **Deploy**: Triển khai trên 2 VPS riêng biệt (Backend VPS & Frontend VPS), hỗ trợ CORS linh hoạt, cấu hình Security Headers và mã hóa thông tin cấu hình.

## 4. Bộ Skills Sẵn Có Trong Workspace
- `fullstack-planning`: Lên kế hoạch, brainstorm, thiết kế DB SQL 2008 & RBAC.
- `fullstack-develop`: Code Backend .NET & Frontend React TS chuẩn bảo mật và hiệu năng.
- `fullstack-frontend`: Xây dựng UI an toàn, phân quyền client, tối ưu trải nghiệm Tablet/iPad, virtual scroll, đồng bộ Design System.
- `fullstack-test-fix`: Audit bảo mật, test phân quyền đa vai trò, test giao diện Tablet/iPad, quét cú pháp SQL 2008 runtime.
- `fullstack-deploy`: Publish Backend, cấu hình IIS 2 VPS trên Windows Server 2012 R2, HTTPS & CORS.
