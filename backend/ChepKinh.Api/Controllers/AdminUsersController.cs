using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ChepKinh.Api.Data;
using ChepKinh.Api.DTOs;

namespace ChepKinh.Api.Controllers
{
    [ApiController]
    [Route("api/admin/users")]
    [Authorize(Roles = "ADMIN")]
    public class AdminUsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminUsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<PagedResult<AdminUserListDto>>>> GetUsers(
            [FromQuery] int pageIndex = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? keyword = null,
            CancellationToken ct = default)
        {
            if (pageIndex < 1) pageIndex = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var query = _context.Users.AsNoTracking().Where(u => u.UserType == "User");

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                var kw = keyword.Trim().ToLower();
                query = query.Where(u => u.FullName.ToLower().Contains(kw) || u.Email.ToLower().Contains(kw));
            }

            var totalCount = await query.CountAsync(ct);
            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            var rawItems = await query
                .OrderByDescending(u => u.CreatedAt)
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .Select(u => new
                {
                    u.Id,
                    u.Email,
                    u.FullName,
                    u.AvatarUrl,
                    u.UserType,
                    u.IsActive,
                    IsGoogleAccount = !string.IsNullOrEmpty(u.GoogleId),
                    u.CreatedAt,
                    TotalSutrasJoined = u.Attempts.Select(a => a.SutraId).Distinct().Count(),
                    TotalWordsWritten = u.Attempts.Sum(a => (long)a.CompletedWords)
                })
                .ToListAsync(ct);

            var items = rawItems.Select(u => new AdminUserListDto
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                AvatarUrl = u.AvatarUrl,
                UserType = u.UserType,
                IsActive = u.IsActive,
                IsGoogleAccount = u.IsGoogleAccount,
                CreatedAt = u.CreatedAt,
                TotalSutrasJoined = u.TotalSutrasJoined,
                TotalWordsWritten = u.TotalWordsWritten
            }).ToList();

            var result = new PagedResult<AdminUserListDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageIndex = pageIndex,
                PageSize = pageSize
            };

            return Ok(ApiResponse<PagedResult<AdminUserListDto>>.Ok(result, "Tải danh sách người dùng thành công."));
        }

        [HttpPost("{id}/toggle-status")]
        public async Task<ActionResult<ApiResponse<bool>>> ToggleUserStatus(long id, CancellationToken ct)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
            if (user == null)
            {
                return NotFound(ApiResponse<bool>.Fail("Người dùng không tồn tại."));
            }

            user.IsActive = !user.IsActive;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);

            return Ok(ApiResponse<bool>.Ok(user.IsActive, user.IsActive ? "Đã kích hoạt tài khoản." : "Đã tạm khóa tài khoản."));
        }
    }
}
