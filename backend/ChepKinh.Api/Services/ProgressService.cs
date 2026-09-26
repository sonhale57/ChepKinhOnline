using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ChepKinh.Api.Data;
using ChepKinh.Api.DTOs;
using ChepKinh.Api.Models;

namespace ChepKinh.Api.Services
{
    public interface IProgressService
    {
        Task<AttemptDto> GetOrCreateActiveAttemptAsync(long userId, int sutraId, CancellationToken ct = default);
        Task<AttemptDto?> GetAttemptByIdAsync(long userId, long attemptId, CancellationToken ct = default);
        Task<List<AttemptDto>> GetUserAttemptsAsync(long userId, int? sutraId, CancellationToken ct = default);
        Task<PageStrokesResponseDto?> GetPageStrokesAsync(long userId, long attemptId, long pageId, CancellationToken ct = default);
        Task<PageStrokesResponseDto> SavePageStrokesAsync(long userId, SavePageStrokesDto dto, CancellationToken ct = default);
        Task<AttemptDto> UpdateAttemptProgressAsync(long userId, UpdateAttemptProgressDto dto, CancellationToken ct = default);
        Task<AttemptDto> CompletePageAsync(long userId, CompletePageDto dto, CancellationToken ct = default);
        Task<AttemptDto> StartNewAttemptAsync(long userId, int sutraId, CancellationToken ct = default);
    }

    public class ProgressService : IProgressService
    {
        private readonly ApplicationDbContext _context;

        public ProgressService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<AttemptDto> GetOrCreateActiveAttemptAsync(long userId, int sutraId, CancellationToken ct = default)
        {
            var sutra = await _context.Sutras.FindAsync(new object[] { sutraId }, ct);
            if (sutra == null) throw new ArgumentException("Bộ kinh không tồn tại.");

            var activeAttempt = await _context.UserSutraAttempts
                .Include(a => a.Sutra)
                .Where(a => a.UserId == userId && a.SutraId == sutraId && a.Status == "IN_PROGRESS")
                .OrderByDescending(a => a.AttemptNumber)
                .FirstOrDefaultAsync(ct);

            if (activeAttempt != null)
            {
                return MapToAttemptDto(activeAttempt);
            }

            // Tìm số thứ tự lượt mới nhất
            var lastAttemptNumber = await _context.UserSutraAttempts
                .Where(a => a.UserId == userId && a.SutraId == sutraId)
                .MaxAsync(a => (int?)a.AttemptNumber, ct) ?? 0;

            var newAttempt = new UserSutraAttempt
            {
                UserId = userId,
                SutraId = sutraId,
                AttemptNumber = lastAttemptNumber + 1,
                CompletedWords = 0,
                TotalWords = sutra.TotalWords,
                ProgressPercent = 0,
                CompletedChunksJson = "[]",
                CurrentChunkIndex = 0,
                CurrentPageNumber = 1,
                TotalNotebookPages = Math.Max(1, sutra.TotalPages),
                Status = "IN_PROGRESS",
                StartedAt = DateTime.UtcNow
            };

            _context.UserSutraAttempts.Add(newAttempt);
            await _context.SaveChangesAsync(ct);

            newAttempt.Sutra = sutra;
            return MapToAttemptDto(newAttempt);
        }

        public async Task<AttemptDto?> GetAttemptByIdAsync(long userId, long attemptId, CancellationToken ct = default)
        {
            var attempt = await _context.UserSutraAttempts
                .AsNoTracking()
                .Include(a => a.Sutra)
                .Where(a => a.UserId == userId && a.Id == attemptId)
                .FirstOrDefaultAsync(ct);

            if (attempt == null) return null;
            return MapToAttemptDto(attempt);
        }

        public async Task<List<AttemptDto>> GetUserAttemptsAsync(long userId, int? sutraId, CancellationToken ct = default)
        {
            var query = _context.UserSutraAttempts
                .AsNoTracking()
                .Include(a => a.Sutra)
                .Where(a => a.UserId == userId);

            if (sutraId.HasValue)
            {
                query = query.Where(a => a.SutraId == sutraId.Value);
            }

            var attempts = await query
                .OrderByDescending(a => a.StartedAt)
                .ToListAsync(ct);

            return attempts.Select(MapToAttemptDto).ToList();
        }

        public async Task<PageStrokesResponseDto?> GetPageStrokesAsync(long userId, long attemptId, long pageId, CancellationToken ct = default)
        {
            var stroke = await _context.UserPageStrokes
                .AsNoTracking()
                .FirstOrDefaultAsync(ps => ps.UserId == userId && ps.AttemptId == attemptId && ps.PageId == pageId, ct);

            if (stroke == null) return null;

            return new PageStrokesResponseDto
            {
                Id = stroke.Id,
                AttemptId = stroke.AttemptId,
                PageId = stroke.PageId,
                StrokesDataJson = stroke.StrokesDataJson,
                IsPageCompleted = stroke.IsPageCompleted,
                UpdatedAt = stroke.UpdatedAt
            };
        }

        public async Task<PageStrokesResponseDto> SavePageStrokesAsync(long userId, SavePageStrokesDto dto, CancellationToken ct = default)
        {
            // Xác thực Attempt thuộc về User (chống IDOR)
            var attempt = await _context.UserSutraAttempts
                .Include(a => a.Sutra)
                .FirstOrDefaultAsync(a => a.Id == dto.AttemptId && a.UserId == userId, ct);

            if (attempt == null) throw new UnauthorizedAccessException("Không tìm thấy lượt chép hợp lệ của bạn.");

            var pageStroke = await _context.UserPageStrokes
                .FirstOrDefaultAsync(ps => ps.AttemptId == dto.AttemptId && ps.PageId == dto.PageId && ps.UserId == userId, ct);

            if (pageStroke == null)
            {
                pageStroke = new UserPageStroke
                {
                    AttemptId = dto.AttemptId,
                    PageId = dto.PageId,
                    UserId = userId,
                    StrokesDataJson = dto.StrokesDataJson,
                    IsPageCompleted = dto.IsPageCompleted,
                    CompletedAt = dto.IsPageCompleted ? DateTime.UtcNow : null,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.UserPageStrokes.Add(pageStroke);
            }
            else
            {
                pageStroke.StrokesDataJson = dto.StrokesDataJson;
                pageStroke.IsPageCompleted = dto.IsPageCompleted;
                if (dto.IsPageCompleted && !pageStroke.CompletedAt.HasValue)
                {
                    pageStroke.CompletedAt = DateTime.UtcNow;
                }
                else if (!dto.IsPageCompleted)
                {
                    pageStroke.CompletedAt = null;
                }
                pageStroke.UpdatedAt = DateTime.UtcNow;
            }

            // Cập nhật tiến trình của attempt nếu được gửi kèm
            if (dto.ProgressPercent.HasValue)
            {
                attempt.ProgressPercent = Math.Clamp(dto.ProgressPercent.Value, 0.0, 100.0);
            }
            if (dto.CompletedWords.HasValue)
            {
                attempt.CompletedWords = dto.CompletedWords.Value;
            }
            if (!string.IsNullOrEmpty(dto.CompletedChunksJson))
            {
                attempt.CompletedChunksJson = dto.CompletedChunksJson;
            }
            if (dto.CurrentChunkIndex.HasValue)
            {
                attempt.CurrentChunkIndex = dto.CurrentChunkIndex.Value;
            }
            if (dto.CurrentPageNumber.HasValue)
            {
                attempt.CurrentPageNumber = dto.CurrentPageNumber.Value;
            }
            if (dto.TotalNotebookPages.HasValue)
            {
                attempt.TotalNotebookPages = Math.Max(attempt.TotalNotebookPages, dto.TotalNotebookPages.Value);
            }

            if (!dto.ProgressPercent.HasValue)
            {
                // Tự động tính lại tổng số chữ đã hoàn thành của lượt nếu không truyền trực tiếp
                var completedPageIds = await _context.UserPageStrokes
                    .Where(ps => ps.AttemptId == dto.AttemptId && ps.IsPageCompleted)
                    .Select(ps => ps.PageId)
                    .ToListAsync(ct);

                var totalCompletedWords = await _context.SutraPages
                    .Where(p => completedPageIds.Contains(p.Id))
                    .SumAsync(p => p.TotalWordsOnPage, ct);

                attempt.CompletedWords = totalCompletedWords;
                attempt.ProgressPercent = attempt.TotalWords > 0 
                    ? Math.Min(100.0, Math.Round(((double)totalCompletedWords / attempt.TotalWords) * 100.0, 1)) 
                    : 0;
            }

            if (attempt.ProgressPercent >= 100.0)
            {
                attempt.Status = "COMPLETED";
                attempt.CompletedAt = DateTime.UtcNow;
            }
            else
            {
                attempt.Status = "IN_PROGRESS";
                attempt.CompletedAt = null;
            }

            await _context.SaveChangesAsync(ct);

            return new PageStrokesResponseDto
            {
                Id = pageStroke.Id,
                AttemptId = pageStroke.AttemptId,
                PageId = pageStroke.PageId,
                StrokesDataJson = pageStroke.StrokesDataJson,
                IsPageCompleted = pageStroke.IsPageCompleted,
                AttemptProgressPercent = attempt.ProgressPercent,
                TotalCompletedWords = attempt.CompletedWords,
                UpdatedAt = pageStroke.UpdatedAt
            };
        }

        public async Task<AttemptDto> UpdateAttemptProgressAsync(long userId, UpdateAttemptProgressDto dto, CancellationToken ct = default)
        {
            var attempt = await _context.UserSutraAttempts
                .Include(a => a.Sutra)
                .FirstOrDefaultAsync(a => a.Id == dto.AttemptId && a.UserId == userId, ct);

            if (attempt == null) throw new UnauthorizedAccessException("Không tìm thấy lượt chép hợp lệ của bạn.");

            attempt.ProgressPercent = Math.Clamp(dto.ProgressPercent, 0.0, 100.0);
            if (dto.CompletedWords.HasValue)
            {
                attempt.CompletedWords = dto.CompletedWords.Value;
            }
            else if (attempt.TotalWords > 0)
            {
                attempt.CompletedWords = (int)Math.Round((attempt.ProgressPercent / 100.0) * attempt.TotalWords);
            }

            if (!string.IsNullOrEmpty(dto.CompletedChunksJson))
            {
                attempt.CompletedChunksJson = dto.CompletedChunksJson;
            }
            if (dto.CurrentChunkIndex.HasValue)
            {
                attempt.CurrentChunkIndex = dto.CurrentChunkIndex.Value;
            }
            if (dto.CurrentPageNumber.HasValue)
            {
                attempt.CurrentPageNumber = dto.CurrentPageNumber.Value;
            }
            if (dto.TotalNotebookPages.HasValue)
            {
                attempt.TotalNotebookPages = Math.Max(attempt.TotalNotebookPages, dto.TotalNotebookPages.Value);
            }

            if (attempt.ProgressPercent >= 100.0)
            {
                attempt.Status = "COMPLETED";
                attempt.CompletedAt = DateTime.UtcNow;
            }
            else
            {
                attempt.Status = "IN_PROGRESS";
                attempt.CompletedAt = null;
            }

            await _context.SaveChangesAsync(ct);
            return MapToAttemptDto(attempt);
        }

        public async Task<AttemptDto> CompletePageAsync(long userId, CompletePageDto dto, CancellationToken ct = default)
        {
            var attempt = await _context.UserSutraAttempts
                .Include(a => a.Sutra)
                .FirstOrDefaultAsync(a => a.Id == dto.AttemptId && a.UserId == userId, ct);

            if (attempt == null) throw new UnauthorizedAccessException("Lượt chép không hợp lệ.");

            var pageStroke = await _context.UserPageStrokes
                .FirstOrDefaultAsync(ps => ps.AttemptId == dto.AttemptId && ps.PageId == dto.PageId && ps.UserId == userId, ct);

            if (pageStroke != null && !pageStroke.IsPageCompleted)
            {
                pageStroke.IsPageCompleted = true;
                pageStroke.CompletedAt = DateTime.UtcNow;
                pageStroke.UpdatedAt = DateTime.UtcNow;
            }

            // Tính lại tổng số chữ đã hoàn thành của lượt
            var completedPageIds = await _context.UserPageStrokes
                .Where(ps => ps.AttemptId == dto.AttemptId && ps.IsPageCompleted)
                .Select(ps => ps.PageId)
                .ToListAsync(ct);

            var totalCompletedWords = await _context.SutraPages
                .Where(p => completedPageIds.Contains(p.Id))
                .SumAsync(p => p.TotalWordsOnPage, ct);

            attempt.CompletedWords = totalCompletedWords;
            attempt.ProgressPercent = attempt.TotalWords > 0 
                ? Math.Min(100.0, Math.Round(((double)totalCompletedWords / attempt.TotalWords) * 100.0, 1)) 
                : 0;

            if (attempt.ProgressPercent >= 100.0)
            {
                attempt.Status = "COMPLETED";
                attempt.CompletedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(ct);
            return MapToAttemptDto(attempt);
        }

        public async Task<AttemptDto> StartNewAttemptAsync(long userId, int sutraId, CancellationToken ct = default)
        {
            var currentAttempt = await _context.UserSutraAttempts
                .Where(a => a.UserId == userId && a.SutraId == sutraId && a.Status == "IN_PROGRESS")
                .FirstOrDefaultAsync(ct);

            if (currentAttempt != null)
            {
                throw new InvalidOperationException("Bạn đang có một lượt chép chưa hoàn thành.");
            }

            return await GetOrCreateActiveAttemptAsync(userId, sutraId, ct);
        }

        private static AttemptDto MapToAttemptDto(UserSutraAttempt attempt)
        {
            return new AttemptDto
            {
                Id = attempt.Id,
                SutraId = attempt.SutraId,
                SutraTitle = attempt.Sutra?.Title ?? string.Empty,
                AttemptNumber = attempt.AttemptNumber,
                CompletedWords = attempt.CompletedWords,
                TotalWords = attempt.TotalWords,
                ProgressPercent = attempt.ProgressPercent,
                Status = attempt.Status,
                CompletedChunksJson = attempt.CompletedChunksJson ?? "[]",
                CurrentChunkIndex = attempt.CurrentChunkIndex,
                CurrentPageNumber = attempt.CurrentPageNumber > 0 ? attempt.CurrentPageNumber : 1,
                TotalNotebookPages = attempt.TotalNotebookPages > 0 ? attempt.TotalNotebookPages : 1,
                StartedAt = attempt.StartedAt,
                CompletedAt = attempt.CompletedAt
            };
        }
    }
}
