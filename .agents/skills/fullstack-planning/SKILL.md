---
name: fullstack-planning
description: Quy trình phân tích yêu cầu, brainstorm, thiết kế kiến trúc Fullstack .NET + React TS, thiết kế Database tối ưu cho SQL Server 2008/2008 R2 và mô hình bảo mật RBAC/ABAC trên Windows Server 2012 R2.
---

# Skill Planning: Phân Tích & Thiết Kế Kiến Trúc Hệ Thống

Skill này hướng dẫn quy trình lập kế hoạch, brainstorm, thiết kế Database và kiến trúc bảo mật cho hệ sinh thái **.NET + React TypeScript** chạy trên môi trường **Windows Server 2012 R2** và **SQL Server 2008 / 2008 R2**.

---

## 1. Quy Trình Brainstorm & Làm Rõ Yêu Cầu

Trước khi viết bất kỳ dòng code nào, luôn thực hiện các bước:
1. **Làm rõ mục tiêu nghiệp vụ (Business Logic)**:
   - Hệ thống giải quyết bài toán gì?
   - Luồng nghiệp vụ chính từ đầu đến cuối (User Story / Use Case).
2. **Xác định các Actor và Ma trận phân quyền**:
   - Ai sử dụng hệ thống? (Admin, Manager, Staff, Customer, v.v.)
   - Mỗi vai trò có quyền xem, tạo, sửa, xóa (CRUD) những module/dữ liệu nào?
3. **Phân tích Input / Output & Ràng buộc dữ liệu**:
   - Dữ liệu đầu vào từ đâu? Các ràng buộc validate (độ dài, định dạng, unique).
   - Dữ liệu đầu ra trả về gì? Cần cấu trúc DTO như thế nào?
4. **Đánh giá tải & Dung lượng dữ liệu (Data Volume)**:
   - Ước tính số lượng bản ghi (hàng ngày, hàng tháng, 1-5 năm).
   - Tần suất truy vấn và bảng nào là bảng có dữ liệu lớn (Big Data Table).

---

## 2. Thiết Kế Database Tương Thích Chuẩn SQL Server 2008 / 2008 R2

> [!CRITICAL]
> **Ràng buộc tương thích SQL Server 2008 (Compatibility Level 100)**:
> SQL Server 2008 **KHÔNG HỖ TRỢ** các tính năng từ SQL Server 2012 trở lên. Thiết kế schema và query phải tuân thủ nghiêm ngặt bảng sau:

### Bảng Kiểm Tra Cú Pháp SQL Server 2008

| Tính năng KHÔNG ĐƯỢC DÙNG (SQL 2012+) | Giải pháp thay thế BẮT BUỘC trong SQL Server 2008 |
| :--- | :--- |
| `OFFSET ... FETCH NEXT ... ROWS ONLY` | Dùng `ROW_NUMBER() OVER(ORDER BY ...)` trong Subquery / CTE |
| `STRING_AGG(...)` | Dùng `FOR XML PATH('')` kết hợp `STUFF(...)` |
| `TRY_CONVERT(...)` / `TRY_PARSE(...)` | Dùng `CASE WHEN ISNUMERIC(...) = 1 THEN CONVERT(...) ELSE NULL END` hoặc validate ở Backend |
| `IIF(condition, true_val, false_val)` | Dùng chuẩn `CASE WHEN condition THEN true_val ELSE false_val END` |
| `CONCAT(a, b, c)` (tự bỏ qua null) | Dùng `ISNULL(a, '') + ISNULL(b, '') + ISNULL(c, '')` |
| `FORMAT(date, 'yyyy-MM-dd')` | Dùng `CONVERT(VARCHAR(10), date, 120)` |
| `DATEFROMPARTS(y, m, d)` | Dùng `CONVERT(DATETIME, CAST(y AS VARCHAR) + '-' + CAST(m AS VARCHAR) + '-' + CAST(d AS VARCHAR))` |
| `SEQUENCE` object | Dùng `IDENTITY(1,1)` |
| `JSON` functions (`JSON_VALUE`, v.v.) | Lưu NVARCHAR(MAX) và parse/serialize tại .NET Backend |

### Chiến Lược Đánh Index Tối Ưu Tải Lớn
1. **Clustered Index**:
   - Luôn có trên khóa chính tự tăng `Id BIGINT IDENTITY(1,1)` hoặc `Id INT IDENTITY(1,1)` (tránh GUID Clustered Index vì gây phân mảnh đĩa nặng).
2. **Non-Clustered Index Chiến Lược**:
   - Đánh index trên tất cả các Foreign Keys (`UserId`, `RoleId`, `TenantId`, `CategoryId`).
   - Đánh composite index cho các trường thường xuyên xuất hiện đồng thời trong `WHERE` và `ORDER BY`:
     ```sql
     CREATE NONCLUSTERED INDEX IX_Orders_Tenant_CreatedAt
     ON Orders(TenantId, CreatedAt DESC)
     INCLUDE (TotalAmount, Status);
     ```
   - Sử dụng `INCLUDE` columns để tạo **Covering Index**, giúp query lấy dữ liệu trực tiếp từ leaf-node của Index mà không cần bookmark lookup về Clustered Table.

---

## 3. Thiết Kế Bảo Mật & Phân Quyền RBAC / ABAC

Thiết kế bảng phân quyền chuẩn RBAC (Role-Based Access Control) ngay từ đầu:

### Database Schema Mẫu Phân Quyền
```sql
-- 1. Bảng Người dùng
CREATE TABLE Users (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    TenantId INT NOT NULL DEFAULT 1,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Email NVARCHAR(150) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    UpdatedAt DATETIME NULL
);

-- 2. Bảng Vai trò
CREATE TABLE Roles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(255) NULL
);

-- 3. Bảng Quyền hạn chi tiết (Granular Permissions)
CREATE TABLE Permissions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    PermissionCode NVARCHAR(100) NOT NULL UNIQUE, -- vd: 'orders.view', 'orders.create', 'orders.export'
    ModuleName NVARCHAR(50) NOT NULL,             -- vd: 'Orders'
    Description NVARCHAR(255) NULL
);

-- 4. Bảng Gán Vai trò cho User (N - N)
CREATE TABLE UserRoles (
    UserId BIGINT NOT NULL,
    RoleId INT NOT NULL,
    PRIMARY KEY (UserId, RoleId),
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE,
    FOREIGN KEY (RoleId) REFERENCES Roles(Id) ON DELETE CASCADE
);

-- 5. Bảng Gán Quyền cho Vai trò (N - N)
CREATE TABLE RolePermissions (
    RoleId INT NOT NULL,
    PermissionId INT NOT NULL,
    PRIMARY KEY (RoleId, PermissionId),
    FOREIGN KEY (RoleId) REFERENCES Roles(Id) ON DELETE CASCADE,
    FOREIGN KEY (PermissionId) REFERENCES Permissions(Id) ON DELETE CASCADE
);
```

### Nguyên Tắc Thiết Kế Bảo Mật
1. **Deny by Default**: Tất cả endpoint API mặc định yêu cầu xác thực và phân quyền, trả về `401 Unauthorized` nếu chưa đăng nhập và `403 Forbidden` nếu thiếu quyền.
2. **Authentication**: Sử dụng **JWT Access Token** (thời hạn ngắn: 15-30 phút) kèm **Refresh Token** (lưu an toàn trong DB với `Revoked` status).
3. **Data-level Isolation (Chống BOLA / IDOR)**: Mọi bảng dữ liệu nghiệp vụ phải có `TenantId` hoặc `UserId` để cô lập truy cập giữa các tài khoản/tổ chức.

---

## 4. Thiết Kế Phân Trang Cấp Database (Server-side Pagination)

Mọi danh sách dữ liệu có khả năng vượt quá 50 bản ghi đều phải được phân trang ở Database, **tuyệt đối không `SELECT *` rồi `.ToList()` về RAM backend**.

### Mẫu Stored Procedure Phân Trang SQL Server 2008
```sql
CREATE PROCEDURE sp_GetOrdersPaged
    @TenantId INT,
    @SearchKeyword NVARCHAR(100) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20,
    @TotalRecords INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    -- Tính tổng số bản ghi
    SELECT @TotalRecords = COUNT(1)
    FROM Orders WITH (NOLOCK)
    WHERE TenantId = @TenantId
      AND (@SearchKeyword IS NULL OR OrderCode LIKE '%' + @SearchKeyword + '%');

    -- Lấy dữ liệu theo phân trang dùng ROW_NUMBER()
    WITH PagedOrders AS (
        SELECT 
            Id, OrderCode, CustomerName, TotalAmount, Status, CreatedAt,
            ROW_NUMBER() OVER (ORDER BY Id DESC) AS RowNum
        FROM Orders WITH (NOLOCK)
        WHERE TenantId = @TenantId
          AND (@SearchKeyword IS NULL OR OrderCode LIKE '%' + @SearchKeyword + '%')
    )
    SELECT Id, OrderCode, CustomerName, TotalAmount, Status, CreatedAt
    FROM PagedOrders
    WHERE RowNum BETWEEN ((@PageNumber - 1) * @PageSize + 1) AND (@PageNumber * @PageSize)
    ORDER BY RowNum;
END;
```

---

## 5. Checklist Kế Hoạch Trước Khi Triển Khai (Planning Checklist)

- [ ] Đã làm rõ yêu cầu nghiệp vụ và các edge cases với stakeholder/user.
- [ ] Đã lập danh sách Permission codes cho từng module.
- [ ] Đã thiết kế ERD Database với kiểu dữ liệu và index tối ưu cho SQL 2008.
- [ ] Đã xác nhận không có cú pháp SQL 2012+ trong kế hoạch thiết kế DB.
- [ ] Đã định nghĩa API Request/Response DTOs đầy đủ cấu trúc phân trang (`PageIndex`, `PageSize`, `TotalCount`, `Items`).
