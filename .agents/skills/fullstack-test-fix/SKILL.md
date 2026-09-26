---
name: fullstack-test-fix
description: Quy trình kiểm thử bảo mật (Security Audit), giả lập test phân quyền RBAC đa vai trò, kiểm thử hiển thị/thao tác trên Tablet/iPad và kiểm tra tương thích SQL Server 2008 Runtime.
---

# Skill Test & Fix Bug: Đánh Giá Bảo Mật, Kiểm Thử Tablet/iPad & Tương Thích Runtime

Skill này cung cấp quy trình tự động hóa kiểm thử, audit bảo mật, test phân quyền đa vai trò, **kiểm thử giao diện cảm ứng Tablet / iPad**, và xác thực tính tương thích tuyệt đối với **SQL Server 2008 / 2008 R2** trên **Windows Server 2012 R2**.

---

## 1. Security Audit: Rà Soát Lỗ Hổng Bảo Mật

Trước khi bàn giao hoặc deploy bất kỳ tính năng nào, phải chạy quy trình rà soát mã nguồn (Code Audit):

### 1.1 Checklist Audit Endpoint Authorization
- [ ] **100% Controller / Minimal API** có attribute `[Authorize]` ở cấp độ class hoặc route.
- [ ] Chỉ những endpoint thực sự public (như Login, ForgotPassword, HealthCheck) mới được gắn `[AllowAnonymous]`.
- [ ] Các action thao tác dữ liệu nhạy cảm (Create, Update, Delete, Export) phải có Policy cụ thể (vd: `[Authorize(Policy = "users.delete")]`).

### 1.2 Rà Soát Bí Mật & Thông Tin Nhạy Cảm (Secret Leak Prevention)
- [ ] Không có Connection String, JWT Secret Key, Private Key được hardcode trong code C# hoặc TypeScript.
- [ ] File `appsettings.json` trong Git chỉ chứa placeholder/mẫu; giá trị thật phải lấy từ Environment Variables hoặc cấu hình mã hóa khi deploy.
- [ ] Các thông tin mật khẩu, token không bao giờ được ghi vào log (`Serilog` / `NLog` phải cấu hình filter hoặc exclude sensitive properties).

---

## 2. Kiểm Thử Trải Nghiệm & Giao Diện Tablet / iPad (Tablet-First UI Testing)

> [!IMPORTANT]
> Kiểm thử frontend bắt buộc thực hiện trên các profile thiết bị Tablet/iPad (Chrome DevTools Device Mode hoặc thiết bị thật):
> - **iPad Mini** (768 x 1024)
> - **iPad Air / Pro 11"** (834 x 1194)
> - **iPad Pro 12.9"** (1024 x 1366)

### 2.1 Kịch Bản Kiểm Thử Cảm Ứng Tablet
- [ ] **Touch Target Test**: Dùng công cụ đo lường kích thước nút bấm đảm bảo tối thiểu **44x44px đến 48x48px**, khoảng cách giữa các nút bấm không bị dính chùm gây chạm nhầm.
- [ ] **Orientation Test (Xoay màn hình)**: Kiểm tra layout không bị vỡ hoặc mất nội dung khi xoay giữa chế độ **Ngang (Landscape)** và **Dọc (Portrait)**.
- [ ] **Virtual Keyboard Test (Bàn phím ảo)**:
  - Bấm vào ô input ở cuối trang: Kiểm tra màn hình tự cuộn lên để không bị bàn phím ảo che khuất.
  - Kiểm tra các trường số mở đúng bàn phím số (`inputmode="numeric"`).
- [ ] **Table Touch Scroll Test**: Bảng dữ liệu có thể dùng ngón tay vuốt ngang mượt mà, cột Thao tác (Action) được cố định (sticky) bên phải.

---

## 3. Test Phân Quyền Đa Vai Trò (Multi-Role Simulation)

Lập kịch bản kiểm thử giả lập với 4 nhóm tài khoản:

| Nhóm Tài Khoản | Kỳ Vọng Backend | Kỳ Vọng Frontend |
| :--- | :--- | :--- |
| **1. Unauthorized (Chưa đăng nhập)** | Gọi API trả về `401 Unauthorized`. | Gõ URL vào trang quản trị tự động chuyển hướng về `/login`. |
| **2. Staff (Chỉ có quyền View)** | Gọi API `POST/PUT/DELETE` trả về `403 Forbidden`. | Nút "Thêm mới", "Sửa", "Xóa" bị ẩn hoàn toàn hoặc disable. |
| **3. Manager (Quyền View + Create + Edit)** | Được phép tạo/sửa. Gọi API `DELETE` trả về `403 Forbidden`. | Không nhìn thấy nút "Xóa" hoặc menu cấu hình hệ thống. |
| **4. SuperAdmin (Toàn quyền)** | Tất cả API trả về `200 OK` / `201 Created`. | Hiển thị đầy đủ menu, nút bấm và tính năng. |

---

## 4. Test Tương Thích Runtime SQL Server 2008

> [!WARNING]
> Tuyệt đối không để lọt các cú pháp SQL 2012+ (`OFFSET...FETCH`, `STRING_AGG`, `TRY_CONVERT`, `IIF`, `FORMAT`).

### 4.1 Bộ Lọc Scan Cú Pháp Bị Cấm (Forbidden Syntax Scan)
Chạy script kiểm tra hoặc inspect log SQL generated từ EF Core để tìm các từ khóa cấm:

```powershell
# Script PowerShell quét mã nguồn tìm cú pháp SQL 2012+ trong các file .sql, .cs
Get-ChildItem -Path . -Recurse -Include *.sql, *.cs | Select-String -Pattern "OFFSET\s+\d+\s+FETCH", "STRING_AGG\(", "TRY_CONVERT\(", "DATEFROMPARTS\(", "FORMAT\(", "IIF\("
```

Nếu tìm thấy bất kỳ dòng nào:
- `OFFSET ... FETCH`: Thay bằng `ROW_NUMBER() OVER()`
- `STRING_AGG(...)`: Thay bằng `FOR XML PATH('')`
- `TRY_CONVERT(...)`: Thay bằng `ISNUMERIC` + `CASE WHEN`
- `IIF(...)`: Thay bằng `CASE WHEN`
- `FORMAT(...)`: Thay bằng `CONVERT(VARCHAR, ..., 120)`

---

## 5. Checklist Hoàn Thành Test & Fix (Test Checklist)

- [ ] Toàn bộ endpoint đã được audit và không có route nào thiếu `[Authorize]`.
- [ ] Giao diện đã được kiểm thử đạt chuẩn cảm ứng trên Tablet/iPad (Landscape & Portrait).
- [ ] Đã test giả lập 4 vai trò (Unauthorized, Staff, Manager, Admin) đều hoạt động đúng.
- [ ] Đã kiểm tra log SQL không chứa bất kỳ từ khóa SQL 2012+ nào.
- [ ] Toàn bộ test suite vượt qua (Pass 100%).
