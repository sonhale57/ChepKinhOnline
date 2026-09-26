using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ChepKinh.Api.DTOs;
using ChepKinh.Api.Services;

namespace ChepKinh.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProgressController : ControllerBase
    {
        private readonly IProgressService _progressService;

        public ProgressController(IProgressService progressService)
        {
            _progressService = progressService;
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

        [HttpGet("active-attempt/{sutraId}")]
        public async Task<ActionResult<ApiResponse<AttemptDto>>> GetOrCreateActiveAttempt(int sutraId, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var attempt = await _progressService.GetOrCreateActiveAttemptAsync(userId, sutraId, ct);
            return Ok(ApiResponse<AttemptDto>.Ok(attempt));
        }

        [HttpGet("attempt-detail/{attemptId}")]
        public async Task<ActionResult<ApiResponse<AttemptDto>>> GetAttemptDetail(long attemptId, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var attempt = await _progressService.GetAttemptByIdAsync(userId, attemptId, ct);
            if (attempt == null)
            {
                return NotFound(ApiResponse<AttemptDto>.Fail("Không tìm thấy bản chép hoặc bạn không có quyền truy cập."));
            }
            return Ok(ApiResponse<AttemptDto>.Ok(attempt));
        }

        [HttpGet("my-attempts")]
        public async Task<ActionResult<ApiResponse<List<AttemptDto>>>> GetMyAttempts([FromQuery] int? sutraId, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var attempts = await _progressService.GetUserAttemptsAsync(userId, sutraId, ct);
            return Ok(ApiResponse<List<AttemptDto>>.Ok(attempts));
        }

        [HttpGet("strokes/{attemptId}/{pageId}")]
        public async Task<ActionResult<ApiResponse<PageStrokesResponseDto>>> GetPageStrokes(long attemptId, long pageId, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var strokes = await _progressService.GetPageStrokesAsync(userId, attemptId, pageId, ct);
            return Ok(ApiResponse<PageStrokesResponseDto?>.Ok(strokes));
        }

        [HttpPost("save-strokes")]
        public async Task<ActionResult<ApiResponse<PageStrokesResponseDto>>> SavePageStrokes([FromBody] SavePageStrokesDto dto, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var result = await _progressService.SavePageStrokesAsync(userId, dto, ct);
            return Ok(ApiResponse<PageStrokesResponseDto>.Ok(result, "Lưu nét viết và tiến trình thành công."));
        }

        [HttpPost("update-progress")]
        public async Task<ActionResult<ApiResponse<AttemptDto>>> UpdateProgress([FromBody] UpdateAttemptProgressDto dto, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var result = await _progressService.UpdateAttemptProgressAsync(userId, dto, ct);
            return Ok(ApiResponse<AttemptDto>.Ok(result, "Cập nhật tiến trình chép thành công."));
        }

        [HttpPost("complete-page")]
        public async Task<ActionResult<ApiResponse<AttemptDto>>> CompletePage([FromBody] CompletePageDto dto, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var result = await _progressService.CompletePageAsync(userId, dto, ct);
            return Ok(ApiResponse<AttemptDto>.Ok(result, "Hoàn thành trang thành công."));
        }

        [HttpPost("start-new-attempt/{sutraId}")]
        public async Task<ActionResult<ApiResponse<AttemptDto>>> StartNewAttempt(int sutraId, CancellationToken ct)
        {
            var userId = GetCurrentUserId();
            var result = await _progressService.StartNewAttemptAsync(userId, sutraId, ct);
            return Ok(ApiResponse<AttemptDto>.Ok(result, "Khởi tạo lượt chép mới thành công."));
        }
    }
}
