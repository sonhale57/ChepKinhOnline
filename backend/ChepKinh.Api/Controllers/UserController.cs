using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;
using ChepKinh.Api.Data;
using ChepKinh.Api.DTOs;

namespace ChepKinh.Api.Controllers
{
    [ApiController]
    [Route("api/user")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public UserController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        private long GetCurrentUserId()
        {
            var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!long.TryParse(idStr, out var id))
            {
                throw new UnauthorizedAccessException("Không xác định được danh tính người dùng.");
            }
            return id;
        }

        [HttpGet("profile")]
        public async Task<ActionResult<ApiResponse<UserProfileDto>>> GetUserProfile(CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct);
            if (user == null)
            {
                return NotFound(ApiResponse<UserProfileDto>.Fail("Không tìm thấy thông tin người dùng."));
            }

            var attempts = await _context.UserSutraAttempts
                .AsNoTracking()
                .Where(a => a.UserId == userId)
                .ToListAsync(ct);

            var totalSutrasJoined = attempts.Select(a => a.SutraId).Distinct().Count();
            var totalSutrasCompleted = attempts.Count(a => a.Status == "COMPLETED");
            var totalWordsWritten = attempts.Sum(a => (long)a.CompletedWords);

            var totalPagesWritten = await _context.UserPageStrokes
                .AsNoTracking()
                .CountAsync(ps => ps.UserId == userId && ps.StrokesDataJson != "[]" && !string.IsNullOrEmpty(ps.StrokesDataJson), ct);

            var profile = new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                AvatarUrl = user.AvatarUrl,
                CreatedAt = user.CreatedAt,
                TotalSutrasJoined = totalSutrasJoined,
                TotalSutrasCompleted = totalSutrasCompleted,
                TotalPagesWritten = totalPagesWritten,
                TotalWordsWritten = totalWordsWritten
            };

            return Ok(ApiResponse<UserProfileDto>.Ok(profile, "Lấy thông tin cá nhân thành công."));
        }

        [HttpPut("profile")]
        public async Task<ActionResult<ApiResponse<UserProfileDto>>> UpdateProfile([FromBody] UpdateProfileDto dto, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
            if (user == null)
            {
                return NotFound(ApiResponse<UserProfileDto>.Fail("Không tìm thấy thông tin người dùng."));
            }

            if (string.IsNullOrWhiteSpace(dto.FullName))
            {
                return BadRequest(ApiResponse<UserProfileDto>.Fail("Họ tên không được để trống."));
            }

            user.FullName = dto.FullName.Trim();
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);

            return await GetUserProfile(ct);
        }

        [HttpPost("upload-avatar")]
        [RequestSizeLimit(10_000_000)] // 10MB
        public async Task<ActionResult<ApiResponse<string>>> UploadAvatar(IFormFile file, CancellationToken ct)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(ApiResponse<string>.Fail("Vui lòng chọn hình ảnh đại diện hợp lệ."));
            }

            var userId = GetCurrentUserId();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
            if (user == null)
            {
                return NotFound(ApiResponse<string>.Fail("Người dùng không tồn tại."));
            }

            var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var uploadDir = Path.Combine(webRoot, "uploads", "avatars");
            if (!Directory.Exists(uploadDir))
            {
                Directory.CreateDirectory(uploadDir);
            }

            var fileName = $"avatar_{userId}_{DateTime.UtcNow.Ticks}.webp";
            var filePath = Path.Combine(uploadDir, fileName);

            try
            {
                using var inStream = file.OpenReadStream();
                using var image = await Image.LoadAsync(inStream, ct);

                // Tối ưu hóa kích thước & crop vuông 300x300
                image.Mutate(x => x.Resize(new ResizeOptions
                {
                    Size = new Size(300, 300),
                    Mode = ResizeMode.Crop
                }));

                // Nén và chuyển đổi sang định dạng WebP chất lượng cao dung lượng cực nhẹ
                var encoder = new WebpEncoder
                {
                    Quality = 82,
                    Method = WebpEncodingMethod.BestQuality
                };

                await image.SaveAsync(filePath, encoder, ct);

                // Xóa avatar cũ nếu là file cục bộ
                if (!string.IsNullOrEmpty(user.AvatarUrl) && user.AvatarUrl.StartsWith("/uploads/avatars/"))
                {
                    var oldFilePath = Path.Combine(webRoot, user.AvatarUrl.TrimStart('/'));
                    if (System.IO.File.Exists(oldFilePath))
                    {
                        try { System.IO.File.Delete(oldFilePath); } catch { /* ignore */ }
                    }
                }

                var relativeUrl = $"/uploads/avatars/{fileName}";
                user.AvatarUrl = relativeUrl;
                user.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync(ct);

                return Ok(ApiResponse<string>.Ok(relativeUrl, "Tải lên và tối ưu hóa Avatar WebP thành công."));
            }
            catch (Exception ex)
            {
                return BadRequest(ApiResponse<string>.Fail($"Không thể xử lý hình ảnh: {ex.Message}"));
            }
        }

        [HttpGet("my-sutras")]
        public async Task<ActionResult<ApiResponse<List<MySutraAttemptDto>>>> GetMySutras(CancellationToken ct)
        {
            var userId = GetCurrentUserId();

            var attempts = await _context.UserSutraAttempts
                .AsNoTracking()
                .Include(a => a.Sutra)
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.StartedAt)
                .ToListAsync(ct);

            var result = attempts.Select(a => new MySutraAttemptDto
            {
                AttemptId = a.Id,
                SutraId = a.SutraId,
                Title = a.Sutra.Title,
                Description = a.Sutra.Description,
                ScriptType = a.Sutra.ScriptType,
                TotalWords = a.TotalWords > 0 ? a.TotalWords : a.Sutra.TotalWords,
                TotalPages = a.TotalNotebookPages > 0 ? a.TotalNotebookPages : a.Sutra.TotalPages,
                AttemptNumber = a.AttemptNumber,
                CompletedWords = a.CompletedWords,
                ProgressPercent = Math.Round(a.ProgressPercent, 1),
                Status = a.Status,
                CurrentPageNumber = a.CurrentPageNumber,
                StartedAt = a.StartedAt,
                CompletedAt = a.CompletedAt
            }).ToList();

            return Ok(ApiResponse<List<MySutraAttemptDto>>.Ok(result, "Lấy danh sách kinh đã chép thành công."));
        }

        [HttpGet("streak-status")]
        public async Task<ActionResult<ApiResponse<UserStreakDto>>> GetStreakStatus(CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct);
            if (user == null) return NotFound(ApiResponse<UserStreakDto>.Fail("Không tìm thấy người dùng."));

            // Múi giờ Việt Nam UTC+7
            var vnNow = DateTime.UtcNow.AddHours(7);
            var vnToday = vnNow.Date;

            // 1. Lấy tất cả các ngày có phát sinh nét viết hoặc khởi tạo / hoàn thành lượt chép
            var strokeDatesUtc = await _context.UserPageStrokes
                .AsNoTracking()
                .Where(ps => ps.UserId == userId && ps.StrokesDataJson != "[]" && !string.IsNullOrEmpty(ps.StrokesDataJson))
                .Select(ps => ps.UpdatedAt)
                .ToListAsync(ct);

            var attemptDatesUtc = await _context.UserSutraAttempts
                .AsNoTracking()
                .Where(a => a.UserId == userId)
                .Select(a => a.StartedAt)
                .ToListAsync(ct);

            var allDatesVn = strokeDatesUtc.Concat(attemptDatesUtc)
                .Select(d => d.AddHours(7).Date)
                .Distinct()
                .OrderByDescending(d => d)
                .ToList();

            bool practicedToday = allDatesVn.Contains(vnToday);

            // 2. Tính Chuỗi ngày tinh tấn hiện tại (Current Streak)
            int currentStreak = 0;
            var checkDate = practicedToday ? vnToday : vnToday.AddDays(-1);

            while (allDatesVn.Contains(checkDate))
            {
                currentStreak++;
                checkDate = checkDate.AddDays(-1);
            }

            // 3. Tính Chuỗi ngày dài nhất (Longest Streak)
            int longestStreak = 0;
            if (allDatesVn.Count > 0)
            {
                var sortedAsc = allDatesVn.OrderBy(d => d).ToList();
                int tempStreak = 1;
                longestStreak = 1;
                for (int i = 1; i < sortedAsc.Count; i++)
                {
                    if (sortedAsc[i] == sortedAsc[i - 1].AddDays(1))
                    {
                        tempStreak++;
                        if (tempStreak > longestStreak) longestStreak = tempStreak;
                    }
                    else
                    {
                        tempStreak = 1;
                    }
                }
            }

            // Danh sách các ngày trong 30 ngày gần nhất
            var last30Days = Enumerable.Range(0, 30).Select(offset => vnToday.AddDays(-offset)).ToList();
            var practicedDatesStrings = allDatesVn
                .Where(d => last30Days.Contains(d))
                .Select(d => d.ToString("yyyy-MM-dd"))
                .ToList();

            var result = new UserStreakDto
            {
                CurrentStreakDays = currentStreak,
                LongestStreakDays = Math.Max(longestStreak, currentStreak),
                PracticedToday = practicedToday,
                DailyReminderTime = user.DailyReminderTime ?? "20:00",
                IsReminderEnabled = user.IsReminderEnabled,
                PracticeDatesThisMonth = practicedDatesStrings
            };

            return Ok(ApiResponse<UserStreakDto>.Ok(result, "Lấy thông tin chuỗi ngày tinh tấn thành công."));
        }

        [HttpPost("reminder-settings")]
        public async Task<ActionResult<ApiResponse<bool>>> UpdateReminderSettings([FromBody] UpdateReminderSettingsDto dto, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
            if (user == null) return NotFound(ApiResponse<bool>.Fail("Không tìm thấy người dùng."));

            user.DailyReminderTime = dto.DailyReminderTime ?? "20:00";
            user.IsReminderEnabled = dto.IsReminderEnabled;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);

            return Ok(ApiResponse<bool>.Ok(true, "Cập nhật cài đặt nhắc nhở công phu thành công."));
        }
    }
}
