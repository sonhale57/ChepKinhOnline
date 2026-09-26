using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ChepKinh.Api.Models;

namespace ChepKinh.Api.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            await context.Database.EnsureCreatedAsync();

            // SQL Server 2008 compatible schema patch for UserSutraAttempts
            const string schemaPatchSql = @"
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('UserSutraAttempts') AND name = 'CompletedChunksJson')
                BEGIN
                    ALTER TABLE UserSutraAttempts ADD CompletedChunksJson NVARCHAR(MAX) NOT NULL DEFAULT '[]';
                END
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('UserSutraAttempts') AND name = 'CurrentChunkIndex')
                BEGIN
                    ALTER TABLE UserSutraAttempts ADD CurrentChunkIndex INT NOT NULL DEFAULT 0;
                END
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('UserSutraAttempts') AND name = 'CurrentPageNumber')
                BEGIN
                    ALTER TABLE UserSutraAttempts ADD CurrentPageNumber INT NOT NULL DEFAULT 1;
                END
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('UserSutraAttempts') AND name = 'TotalNotebookPages')
                BEGIN
                    ALTER TABLE UserSutraAttempts ADD TotalNotebookPages INT NOT NULL DEFAULT 1;
                END
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'DailyReminderTime')
                BEGIN
                    ALTER TABLE Users ADD DailyReminderTime NVARCHAR(10) NULL DEFAULT '20:00';
                END
                IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'IsReminderEnabled')
                BEGIN
                    ALTER TABLE Users ADD IsReminderEnabled BIT NOT NULL DEFAULT 1;
                END
            ";
            try
            {
                await context.Database.ExecuteSqlRawAsync(schemaPatchSql);
            }
            catch
            {
                // ignore if already migrated
            }

            // 1. Seed Roles
            if (!await context.Roles.AnyAsync())
            {
                var adminRole = new Role { RoleName = "ADMIN", Description = "Quản trị viên toàn quyền hệ thống" };
                var userRole = new Role { RoleName = "USER", Description = "Người dùng chép kinh" };
                context.Roles.AddRange(adminRole, userRole);
                await context.SaveChangesAsync();
            }

            // 2. Seed Permissions
            if (!await context.Permissions.AnyAsync())
            {
                var permissions = new List<Permission>
                {
                    new() { PermissionCode = "sutras.view", ModuleName = "Sutras", Description = "Xem danh sách và nội dung kinh" },
                    new() { PermissionCode = "sutras.manage", ModuleName = "Sutras", Description = "Quản trị kinh (Thêm, sửa, xóa, xuất bản)" },
                    new() { PermissionCode = "users.view", ModuleName = "Users", Description = "Xem danh sách người dùng" },
                    new() { PermissionCode = "users.manage", ModuleName = "Users", Description = "Khóa / Mở khóa người dùng" },
                    new() { PermissionCode = "reports.view", ModuleName = "Reports", Description = "Xem báo cáo thống kê tiến độ" },
                    new() { PermissionCode = "ink.sync", ModuleName = "DigitalInk", Description = "Lưu và đồng bộ nét viết tay" }
                };
                context.Permissions.AddRange(permissions);
                await context.SaveChangesAsync();

                // Gán quyền cho ADMIN
                var adminRole = await context.Roles.FirstAsync(r => r.RoleName == "ADMIN");
                foreach (var p in permissions)
                {
                    context.RolePermissions.Add(new RolePermission { RoleId = adminRole.Id, PermissionId = p.Id });
                }

                // Gán quyền cho USER
                var userRole = await context.Roles.FirstAsync(r => r.RoleName == "USER");
                var userPermCodes = new[] { "sutras.view", "ink.sync" };
                foreach (var p in permissions.Where(x => userPermCodes.Contains(x.PermissionCode)))
                {
                    context.RolePermissions.Add(new RolePermission { RoleId = userRole.Id, PermissionId = p.Id });
                }

                await context.SaveChangesAsync();
            }

            // 3. Seed Default Admin
            if (!await context.Users.AnyAsync(u => u.UserType == "Admin"))
            {
                var adminUser = new User
                {
                    Email = "admin@chepkinh.vn",
                    FullName = "Hệ Thống Quản Trị",
                    UserType = "Admin",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123456"),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Users.Add(adminUser);
                await context.SaveChangesAsync();

                var adminRole = await context.Roles.FirstAsync(r => r.RoleName == "ADMIN");
                context.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = adminRole.Id });
                await context.SaveChangesAsync();
            }

            // 4. Seed Mẫu Bộ Kinh: Bát Nhã Ba La Mật Đa Tâm Kinh (Quốc ngữ)
            if (!await context.Sutras.AnyAsync())
            {
                var batNhaSutra = new Sutra
                {
                    Title = "Bát Nhã Ba La Mật Đa Tâm Kinh",
                    Description = "Bản dịch nghĩa Tiếng Việt phổ biến của Hòa Thượng Thích Thanh Từ, giúp khai mở trí tuệ Bát Nhã.",
                    ScriptType = "QUOC_NGU",
                    OriginalSource = "Kinh Điển Đại Thừa",
                    TotalWords = 260,
                    TotalPages = 2,
                    IsPublished = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Sutras.Add(batNhaSutra);
                await context.SaveChangesAsync();

                var page1Content = "Khi Quán Tự Tại Bồ Tát hành sâu Bát nhã Ba la mật đa thời soi thấy năm uẩn đều không, liền qua hết thảy khổ ách. Này Xá Lợi Tử! Sắc chẳng khác không, không chẳng khác sắc; sắc tức là không, không tức là sắc. Thọ, tưởng, hành, thức cũng lại như thế. Này Xá Lợi Tử! Tướng không của các pháp: chẳng sanh chẳng diệt, chẳng nhơ chẳng sạch, chẳng thêm chẳng bớt.";
                var page2Content = "Cho nên trong tướng không không có sắc, không có thọ, tưởng, hành, thức; không có mắt, tai, mũi, lưỡi, thân, ý; không có sắc, thanh, hương, vị, xúc, pháp; không có giới hạn của mắt cho đến không có giới hạn của ý thức; không có vô minh cũng không có hết vô minh, cho đến không có già chết cũng không có hết già chết; không có khổ, tập, diệt, đạo; không có trí huệ cũng không có đắc được.";

                context.SutraPages.AddRange(
                    new SutraPage
                    {
                        SutraId = batNhaSutra.Id,
                        PageNumber = 1,
                        ContentText = page1Content,
                        TotalWordsOnPage = 130,
                        LineCount = 8,
                        DefaultFontSize = 26,
                        DefaultGridType = "GRID_OLY"
                    },
                    new SutraPage
                    {
                        SutraId = batNhaSutra.Id,
                        PageNumber = 2,
                        ContentText = page2Content,
                        TotalWordsOnPage = 130,
                        LineCount = 8,
                        DefaultFontSize = 26,
                        DefaultGridType = "GRID_OLY"
                    }
                );

                // Thêm mẫu Kinh Chú Đại Bi (Phiên âm Phạn / Âm Hán Việt)
                var chuDaiBi = new Sutra
                {
                    Title = "Chú Đại Bi (Thiên Thủ Thiên Nhãn)",
                    Description = "Chân ngôn linh ứng của Đức Bồ Tát Quán Thế Âm cứu khổ ban vui.",
                    ScriptType = "QUOC_NGU",
                    OriginalSource = "Mật Tông Đại Thừa",
                    TotalWords = 420,
                    TotalPages = 3,
                    IsPublished = true,
                    CreatedAt = DateTime.UtcNow
                };
                context.Sutras.Add(chuDaiBi);
                await context.SaveChangesAsync();

                var daiBiPage1 = "Nam mô Hắc ra đát na đa ra dạ da. Nam mô A rị da, bà lô kiết đế, thước bát ra da, bồ đề tát đỏa bà da, ma ha tát đỏa bà da, ma ha ca lô ni ca da. Án, tát bàn ra phạt duệ, số đát na đát tỏa. Nam mô Tất kiết lật đỏa, y mông a rị da, bà lô kiết đế thất Phật ra lăng đà bà. Nam mô Na ra cẩn trì, hê rị ma ha bàn đà sa mế, tát bà a tha đậu du bằng, a thệ dựng.";
                var daiBiPage2 = "Tát bà tát đa, na ma bà tát đa, na ma bà già, ma phạt đạt đậu, đát điệt tha. Án, a bà lô hê, lô ca đế, ca ra đế, di hê rị, ma ha bồ đề tát đỏa, tát bà tát bà, ma ra ma ra, ma hê ma hê, rị đà dựng, cu lô cu lô kiết mông, độ lô độ lô phạt xà da đế, ma ha phạt xà da đế, đà ra đà ra, địa rị ni, thất Phật ra da.";
                var daiBiPage3 = "Giá ra giá ra, ma ma phạt ma ra, mục đế lệ, y hê y hê, thất na thất na, a ra sâm Phật ra xá lợi, phạt sa phạt sâm, Phật ra xá da, hô lô hô lô ma ra, hô lô hô lô hê rị, ta ra ta ra, tất rị tất rị, tô rô tô rô, bồ đề dạ bồ đề dạ, bồ đà dạ bồ đà dạ, di đế rị dạ, na ra cẩn trì, địa rị sắc ni na, ba dạ ma na ta bà ha.";

                context.SutraPages.AddRange(
                    new SutraPage { SutraId = chuDaiBi.Id, PageNumber = 1, ContentText = daiBiPage1, TotalWordsOnPage = 140, LineCount = 8, DefaultFontSize = 26, DefaultGridType = "GRID_OLY" },
                    new SutraPage { SutraId = chuDaiBi.Id, PageNumber = 2, ContentText = daiBiPage2, TotalWordsOnPage = 140, LineCount = 8, DefaultFontSize = 26, DefaultGridType = "GRID_OLY" },
                    new SutraPage { SutraId = chuDaiBi.Id, PageNumber = 3, ContentText = daiBiPage3, TotalWordsOnPage = 140, LineCount = 8, DefaultFontSize = 26, DefaultGridType = "GRID_OLY" }
                );

                await context.SaveChangesAsync();
            }
        }
    }
}
