---
name: fullstack-develop
description: Hướng dẫn phát triển Backend .NET và Frontend React TypeScript tuân thủ tương thích SQL Server 2008, bảo mật RBAC, chống OWASP, Async/Await chống Thread Starvation, và tối ưu dữ liệu lớn.
---

# Skill Develop: Lập Trình Backend .NET & Frontend React TypeScript

Skill này hướng dẫn quy tắc lập trình, tổ chức mã nguồn, cấu hình tương thích **SQL Server 2008 / 2008 R2** và thực thi bảo mật toàn diện cho cả Backend (.NET) và Frontend (React TypeScript) trên **Windows Server 2012 R2**.

---

## 1. Cấu Hình Backend .NET & Tương Thích SQL Server 2008

### 1.1 Cấu hình DbContext trong EF Core (BẮT BUỘC)
Khi sử dụng Entity Framework Core với SQL Server 2008 / 2008 R2, bắt buộc phải cấu hình `UseCompatibilityLevel(100)`. Nếu thiếu cấu hình này, EF Core sẽ tự động sinh lệnh `OFFSET...FETCH` gây crash runtime:

```csharp
// Program.cs hoặc DependencyInjection.cs
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions =>
        {
            // Bắt buộc: Tương thích SQL Server 2008 / 2008 R2
            sqlOptions.UseCompatibilityLevel(100);
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(5),
                errorNumbersToAdd: null);
        });
});
```

### 1.2 Viết Truy Vấn Đọc Dữ Liệu Tối Ưu (AsNoTracking)
Luôn dùng `.AsNoTracking()` cho tất cả các truy vấn chỉ đọc (read-only) để không tốn RAM track entity:

```csharp
public async Task<PagedResult<OrderDto>> GetOrdersAsync(GetOrdersQuery query, CancellationToken cancellationToken)
{
    var baseQuery = _dbContext.Orders
        .AsNoTracking()
        .Where(x => x.TenantId == query.TenantId);

    if (!string.IsNullOrWhiteSpace(query.Keyword))
    {
        baseQuery = baseQuery.Where(x => x.OrderCode.Contains(query.Keyword));
    }

    var totalCount = await baseQuery.CountAsync(cancellationToken);

    var items = await baseQuery
        .OrderByDescending(x => x.CreatedAt)
        .Skip((query.PageIndex - 1) * query.PageSize)
        .Take(query.PageSize)
        .Select(x => new OrderDto
        {
            Id = x.Id,
            OrderCode = x.OrderCode,
            CustomerName = x.CustomerName,
            TotalAmount = x.TotalAmount,
            Status = x.Status,
            CreatedAt = x.CreatedAt
        })
        .ToListAsync(cancellationToken);

    return new PagedResult<OrderDto>(items, totalCount, query.PageIndex, query.PageSize);
}
```

### 1.3 Truy Vấn Dữ Liệu Lớn & Báo Cáo Phức Tạp (Dapper + SQL 2008)
Đối với các báo cáo aggregation hoặc xử lý hàng triệu bản ghi, sử dụng Dapper với cú pháp `ROW_NUMBER() OVER()`:

```csharp
public async Task<PagedResult<ReportItemDto>> GetReportAsync(ReportFilter filter, CancellationToken ct)
{
    using var connection = new SqlConnection(_connectionString);
    await connection.OpenAsync(ct);

    var sql = @"
        WITH PagedData AS (
            SELECT 
                o.Id, o.OrderCode, o.TotalAmount, o.CreatedAt, u.FullName AS StaffName,
                ROW_NUMBER() OVER (ORDER BY o.CreatedAt DESC) AS RowNum
            FROM Orders o WITH (NOLOCK)
            INNER JOIN Users u WITH (NOLOCK) ON o.CreatedByUserId = u.Id
            WHERE o.TenantId = @TenantId
              AND (@Status IS NULL OR o.Status = @Status)
              AND (@FromDate IS NULL OR o.CreatedAt >= @FromDate)
              AND (@ToDate IS NULL OR o.CreatedAt <= @ToDate)
        )
        SELECT * FROM PagedData 
        WHERE RowNum BETWEEN ((@PageIndex - 1) * @PageSize + 1) AND (@PageIndex * @PageSize);

        SELECT COUNT(1) 
        FROM Orders WITH (NOLOCK)
        WHERE TenantId = @TenantId
          AND (@Status IS NULL OR Status = @Status)
          AND (@FromDate IS NULL OR CreatedAt >= @FromDate)
          AND (@ToDate IS NULL OR CreatedAt <= @ToDate);";

    using var multi = await connection.QueryMultipleAsync(new CommandDefinition(
        sql, 
        new { filter.TenantId, filter.Status, filter.FromDate, filter.ToDate, filter.PageIndex, filter.PageSize }, 
        cancellationToken: ct));

    var items = (await multi.ReadAsync<ReportItemDto>()).ToList();
    var totalCount = await multi.ReadFirstAsync<int>();

    return new PagedResult<ReportItemDto>(items, totalCount, filter.PageIndex, filter.PageSize);
}
```

---

## 2. Bảo Mật & Kiểm Soát Truy Cập Backend

### 2.1 Phân Quyền Granular Permission (Policy-based Authorization)
Mọi Controller/Action đều phải được bảo vệ bằng Policy:

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize] // Bắt buộc đăng nhập
public class OrdersController : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = "orders.view")]
    public async Task<IActionResult> GetOrders([FromQuery] GetOrdersQuery query) => ...

    [HttpPost]
    [Authorize(Policy = "orders.create")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderCommand command) => ...

    [HttpDelete("{id}")]
    [Authorize(Policy = "orders.delete")]
    public async Task<IActionResult> DeleteOrder(long id) => ...
}
```

### 2.2 Chống Lỗ Hổng BOLA / IDOR (Data-level Security)
Tuyệt đối không query dữ liệu chỉ dựa trên `id` do client gửi lên:

```csharp
// ❌ NGUY HIỂM (Dễ bị IDOR / BOLA):
var order = await _dbContext.Orders.FirstOrDefaultAsync(x => x.Id == id);

// ✅ AN TOÀN (Ràng buộc TenantId / CurrentUserId):
var currentUserId = User.GetUserId();
var currentTenantId = User.GetTenantId();

var order = await _dbContext.Orders
    .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == currentTenantId);

if (order == null)
{
    return NotFound(new { message = "Bản ghi không tồn tại hoặc bạn không có quyền truy cập." });
}
```

### 2.3 Async/Await Chống Nghẽn Thread Pool (Thread Starvation)
Trên Windows Server 2012 R2 và IIS, việc gọi `.Result` hoặc `.Wait()` đồng bộ sẽ làm cạn kiệt Thread Pool và làm đơ toàn bộ server:
- **100% Code I/O** (DB, Cache, File, HTTP Call) phải là `async/await`.
- Luôn truyền `CancellationToken` xuống các tầng truy vấn Database.

### 2.4 Caching Giảm Tải Cho SQL Server 2008
Sử dụng `IMemoryCache` hoặc Redis để cache ma trận quyền và dữ liệu danh mục (Master Data):

```csharp
public async Task<List<string>> GetUserPermissionsAsync(long userId)
{
    string cacheKey = $"user_perms_{userId}";
    if (!_memoryCache.TryGetValue(cacheKey, out List<string> permissions))
    {
        permissions = await _dbContext.UserRoles
            .Where(ur => ur.UserId == userId)
            .SelectMany(ur => ur.Role.RolePermissions)
            .Select(rp => rp.Permission.PermissionCode)
            .Distinct()
            .ToListAsync();

        var cacheOptions = new MemoryCacheEntryOptions()
            .SetSlidingExpiration(TimeSpan.FromMinutes(15))
            .SetAbsoluteExpiration(TimeSpan.FromHours(1));

        _memoryCache.Set(cacheKey, permissions, cacheOptions);
    }
    return permissions;
}
```

---

## 3. Lập Trình Frontend React TypeScript Type-Safe

### 3.1 Cấu Trúc Dự Án Chuẩn
```
src/
├── api/             # Axios instance & API services
├── assets/          # Icons, images, global styles
├── components/      # Reusable UI components (Button, Table, Modal...)
├── contexts/        # AuthContext, ThemeContext
├── hooks/           # usePermission, useDebounce, usePagination
├── pages/           # Page components theo module (Orders, Users...)
├── routes/          # AppRoutes, PrivateRoute, PermissionRoute
├── types/           # TypeScript interfaces & DTOs
└── utils/           # Formatters, constants, helpers
```

### 3.2 Axios Interceptor Xử Lý Token & Lỗi 401/403
```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject Bearer Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept 401 / 403 Response
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Điều hướng đến trang 403 hoặc hiển thị Toast thông báo từ chối truy cập
      console.error('Bạn không có quyền thực hiện thao tác này.');
    }
    return Promise.reject(error);
  }
);
```

---

## 4. Checklist Hoàn Thành Phát Triển (Develop Checklist)

- [ ] Backend đã bật `sqlOptions.UseCompatibilityLevel(100)` trong cấu hình SQL Server.
- [ ] Tất cả các API Query chỉ đọc đều có `.AsNoTracking()`.
- [ ] 100% các endpoint danh sách đều được phân trang ở Database (Server-side Pagination).
- [ ] 100% Controller/Action có gắn `[Authorize(Policy = "...")]`.
- [ ] Các truy vấn dữ liệu nhạy cảm có điều kiện `TenantId` / `UserId` chống IDOR.
- [ ] Sử dụng `async/await` xuyên suốt, không có `.Result` hay `.Wait()`.
- [ ] Frontend có type-safe DTOs và Axios interceptor đầy đủ.
