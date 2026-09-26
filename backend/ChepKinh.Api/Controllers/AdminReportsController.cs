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
    [Route("api/admin/reports")]
    [Authorize(Roles = "ADMIN")]
    public class AdminReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("dashboard-stats")]
        public async Task<ActionResult<ApiResponse<DashboardStatsDto>>> GetDashboardStats(CancellationToken ct)
        {
            var totalUsers = await _context.Users.CountAsync(u => u.UserType == "User", ct);
            var totalParticipants = await _context.UserSutraAttempts.Select(a => a.UserId).Distinct().CountAsync(ct);
            var totalAttempts = await _context.UserSutraAttempts.CountAsync(ct);
            var totalCompletedAttempts = await _context.UserSutraAttempts.CountAsync(a => a.Status == "COMPLETED", ct);
            var totalPagesWritten = await _context.UserPageStrokes.CountAsync(ps => ps.StrokesDataJson != "[]" && !string.IsNullOrEmpty(ps.StrokesDataJson), ct);
            var totalWordsWritten = await _context.UserSutraAttempts.SumAsync(a => (long)a.CompletedWords, ct);

            // Thống kê từng bộ kinh
            var sutras = await _context.Sutras
                .AsNoTracking()
                .Select(s => new
                {
                    s.Id,
                    s.Title,
                    s.ScriptType,
                    s.TotalWords,
                    s.TotalPages,
                    ParticipantCount = s.Attempts.Select(a => a.UserId).Distinct().Count(),
                    TotalAttempts = s.Attempts.Count(),
                    CompletedAttempts = s.Attempts.Count(a => a.Status == "COMPLETED"),
                    AvgProgress = s.Attempts.Any() ? s.Attempts.Average(a => a.ProgressPercent) : 0
                })
                .ToListAsync(ct);

            var sutraStats = sutras.Select(s => new SutraReportDto
            {
                SutraId = s.Id,
                Title = s.Title,
                ScriptType = s.ScriptType,
                TotalWords = s.TotalWords,
                TotalPages = s.TotalPages,
                ParticipantCount = s.ParticipantCount,
                TotalAttempts = s.TotalAttempts,
                CompletedAttempts = s.CompletedAttempts,
                AvgProgressPercent = Math.Round(s.AvgProgress, 1)
            }).ToList();

            // Hoạt động gần đây (Top 15 attempts gần nhất)
            var recentAttempts = await _context.UserSutraAttempts
                .AsNoTracking()
                .Include(a => a.User)
                .Include(a => a.Sutra)
                .OrderByDescending(a => a.StartedAt)
                .Take(15)
                .Select(a => new RecentActivityDto
                {
                    AttemptId = a.Id,
                    UserName = a.User.FullName,
                    UserAvatar = a.User.AvatarUrl,
                    SutraTitle = a.Sutra.Title,
                    ProgressPercent = Math.Round(a.ProgressPercent, 1),
                    Status = a.Status,
                    StartedAt = a.StartedAt,
                    CompletedAt = a.CompletedAt
                })
                .ToListAsync(ct);

            var result = new DashboardStatsDto
            {
                TotalUsers = totalUsers,
                TotalParticipants = totalParticipants,
                TotalAttempts = totalAttempts,
                TotalCompletedAttempts = totalCompletedAttempts,
                TotalPagesWritten = totalPagesWritten,
                TotalWordsWritten = totalWordsWritten,
                SutraStats = sutraStats,
                RecentActivities = recentAttempts
            };

            return Ok(ApiResponse<DashboardStatsDto>.Ok(result, "Tải báo cáo thống kê thành công."));
        }
    }
}
