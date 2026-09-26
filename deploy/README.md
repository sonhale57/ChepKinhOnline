# HƯỚNG DẪN TRIỂN KHAI BACKEND (.NET 8) TRÊN WINDOWS SERVER 2012 R2

Thư mục `deploy/backend` chứa toàn bộ tệp binary đã được build và publish sẵn sàng cho môi trường Production (Release mode).

---

## 1. Yêu Cầu Cài Đặt Trên Windows Server 2012 R2

1. **IIS (Internet Information Services)**: Bật Web Server Role.
2. **ASP.NET Core Hosting Bundle**: Cài đặt gói `.NET 8.0 Hosting Bundle` (chứa ASP.NET Core Runtime và IIS AspNetCoreModuleV2).
3. **Database**: SQL Server 2008 / 2008 R2 (hoặc cao hơn). Đã tương thích Compatibility Level 100.

---

## 2. Các Bước Triển Khai Lên IIS

1. Copy toàn bộ nội dung thư mục `deploy/backend` vào thư mục web trên VPS (ví dụ: `C:\inetpub\wwwroot\chepkinh-api`).
2. Mở **IIS Manager** -> Tạo một **Application Pool** mới:
   - Name: `ChepKinhApiPool`
   - .NET CLR Version: `No Managed Code`
   - Managed Pipeline Mode: `Integrated`
3. Tạo một **Website** hoặc **Application** trỏ vào thư mục `C:\inetpub\wwwroot\chepkinh-api`:
   - Binding Port: `5000` (hoặc `443` HTTPS).
   - Chọn Application Pool vừa tạo (`ChepKinhApiPool`).
4. Cấp quyền ghi (Write Permission) cho thư mục `wwwroot/uploads` để lưu trữ ảnh đại diện WebP người dùng:
   - Chuột phải thư mục `wwwroot\uploads` -> Properties -> Security -> Thêm `IIS AppPool\ChepKinhApiPool` với quyền `Full Control` hoặc `Modify`.
5. Cập nhật chuỗi kết nối Database trong `appsettings.Production.json` (hoặc `appsettings.json`):
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=localhost;Database=ChepKinhOnline;User Id=sa;Password=MatKhauCuaBan;MultipleActiveResultSets=true;TrustServerCertificate=True"
   }
   ```

---

## 3. Khởi Chạy Nhanh Bằng Dòng Lệnh (Standalone Console / Windows Service)

Nếu không muốn chạy qua IIS, có thể khởi chạy trực tiếp bằng dòng lệnh hoặc cấu hình làm Windows Service:

```powershell
cd C:\inetpub\wwwroot\chepkinh-api
dotnet .\ChepKinh.Api.dll --urls "http://0.0.0.0:5000"
```

---

## 4. Frontend Environment Setup

Tại thư mục `frontend`:
1. Sao chép `.env.sample` thành `.env`:
   ```powershell
   copy .env.sample .env
   ```
2. Cập nhật `VITE_API_URL` trỏ về địa chỉ IP/Domain của Backend VPS:
   ```env
   VITE_API_URL=http://<IP_HOẶC_DOMAIN_VPS_BACKEND>:5000/api
   VITE_GOOGLE_CLIENT_ID=997339088254-e3v8rpclgleadehklk79euvve29s0n6r.apps.googleusercontent.com
   ```
3. Chạy frontend:
   ```powershell
   npm run dev
   # hoặc build tĩnh cho IIS:
   npm run build
   ```
