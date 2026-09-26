---
name: fullstack-deploy
description: Quy trình đóng gói và deploy dự án Fullstack .NET và React TypeScript lên 2 VPS Windows Server 2012 R2 riêng biệt (Backend IIS/Service & Frontend Static Site/IIS), cấu hình HTTPS, Security Headers, CORS và mã hóa cấu hình.
---

# Skill Deploy & Publish: Triển Khai & Hardening Trên Windows Server 2012 R2

Skill này hướng dẫn quy trình publish Backend .NET, cấu hình IIS / Windows Service trên **Windows Server 2012 R2**, quản lý kết nối giữa **2 VPS riêng biệt** (Backend VPS & Frontend VPS), thiết lập CORS linh hoạt, cấu hình Security Headers và mã hóa thông tin nhạy cảm.

---

## 1. Kiến Trúc Hạ Tầng 2 VPS Riêng Biệt

```
                                    ┌────────────────────────────────────────────────────────┐
                                    │               VPS 1 (Frontend Server)                  │
                                    │               Windows Server 2012 R2                   │
                                    │  - IIS Static Site / Web Server                        │
                                    │  - React TypeScript App (Port 80/443)                  │
                                    └──────────────────────────┬─────────────────────────────┘
                                                               │
                                         HTTPS API Calls       │ (CORS Enabled)
                                                               ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   VPS 2 (Backend & Database Server)                        │
│                                        Windows Server 2012 R2                              │
│  - IIS / Windows Service (.NET Core App - Port 5000/443)                                    │
│  - SQL Server 2008 / 2008 R2 (Localhost / Named Instance Port 1433)                        │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Đóng Gói Backend .NET (Publish To Standalone Folder)

### 2.1 Lệnh Publish Sạch Sẽ (Chứa Đầy Đủ Dependencies)
Thực hiện lệnh publish tự chứa (Self-Contained) hoặc Framework-Dependent để chỉ cần copy thư mục là chạy ngay:

```powershell
# Chạy lệnh publish ra thư mục ./publish/backend
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=false -o ./publish/backend
```

> [!TIP]
> Tùy chọn `--self-contained true` giúp ứng dụng mang theo toàn bộ runtime .NET, không cần cài đặt .NET SDK trên VPS Windows Server 2012 R2, chỉ cần cài **ASP.NET Core Hosting Bundle**.

---

## 3. Cấu Hình CORS Linh Hoạt & Bảo Mật

### 3.1 Cấu Hình Trong `Program.cs`
Cấu hình hỗ trợ kết nối từ Frontend khác VPS (mở linh hoạt cho môi trường thử nghiệm và siết chặt trên Production):

```csharp
var builder = WebApplication.CreateBuilder(args);

// Cấu hình CORS
builder.Services.AddCors(options =>
{
    // Policy dành cho kết nối linh hoạt (Testing / Inter-VPS Dev)
    options.AddPolicy("AllowFrontendVPS", policy =>
    {
        // Khi chạy thật (Production): Thay thế bằng Domain/IP chính xác của VPS Frontend
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
                             ?? new[] { "*" };

        if (allowedOrigins.Contains("*"))
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
        else
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

var app = builder.Build();

// Đặt UseCors TRƯỚC UseAuthentication và UseAuthorization
app.UseCors("AllowFrontendVPS");

app.UseAuthentication();
app.UseAuthorization();
```

---

## 4. Cấu Hình IIS & Security Headers Trên Windows Server 2012 R2

### 4.1 Cài Đặt Yêu Cầu Trên Windows Server 2012 R2
1. Bật tính năng **IIS (Web Server Role)** qua Server Manager.
2. Cài đặt **ASP.NET Core Hosting Bundle** (tương thích với phiên bản .NET sử dụng).
3. Cài đặt **URL Rewrite Module 2.1** cho IIS.
4. Tạo Application Pool:
   - **.NET CLR Version**: `No Managed Code`
   - **Managed Pipeline Mode**: `Integrated`

### 4.2 File `web.config` Chuẩn Cho Backend (Kèm Security Headers)
File `web.config` đặt tại thư mục gốc của Backend trên VPS:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="aspNetCore" path="*" verb="*" modules="AspNetCoreModuleV2" resourceType="Unspecified" />
    </handlers>
    
    <aspNetCore processPath=".\YourApp.Server.exe" stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" hostingModel="inprocess" />

    <!-- Security Headers Hardening -->
    <httpProtocol>
      <customHeaders>
        <add name="X-Frame-Options" value="SAMEORIGIN" />
        <add name="X-Content-Type-Options" value="nosniff" />
        <add name="X-XSS-Protection" value="1; mode=block" />
        <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
        <remove name="X-Powered-By" />
      </customHeaders>
    </httpProtocol>
    
    <!-- Cho phép các method HTTP: GET, POST, PUT, DELETE, OPTIONS -->
    <security>
      <requestFiltering>
        <verbs allowUnlisted="true">
          <add verb="OPTIONS" allowed="true" />
        </verbs>
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
```

---

## 5. Mã Hóa Chuỗi Kết Nối & AppSettings (Configuration Security)

### 5.1 Mã hóa bằng `aspnet_regiis` (Dành cho web.config trên IIS)
Chạy command prompt với quyền Administrator trên Windows Server 2012 R2:

```cmd
:: Mã hóa connectionStrings trong web.config
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\aspnet_regiis.exe -pef "connectionStrings" "C:\inetpub\wwwroot\backend"

:: Mã hóa appSettings trong web.config
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\aspnet_regiis.exe -pef "appSettings" "C:\inetpub\wwwroot\backend"
```

### 5.2 Bảo mật `appsettings.json` trong .NET Core
- Đặt connection string chứa tài khoản SQL Server 2008 trong **Environment Variables** của Windows Server:
  - Tên biến: `ConnectionStrings__DefaultConnection`
  - Giá trị: `Server=localhost;Database=YourDb;User Id=sa;Password=StrongPassword;TrustServerCertificate=True;`
- .NET sẽ tự động override giá trị trong `appsettings.json` mà không cần lưu mật khẩu dạng plaintext trong file.

---

## 6. Frontend (React TypeScript)

- Frontend được lưu trữ trên VPS 1 riêng biệt.
- **Lưu ý**: Theo yêu cầu hệ thống, phần Frontend không cần tự đóng gói file build (được quản lý theo quy trình riêng).
- Đảm bảo trỏ `VITE_API_URL` hoặc cấu hình Reverse Proxy hướng về IP / Domain của VPS Backend (VPS 2).

---

## 7. Checklist Hoàn Thành Deploy (Deploy Checklist)

- [ ] Backend đã được publish dạng self-contained và copy đầy đủ file sang VPS Backend.
- [ ] Application Pool trên IIS đã chọn `No Managed Code`.
- [ ] Cấu hình CORS đã cho phép IP/Domain của VPS Frontend kết nối.
- [ ] Security Headers (`X-Frame-Options`, `X-Content-Type-Options`) đã được nạp trong `web.config`.
- [ ] Chuỗi kết nối SQL Server 2008 và JWT Secret Key đã được bảo vệ/mã hóa.
- [ ] Kiểm tra kết nối từ VPS Frontend gọi sang VPS Backend thành công.
