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
    public interface ISutraService
    {
        Task<PagedResult<SutraListDto>> GetPublishedSutrasAsync(int pageIndex, int pageSize, string? keyword, CancellationToken ct = default);
        Task<SutraDetailDto?> GetSutraDetailAsync(int sutraId, CancellationToken ct = default);
        Task<SutraPageDto?> GetSutraPageAsync(int sutraId, int pageNumber, CancellationToken ct = default);
        Task<PagedResult<SutraListDto>> GetAllSutrasAdminAsync(int pageIndex, int pageSize, string? keyword, CancellationToken ct = default);
        Task<SutraDetailDto> CreateSutraAsync(CreateSutraDto dto, long adminId, CancellationToken ct = default);
        Task<SutraDetailDto?> UpdateSutraAsync(int sutraId, CreateSutraDto dto, CancellationToken ct = default);
        Task<bool> DeleteSutraAsync(int sutraId, CancellationToken ct = default);
        Task<bool> TogglePublishAsync(int sutraId, CancellationToken ct = default);
    }

    public class SutraService : ISutraService
    {
        private readonly ApplicationDbContext _context;

        public SutraService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<SutraListDto>> GetPublishedSutrasAsync(int pageIndex, int pageSize, string? keyword, CancellationToken ct = default)
        {
            var query = _context.Sutras.AsNoTracking().Where(s => s.IsPublished);

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(s => s.Title.Contains(keyword) || (s.Description != null && s.Description.Contains(keyword)));
            }

            var totalCount = await query.CountAsync(ct);

            var items = await query
                .OrderByDescending(s => s.CreatedAt)
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new SutraListDto
                {
                    Id = s.Id,
                    Title = s.Title,
                    Description = s.Description,
                    ScriptType = s.ScriptType,
                    OriginalSource = s.OriginalSource,
                    TotalWords = s.TotalWords,
                    TotalPages = s.TotalPages,
                    IsPublished = s.IsPublished,
                    CreatedAt = s.CreatedAt
                })
                .ToListAsync(ct);

            return new PagedResult<SutraListDto>(items, totalCount, pageIndex, pageSize);
        }

        public async Task<SutraDetailDto?> GetSutraDetailAsync(int sutraId, CancellationToken ct = default)
        {
            var sutra = await _context.Sutras
                .AsNoTracking()
                .Include(s => s.Pages.OrderBy(p => p.PageNumber))
                .FirstOrDefaultAsync(s => s.Id == sutraId, ct);

            if (sutra == null) return null;

            return new SutraDetailDto
            {
                Id = sutra.Id,
                Title = sutra.Title,
                Description = sutra.Description,
                ScriptType = sutra.ScriptType,
                OriginalSource = sutra.OriginalSource,
                TotalWords = sutra.TotalWords,
                TotalPages = sutra.TotalPages,
                Pages = sutra.Pages.Select(p => new SutraPageDto
                {
                    Id = p.Id,
                    SutraId = p.SutraId,
                    PageNumber = p.PageNumber,
                    ContentText = p.ContentText,
                    TotalWordsOnPage = p.TotalWordsOnPage,
                    LineCount = p.LineCount,
                    DefaultFontSize = p.DefaultFontSize,
                    DefaultGridType = p.DefaultGridType
                }).ToList()
            };
        }

        public async Task<SutraPageDto?> GetSutraPageAsync(int sutraId, int pageNumber, CancellationToken ct = default)
        {
            var page = await _context.SutraPages
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.SutraId == sutraId && p.PageNumber == pageNumber, ct);

            if (page == null) return null;

            return new SutraPageDto
            {
                Id = page.Id,
                SutraId = page.SutraId,
                PageNumber = page.PageNumber,
                ContentText = page.ContentText,
                TotalWordsOnPage = page.TotalWordsOnPage,
                LineCount = page.LineCount,
                DefaultFontSize = page.DefaultFontSize,
                DefaultGridType = page.DefaultGridType
            };
        }

        public async Task<PagedResult<SutraListDto>> GetAllSutrasAdminAsync(int pageIndex, int pageSize, string? keyword, CancellationToken ct = default)
        {
            var query = _context.Sutras.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(keyword))
            {
                query = query.Where(s => s.Title.Contains(keyword) || (s.Description != null && s.Description.Contains(keyword)));
            }

            var totalCount = await query.CountAsync(ct);

            var items = await query
                .OrderByDescending(s => s.CreatedAt)
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new SutraListDto
                {
                    Id = s.Id,
                    Title = s.Title,
                    Description = s.Description,
                    ScriptType = s.ScriptType,
                    OriginalSource = s.OriginalSource,
                    TotalWords = s.TotalWords,
                    TotalPages = s.TotalPages,
                    IsPublished = s.IsPublished,
                    CreatedAt = s.CreatedAt
                })
                .ToListAsync(ct);

            return new PagedResult<SutraListDto>(items, totalCount, pageIndex, pageSize);
        }

        public async Task<SutraDetailDto> CreateSutraAsync(CreateSutraDto dto, long adminId, CancellationToken ct = default)
        {
            var sutra = new Sutra
            {
                Title = dto.Title,
                Description = dto.Description,
                ScriptType = dto.ScriptType,
                OriginalSource = dto.OriginalSource,
                IsPublished = true,
                CreatedByAdminId = adminId,
                CreatedAt = DateTime.UtcNow
            };

            int totalWords = 0;
            int pageNumber = 1;

            foreach (var p in dto.Pages)
            {
                var wordCount = CountWords(p.ContentText, dto.ScriptType);
                totalWords += wordCount;

                sutra.Pages.Add(new SutraPage
                {
                    PageNumber = pageNumber++,
                    ContentText = p.ContentText,
                    TotalWordsOnPage = wordCount,
                    LineCount = p.LineCount,
                    DefaultFontSize = p.DefaultFontSize,
                    DefaultGridType = p.DefaultGridType
                });
            }

            sutra.TotalWords = totalWords;
            sutra.TotalPages = sutra.Pages.Count;

            _context.Sutras.Add(sutra);
            await _context.SaveChangesAsync(ct);

            return (await GetSutraDetailAsync(sutra.Id, ct))!;
        }

        public async Task<SutraDetailDto?> UpdateSutraAsync(int sutraId, CreateSutraDto dto, CancellationToken ct = default)
        {
            var sutra = await _context.Sutras
                .Include(s => s.Pages)
                .FirstOrDefaultAsync(s => s.Id == sutraId, ct);

            if (sutra == null) return null;

            sutra.Title = dto.Title;
            sutra.Description = dto.Description;
            sutra.ScriptType = dto.ScriptType;
            sutra.OriginalSource = dto.OriginalSource;
            sutra.UpdatedAt = DateTime.UtcNow;

            // Xóa trang cũ và cập nhật trang mới
            _context.SutraPages.RemoveRange(sutra.Pages);

            int totalWords = 0;
            int pageNumber = 1;

            foreach (var p in dto.Pages)
            {
                var wordCount = CountWords(p.ContentText, dto.ScriptType);
                totalWords += wordCount;

                sutra.Pages.Add(new SutraPage
                {
                    SutraId = sutra.Id,
                    PageNumber = pageNumber++,
                    ContentText = p.ContentText,
                    TotalWordsOnPage = wordCount,
                    LineCount = p.LineCount,
                    DefaultFontSize = p.DefaultFontSize,
                    DefaultGridType = p.DefaultGridType
                });
            }

            sutra.TotalWords = totalWords;
            sutra.TotalPages = sutra.Pages.Count;

            await _context.SaveChangesAsync(ct);
            return (await GetSutraDetailAsync(sutra.Id, ct))!;
        }

        public async Task<bool> DeleteSutraAsync(int sutraId, CancellationToken ct = default)
        {
            var sutra = await _context.Sutras.FindAsync(new object[] { sutraId }, ct);
            if (sutra == null) return false;

            _context.Sutras.Remove(sutra);
            await _context.SaveChangesAsync(ct);
            return true;
        }

        public async Task<bool> TogglePublishAsync(int sutraId, CancellationToken ct = default)
        {
            var sutra = await _context.Sutras.FindAsync(new object[] { sutraId }, ct);
            if (sutra == null) return false;

            sutra.IsPublished = !sutra.IsPublished;
            sutra.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);
            return true;
        }

        public static int CountWords(string text, string scriptType)
        {
            if (string.IsNullOrWhiteSpace(text)) return 0;
            if (scriptType == "HAN")
            {
                return text.Count(c => !char.IsWhiteSpace(c) && !char.IsPunctuation(c));
            }
            var words = text.Split(new[] { ' ', '\r', '\n', '\t', ',', '.', ';', ':', '!', '?', '—', '-' }, StringSplitOptions.RemoveEmptyEntries);
            return words.Length;
        }
    }
}
